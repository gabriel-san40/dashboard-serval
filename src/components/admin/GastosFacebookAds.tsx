import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/components/ui/use-toast";
import { Trash2 } from "lucide-react";
import { todayLocal } from "@/lib/utils";

type Gasto = {
  id: string;
  data: string;
  valor: number;
};

export function GastosFacebookAds() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [gastos, setGastos] = useState<Gasto[]>([]);

  const [novaData, setNovaData] = useState(todayLocal);
  const [novoValor, setNovoValor] = useState("");

  const load = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("gastos_facebook_ads")
        .select("id, data, valor")
        .eq("ativo", true)
        .is("deleted_at", null)
        .order("data", { ascending: false });

      if (error) throw error;
      setGastos(data ?? []);
    } catch (e: any) {
      toast({
        title: "Erro ao carregar gastos",
        description: e?.message ?? "Não foi possível carregar os gastos.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const handleAdd = async () => {
    if (!novaData || !novoValor) return;

    const valor = Number(novoValor);
    if (isNaN(valor) || valor < 0) {
      toast({
        title: "Valor inválido",
        description: "Informe um valor numérico positivo.",
        variant: "destructive",
      });
      return;
    }

    setSaving(true);
    try {
      // Check if date already exists
      const { data: existing } = await supabase
        .from("gastos_facebook_ads")
        .select("id")
        .eq("data", novaData)
        .maybeSingle();

      if (existing) {
        const { error } = await supabase
          .from("gastos_facebook_ads")
          .update({ valor, ativo: true, deleted_at: null })
          .eq("id", existing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("gastos_facebook_ads")
          .insert({ data: novaData, valor });
        if (error) throw error;
      }

      toast({ title: "Gasto salvo com sucesso" });
      setNovaData("");
      setNovoValor("");
      await load();
    } catch (e: any) {
      toast({
        title: "Erro ao salvar gasto",
        description: e?.message ?? "Não foi possível salvar.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase
        .from("gastos_facebook_ads")
        .update({ ativo: false, deleted_at: new Date().toISOString() })
        .eq("id", id);
      if (error) throw error;

      toast({ title: "Gasto removido" });
      await load();
    } catch (e: any) {
      toast({
        title: "Erro ao remover",
        description: e?.message ?? "Não foi possível remover.",
        variant: "destructive",
      });
    }
  };

  return (
    <section className="space-y-4">
      <header>
        <h2 className="text-lg font-semibold">Gastos com Facebook Ads</h2>
        <p className="text-sm text-muted-foreground">
          Registre os gastos diários com Facebook Ads. Se a data já existir, o valor será atualizado.
        </p>
      </header>

      <div className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-3 sm:items-end">
          <div className="space-y-2">
            <Label htmlFor="fb-data">Data</Label>
            <Input
              id="fb-data"
              type="date"
              value={novaData}
              onChange={(e) => setNovaData(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="fb-valor">Valor (R$)</Label>
            <Input
              id="fb-valor"
              type="number"
              min={0}
              step="0.01"
              placeholder="Ex: 150.00"
              value={novoValor}
              onChange={(e) => setNovoValor(e.target.value)}
            />
          </div>
          <Button
            onClick={() => void handleAdd()}
            disabled={saving || !novaData || !novoValor}
          >
            {saving ? "Salvando…" : "Adicionar"}
          </Button>
        </div>

        {loading ? (
          <p className="text-sm text-muted-foreground">Carregando…</p>
        ) : gastos.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nenhum gasto registrado.</p>
        ) : (
          <div className="rounded-md border">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="px-4 py-2 text-left font-medium">Data</th>
                  <th className="px-4 py-2 text-left font-medium">Valor (R$)</th>
                  <th className="px-4 py-2 text-right font-medium">Ações</th>
                </tr>
              </thead>
              <tbody>
                {gastos.map((g) => (
                  <tr key={g.id} className="border-b last:border-0">
                    <td className="px-4 py-2">
                      {new Date(g.data + "T00:00:00").toLocaleDateString("pt-BR")}
                    </td>
                    <td className="px-4 py-2">
                      {g.valor.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                    </td>
                    <td className="px-4 py-2 text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => void handleDelete(g.id)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </section>
  );
}
