import { useMemo, useState } from "react";
import { useForm, UseFormReturn } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const int0 = z.coerce.number().int().min(0, "Mínimo 0");

const schema = z.object({
  data: z.string().min(1, "Data é obrigatória"),
  total_leads: int0,
  ia_leads: int0,
  robo_leads: int0,
  facebook_leads: int0,
  sem_contato_ia: int0,
  sem_contato_robo: int0,
  sem_contato_facebook: int0,
  em_negociacao_ia: int0,
  em_negociacao_robo: int0,
  em_negociacao_facebook: int0,
  cadastradas_ia: int0,
  cadastradas_robo: int0,
  cadastradas_facebook: int0,
  cadastradas_loja: int0,
  cadastradas_indicacao: int0,
  cadastradas_pap: int0,
  habilitada_ia: int0,
  habilitada_robo: int0,
  habilitada_facebook: int0,
});

type FormValues = z.infer<typeof schema>;

const defaultValues: FormValues = {
  data: new Date().toISOString().slice(0, 10),
  total_leads: 0,
  ia_leads: 0,
  robo_leads: 0,
  facebook_leads: 0,
  sem_contato_ia: 0,
  sem_contato_robo: 0,
  sem_contato_facebook: 0,
  em_negociacao_ia: 0,
  em_negociacao_robo: 0,
  em_negociacao_facebook: 0,
  cadastradas_ia: 0,
  cadastradas_robo: 0,
  cadastradas_facebook: 0,
  cadastradas_loja: 0,
  cadastradas_indicacao: 0,
  cadastradas_pap: 0,
  habilitada_ia: 0,
  habilitada_robo: 0,
  habilitada_facebook: 0,
};

function safePercent(num: number, den: number): string | null {
  if (den === 0) return null;
  return ((num / den) * 100).toFixed(1);
}

function NumericField({
  name,
  label,
  form,
}: {
  name: keyof FormValues;
  label: string;
  form: UseFormReturn<FormValues>;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={name}>{label}</Label>
      <Input id={name} type="number" min={0} className="h-12 text-base" {...form.register(name)} />
      {form.formState.errors[name] ? (
        <p className="text-sm text-destructive">{form.formState.errors[name]?.message}</p>
      ) : null}
    </div>
  );
}

