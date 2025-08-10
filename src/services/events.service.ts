// src/services/events.service.ts
import { supabase } from '../lib/supabase';

/**
 * Evita seleccionar '*' para reducir payload.
 * Ajusta esta lista si agregas/quitas columnas en la tabla `events`.
 */
const SELECT_FIELDS =
  'id,title,description,date,time,location,location_url,image_url,registration_url,max_attendees,current_attendees,speakers,tags,status,created_at,updated_at';

const DEFAULT_PAGE_SIZE = 12;

/* ────────────────────────────────────────────────────────────────────── */
/* Tipos                                                                  */
/* ────────────────────────────────────────────────────────────────────── */
export type EventStatus = 'upcoming' | 'past' | 'cancelled';

export interface Event {
  id: string;
  title: string;
  description: string;
  date: string;          // YYYY-MM-DD
  time: string;          // HH:mm (24h) - opcional si no manejas horas
  location: string;
  location_url?: string | null;
  image_url?: string | null;
  registration_url?: string | null;
  max_attendees?: number | null;
  current_attendees?: number | null;
  speakers?: string[] | null;
  tags?: string[] | null;
  status: EventStatus;
  created_at: string;
  updated_at: string;
}

export interface EventInsert {
  title: string;
  description: string;
  date: string;
  time: string;
  location: string;
  location_url?: string | null;
  image_url?: string | null;
  registration_url?: string | null;
  max_attendees?: number | null;
  current_attendees?: number | null;
  speakers?: string[] | null;
  tags?: string[] | null;
  status?: EventStatus;
}

export interface EventUpdate extends Partial<EventInsert> {}

export interface Page<T> {
  items: T[];
  total: number;
  page: number;     // 1-based
  pageSize: number;
}

/* ────────────────────────────────────────────────────────────────────── */
/* Helpers                                                                */
/* ────────────────────────────────────────────────────────────────────── */
const sanitize = (s: string) =>
  s.replaceAll(',', ' ').replaceAll('%', '').trim().slice(0, 200);

