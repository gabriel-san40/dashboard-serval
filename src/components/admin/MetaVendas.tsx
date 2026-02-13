import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/components/ui/use-toast";

const META_KEYS = [
  { chave: "meta_vendas_sky", label: "Meta de Vendas Sky" },
  { chave: "meta_vendas_internet", label: "Meta de Vendas Internet" },
] as const;

type MetaValues = Record<string, string>;

export function MetaVendas() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [values, setValues] = useState<MetaValues>({
    meta_vendas_sky: "",
    meta_vendas_internet: "",
  });

  const load = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("configuracoes")
        .select("chave, valor_numeric")
        .in(
          "chave",
          META_KEYS.map((k) => k.chave),
        )
        .eq("ativo", true)
        .is("deleted_at", null);

      if (error) throw error;

      const next: MetaValues = {
        meta_vendas_sky: "",
        meta_vendas_internet: "",
      };

      data?.forEach((row) => {
        if (row.valor_numeric != null) {
          next[row.chave] = String(row.valor_numeric);
        }
      });

      setValues(next);
    } catch (e: any) {
      toast({
        title: "Erro ao carregar metas",
        description: e?.message ?? "Não foi possível carregar as metas.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      for (const { chave } of META_KEYS) {
        const raw = values[chave]?.trim();
        const num = raw ? Number(raw) : null;

        if (raw && (isNaN(num!) || num! < 0)) {
          toast({
            title: "Valor inválido",
            description: `O valor de "${chave}" deve ser um número positivo.`,
            variant: "destructive",
          });
          setSaving(false);
          return;
        }

        const { data: existing } = await supabase
          .from("configuracoes")
          .select("id")
          .eq("chave", chave)
          .maybeSingle();

        if (existing) {
          const { error } = await supabase
            .from("configuracoes")
            .update({ valor_numeric: num, ativo: true, deleted_at: null })
            .eq("id", existing.id);
          if (error) throw error;
        } else {
          const { error } = await supabase
            .from("configuracoes")
            .insert({ chave, valor_numeric: num });
          if (error) throw error;
        }
      }

      toast({ title: "Metas salvas com sucesso" });
      await load();
    } catch (e: any) {
      toast({
        title: "Erro ao salvar metas",
        description: e?.message ?? "Não foi possível salvar.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="space-y-4">
      <header>
        <h2 className="text-lg font-semibold">Metas de Vendas</h2>
        <p className="text-sm text-muted-foreground">
          Defina as metas mensais de vendas para Sky e Internet. Esses valores são usados nos dashboards.
        </p>
      </header>

      {loading ? (
        <p className="text-sm text-muted-foreground">Carregando…</p>
      ) : (
        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            {META_KEYS.map(({ chave, label }) => (
              <div key={chave} className="space-y-2">
                <Label htmlFor={chave}>{label}</Label>
                <Input
                  id={chave}
                  type="number"
                  min={0}
                  placeholder="Ex: 100"
                  value={values[chave]}
                  onChange={(e) =>
                    setValues((prev) => ({ ...prev, [chave]: e.target.value }))
                  }
                />
              </div>
            ))}
          </div>

          <Button onClick={() => void handleSave()} disabled={saving}>
            {saving ? "Salvando…" : "Salvar Metas"}
          </Button>
        </div>
      )}
    </section>
  );
}
