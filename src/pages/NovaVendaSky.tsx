import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type Option = { id: string; nome: string };

type FormValues = {
  data_venda: string;
  vendedor_id: string;
  produto_id: string;
  pacote_id: string | null;
  forma_pagamento_id: string;
  seguro: boolean;
  cidade: string;
  origem_lead_id: string;
};

const schema = z
  .object({
    data_venda: z.string().min(1, "Data é obrigatória"),
    vendedor_id: z.string().uuid("Selecione um vendedor"),
    produto_id: z.string().uuid("Selecione um produto"),
    pacote_id: z.string().uuid().nullable(),
    forma_pagamento_id: z.string().uuid("Selecione a forma de pagamento"),
    seguro: z.boolean(),
    cidade: z.string().trim().min(1, "Cidade é obrigatória").max(120, "Cidade muito longa"),
    origem_lead_id: z.string().uuid("Selecione a origem do lead"),
  })
  .superRefine((val, ctx) => {
    // validação condicional de pacote é feita na UI quando lista de pacotes existir
    // aqui fica neutra (nullable) e a página adiciona erro manual.
  });

export default function NovaVendaSky() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [vendedores, setVendedores] = useState<Option[]>([]);
  const [produtos, setProdutos] = useState<Option[]>([]);
  const [pacotes, setPacotes] = useState<Option[]>([]);
  const [formas, setFormas] = useState<Option[]>([]);
  const [origens, setOrigens] = useState<Option[]>([]);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      data_venda: new Date().toISOString().slice(0, 10),
      vendedor_id: "",
      produto_id: "",
      pacote_id: null,
      forma_pagamento_id: "",
      seguro: false,
      cidade: "",
      origem_lead_id: "",
    },
    mode: "onSubmit",
  });

  const produtoId = form.watch("produto_id");

  const pacoteObrigatorio = useMemo(() => {
    return !!produtoId && pacotes.length > 0;
  }, [produtoId, pacotes.length]);

  useEffect(() => {
    const loadBase = async () => {
      setLoading(true);
      try {
        const [vend, prod, fp, ol] = await Promise.all([
          supabase.from("vendedores").select("id, nome").eq("ativo", true).is("deleted_at", null).order("nome"),
          supabase.from("produtos_sky").select("id, nome").eq("ativo", true).is("deleted_at", null).order("nome"),
          supabase.from("formas_pagamento").select("id, nome").eq("ativo", true).is("deleted_at", null).order("nome"),
          supabase.from("origens_lead").select("id, nome").eq("ativo", true).is("deleted_at", null).order("nome"),
        ]);
        if (vend.error) throw vend.error;
        if (prod.error) throw prod.error;
        if (fp.error) throw fp.error;
        if (ol.error) throw ol.error;

        setVendedores((vend.data ?? []) as Option[]);
        setProdutos((prod.data ?? []) as Option[]);
        setFormas((fp.data ?? []) as Option[]);
        setOrigens((ol.data ?? []) as Option[]);
      } catch (e: any) {
        toast({
          title: "Erro ao carregar opções",
          description: e?.message ?? "Não foi possível carregar cadastros base.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    void loadBase();
  }, []);

  useEffect(() => {
    const loadPacotes = async () => {
      if (!produtoId) {
        setPacotes([]);
        form.setValue("pacote_id", null);
        return;
      }

      const { data, error } = await supabase
        .from("pacotes_sky")
        .select("id, nome")
        .eq("produto_id", produtoId)
        .eq("ativo", true)
        .is("deleted_at", null)
        .order("nome");

      if (error) {
        setPacotes([]);
        return;
      }

      const list = (data ?? []) as Option[];
      setPacotes(list);

      // se pacote virou obrigatório, força selecionar
      if (list.length === 0) {
        form.setValue("pacote_id", null);
      } else {
        const current = form.getValues("pacote_id");
        if (current && !list.some((p) => p.id === current)) {
          form.setValue("pacote_id", null);
        }
      }
    };

    void loadPacotes();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [produtoId]);

  const onSubmit = async (values: FormValues) => {
    // Pacote obrigatório condicional
    if (pacoteObrigatorio && !values.pacote_id) {
      form.setError("pacote_id", { type: "manual", message: "Selecione um pacote" });
      return;
    }

    setSaving(true);
    try {
      const { error } = await supabase.from("vendas_sky").insert({
        data_venda: values.data_venda,
        vendedor_id: values.vendedor_id,
        produto_id: values.produto_id,
        pacote_id: values.pacote_id,
        forma_pagamento_id: values.forma_pagamento_id,
        seguro: values.seguro,
        cidade: values.cidade.trim(),
        origem_lead_id: values.origem_lead_id,
      });
      if (error) throw error;

      toast({ title: "Venda Sky cadastrada" });

      form.reset({
        data_venda: new Date().toISOString().slice(0, 10),
        vendedor_id: "",
        produto_id: "",
        pacote_id: null,
        forma_pagamento_id: "",
        seguro: false,
        cidade: "",
        origem_lead_id: "",
      });
      setPacotes([]);
    } catch (e: any) {
      toast({
        title: "Erro ao salvar",
        description: e?.message ?? "Não foi possível cadastrar a venda.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="space-y-6">
      <header className="space-y-1">
        <h1 className="text-3xl font-bold tracking-tight">Cadastrar Venda Sky</h1>
        <p className="text-base text-muted-foreground">Preencha os campos e salve para registrar uma nova venda.</p>
      </header>

      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5 rounded-lg border bg-card p-6">
        <div className="grid gap-5 lg:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="data_venda">Data</Label>
            <Input id="data_venda" type="date" className="h-12 text-base" {...form.register("data_venda")} />
            {form.formState.errors.data_venda ? (
              <p className="text-sm text-destructive">{form.formState.errors.data_venda.message}</p>
            ) : null}
          </div>

          <div className="space-y-2">
            <Label>Cidade</Label>
            <Input className="h-12 text-base" placeholder="Ex.: São Paulo" {...form.register("cidade")} />
            {form.formState.errors.cidade ? <p className="text-sm text-destructive">{form.formState.errors.cidade.message}</p> : null}
          </div>

          <div className="space-y-2">
            <Label>Vendedor</Label>
            <Select value={form.watch("vendedor_id")} onValueChange={(v) => form.setValue("vendedor_id", v, { shouldValidate: true })}>
              <SelectTrigger className="h-12 text-base">
                <SelectValue placeholder={loading ? "Carregando…" : "Selecione"} />
              </SelectTrigger>
              <SelectContent>
                {vendedores.map((o) => (
                  <SelectItem key={o.id} value={o.id}>
                    {o.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {form.formState.errors.vendedor_id ? (
              <p className="text-sm text-destructive">{form.formState.errors.vendedor_id.message}</p>
            ) : null}
          </div>

          <div className="space-y-2">
            <Label>Forma de pagamento</Label>
            <Select
              value={form.watch("forma_pagamento_id")}
              onValueChange={(v) => form.setValue("forma_pagamento_id", v, { shouldValidate: true })}
            >
              <SelectTrigger className="h-12 text-base">
                <SelectValue placeholder={loading ? "Carregando…" : "Selecione"} />
              </SelectTrigger>
              <SelectContent>
                {formas.map((o) => (
                  <SelectItem key={o.id} value={o.id}>
                    {o.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {form.formState.errors.forma_pagamento_id ? (
              <p className="text-sm text-destructive">{form.formState.errors.forma_pagamento_id.message}</p>
            ) : null}
          </div>

          <div className="space-y-2">
            <Label>Produto</Label>
            <Select value={form.watch("produto_id")} onValueChange={(v) => form.setValue("produto_id", v, { shouldValidate: true })}>
              <SelectTrigger className="h-12 text-base">
                <SelectValue placeholder={loading ? "Carregando…" : "Selecione"} />
              </SelectTrigger>
              <SelectContent>
                {produtos.map((o) => (
                  <SelectItem key={o.id} value={o.id}>
                    {o.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {form.formState.errors.produto_id ? (
              <p className="text-sm text-destructive">{form.formState.errors.produto_id.message}</p>
            ) : null}
          </div>

          <div className="space-y-2">
            <Label>
              Pacote {pacoteObrigatorio ? <span className="text-destructive">*</span> : <span className="text-muted-foreground">(opcional)</span>}
            </Label>
            <Select
              value={form.watch("pacote_id") ?? ""}
              onValueChange={(v) => form.setValue("pacote_id", v || null, { shouldValidate: true })}
              disabled={!produtoId || pacotes.length === 0}
            >
              <SelectTrigger className="h-12 text-base">
                <SelectValue placeholder={!produtoId ? "Selecione um produto" : pacotes.length ? "Selecione" : "Sem pacotes"} />
              </SelectTrigger>
              <SelectContent>
                {pacotes.map((o) => (
                  <SelectItem key={o.id} value={o.id}>
                    {o.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {form.formState.errors.pacote_id ? (
              <p className="text-sm text-destructive">{form.formState.errors.pacote_id.message}</p>
            ) : null}
          </div>

          <div className="space-y-2">
            <Label>Origem do lead</Label>
            <Select
              value={form.watch("origem_lead_id")}
              onValueChange={(v) => form.setValue("origem_lead_id", v, { shouldValidate: true })}
            >
              <SelectTrigger className="h-12 text-base">
                <SelectValue placeholder={loading ? "Carregando…" : "Selecione"} />
              </SelectTrigger>
              <SelectContent>
                {origens.map((o) => (
                  <SelectItem key={o.id} value={o.id}>
                    {o.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {form.formState.errors.origem_lead_id ? (
              <p className="text-sm text-destructive">{form.formState.errors.origem_lead_id.message}</p>
            ) : null}
          </div>

          <div className="space-y-2">
            <Label>Seguro</Label>
            <div className="flex h-12 items-center justify-between rounded-md border bg-background px-4">
              <span className="text-base text-muted-foreground">Adicionar seguro?</span>
              <Switch checked={form.watch("seguro")} onCheckedChange={(v) => form.setValue("seguro", v)} />
            </div>
          </div>
        </div>

        <div className="flex justify-end">
          <Button type="submit" className="h-12 px-6 text-base" disabled={saving || loading}>
            {saving ? "Salvando…" : "Salvar venda"}
          </Button>
        </div>
      </form>
    </section>
  );
}