const normalizeUrl = (url?: string | null) => {
  if (!url) return null;
  const t = url.trim();
  if (!t) return null;
  if (/^https?:\/\//i.test(t)) return t;
  return `https://${t}`;
};

function getISODate(date: string, time?: string) {
  // Construye un ISO local aproximado para comparar con "ahora".
  const base = time ? `${date}T${time}:00` : `${date}T00:00:00`;
  return new Date(base);
}

function computeStatus(e: Pick<Event, 'date' | 'time' | 'status'>): EventStatus {
  if (e.status === 'cancelled') return 'cancelled';
  const now = new Date();
  const eventDate = getISODate(e.date, e.time);
  return eventDate.getTime() < now.getTime() ? 'past' : 'upcoming';
}

function monthRange(ym: string) {
  // ym formato "YYYY-MM"
  const [yStr, mStr] = ym.split('-');
  const y = Number(yStr);
  const m = Number(mStr);
  if (!y || !m || m < 1 || m > 12) return null;
  const start = new Date(Date.UTC(y, m - 1, 1));
  const end = new Date(Date.UTC(y, m, 0)); // último día del mes
  const startStr = start.toISOString().slice(0, 10);
  const endStr = end.toISOString().slice(0, 10);
  return { start: startStr, end: endStr };
}

/* ────────────────────────────────────────────────────────────────────── */
/* Servicio                                                               */
/* ────────────────────────────────────────────────────────────────────── */
class EventService {
  /**
   * Listado paginado con filtros:
   * - search: ilike en title/description
   * - status: 'upcoming' | 'past' | 'cancelled'
   * - month: "YYYY-MM"
   */
  async getPage(
    params: {
      page?: number;
      pageSize?: number;
      search?: string;
      status?: EventStatus;
      month?: string;
    } = {}
  ): Promise<Page<Event>> {
    const page = Math.max(1, params.page ?? 1);
    const pageSize = Math.min(50, Math.max(1, params.pageSize ?? DEFAULT_PAGE_SIZE));
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    let query = supabase
      .from('events')
      .select(SELECT_FIELDS, { count: 'exact' });

    // Filtros
    if (params.status) {
      query = query.eq('status', params.status);
    }
    if (params.search) {
      const q = sanitize(params.search);
      if (q) {
        query = query.or(`title.ilike.%${q}%,description.ilike.%${q}%`);
      }
    }
    if (params.month) {
      const range = monthRange(params.month);
      if (range) {
        query = query.gte('date', range.start).lte('date', range.end);
      }
    }

    // Orden por fecha/hora
    query = query
      .order('date', { ascending: true })
      .order('time', { ascending: true })
      .range(from, to);

    const { data, error, count } = await query;
    if (error) throw error;

    const items =
      (data ?? []).map((ev: any) => ({
        ...ev,
        location_url: normalizeUrl(ev.location_url),
        image_url: normalizeUrl(ev.image_url),
        registration_url: normalizeUrl(ev.registration_url),
        current_attendees:
          typeof ev.current_attendees === 'number' && ev.current_attendees < 0
            ? 0
            : ev.current_attendees,
        status: computeStatus(ev),
      })) as Event[];

    return {
      items,
      total: count ?? 0,
      page,
      pageSize,
    };
  }

  /** Alias temporal para compatibilidad retro (antes tenías getEvents). */
  async getEvents(
    page = 1,
    limit = DEFAULT_PAGE_SIZE,
    filters?: { search?: string; status?: EventStatus; month?: string }
  ) {
    const res = await this.getPage({
      page,
      pageSize: limit,
      search: filters?.search,
      status: filters?.status,
      month: filters?.month,
    });
    return {
      data: res.items,
      totalPages: Math.ceil(res.total / res.pageSize),
      currentPage: res.page,
      total: res.total,
    };
  }

  async getEvent(id: string): Promise<Event | null> {
    const { data, error } = await supabase
      .from('events')
      .select(SELECT_FIELDS)
      .eq('id', id)
      .single();

    if (error) throw error;
    if (!data) return null;

    return {
      ...(data as Event),
      location_url: normalizeUrl(data.location_url),
      image_url: normalizeUrl(data.image_url),
      registration_url: normalizeUrl(data.registration_url),
      current_attendees:
        typeof data.current_attendees === 'number' && data.current_attendees < 0
          ? 0
          : data.current_attendees,
      status: computeStatus(data as Event),
    };
  }

  async createEvent(event: EventInsert): Promise<Event> {
    // Determinar status inicial si no se proporciona
    const payload: EventInsert = {
      ...event,
      status: event.status ?? computeStatus({ date: event.date, time: event.time, status: 'upcoming' }),
      location_url: normalizeUrl(event.location_url),
      image_url: normalizeUrl(event.image_url),
      registration_url: normalizeUrl(event.registration_url),
      current_attendees:
        typeof event.current_attendees === 'number' && event.current_attendees < 0
          ? 0
          : event.current_attendees ?? 0,
      max_attendees:
        typeof event.max_attendees === 'number' && event.max_attendees < 0
          ? 0
          : event.max_attendees ?? null,
    };

    const { data, error } = await supabase
      .from('events')
      .insert([payload])
      .select(SELECT_FIELDS)
      .single();

    if (error) throw error;
    const created = data as Event;
    return {
      ...created,
      status: computeStatus(created),
    };
  }

  async updateEvent(id: string, updates: EventUpdate): Promise<Event> {
    const normalized: EventUpdate = {
      ...updates,
      location_url: normalizeUrl(updates.location_url ?? null),
      image_url: normalizeUrl(updates.image_url ?? null),
      registration_url: normalizeUrl(updates.registration_url ?? null),
    };

    // Si se actualiza fecha/hora y no viene status explícito, recalcula.
    if ((updates.date || updates.time) && !updates.status) {
      normalized.status = computeStatus({
        date: updates.date ?? (await this.getEvent(id))!.date,
        time: updates.time ?? (await this.getEvent(id))!.time,
        status: 'upcoming',
      });
    }

    // Normaliza contadores (no negativos)
    if (typeof updates.current_attendees === 'number' && updates.current_attendees < 0) {
      normalized.current_attendees = 0;
    }
    if (typeof updates.max_attendees === 'number' && updates.max_attendees < 0) {
      normalized.max_attendees = 0;
    }

    const { data, error } = await supabase
      .from('events')
      .update(normalized)
      .eq('id', id)
      .select(SELECT_FIELDS)
      .single();

    if (error) throw error;
    const updated = data as Event;
    return {
      ...updated,
      status: computeStatus(updated),
    };
  }

  async deleteEvent(id: string) {
    const { error } = await supabase.from('events').delete().eq('id', id);
    if (error) throw error;
  }

  async cancelEvent(id: string) {
    return this.updateEvent(id, { status: 'cancelled' });
  }

  async updateAttendees(id: string, count: number) {
    return this.updateEvent(id, { current_attendees: Math.max(0, count) });
  }

  async getUpcomingEvents(limit = 5): Promise<Event[]> {
    const today = new Date().toISOString().slice(0, 10);
    const { data, error } = await supabase
      .from('events')
      .select(SELECT_FIELDS)
      .gte('date', today)
      .neq('status', 'cancelled')
      .order('date', { ascending: true })
      .order('time', { ascending: true })
      .limit(limit);

    if (error) throw error;

    return (data ?? []).map((e: any) => ({
      ...e,
      location_url: normalizeUrl(e.location_url),
      image_url: normalizeUrl(e.image_url),
      registration_url: normalizeUrl(e.registration_url),
      status: computeStatus(e),
    })) as Event[];
  }

  async getPastEvents(limit = 10): Promise<Event[]> {
    const today = new Date().toISOString().slice(0, 10);
    const { data, error } = await supabase
      .from('events')
      .select(SELECT_FIELDS)
      .lt('date', today)
      .order('date', { ascending: false })
      .limit(limit);

    if (error) throw error;

    return (data ?? []).map((e: any) => ({
      ...e,
      location_url: normalizeUrl(e.location_url),
      image_url: normalizeUrl(e.image_url),
      registration_url: normalizeUrl(e.registration_url),
      status: computeStatus(e),
    })) as Event[];
  }
}

export const eventService = new EventService();