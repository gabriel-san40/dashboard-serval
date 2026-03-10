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
        .select("id, habilitadas, pagas, instaladas")
        .limit(1)
        .single();

      if (error) throw error;
      return data;
    },
  });

  const [habilitadas, setHabilitadas] = useState(0);
  const [pagas, setPagas] = useState(0);
  const [instaladas, setInstaladas] = useState(0);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (status) {
      setHabilitadas(status.habilitadas);
      setPagas(status.pagas);
      setInstaladas(status.instaladas);
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

      <Card className="max-w-lg">
        <CardHeader>
          <CardTitle className="text-xl">Atualizar Status</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {isLoading ? (
            <div className="text-base text-muted-foreground">Carregando…</div>
          ) : (
            <>
              <div className="space-y-2">
                <Label className="text-lg">Habilitadas</Label>
                <Input
                  type="number"
                  className="h-14 text-lg"
                  min={0}
                  value={habilitadas}
                  onChange={(e) => setHabilitadas(Number(e.target.value))}
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
                <Label className="text-lg">Instaladas</Label>
                <Input
                  type="number"
                  className="h-14 text-lg"
                  min={0}
                  value={instaladas}
                  onChange={(e) => setInstaladas(Number(e.target.value))}
                />
              </div>

              <Button
                className="h-14 w-full text-lg"
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
