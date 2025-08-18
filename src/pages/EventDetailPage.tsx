import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Calendar, MapPin, Share2, Download, Clock, Mail } from "lucide-react";
import { eventService } from "@/services/events.service";

type Speaker = {
  id: string;
  name: string;
  title: string;
  company?: string;
  avatar?: string;
};

type AgendaItem = {
  time: string;
  title: string;
  description?: string;
  speakerId?: string;
};

export default function EventDetailPage() {
  const { id = "1" } = useParams();
  const [event, setEvent] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [email, setEmail] = useState("");
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    async function loadEvent() {
      try {
        setLoading(true);
        // Usamos el servicio existente de events
        const events = await eventService.getAll();
        const foundEvent = events.find(e => e.id === id) || events[0];
        
        // Agregar datos mock para speakers y agenda
        const enrichedEvent = {
          ...foundEvent,
          registrationOpen: true,
          speakers: [
            { id: "s1", name: "Anthony Chávez", title: "Community Lead LATAM", company: "Uniswap Labs" },
            { id: "s2", name: "Guido", title: "Developer Advocate", company: "Scroll" },
            { id: "s3", name: "Sandra", title: "BD Lead", company: "DeFi México" },
          ],
          agenda: [
            { time: "10:00 - 10:30", title: "Registro y bienvenida" },
            { time: "10:30 - 11:00", title: "Warm-up & Práctica" },
            { time: "11:00 - 11:30", title: "Clasificación (Qualy)" },
            { time: "11:45 - 12:30", title: "Carrera Final" },
            { time: "12:30 - 13:00", title: "Premiación y networking" },
          ],
        };
        
        setEvent(enrichedEvent);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to load event'));
      } finally {
        setLoading(false);
      }
    }
    loadEvent();
  }, [id]);

  async function onRegister(e: React.FormEvent) {
    e.preventDefault();
    if (!event?.registrationOpen) return;
    setSubmitting(true);
    try {
      // Aquí llamarías a tu API para registrar
      await new Promise(r => setTimeout(r, 700));
      setSubmitted(true);
    } catch (err) {
      console.error(err);
      alert("No se pudo registrar, intenta de nuevo.");
    } finally { 
      setSubmitting(false); 
    }
  }

  if (error) return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <Alert variant="destructive">
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>{error.message}</AlertDescription>
      </Alert>
    </div>
  );

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      {loading || !event ? (
        <div className="space-y-4">
          <Skeleton className="h-10 w-2/3" />
          <Skeleton className="h-5 w-1/3" />
          <Skeleton className="h-48 w-full" />
        </div>
      ) : (
        <>
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-2xl font-semibold">{event.title}</h1>
              <p className="text-muted-foreground flex items-center gap-4 mt-1">
                <span className="inline-flex items-center gap-1">
                  <Calendar className="h-4 w-4"/>
                  {new Date(event.date).toLocaleString()}
                </span>
                <span className="inline-flex items-center gap-1">
                  <MapPin className="h-4 w-4"/>
                  {event.location}
                </span>
              </p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" className="gap-2">
                <Share2 className="h-4 w-4"/>Compartir
              </Button>
              <Button className="gap-2" variant="secondary">
                <Download className="h-4 w-4"/>.ics
              </Button>
            </div>
          </div>

          <Card className="mt-6 overflow-hidden">
            {event.cover_image && (
              <div className="h-48 w-full overflow-hidden">
                <img src={event.cover_image} alt={event.title} className="w-full h-full object-cover" />
              </div>
            )}
            <CardContent className="pt-6">
              <p className="text-muted-foreground">{event.description}</p>
            </CardContent>
          </Card>

          {/* Registro */}
          <div className="mt-8 grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Registro</CardTitle>
                <CardDescription>Reserva tu lugar. Cupos limitados.</CardDescription>
              </CardHeader>
              <CardContent>
                {submitted ? (
                  <Alert>
                    <AlertTitle>¡Listo!</AlertTitle>
                    <AlertDescription>Te enviamos un correo con la confirmación.</AlertDescription>
                  </Alert>
                ) : (
                  <form onSubmit={onRegister} className="space-y-4">
                    <div className="grid gap-2">
                      <Label htmlFor="email">Email</Label>
                      <Input 
                        id="email" 
                        type="email" 
                        required 
                        value={email} 
                        onChange={(e) => setEmail(e.target.value)} 
                        placeholder="tu@email.com"
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="note">Notas (opcional)</Label>
                      <Textarea 
                        id="note" 
                        value={note} 
                        onChange={(e) => setNote(e.target.value)} 
                        placeholder="Tu rol, expectativas, etc."
                      />
                    </div>
                    <Button type="submit" disabled={!event.registrationOpen || submitting} className="gap-2">
                      <Mail className="h-4 w-4"/>
                      {submitting ? "Registrando..." : "Registrarme"}
                    </Button>
                  </form>
                )}
              </CardContent>
            </Card>

            {/* Speakers */}
            <Card>
              <CardHeader>
                <CardTitle>Speakers</CardTitle>
                <CardDescription>Conoce a los ponentes.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  {event.speakers.map((s: Speaker) => (
                    <div key={s.id} className="flex items-center gap-3">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={s.avatar}/>
                        <AvatarFallback>{s.name.slice(0,2).toUpperCase()}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium leading-tight">{s.name}</p>
                        <p className="text-sm text-muted-foreground leading-tight">
                          {s.title}{s.company ? ` · ${s.company}` : ""}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Agenda */}
          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5"/>Agenda
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {event.agenda.map((item: AgendaItem, idx: number) => (
                  <div key={idx} className="grid gap-2 rounded-xl border p-4 md:grid-cols-[140px_1fr]">
                    <div className="text-sm font-medium">{item.time}</div>
                    <div>
                      <div className="font-medium">{item.title}</div>
                      {item.description && (
                        <p className="text-sm text-muted-foreground">{item.description}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}