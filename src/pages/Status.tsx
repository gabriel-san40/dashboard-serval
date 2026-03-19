import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function Status() {
  const qc = useQueryClient();

  const { data: status, isLoading } = useQuery({
    queryKey: ["status"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("status")
        .select("id, habilitadas, pagas, instaladas, negadas, ag_pagamento, ag_habilitacao")
        .limit(1)
        .single();

      if (error) throw error;
      return data;
    },
  });

  const [habilitadas, setCadastradas] = useState(0);
  const [pagas, setPagas] = useState(0);
  const [instaladas, setInstaladas] = useState(0);
  const [negadas, setNegadas] = useState(0);
  const [agPagamento, setAgPagamento] = useState(0);
  const [agHabilitacao, setAgHabilitacao] = useState(0);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (status) {
      setCadastradas(status.habilitadas);
      setPagas(status.pagas);
      setInstaladas(status.instaladas);
      setNegadas(status.negadas);
      setAgPagamento(status.ag_pagamento);
      setAgHabilitacao(status.ag_habilitacao);
    }
  }, [status]);

  const handleSave = async () => {
    if (!status) return;
    setSaving(true);
    try {
      const { error } = await supabase
        .from("status")
        .update({
          habilitadas,
          pagas,
          instaladas,
          negadas,
          ag_pagamento: agPagamento,
          ag_habilitacao: agHabilitacao,
        })
        .eq("id", status.id);

      if (error) throw error;

      qc.invalidateQueries({ queryKey: ["status"] });
      toast({ title: "Status atualizado com sucesso!" });
    } catch (err: any) {
      toast({ title: "Erro ao salvar", description: err.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="space-y-8">
      <header>
        <h1 className="text-4xl font-bold tracking-tight">Status</h1>
      </header>

      <Card>
        <CardHeader>
          <CardTitle className="text-xl">Atualizar Status</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {isLoading ? (
            <div className="text-base text-muted-foreground">Carregando…</div>
          ) : (
            <>
              <div className="grid grid-cols-3 gap-6">
                <div className="space-y-2">
                  <Label className="text-lg">Cadastradas</Label>
                  <Input
                    type="number"
                    className="h-14 text-lg"
                    min={0}
                    value={habilitadas}
                    onChange={(e) => setCadastradas(Number(e.target.value))}
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-lg">Pagas</Label>
                  <Input
                    type="number"
                    className="h-14 text-lg"
                    min={0}
                    value={pagas}
                    onChange={(e) => setPagas(Number(e.target.value))}
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-lg">Habilitadas</Label>
                  <Input
                    type="number"
                    className="h-14 text-lg"
                    min={0}
                    value={instaladas}
                    onChange={(e) => setInstaladas(Number(e.target.value))}
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-lg">Negadas</Label>
                  <Input
                    type="number"
                    className="h-14 text-lg"
                    min={0}
                    value={negadas}
                    onChange={(e) => setNegadas(Number(e.target.value))}
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-lg">AG-Pagamento</Label>
                  <Input
                    type="number"
                    className="h-14 text-lg"
                    min={0}
                    value={agPagamento}
                    onChange={(e) => setAgPagamento(Number(e.target.value))}
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-lg">AG-Habilitação</Label>
                  <Input
                    type="number"
                    className="h-14 text-lg"
                    min={0}
                    value={agHabilitacao}
                    onChange={(e) => setAgHabilitacao(Number(e.target.value))}
                  />
                </div>
              </div>

              <Button
                className="h-14 px-12 text-lg"
                onClick={handleSave}
                disabled={saving}
              >
                {saving ? "Salvando…" : "Salvar"}
              </Button>
            </>
          )}
        </CardContent>
      </Card>
    </section>
  );
}