export default function NovoDadoAdmin() {
  const [saving, setSaving] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues,
    mode: "onSubmit",
  });

  const [
    ia_leads, robo_leads, facebook_leads,
    cadastradas_ia, cadastradas_robo, cadastradas_facebook,
    habilitada_ia, habilitada_robo, habilitada_facebook,
  ] = form.watch([
    "ia_leads", "robo_leads", "facebook_leads",
    "cadastradas_ia", "cadastradas_robo", "cadastradas_facebook",
    "habilitada_ia", "habilitada_robo", "habilitada_facebook",
  ]);

  const taxas = useMemo(
    () => ({
      taxa_cadastro_lead_ia: safePercent(cadastradas_ia, ia_leads),
      taxa_cadastro_lead_robo: safePercent(cadastradas_robo, robo_leads),
      taxa_cadastro_lead_facebook: safePercent(cadastradas_facebook, facebook_leads),
      taxa_habilitacao_ia: safePercent(habilitada_ia, cadastradas_ia),
      taxa_habilitacao_robo: safePercent(habilitada_robo, cadastradas_robo),
      taxa_habilitacao_facebook: safePercent(habilitada_facebook, cadastradas_facebook),
    }),
    [ia_leads, robo_leads, facebook_leads, cadastradas_ia, cadastradas_robo, cadastradas_facebook, habilitada_ia, habilitada_robo, habilitada_facebook],
  );

  const onSubmit = async (values: FormValues) => {
    setSaving(true);
    try {
      const { error } = await supabase.from("dados_administrativos").upsert(
        {
          data: values.data,
          total_leads: values.total_leads,
          ia_leads: values.ia_leads,
          robo_leads: values.robo_leads,
          facebook_leads: values.facebook_leads,
          sem_contato_ia: values.sem_contato_ia,
          sem_contato_robo: values.sem_contato_robo,
          sem_contato_facebook: values.sem_contato_facebook,
          em_negociacao_ia: values.em_negociacao_ia,
          em_negociacao_robo: values.em_negociacao_robo,
          em_negociacao_facebook: values.em_negociacao_facebook,
          cadastradas_ia: values.cadastradas_ia,
          cadastradas_robo: values.cadastradas_robo,
          cadastradas_facebook: values.cadastradas_facebook,
          cadastradas_loja: values.cadastradas_loja,
          cadastradas_indicacao: values.cadastradas_indicacao,
          cadastradas_pap: values.cadastradas_pap,
          habilitada_ia: values.habilitada_ia,
          habilitada_robo: values.habilitada_robo,
          habilitada_facebook: values.habilitada_facebook,
        },
        { onConflict: "data" },
      );
      if (error) throw error;

      toast({ title: "Dado administrativo cadastrado" });
      form.reset({ ...defaultValues, data: new Date().toISOString().slice(0, 10) });
    } catch (e: any) {
      toast({
        title: "Erro ao salvar",
        description: e?.message ?? "Não foi possível cadastrar o dado.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="space-y-6">
      <header className="space-y-1">
        <h1 className="text-3xl font-bold tracking-tight">Cadastrar Dados Administrativos</h1>
        <p className="text-base text-muted-foreground">Preencha os campos para registrar dados de leads por canal.</p>
      </header>

      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 rounded-lg border bg-card p-6">
        {/* Data + Total Leads */}
        <div className="grid gap-5 lg:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="data">Data de referência</Label>
            <Input id="data" type="date" className="h-12 text-base" {...form.register("data")} />
            {form.formState.errors.data ? (
              <p className="text-sm text-destructive">{form.formState.errors.data.message}</p>
            ) : null}
          </div>
          <NumericField name="total_leads" label="Total Leads" form={form} />
        </div>

        {/* Leads por Canal */}
        <fieldset className="space-y-4">
          <legend className="text-lg font-semibold">Leads por Canal</legend>
          <div className="grid gap-5 lg:grid-cols-3">
            <NumericField name="ia_leads" label="IA" form={form} />
            <NumericField name="robo_leads" label="Robô" form={form} />
            <NumericField name="facebook_leads" label="Facebook" form={form} />
          </div>
        </fieldset>

        {/* Sem Contato */}
        <fieldset className="space-y-4">
          <legend className="text-lg font-semibold">Sem Contato</legend>
          <div className="grid gap-5 lg:grid-cols-3">
            <NumericField name="sem_contato_ia" label="IA" form={form} />
            <NumericField name="sem_contato_robo" label="Robô" form={form} />
            <NumericField name="sem_contato_facebook" label="Facebook" form={form} />
          </div>
        </fieldset>

        {/* Em Negociação */}
        <fieldset className="space-y-4">
          <legend className="text-lg font-semibold">Em Negociação</legend>
          <div className="grid gap-5 lg:grid-cols-3">
            <NumericField name="em_negociacao_ia" label="IA" form={form} />
            <NumericField name="em_negociacao_robo" label="Robô" form={form} />
            <NumericField name="em_negociacao_facebook" label="Facebook" form={form} />
          </div>
        </fieldset>

        {/* Cadastradas */}
        <fieldset className="space-y-4">
          <legend className="text-lg font-semibold">Cadastradas</legend>
          <div className="grid gap-5 lg:grid-cols-3">
            <NumericField name="cadastradas_ia" label="IA" form={form} />
            <NumericField name="cadastradas_robo" label="Robô" form={form} />
            <NumericField name="cadastradas_facebook" label="Facebook" form={form} />
            <NumericField name="cadastradas_loja" label="Loja" form={form} />
            <NumericField name="cadastradas_indicacao" label="Indicação" form={form} />
            <NumericField name="cadastradas_pap" label="PAP" form={form} />
          </div>
        </fieldset>

        {/* Habilitadas */}
        <fieldset className="space-y-4">
          <legend className="text-lg font-semibold">Habilitadas</legend>
          <div className="grid gap-5 lg:grid-cols-3">
            <NumericField name="habilitada_ia" label="IA" form={form} />
            <NumericField name="habilitada_robo" label="Robô" form={form} />
            <NumericField name="habilitada_facebook" label="Facebook" form={form} />
          </div>
        </fieldset>

        {/* Taxas computadas */}
        <div className="space-y-4 rounded-md border bg-muted/50 p-4">
          <h3 className="text-lg font-semibold">Taxas Calculadas</h3>

          <div className="grid gap-4 lg:grid-cols-3">
            <div>
              <Label className="text-sm text-muted-foreground">Taxa Cadastro IA (cadastradas / leads)</Label>
              <div className="text-2xl font-semibold">{taxas.taxa_cadastro_lead_ia !== null ? `${taxas.taxa_cadastro_lead_ia}%` : "—"}</div>
            </div>
            <div>
              <Label className="text-sm text-muted-foreground">Taxa Cadastro Robô (cadastradas / leads)</Label>
              <div className="text-2xl font-semibold">{taxas.taxa_cadastro_lead_robo !== null ? `${taxas.taxa_cadastro_lead_robo}%` : "—"}</div>
            </div>
            <div>
              <Label className="text-sm text-muted-foreground">Taxa Cadastro Facebook (cadastradas / leads)</Label>
              <div className="text-2xl font-semibold">{taxas.taxa_cadastro_lead_facebook !== null ? `${taxas.taxa_cadastro_lead_facebook}%` : "—"}</div>
            </div>
          </div>

          <div className="grid gap-4 lg:grid-cols-3">
            <div>
              <Label className="text-sm text-muted-foreground">Taxa Habilitação IA (habilitada / cadastradas)</Label>
              <div className="text-2xl font-semibold">{taxas.taxa_habilitacao_ia !== null ? `${taxas.taxa_habilitacao_ia}%` : "—"}</div>
            </div>
            <div>
              <Label className="text-sm text-muted-foreground">Taxa Habilitação Robô (habilitada / cadastradas)</Label>
              <div className="text-2xl font-semibold">{taxas.taxa_habilitacao_robo !== null ? `${taxas.taxa_habilitacao_robo}%` : "—"}</div>
            </div>
            <div>
              <Label className="text-sm text-muted-foreground">Taxa Habilitação Facebook (habilitada / cadastradas)</Label>
              <div className="text-2xl font-semibold">{taxas.taxa_habilitacao_facebook !== null ? `${taxas.taxa_habilitacao_facebook}%` : "—"}</div>
            </div>
          </div>
        </div>

        <div className="flex justify-end">
          <Button type="submit" className="h-12 px-6 text-base" disabled={saving}>
            {saving ? "Salvando…" : "Salvar dado"}
          </Button>
        </div>
      </form>
    </section>
  );
}
