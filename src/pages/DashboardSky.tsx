import { useEffect, useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { format, parseISO, startOfDay, endOfDay, startOfMonth, getDaysInMonth, differenceInCalendarDays } from "date-fns";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  Legend,
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
  seguro: boolean;
  vendedor_id: string;
  produto_id: string;
  pacote_id: string | null;
  forma_pagamento_id: string;
  origem_lead_id: string | null;
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

const META_CHAVES_SKY = [
  { chave: "meta_vendas_sky_pos_pago", label: "Pós Pago" },
  { chave: "meta_vendas_sky_sky_plus", label: "Sky+" },
  { chave: "meta_vendas_sky_pre_pago", label: "Pré Pago" },
  { chave: "meta_vendas_sky_parabolica", label: "Parabólica" },
] as const;

function toISODate(d: Date) {
  return format(d, "yyyy-MM-dd");
}

function monthKey(isoDate: string) {
  return isoDate.slice(0, 7);
}

const TICK_STYLE = { fontSize: 14 };
const PIE_COLORS = ["hsl(217, 91%, 60%)", "hsl(142, 71%, 45%)", "hsl(38, 92%, 50%)", "hsl(0, 84%, 60%)"];

export default function DashboardSky() {
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
    queryKey: ["sky", "options"],
    queryFn: async () => {
      const [vend, prod] = await Promise.all([
        supabase.from("vendedores").select("id, nome").eq("ativo", true).is("deleted_at", null).order("nome"),
        supabase.from("produtos_sky").select("id, nome").eq("ativo", true).is("deleted_at", null).order("nome"),
      ]);
      if (vend.error) throw vend.error;
      if (prod.error) throw prod.error;

      return {
        vendedores: (vend.data ?? []) as Option[],
        produtos: (prod.data ?? []) as Option[],
      };
    },
  });

  const { data: metaData, isLoading: loadingMeta } = useQuery({
    queryKey: ["sky", "meta", META_CHAVES_SKY],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("configuracoes")
        .select("chave, valor_numeric")
        .in("chave", META_CHAVES_SKY.map((m) => m.chave))
        .eq("ativo", true)
        .is("deleted_at", null);

      if (error) throw error;
      if (!data || data.length === 0) return null;

      const porChave = Object.fromEntries(data.map((r) => [r.chave, r.valor_numeric ?? 0]));
      const individuais = META_CHAVES_SKY.map((m) => ({
        label: m.label,
        valor: porChave[m.chave] ?? 0,
      }));
      const total = individuais.reduce((acc, i) => acc + i.valor, 0);

      return total > 0 ? { individuais, total } : null;
    },
  });

  const { data: vendas, isLoading: loadingVendas } = useQuery({
    queryKey: ["sky", "vendas", filters],
    queryFn: async () => {
      const inicio = startOfDay(parseISO(filters.inicio));
      const fim = endOfDay(parseISO(filters.fim));

      let q = supabase
        .from("vendas_sky")
        .select(
          [
            "id",
            "data_venda",
            "cidade",
            "seguro",
            "vendedor_id",
            "produto_id",
            "pacote_id",
            "forma_pagamento_id",
            "origem_lead_id",
            "vendedor:vendedores(nome)",
            "produto:produtos_sky(nome)",
            "pacote:pacotes_sky(nome)",
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

  const { data: statusData, isLoading: loadingStatus } = useQuery({
    queryKey: ["status"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("status")
        .select("habilitadas, pagas, instaladas")
        .limit(1)
        .single();

      if (error) throw error;
      return data;
    },
  });

  useEffect(() => {
    const channel = supabase
      .channel("rt-dashboard-sky")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "vendas_sky" },
        () => qc.invalidateQueries({ queryKey: ["sky", "vendas"] }),
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "status" },
        () => qc.invalidateQueries({ queryKey: ["status"] }),
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "configuracoes" },
        (payload) => {
          const next = (payload as any)?.new?.chave ?? (payload as any)?.old?.chave;
          if (!next || META_CHAVES_SKY.some((m) => m.chave === next)) {
            qc.invalidateQueries({ queryKey: ["sky", "meta"] });
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
    const comSeguro = list.filter((v) => v.seguro).length;
    const percSeguro = total > 0 ? (comSeguro / total) * 100 : 0;

    const byVendedor = new Map<string, { nome: string; total: number }>();
    const byProduto = new Map<string, { nome: string; total: number }>();

    for (const v of list) {
      const vendNome = v.vendedor?.nome ?? "—";
      const prodNome = v.produto?.nome ?? "—";

      const vendKey = v.vendedor_id;
      byVendedor.set(vendKey, { nome: vendNome, total: (byVendedor.get(vendKey)?.total ?? 0) + 1 });

      const prodKey = v.produto_id;
      byProduto.set(prodKey, { nome: prodNome, total: (byProduto.get(prodKey)?.total ?? 0) + 1 });
    }

    const rankingVendedor = Array.from(byVendedor.values()).sort((a, b) => b.total - a.total).slice(0, 5);
    const rankingProduto = Array.from(byProduto.values()).sort((a, b) => b.total - a.total).slice(0, 5);

    const topVendedor = rankingVendedor[0]?.nome ?? "—";

    const vendasPorProdutoNome: Record<string, number> = {};
    for (const { nome, total: t } of byProduto.values()) {
      vendasPorProdutoNome[nome.toLowerCase()] = t;
    }

    return { total, comSeguro, percSeguro, topVendedor, rankingVendedor, rankingProduto, vendasPorProdutoNome };
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

  const pagamentoPosPago = useMemo(() => {
    const list = vendas ?? [];
    const posPago = list.filter((v) => {
      const nome = v.produto?.nome?.toLowerCase() ?? "";
      return nome.includes("pós pago") || nome.includes("pos pago");
    });

    if (posPago.length === 0) return [];

    const byForma = new Map<string, number>();
    for (const v of posPago) {
      const formaNome = v.forma?.nome ?? "Outros";
      byForma.set(formaNome, (byForma.get(formaNome) ?? 0) + 1);
    }

    return Array.from(byForma.entries()).map(([nome, valor]) => ({ nome, valor }));
  }, [vendas]);

  const progressoMeta = useMemo(() => {
    if (!metaData) return null;
    const total = stats.total;
    const pct = (total / metaData.total) * 100;
    return { meta: metaData.total, individuais: metaData.individuais, total, pct };
  }, [metaData, stats.total]);

  const projecaoPosPago = useMemo(() => {
    const list = vendas ?? [];
    const now = new Date();
    const inicioMes = startOfMonth(now);
    const diasNoMes = getDaysInMonth(now);
    const diasDecorridos = differenceInCalendarDays(now, inicioMes) + 1;

    const vendasPosPagoMes = list.filter((v) => {
      const nome = v.produto?.nome?.toLowerCase() ?? "";
      const dataVenda = v.data_venda;
      const mesAtual = format(now, "yyyy-MM");
      return (
        (nome.includes("pós pago") || nome.includes("pos pago")) &&
        dataVenda.startsWith(mesAtual)
      );
    });

    const realizadas = vendasPosPagoMes.length;
    const mediaDiaria = diasDecorridos > 0 ? realizadas / diasDecorridos : 0;
    const projecao = Math.round(mediaDiaria * diasNoMes);

    const metaPosPago = progressoMeta?.individuais.find(
      (i) => i.label.toLowerCase() === "pós pago"
    )?.valor ?? 0;

    return { realizadas, mediaDiaria, projecao, diasDecorridos, diasNoMes, metaPosPago };
  }, [vendas, progressoMeta]);

  const busy = loadingOptions || loadingMeta || loadingVendas;

  useEffect(() => {
    if (!busy) return;
  }, [busy]);

  return (
    <section className="space-y-8">
      <header>
        <h1 className="text-4xl font-bold tracking-tight">Dashboard Sky</h1>
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
            <div className="mt-2 text-base text-muted-foreground">Vendas Sky.</div>
          </CardContent>
        </Card>

        <Card className="p-2">
          <CardHeader>
            <CardTitle className="text-xl">Seguro</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-6xl font-bold tracking-tight">{loadingVendas ? "—" : `${stats.percSeguro.toFixed(0)}%`}</div>
            <div className="mt-2 text-base text-muted-foreground">
              {loadingVendas ? "" : `${stats.comSeguro} com seguro / ${stats.total} total`}
            </div>
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
            <CardTitle className="text-xl">Meta Total</CardTitle>
          </CardHeader>
          <CardContent>
            {loadingMeta ? (
              <div className="text-base text-muted-foreground">Carregando…</div>
            ) : progressoMeta ? (
              <>
                <div className="text-4xl font-semibold">{progressoMeta.total} / {progressoMeta.meta}</div>
                <div className="mt-2 text-base text-muted-foreground">{progressoMeta.pct.toFixed(0)}% atingido</div>
              </>
            ) : (
              <div className="text-base text-muted-foreground">
                Meta não configurada. Defina em Cadastros &gt; Metas de Vendas.
              </div>
            )}
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-6 lg:grid-cols-4">
        {META_CHAVES_SKY.map((m) => {
          const metaItem = progressoMeta?.individuais.find((i) => i.label === m.label);
          const labelLower = m.label.toLowerCase();
          const vendasCount = Object.entries(stats.vendasPorProdutoNome).find(
            ([nome]) => nome.includes(labelLower) || labelLower.includes(nome),
          )?.[1] ?? 0;
          return (
            <Card key={m.chave} className="p-2">
              <CardHeader>
                <CardTitle className="text-xl">{m.label}</CardTitle>
              </CardHeader>
              <CardContent>
                {loadingVendas ? (
                  <div className="text-base text-muted-foreground">Carregando…</div>
                ) : (
                  <>
                    <div className="text-6xl font-semibold">
                      {vendasCount}
                      {metaItem && metaItem.valor > 0 && (
                        <span className="text-4xl text-muted-foreground font-normal"> / {metaItem.valor}</span>
                      )}
                    </div>
                    {metaItem && metaItem.valor > 0 && (
                      <div className="mt-2 text-xl text-muted-foreground">
                        {((vendasCount / metaItem.valor) * 100).toFixed(0)}% da meta
                      </div>
                    )}
                  </>
                )}
              </CardContent>
            </Card>
          );
        })}
      </section>

      <section className="grid gap-6 lg:grid-cols-3">
        <Card className="p-2">
          <CardHeader>
            <CardTitle className="text-xl">Cadastradas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-6xl font-bold tracking-tight">
              {loadingStatus ? "—" : (statusData?.habilitadas ?? 0)}
            </div>
          </CardContent>
        </Card>

        <Card className="p-2">
          <CardHeader>
            <CardTitle className="text-xl">Pagas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-6xl font-bold tracking-tight">
              {loadingStatus ? "—" : (statusData?.pagas ?? 0)}
            </div>
          </CardContent>
        </Card>

        <Card className="p-2">
          <CardHeader>
            <CardTitle className="text-xl">Instaladas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-6xl font-bold tracking-tight">
              {loadingStatus ? "—" : (statusData?.instaladas ?? 0)}
            </div>
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-6 lg:grid-cols-1">
        <Card className="p-2">
          <CardHeader>
            <CardTitle className="text-xl">Projeção de Vendas — Pós Pago</CardTitle>
          </CardHeader>
          <CardContent>
            {loadingVendas || loadingMeta ? (
              <div className="text-base text-muted-foreground">Carregando…</div>
            ) : (
              <div className="grid gap-6 lg:grid-cols-4">
                <div>
                  <div className="text-base text-muted-foreground">Realizadas</div>
                  <div className="text-5xl font-bold tracking-tight">{projecaoPosPago.realizadas}</div>
                  <div className="mt-1 text-sm text-muted-foreground">
                    em {projecaoPosPago.diasDecorridos} de {projecaoPosPago.diasNoMes} dias
                  </div>
                </div>
                <div>
                  <div className="text-base text-muted-foreground">Média diária</div>
                  <div className="text-5xl font-bold tracking-tight">{projecaoPosPago.mediaDiaria.toFixed(1)}</div>
                  <div className="mt-1 text-sm text-muted-foreground">vendas/dia</div>
                </div>
                <div>
                  <div className="text-base text-muted-foreground">Projeção do mês</div>
                  <div className="text-5xl font-bold tracking-tight">{projecaoPosPago.projecao}</div>
                  <div className="mt-1 text-sm text-muted-foreground">
                    {projecaoPosPago.metaPosPago > 0
                      ? `${((projecaoPosPago.projecao / projecaoPosPago.metaPosPago) * 100).toFixed(0)}% da meta`
                      : "Meta não configurada"}
                  </div>
                </div>
                <div>
                  <div className="text-base text-muted-foreground">Meta Pós Pago</div>
                  <div className="text-5xl font-bold tracking-tight">
                    {projecaoPosPago.metaPosPago > 0 ? projecaoPosPago.metaPosPago : "—"}
                  </div>
                  <div className="mt-1 text-sm text-muted-foreground">
                    {projecaoPosPago.metaPosPago > 0
                      ? projecaoPosPago.projecao >= projecaoPosPago.metaPosPago
                        ? "Projeção acima da meta"
                        : `Faltam ~${projecaoPosPago.metaPosPago - projecaoPosPago.projecao} vendas na projeção`
                      : "Defina em Metas de Vendas"}
                  </div>
                </div>
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
            <CardTitle className="text-xl">Pós Pago — Forma de Pagamento</CardTitle>
          </CardHeader>
          <CardContent className="h-[420px]">
            {loadingVendas ? (
              <div className="text-base text-muted-foreground">Carregando…</div>
            ) : pagamentoPosPago.length === 0 ? (
              <div className="text-base text-muted-foreground">Sem vendas Pós Pago no período.</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pagamentoPosPago}
                    dataKey="valor"
                    nameKey="nome"
                    cx="50%"
                    cy="50%"
                    outerRadius={140}
                    label={({ nome, percent }) => `${nome}: ${(percent * 100).toFixed(0)}%`}
                  >
                    {pagamentoPosPago.map((_, i) => (
                      <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: number) => [value, "Vendas"]} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
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
      </section>
    </section>
  );
}
