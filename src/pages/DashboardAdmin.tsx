import { useEffect, useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { format, startOfMonth } from "date-fns";
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

type DadoRow = {
  id: string;
  data: string;
  total_leads: number;
  ia_leads: number;
  robo_leads: number;
  facebook_leads: number;
  sem_contato_ia: number;
  sem_contato_robo: number;
  sem_contato_facebook: number;
  em_negociacao_ia: number;
  em_negociacao_robo: number;
  em_negociacao_facebook: number;
  cadastradas_ia: number;
  cadastradas_robo: number;
  cadastradas_facebook: number;
  cadastradas_loja: number;
  cadastradas_indicacao: number;
  cadastradas_pap: number;
  habilitada_ia: number;
  habilitada_robo: number;
  habilitada_facebook: number;
};

type Filters = {
  inicio: string;
  fim: string;
  canal: string;
};

const CANAIS = ["IA", "ROBO", "Facebook"] as const;

const CANAL_COLORS: Record<string, string> = {
  IA: "hsl(210, 80%, 55%)",
  ROBO: "hsl(150, 60%, 45%)",
  Facebook: "hsl(35, 90%, 55%)",
};

const ETAPA_COLORS: Record<string, string> = {
  leads: "hsl(210, 80%, 55%)",
  sem_contato: "hsl(35, 90%, 55%)",
  em_negociacao: "hsl(280, 60%, 55%)",
  cadastradas: "hsl(150, 60%, 45%)",
  habilitadas: "hsl(350, 70%, 55%)",
};

function toISODate(d: Date) {
  return format(d, "yyyy-MM-dd");
}

function safePercent(num: number, den: number): string | null {
  if (den === 0) return null;
  return ((num / den) * 100).toFixed(1);
}

type CanalTotals = {
  leads: number;
  sem_contato: number;
  em_negociacao: number;
  cadastradas: number;
  habilitada: number;
};

const SELECT_COLS = "id, data, total_leads, ia_leads, robo_leads, facebook_leads, sem_contato_ia, sem_contato_robo, sem_contato_facebook, em_negociacao_ia, em_negociacao_robo, em_negociacao_facebook, cadastradas_ia, cadastradas_robo, cadastradas_facebook, cadastradas_loja, cadastradas_indicacao, cadastradas_pap, habilitada_ia, habilitada_robo, habilitada_facebook";

const TICK_STYLE = { fontSize: 14 };

export default function DashboardAdmin() {
  const qc = useQueryClient();

  const [filters, setFilters] = useState<Filters>(() => {
    const now = new Date();
    const start = startOfMonth(now);
    return { inicio: toISODate(start), fim: toISODate(now), canal: "all" };
  });

  const { data: dados, isLoading } = useQuery({
    queryKey: ["admin", "dados", filters],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("dados_administrativos")
        .select(SELECT_COLS)
        .eq("ativo", true)
        .is("deleted_at", null)
        .gte("data", filters.inicio)
        .lte("data", filters.fim)
        .order("data", { ascending: true });

      if (error) throw error;
      return (data ?? []) as DadoRow[];
    },
  });

  // Realtime
  useEffect(() => {
    const channel = supabase
      .channel("rt-dashboard-admin")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "dados_administrativos" },
        () => qc.invalidateQueries({ queryKey: ["admin", "dados"] }),
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [qc]);

  // Totais por canal
  const porCanal = useMemo(() => {
    const list = dados ?? [];
    const result: Record<string, CanalTotals> = {
      IA: { leads: 0, sem_contato: 0, em_negociacao: 0, cadastradas: 0, habilitada: 0 },
      ROBO: { leads: 0, sem_contato: 0, em_negociacao: 0, cadastradas: 0, habilitada: 0 },
      Facebook: { leads: 0, sem_contato: 0, em_negociacao: 0, cadastradas: 0, habilitada: 0 },
    };

    for (const d of list) {
      result.IA.leads += d.ia_leads;
      result.IA.sem_contato += d.sem_contato_ia;
      result.IA.em_negociacao += d.em_negociacao_ia;
      result.IA.cadastradas += d.cadastradas_ia;
      result.IA.habilitada += d.habilitada_ia;

      result.ROBO.leads += d.robo_leads;
      result.ROBO.sem_contato += d.sem_contato_robo;
      result.ROBO.em_negociacao += d.em_negociacao_robo;
      result.ROBO.cadastradas += d.cadastradas_robo;
      result.ROBO.habilitada += d.habilitada_robo;

      result.Facebook.leads += d.facebook_leads;
      result.Facebook.sem_contato += d.sem_contato_facebook;
      result.Facebook.em_negociacao += d.em_negociacao_facebook;
      result.Facebook.cadastradas += d.cadastradas_facebook;
      result.Facebook.habilitada += d.habilitada_facebook;
    }

    return result;
  }, [dados]);

  // Totais gerais
  const totais = useMemo(() => {
    const list = dados ?? [];
    let total_leads = 0;
    let total_cadastradas = 0;
    let total_habilitadas = 0;

    for (const d of list) {
      total_leads += d.total_leads;
      total_cadastradas +=
        d.cadastradas_ia + d.cadastradas_robo + d.cadastradas_facebook +
        d.cadastradas_loja + d.cadastradas_indicacao + d.cadastradas_pap;
      total_habilitadas += d.habilitada_ia + d.habilitada_robo + d.habilitada_facebook;
    }

    return { total_leads, total_cadastradas, total_habilitadas };
  }, [dados]);

  // Taxas de conversão por canal
  const taxas = useMemo(() => {
    return CANAIS.map((c) => {
      const v = porCanal[c];
      return {
        canal: c,
        taxa_cadastro: v ? safePercent(v.cadastradas, v.leads) : null,
        taxa_habilitacao: v ? safePercent(v.habilitada, v.cadastradas) : null,
      };
    });
  }, [porCanal]);

  // Funil por canal
  const funelPorCanal = useMemo(() => {
    return CANAIS
      .filter((c) => filters.canal === "all" || filters.canal === c)
      .map((c) => {
        const v = porCanal[c];
        return {
          canal: c,
          data: [
            { etapa: "Leads", valor: v.leads },
            { etapa: "Sem Contato", valor: v.sem_contato },
            { etapa: "Negociação", valor: v.em_negociacao },
            { etapa: "Cadastradas", valor: v.cadastradas },
            { etapa: "Habilitadas", valor: v.habilitada },
          ],
        };
      });
  }, [porCanal, filters.canal]);

  // Comparativo entre canais
  const comparativo = useMemo(() => {
    return CANAIS
      .filter((c) => filters.canal === "all" || filters.canal === c)
      .map((c) => ({
        canal: c,
        leads: porCanal[c].leads,
        sem_contato: porCanal[c].sem_contato,
        em_negociacao: porCanal[c].em_negociacao,
        cadastradas: porCanal[c].cadastradas,
        habilitadas: porCanal[c].habilitada,
      }));
  }, [porCanal, filters.canal]);

  // Evolução temporal (leads por dia)
  const evolucao = useMemo(() => {
    const list = dados ?? [];
    return list.map((d) => ({
      data: d.data,
      IA: d.ia_leads,
      ROBO: d.robo_leads,
      Facebook: d.facebook_leads,
    }));
  }, [dados]);

  // Evolução taxa de cadastro por dia
  const evolucaoTaxas = useMemo(() => {
    const list = dados ?? [];
    return list.map((d) => ({
      data: d.data,
      taxa_ia: d.ia_leads > 0 ? +((d.cadastradas_ia / d.ia_leads) * 100).toFixed(1) : 0,
      taxa_robo: d.robo_leads > 0 ? +((d.cadastradas_robo / d.robo_leads) * 100).toFixed(1) : 0,
      taxa_facebook: d.facebook_leads > 0 ? +((d.cadastradas_facebook / d.facebook_leads) * 100).toFixed(1) : 0,
    }));
  }, [dados]);

  return (
    <section className="space-y-8">
      <header>
        <h1 className="text-4xl font-bold tracking-tight">Dashboard Administrativo</h1>
      </header>

      {/* Filtros */}
      <section className="grid gap-4 rounded-lg border bg-card p-5 lg:grid-cols-6">
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
          <Label className="text-lg">Canal</Label>
          <Select value={filters.canal} onValueChange={(v) => setFilters((p) => ({ ...p, canal: v }))}>
            <SelectTrigger className="h-14 text-lg">
              <SelectValue placeholder="Todos" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              {CANAIS.map((c) => (
                <SelectItem key={c} value={c}>{c}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-wrap items-end gap-2 lg:col-span-2">
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
              setFilters((p) => ({ ...p, canal: "all" }));
              toast({ title: "Filtros limpos", description: "Mantivemos o período." });
            }}
          >
            Limpar filtros
          </Button>
        </div>
      </section>

      {/* Cards resumo */}
      <section className="grid gap-6 lg:grid-cols-3">
        <Card className="p-2">
          <CardHeader><CardTitle className="text-xl">Total Leads</CardTitle></CardHeader>
          <CardContent>
            <div className="text-6xl font-bold tracking-tight">{isLoading ? "—" : totais.total_leads}</div>
            <div className="mt-2 text-base text-muted-foreground">Entrada manual no período</div>
          </CardContent>
        </Card>
        <Card className="p-2">
          <CardHeader><CardTitle className="text-xl">Total Cadastradas</CardTitle></CardHeader>
          <CardContent>
            <div className="text-6xl font-bold tracking-tight">{isLoading ? "—" : totais.total_cadastradas}</div>
            <div className="mt-2 text-base text-muted-foreground">Soma de todos os canais</div>
          </CardContent>
        </Card>
        <Card className="p-2">
          <CardHeader><CardTitle className="text-xl">Total Habilitadas</CardTitle></CardHeader>
          <CardContent>
            <div className="text-6xl font-bold tracking-tight">{isLoading ? "—" : totais.total_habilitadas}</div>
            <div className="mt-2 text-base text-muted-foreground">IA + Robô + Facebook</div>
          </CardContent>
        </Card>
      </section>

      {/* Cards por canal */}
      <section className="grid gap-6 lg:grid-cols-3">
        {CANAIS
          .filter((c) => filters.canal === "all" || filters.canal === c)
          .map((c) => {
            const v = porCanal[c];
            const tc = safePercent(v.cadastradas, v.leads);
            const th = safePercent(v.habilitada, v.cadastradas);
            return (
              <Card key={c} className="p-2">
                <CardHeader>
                  <CardTitle className="text-2xl" style={{ color: CANAL_COLORS[c] }}>{c}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between text-lg"><span>Leads</span><span className="font-semibold text-2xl">{v.leads}</span></div>
                  <div className="flex justify-between text-lg"><span>Sem Contato</span><span className="font-semibold text-2xl">{v.sem_contato}</span></div>
                  <div className="flex justify-between text-lg"><span>Negociação</span><span className="font-semibold text-2xl">{v.em_negociacao}</span></div>
                  <div className="flex justify-between text-lg"><span>Cadastradas</span><span className="font-semibold text-2xl">{v.cadastradas}</span></div>
                  <div className="flex justify-between text-lg"><span>Habilitadas</span><span className="font-semibold text-2xl">{v.habilitada}</span></div>
                  <div className="border-t pt-3 flex justify-between text-lg"><span>Taxa Cadastro</span><span className="font-semibold text-2xl">{tc !== null ? `${tc}%` : "—"}</span></div>
                  <div className="flex justify-between text-lg"><span>Taxa Habilitação</span><span className="font-semibold text-2xl">{th !== null ? `${th}%` : "—"}</span></div>
                </CardContent>
              </Card>
            );
          })}
      </section>

      {/* Taxas de conversão por canal */}
      <section className="grid gap-6 lg:grid-cols-2">
        <Card className="p-2">
          <CardHeader><CardTitle className="text-xl">Taxa de Cadastro (cadastradas / leads)</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            {taxas
              .filter((t) => filters.canal === "all" || filters.canal === t.canal)
              .map((t) => (
                <div key={t.canal} className="flex items-center justify-between">
                  <span className="text-xl font-medium">{t.canal}</span>
                  <span className="text-4xl font-semibold">{t.taxa_cadastro !== null ? `${t.taxa_cadastro}%` : "—"}</span>
                </div>
              ))}
          </CardContent>
        </Card>
        <Card className="p-2">
          <CardHeader><CardTitle className="text-xl">Taxa de Habilitação (habilitada / cadastradas)</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            {taxas
              .filter((t) => filters.canal === "all" || filters.canal === t.canal)
              .map((t) => (
                <div key={t.canal} className="flex items-center justify-between">
                  <span className="text-xl font-medium">{t.canal}</span>
                  <span className="text-4xl font-semibold">{t.taxa_habilitacao !== null ? `${t.taxa_habilitacao}%` : "—"}</span>
                </div>
              ))}
          </CardContent>
        </Card>
      </section>

      {/* Funil por canal */}
      <section className="grid gap-6 lg:grid-cols-3">
        {funelPorCanal.map((f) => (
          <Card key={f.canal} className="min-h-[480px]">
            <CardHeader>
              <CardTitle className="text-xl">Funil — {f.canal}</CardTitle>
            </CardHeader>
            <CardContent className="h-[420px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={f.data} layout="vertical" margin={{ left: 24, right: 8, top: 8, bottom: 8 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" allowDecimals={false} tick={TICK_STYLE} />
                  <YAxis type="category" dataKey="etapa" width={120} tick={TICK_STYLE} />
                  <Tooltip />
                  <Bar dataKey="valor" fill={CANAL_COLORS[f.canal] ?? "hsl(var(--primary))"} radius={[6, 6, 6, 6]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        ))}
      </section>

      {/* Comparativo entre canais */}
      <Card className="min-h-[480px]">
        <CardHeader>
          <CardTitle className="text-xl">Comparativo entre Canais</CardTitle>
        </CardHeader>
        <CardContent className="h-[420px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={comparativo} margin={{ left: 8, right: 8, top: 8, bottom: 8 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="canal" tickLine={false} axisLine={false} tick={TICK_STYLE} />
              <YAxis allowDecimals={false} tickLine={false} axisLine={false} tick={TICK_STYLE} />
              <Tooltip />
              <Legend wrapperStyle={{ fontSize: 14 }} />
              <Bar dataKey="leads" name="Leads" fill={ETAPA_COLORS.leads} radius={[4, 4, 0, 0]} />
              <Bar dataKey="sem_contato" name="Sem Contato" fill={ETAPA_COLORS.sem_contato} radius={[4, 4, 0, 0]} />
              <Bar dataKey="em_negociacao" name="Negociação" fill={ETAPA_COLORS.em_negociacao} radius={[4, 4, 0, 0]} />
              <Bar dataKey="cadastradas" name="Cadastradas" fill={ETAPA_COLORS.cadastradas} radius={[4, 4, 0, 0]} />
              <Bar dataKey="habilitadas" name="Habilitadas" fill={ETAPA_COLORS.habilitadas} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Evolução temporal (leads por dia) */}
      <Card className="min-h-[480px]">
        <CardHeader>
          <CardTitle className="text-xl">Evolução Temporal (leads por dia)</CardTitle>
        </CardHeader>
        <CardContent className="h-[420px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={evolucao} margin={{ left: 8, right: 8, top: 8, bottom: 8 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="data" tickLine={false} axisLine={false} tick={TICK_STYLE} />
              <YAxis allowDecimals={false} tickLine={false} axisLine={false} tick={TICK_STYLE} />
              <Tooltip />
              <Legend wrapperStyle={{ fontSize: 14 }} />
              {CANAIS
                .filter((c) => filters.canal === "all" || filters.canal === c)
                .map((c) => (
                  <Line
                    key={c}
                    type="monotone"
                    dataKey={c}
                    name={c}
                    stroke={CANAL_COLORS[c]}
                    strokeWidth={4}
                    dot={false}
                    connectNulls
                  />
                ))}
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Evolução taxa de cadastro */}
      <Card className="min-h-[480px]">
        <CardHeader>
          <CardTitle className="text-xl">Evolução Taxa de Cadastro (%)</CardTitle>
        </CardHeader>
        <CardContent className="h-[420px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={evolucaoTaxas} margin={{ left: 8, right: 8, top: 8, bottom: 8 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="data" tickLine={false} axisLine={false} tick={TICK_STYLE} />
              <YAxis allowDecimals tickLine={false} axisLine={false} unit="%" tick={TICK_STYLE} />
              <Tooltip />
              <Legend wrapperStyle={{ fontSize: 14 }} />
              {CANAIS
                .filter((c) => filters.canal === "all" || filters.canal === c)
                .map((c) => (
                  <Line
                    key={c}
                    type="monotone"
                    dataKey={`taxa_${c.toLowerCase()}`}
                    name={c}
                    stroke={CANAL_COLORS[c]}
                    strokeWidth={4}
                    dot={false}
                    connectNulls
                  />
                ))}
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </section>
  );
}
