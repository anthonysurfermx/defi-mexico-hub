import React, { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { Users, Search, Share2, SlidersHorizontal } from "lucide-react";
import { communitiesService } from "@/services/communities.service";

export default function CommunitiesPage() {
  const [communities, setCommunities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<string>("all");
  const [sort, setSort] = useState<string>("members");

  React.useEffect(() => {
    async function loadCommunities() {
      try {
        setLoading(true);
        const data = await communitiesService.getAll();
        setCommunities(data || []);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to load communities'));
      } finally {
        setLoading(false);
      }
    }
    loadCommunities();
  }, []);

  const filtered = useMemo(() => {
    const q = query.toLowerCase();
    return (communities ?? [])
      .filter((c) => (category === "all" ? true : c.category === category))
      .filter((c) => 
        c.name.toLowerCase().includes(q) || 
        c.description.toLowerCase().includes(q) || 
        (c.tags || []).some((t: string) => t.toLowerCase().includes(q))
      )
      .sort((a, b) => {
        if (sort === "members") return (b.member_count || 0) - (a.member_count || 0);
        return a.name.localeCompare(b.name);
      });
  }, [communities, query, category, sort]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Comunidades</h1>
          <p className="text-muted-foreground">Explora comunidades por categoría o busca por nombre/tema.</p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Buscar..." className="pl-9" />
          </div>
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Categoría" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas</SelectItem>
              <SelectItem value="DeFi">DeFi</SelectItem>
              <SelectItem value="NFT">NFT</SelectItem>
              <SelectItem value="Infra">Infra</SelectItem>
              <SelectItem value="DAO">DAO</SelectItem>
              <SelectItem value="Security">Security</SelectItem>
            </SelectContent>
          </Select>
          <Select value={sort} onValueChange={setSort}>
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Ordenar por" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="members">Miembros</SelectItem>
              <SelectItem value="name">Nombre</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" className="gap-2">
            <SlidersHorizontal className="h-4 w-4"/>Más filtros
          </Button>
        </div>
      </div>

      <Separator className="my-6" />

      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error.message}</AlertDescription>
        </Alert>
      )}

      {loading ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i} className="p-4">
              <div className="flex items-center gap-4">
                <Skeleton className="h-12 w-12 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-2/3" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
              </div>
              <Skeleton className="mt-4 h-5 w-full" />
              <Skeleton className="mt-2 h-5 w-3/4" />
            </Card>
          ))}
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((c) => (
            <Card key={c.id} className="flex flex-col">
              <CardHeader className="flex-row items-center gap-4">
                <Avatar className="h-12 w-12">
                  <AvatarImage src={c.logo_url} alt={c.name} />
                  <AvatarFallback>{c.name.slice(0,2).toUpperCase()}</AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <CardTitle className="text-lg">{c.name}</CardTitle>
                  <CardDescription className="flex items-center gap-2 text-sm">
                    <Badge variant="secondary">{c.category}</Badge>
                    <span className="inline-flex items-center gap-1 text-muted-foreground">
                      <Users className="h-4 w-4"/>{c.member_count || 0}
                    </span>
                  </CardDescription>
                </div>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                {c.description}
                <div className="mt-3 flex flex-wrap gap-2">
                  {(c.tags || []).map((t: string) => (
                    <Badge key={t} variant="outline">#{t}</Badge>
                  ))}
                </div>
              </CardContent>
              <CardFooter className="justify-between">
                <Button variant="outline" asChild>
                  <Link to={`/communities/${c.id}`}>Ver detalles</Link>
                </Button>
                <Button variant="default" className="gap-2">
                  <Share2 className="h-4 w-4"/>Compartir
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}