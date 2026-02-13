import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { TablesInsert } from "@/integrations/supabase/types";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "@/components/ui/use-toast";

export type CrudMode = "create" | "edit";

type BaseRow = { id: string; ativo: boolean; deleted_at: string | null; created_at: string; updated_at: string };

type NomeRow = BaseRow & { nome: string };

type WithProdutoRow = BaseRow & { nome: string; produto_id: string };

type ResourceConfig =
  | {
      kind: "nome";
      table:
        | "vendedores"
        | "produtos_sky"
        | "produtos_internet"
        | "formas_pagamento"
        | "origens_lead";
      title: string;
      description?: string;
    }
  | {
      kind: "pacote";
      table: "pacotes_sky" | "pacotes_internet";
      produtoTable: "produtos_sky" | "produtos_internet";
      title: string;
      description?: string;
    };

type Props = {
  resource: ResourceConfig;
};

export function CrudResource({ resource }: Props) {
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState<(NomeRow | WithProdutoRow)[]>([]);

  const [modalOpen, setModalOpen] = useState(false);
  const [mode, setMode] = useState<CrudMode>("create");
  const [editing, setEditing] = useState<(NomeRow | WithProdutoRow) | null>(null);

  const [nome, setNome] = useState("");
  const [produtoId, setProdutoId] = useState<string | null>(null);

  const [produtos, setProdutos] = useState<NomeRow[]>([]);

  const isPacote = resource.kind === "pacote";

  const canSubmit = useMemo(() => {
    if (!nome.trim()) return false;
    if (isPacote && !produtoId) return false;
    return true;
  }, [nome, isPacote, produtoId]);

  const openCreate = () => {
    setMode("create");
    setEditing(null);
    setNome("");
    setProdutoId(null);
    setModalOpen(true);
  };

  const openEdit = (row: NomeRow | WithProdutoRow) => {
    setMode("edit");
    setEditing(row);
    setNome(row.nome ?? "");
    setProdutoId(isPacote ? (row as WithProdutoRow).produto_id : null);
    setModalOpen(true);
  };

  const load = async () => {
    setLoading(true);
    try {
      if (resource.kind === "pacote") {
        const [{ data: prod, error: prodErr }, { data: dataRows, error: rowsErr }] = await Promise.all([
          supabase
            .from(resource.produtoTable)
            .select("id, nome, ativo, deleted_at, created_at, updated_at")
            .eq("ativo", true)
            .is("deleted_at", null)
            .order("nome", { ascending: true }),
          supabase
            .from(resource.table)
            .select("id, nome, produto_id, ativo, deleted_at, created_at, updated_at")
            .eq("ativo", true)
            .is("deleted_at", null)
            .order("nome", { ascending: true }),
        ]);

        if (prodErr) throw prodErr;
        if (rowsErr) throw rowsErr;

        setProdutos((prod ?? []) as NomeRow[]);
        setRows((dataRows ?? []) as WithProdutoRow[]);
      } else {
        const { data, error } = await supabase
          .from(resource.table)
          .select("id, nome, ativo, deleted_at, created_at, updated_at")
          .eq("ativo", true)
          .is("deleted_at", null)
          .order("nome", { ascending: true });

        if (error) throw error;
        setRows((data ?? []) as NomeRow[]);
      }
    } catch (e: any) {
      toast({
        title: "Erro ao carregar",
        description: e?.message ?? "Não foi possível carregar os registros.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resource.table]);

  const handleSave = async () => {
    if (!canSubmit) return;

    try {
      if (mode === "create") {
        if (resource.kind === "pacote") {
          const payload: TablesInsert<typeof resource.table> = {
            nome: nome.trim(),
            produto_id: produtoId!,
          } as any;

          const { error } = await supabase.from(resource.table).insert(payload);
          if (error) throw error;
        } else {
          const payload: TablesInsert<typeof resource.table> = {
            nome: nome.trim(),
          } as any;

          const { error } = await supabase.from(resource.table).insert(payload);
          if (error) throw error;
        }

        toast({ title: "Criado com sucesso" });
      } else {
        if (!editing) return;

        if (resource.kind === "pacote") {
          const { error } = await supabase
            .from(resource.table)
            .update({ nome: nome.trim(), produto_id: produtoId! } as any)
            .eq("id", editing.id);
          if (error) throw error;
        } else {
          const { error } = await supabase
            .from(resource.table)
            .update({ nome: nome.trim() } as any)
            .eq("id", editing.id);
          if (error) throw error;
        }

        toast({ title: "Atualizado com sucesso" });
      }

      setModalOpen(false);
      await load();
    } catch (e: any) {
      toast({
        title: "Erro ao salvar",
        description: e?.message ?? "Não foi possível salvar.",
        variant: "destructive",
      });
    }
  };

  const handleDeactivate = async (row: NomeRow | WithProdutoRow) => {
    try {
      const { error } = await supabase
        .from(resource.table)
        .update({ ativo: false, deleted_at: new Date().toISOString() } as any)
        .eq("id", row.id);

      if (error) throw error;

      toast({ title: "Registro desativado" });
      await load();
    } catch (e: any) {
      toast({
        title: "Erro ao desativar",
        description: e?.message ?? "Não foi possível desativar.",
        variant: "destructive",
      });
    }
  };

  const produtoNomeById = useMemo(() => {
    const m = new Map<string, string>();
    produtos.forEach((p) => m.set(p.id, p.nome));
    return m;
  }, [produtos]);

  return (
    <section className="space-y-4">
      <header className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold">{resource.title}</h2>
          {resource.description ? (
            <p className="text-sm text-muted-foreground">{resource.description}</p>
          ) : null}
        </div>
        <Button onClick={openCreate}>Novo</Button>
      </header>

      <div className="rounded-lg border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              {isPacote ? <TableHead>Produto</TableHead> : null}
              <TableHead className="w-[180px] text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={isPacote ? 3 : 2} className="py-10 text-center text-sm text-muted-foreground">
                  Carregando…
                </TableCell>
              </TableRow>
            ) : rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={isPacote ? 3 : 2} className="py-10 text-center text-sm text-muted-foreground">
                  Nenhum registro ativo.
                </TableCell>
              </TableRow>
            ) : (
              rows.map((r) => (
                <TableRow key={r.id}>
                  <TableCell className="font-medium">{r.nome}</TableCell>
                  {isPacote ? (
                    <TableCell className="text-sm text-muted-foreground">
                      {produtoNomeById.get((r as WithProdutoRow).produto_id) ?? "—"}
                    </TableCell>
                  ) : null}
                  <TableCell className="text-right">
                    <div className="inline-flex items-center gap-2">
                      <Button variant="secondary" size="sm" onClick={() => openEdit(r)}>
                        Editar
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="destructive" size="sm">
                            Desativar
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Desativar registro?</AlertDialogTitle>
                            <AlertDialogDescription>
                              Essa ação aplica soft delete (ativo=false e deleted_at preenchido). Você pode implementar reativação depois,
                              se necessário.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction onClick={() => void handleDeactivate(r)}>
                              Confirmar
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{mode === "create" ? "Novo" : "Editar"}</DialogTitle>
            <DialogDescription>{resource.title}</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="nome">Nome</Label>
              <Input id="nome" value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Digite o nome" />
            </div>

            {isPacote ? (
              <div className="space-y-2">
                <Label>Produto</Label>
                <Select value={produtoId ?? ""} onValueChange={(v) => setProdutoId(v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um produto" />
                  </SelectTrigger>
                  <SelectContent>
                    {produtos.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ) : null}
          </div>

          <DialogFooter>
            <Button variant="secondary" onClick={() => setModalOpen(false)}>
              Cancelar
            </Button>
            <Button disabled={!canSubmit} onClick={() => void handleSave()}>
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  );
}

