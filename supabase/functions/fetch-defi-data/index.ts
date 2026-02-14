import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const DEFILLAMA_API_KEY = Deno.env.get("DEFILLAMA_API_KEY");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);

interface ChartDataPoint {
  date: number; // unix timestamp
  value: number;
}

async function fetchFromDefiLlama(
  type: string,
  identifier: string
): Promise<ChartDataPoint[]> {
  const baseUrl = `https://pro-api.llama.fi/${DEFILLAMA_API_KEY}`;
  let url: string;
  let transform: (data: any) => ChartDataPoint[];

  switch (type) {
    case "protocol_tvl":
      url = `${baseUrl}/protocol/${identifier}`;
      transform = (data) => {
        const tvl = data.tvl || data.chainTvls?.["all"]?.tvl || [];
        return tvl.map((p: any) => ({
          date: p.date,
          value: p.totalLiquidityUSD ?? p.tvl ?? 0,
        }));
      };
      break;

    case "chain_tvl":
      url = `${baseUrl}/v2/historicalChainTvl/${identifier}`;
      transform = (data) => {
        if (!Array.isArray(data)) return [];
        return data.map((p: any) => ({
          date: p.date,
          value: p.tvl ?? 0,
        }));
      };
      break;

    case "protocol_fees":
      url = `${baseUrl}/summary/fees/${identifier}?dataType=dailyFees`;
      transform = (data) => {
        const chart = data.totalDataChart || [];
        return chart.map((p: any) => ({
          date: typeof p[0] === "number" ? p[0] : new Date(p[0]).getTime() / 1000,
          value: p[1] ?? 0,
        }));
      };
      break;

    default:
      throw new Error(`Unknown chart type: ${type}`);
  }

  const response = await fetch(url);
  if (!response.ok) {
    const text = await response.text();
    throw new Error(`DeFi Llama API error (${response.status}): ${text}`);
  }

  const data = await response.json();
  return transform(data);
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const type = url.searchParams.get("type");
    const identifier = url.searchParams.get("identifier");

    if (!type || !identifier) {
      return new Response(
        JSON.stringify({ error: "Missing type or identifier params" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check cache first
    const { data: cached } = await supabase
      .from("defi_chart_cache")
      .select("data, fetched_at")
      .eq("chart_type", type)
      .eq("identifier", identifier)
      .single();

    if (cached) {
      const fetchedAt = new Date(cached.fetched_at).getTime();
      const now = Date.now();
      if (now - fetchedAt < CACHE_TTL_MS) {
        return new Response(
          JSON.stringify({ data: cached.data, cached: true }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    // Fetch fresh data
    const chartData = await fetchFromDefiLlama(type, identifier);

    // Upsert into cache
    await supabase.from("defi_chart_cache").upsert(
      {
        chart_type: type,
        identifier,
        data: chartData,
        fetched_at: new Date().toISOString(),
      },
      { onConflict: "chart_type,identifier" }
    );

    return new Response(
      JSON.stringify({ data: chartData, cached: false }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in fetch-defi-data:", error);
    return new Response(
      JSON.stringify({ error: String(error) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
