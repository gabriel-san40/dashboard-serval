import { useEffect, useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { endOfDay, format, parseISO, startOfDay, startOfMonth } from "date-fns";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/use-toast";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type Option = { id: string; nome: string };

type VendaRow = {
  id: string;
  data_venda: string;
  cidade: string | null;
  vendedor_id: string;
  produto_id: string;
  pacote_id: string | null;
  origem_lead_id: string | null;
  forma_pagamento_id: string;
  vendedor?: { nome: string } | null;
  produto?: { nome: string } | null;
  pacote?: { nome: string } | null;
  origem?: { nome: string } | null;
  forma?: { nome: string } | null;
};

type Filters = {
  inicio: string;
  fim: string;
  vendedorId: string | "all";
  produtoId: string | "all";
};

const META_CHAVE_DEFAULT = "meta_vendas_internet";

function toISODate(d: Date) {
  return format(d, "yyyy-MM-dd");
}

function monthKey(isoDate: string) {
  return isoDate.slice(0, 7);
}

const TICK_STYLE = { fontSize: 14 };

export default function DashboardInternet() {
  const qc = useQueryClient();

  const [filters, setFilters] = useState<Filters>(() => {
    const now = new Date();
    const start = startOfMonth(now);
    return {
      inicio: toISODate(start),
      fim: toISODate(now),
      vendedorId: "all",
      produtoId: "all",
    };
  });

  const { data: options, isLoading: loadingOptions } = useQuery({
    queryKey: ["internet", "options"],
    queryFn: async () => {
      const [vend, prod] = await Promise.all([
        supabase
          .from("vendedores")
          .select("id, nome")
          .eq("ativo", true)
          .is("deleted_at", null)
          .order("nome"),
        supabase
          .from("produtos_internet")
          .select("id, nome")
          .eq("ativo", true)
          .is("deleted_at", null)
          .order("nome"),
      ]);
      if (vend.error) throw vend.error;
      if (prod.error) throw prod.error;

      return {
        vendedores: (vend.data ?? []) as Option[],
        produtos: (prod.data ?? []) as Option[],
      };
    },
  });

  const { data: meta, isLoading: loadingMeta } = useQuery({
    queryKey: ["internet", "meta", META_CHAVE_DEFAULT],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("configuracoes")
        .select("chave, valor_numeric")
        .eq("chave", META_CHAVE_DEFAULT)
        .eq("ativo", true)
        .is("deleted_at", null)
        .maybeSingle();

      if (error) throw error;
      return data?.valor_numeric ?? null;
    },
  });

  const { data: vendas, isLoading: loadingVendas } = useQuery({
    queryKey: ["internet", "vendas", filters],
    queryFn: async () => {
      const inicio = startOfDay(parseISO(filters.inicio));
      const fim = endOfDay(parseISO(filters.fim));

      let q = supabase
        .from("vendas_internet")
        .select(
          [
            "id",
            "data_venda",
            "cidade",
            "vendedor_id",
            "produto_id",
            "pacote_id",
            "origem_lead_id",
            "forma_pagamento_id",
            "vendedor:vendedores(nome)",
            "produto:produtos_internet(nome)",
            "pacote:pacotes_internet(nome)",
            "origem:origens_lead(nome)",
            "forma:formas_pagamento(nome)",
          ].join(","),
        )
        .eq("ativo", true)
        .is("deleted_at", null)
        .gte("data_venda", toISODate(inicio))
        .lte("data_venda", toISODate(fim))
        .order("data_venda", { ascending: true });

      if (filters.vendedorId !== "all") q = q.eq("vendedor_id", filters.vendedorId);
      if (filters.produtoId !== "all") q = q.eq("produto_id", filters.produtoId);

      const { data, error } = await q;
      if (error) throw error;
      return (data ?? []) as unknown as VendaRow[];
    },
  });

  useEffect(() => {
    const channel = supabase
      .channel("rt-dashboard-internet")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "vendas_internet" },
        () => qc.invalidateQueries({ queryKey: ["internet", "vendas"] }),
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "configuracoes" },
        (payload) => {
          const next = (payload as any)?.new?.chave ?? (payload as any)?.old?.chave;
          if (!next || next === META_CHAVE_DEFAULT) {
            qc.invalidateQueries({ queryKey: ["internet", "meta"] });
          }
        },
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [qc]);

  const stats = useMemo(() => {
    const list = vendas ?? [];

    const total = list.length;

    const byVendedor = new Map<string, { nome: string; total: number }>();
    const byProduto = new Map<string, { nome: string; total: number }>();
    const byForma = new Map<string, { nome: string; total: number }>();

    for (const v of list) {
      const vendNome = v.vendedor?.nome ?? "—";
      const prodNome = v.produto?.nome ?? "—";
      const formaNome = v.forma?.nome ?? "—";

      byVendedor.set(v.vendedor_id, {
        nome: vendNome,
        total: (byVendedor.get(v.vendedor_id)?.total ?? 0) + 1,
      });

      byProduto.set(v.produto_id, {
        nome: prodNome,
        total: (byProduto.get(v.produto_id)?.total ?? 0) + 1,
      });

      byForma.set(v.forma_pagamento_id, {
        nome: formaNome,
        total: (byForma.get(v.forma_pagamento_id)?.total ?? 0) + 1,
      });
    }

    const rankingVendedor = Array.from(byVendedor.values())
      .sort((a, b) => b.total - a.total)
      .slice(0, 5);

    const rankingProduto = Array.from(byProduto.values())
      .sort((a, b) => b.total - a.total)
      .slice(0, 5);

    const topForma = Array.from(byForma.values()).sort((a, b) => b.total - a.total)[0]?.nome ?? "—";
    const topVendedor = rankingVendedor[0]?.nome ?? "—";

    return { total, topVendedor, topForma, rankingVendedor, rankingProduto };
  }, [vendas]);

  const serieMensal = useMemo(() => {
    const list = vendas ?? [];
    const m = new Map<string, number>();

    for (const v of list) {
      const k = monthKey(v.data_venda);
      m.set(k, (m.get(k) ?? 0) + 1);
    }

    return Array.from(m.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([k, total]) => ({ mes: k, total }));
  }, [vendas]);

  const progressoMeta = useMemo(() => {
    const m = meta ?? null;
    if (!m || m <= 0) return null;
    const total = stats.total;
    const pct = Math.min(100, (total / Number(m)) * 100);
    return { meta: Number(m), total, pct };
  }, [meta, stats.total]);

  const busy = loadingOptions || loadingMeta || loadingVendas;

  return (
    <section className="space-y-8">
      <header>
        <h1 className="text-4xl font-bold tracking-tight">Dashboard Internet</h1>
      </header>

      <section className="grid gap-4 rounded-lg border bg-card p-5 lg:grid-cols-9">
        <div className="space-y-2 lg:col-span-1">
          <Label className="text-lg">Início</Label>
          <Input
            type="date"
            className="h-14 text-lg"
            value={filters.inicio}
            onChange={(e) => setFilters((p) => ({ ...p, inicio: e.target.value }))}
          />
        </div>

        <div className="space-y-2 lg:col-span-1">
          <Label className="text-lg">Fim</Label>
          <Input
            type="date"
            className="h-14 text-lg"
            value={filters.fim}
            onChange={(e) => setFilters((p) => ({ ...p, fim: e.target.value }))}
          />
        </div>

        <div className="space-y-2 lg:col-span-2">
          <Label className="text-lg">Vendedor</Label>
          <Select value={filters.vendedorId} onValueChange={(v) => setFilters((p) => ({ ...p, vendedorId: v as any }))}>
            <SelectTrigger className="h-14 text-lg">
              <SelectValue placeholder={loadingOptions ? "Carregando…" : "Todos"} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              {(options?.vendedores ?? []).map((o) => (
                <SelectItem key={o.id} value={o.id}>
                  {o.nome}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2 lg:col-span-2">
          <Label className="text-lg">Produto</Label>
          <Select value={filters.produtoId} onValueChange={(v) => setFilters((p) => ({ ...p, produtoId: v as any }))}>
            <SelectTrigger className="h-14 text-lg">
              <SelectValue placeholder={loadingOptions ? "Carregando…" : "Todos"} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              {(options?.produtos ?? []).map((o) => (
                <SelectItem key={o.id} value={o.id}>
                  {o.nome}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-wrap items-end gap-2 lg:col-span-3">
          <Button
            type="button"
            variant="secondary"
            className="h-14 px-6 text-lg"
            onClick={() => {
              const now = new Date();
              setFilters((p) => ({ ...p, inicio: toISODate(now), fim: toISODate(now) }));
            }}
          >
            Hoje
          </Button>
          <Button
            type="button"
            variant="secondary"
            className="h-14 px-6 text-lg"
            onClick={() => {
              const now = new Date();
              const start = startOfMonth(now);
              setFilters((p) => ({ ...p, inicio: toISODate(start), fim: toISODate(now) }));
            }}
          >
            Mês
          </Button>
          <Button
            type="button"
            variant="secondary"
            className="h-14 px-6 text-lg"
            onClick={() => {
              setFilters((p) => ({ ...p, vendedorId: "all", produtoId: "all" }));
              toast({ title: "Filtros limpos", description: "Mantivemos o período." });
            }}
          >
            Limpar filtros
          </Button>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-4">
        <Card className="p-2">
          <CardHeader>
            <CardTitle className="text-xl">Total no período</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-6xl font-bold tracking-tight">{loadingVendas ? "—" : stats.total}</div>
            <div className="mt-2 text-base text-muted-foreground">Vendas Internet filtradas.</div>
          </CardContent>
        </Card>

        <Card className="p-2">
          <CardHeader>
            <CardTitle className="text-xl">Forma (top)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-semibold leading-tight">{loadingVendas ? "—" : stats.topForma}</div>
            <div className="mt-2 text-base text-muted-foreground">No período selecionado.</div>
          </CardContent>
        </Card>

        <Card className="p-2">
          <CardHeader>
            <CardTitle className="text-xl">Top vendedor</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-semibold leading-tight">{loadingVendas ? "—" : stats.topVendedor}</div>
            <div className="mt-2 text-base text-muted-foreground">No período selecionado.</div>
          </CardContent>
        </Card>

        <Card className="p-2">
          <CardHeader>
            <CardTitle className="text-xl">Meta</CardTitle>
          </CardHeader>
          <CardContent>
            {loadingMeta ? (
              <div className="text-base text-muted-foreground">Carregando…</div>
            ) : progressoMeta ? (
              <>
                <div className="text-4xl font-semibold">
                  {progressoMeta.total} / {progressoMeta.meta}
                </div>
                <div className="mt-2 text-base text-muted-foreground">{progressoMeta.pct.toFixed(0)}% atingido</div>
              </>
            ) : (
              <div className="text-base text-muted-foreground">
                Meta não configurada em <code>{META_CHAVE_DEFAULT}</code>.
              </div>
            )}
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <Card className="min-h-[480px]">
          <CardHeader>
            <CardTitle className="text-xl">Evolução (mês)</CardTitle>
          </CardHeader>
          <CardContent className="h-[420px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={serieMensal} margin={{ left: 8, right: 8, top: 8, bottom: 8 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="mes" tickLine={false} axisLine={false} tick={TICK_STYLE} />
                <YAxis allowDecimals={false} tickLine={false} axisLine={false} tick={TICK_STYLE} />
                <Tooltip />
                <Line type="monotone" dataKey="total" stroke="hsl(var(--primary))" strokeWidth={4} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="min-h-[480px]">
          <CardHeader>
            <CardTitle className="text-xl">Ranking Vendedores (Top 5)</CardTitle>
          </CardHeader>
          <CardContent className="h-[420px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.rankingVendedor} layout="vertical" margin={{ left: 24, right: 8, top: 8, bottom: 8 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" allowDecimals={false} tick={TICK_STYLE} />
                <YAxis type="category" dataKey="nome" width={140} tick={TICK_STYLE} />
                <Tooltip />
                <Bar dataKey="total" fill="hsl(var(--primary))" radius={[6, 6, 6, 6]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <Card className="min-h-[480px]">
          <CardHeader>
            <CardTitle className="text-xl">Top Produtos (Top 5)</CardTitle>
          </CardHeader>
          <CardContent className="h-[420px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.rankingProduto} layout="vertical" margin={{ left: 24, right: 8, top: 8, bottom: 8 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" allowDecimals={false} tick={TICK_STYLE} />
                <YAxis type="category" dataKey="nome" width={140} tick={TICK_STYLE} />
                <Tooltip />
                <Bar dataKey="total" fill="hsl(var(--primary))" radius={[6, 6, 6, 6]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="min-h-[480px]">
          <CardHeader>
            <CardTitle className="text-xl">Status</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="text-base text-muted-foreground">
              Realtime: ativo (vendas_internet/configuracoes). Quando houver alteração, os dados são atualizados automaticamente.
            </div>
            <div className="text-base text-muted-foreground">{busy ? "Carregando dados…" : "Ok"}</div>
          </CardContent>
        </Card>
      </section>
    </section>
  );
}
