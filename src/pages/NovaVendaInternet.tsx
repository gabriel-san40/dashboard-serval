import { useCallback, useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { format, startOfMonth } from "date-fns";
import { Pencil, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { todayLocal } from "@/lib/utils";
import { toast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

type Option = { id: string; nome: string };

type VendaRow = {
  id: string;
  data_venda: string;
  cidade: string | null;
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

type FormValues = {
  data_venda: string;
  vendedor_id: string;
  produto_id: string;
  pacote_id: string | null;
  forma_pagamento_id: string;
  cidade: string;
  origem_lead_id: string | null;
};

const schema = z.object({
  data_venda: z.string().min(1, "Data é obrigatória"),
  vendedor_id: z.string().uuid("Selecione um vendedor"),
  produto_id: z.string().uuid("Selecione um produto"),
  pacote_id: z.string().uuid().nullable(),
  forma_pagamento_id: z.string().uuid("Selecione a forma de pagamento"),
  cidade: z.string().trim().min(1, "Cidade é obrigatória").max(120, "Cidade muito longa"),
  origem_lead_id: z.string().uuid().nullable(),
});

export default function NovaVendaInternet() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [vendedores, setVendedores] = useState<Option[]>([]);
  const [produtos, setProdutos] = useState<Option[]>([]);
  const [pacotes, setPacotes] = useState<Option[]>([]);
  const [formas, setFormas] = useState<Option[]>([]);
  const [origens, setOrigens] = useState<Option[]>([]);

  const today = format(new Date(), "yyyy-MM-dd");
  const monthStart = format(startOfMonth(new Date()), "yyyy-MM-dd");

  const [listInicio, setListInicio] = useState(today);
  const [listFim, setListFim] = useState(today);
  const [vendasList, setVendasList] = useState<VendaRow[]>([]);
  const [loadingList, setLoadingList] = useState(false);
  const [editingVenda, setEditingVenda] = useState<VendaRow | null>(null);
  const [editValues, setEditValues] = useState<FormValues | null>(null);
  const [editPacotes, setEditPacotes] = useState<Option[]>([]);
  const [savingEdit, setSavingEdit] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      data_venda: todayLocal(),
      vendedor_id: "",
      produto_id: "",
      pacote_id: null,
      forma_pagamento_id: "",
      cidade: "",
      origem_lead_id: null,
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
          supabase.from("produtos_internet").select("id, nome").eq("ativo", true).is("deleted_at", null).order("nome"),
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
        .from("pacotes_internet")
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

  const fetchVendas = useCallback(async () => {
    setLoadingList(true);
    try {
      const { data, error } = await supabase
        .from("vendas_internet")
        .select(
          [
            "id", "data_venda", "cidade",
            "vendedor_id", "produto_id", "pacote_id", "forma_pagamento_id", "origem_lead_id",
            "vendedor:vendedores(nome)",
            "produto:produtos_internet(nome)",
            "pacote:pacotes_internet(nome)",
            "origem:origens_lead(nome)",
            "forma:formas_pagamento(nome)",
          ].join(","),
        )
        .eq("ativo", true)
        .is("deleted_at", null)
        .gte("data_venda", listInicio)
        .lte("data_venda", listFim)
        .order("data_venda", { ascending: false });

      if (error) throw error;
      setVendasList((data ?? []) as unknown as VendaRow[]);
    } catch (e: any) {
      toast({ title: "Erro ao carregar vendas", description: e?.message, variant: "destructive" });
    } finally {
      setLoadingList(false);
    }
  }, [listInicio, listFim]);

  useEffect(() => {
    void fetchVendas();
  }, [fetchVendas]);

  const openEdit = async (v: VendaRow) => {
    setEditingVenda(v);
    setEditValues({
      data_venda: v.data_venda,
      vendedor_id: v.vendedor_id,
      produto_id: v.produto_id,
      pacote_id: v.pacote_id,
      forma_pagamento_id: v.forma_pagamento_id,
      cidade: v.cidade ?? "",
      origem_lead_id: v.origem_lead_id,
    });

    if (v.produto_id) {
      const { data } = await supabase
        .from("pacotes_internet")
        .select("id, nome")
        .eq("produto_id", v.produto_id)
        .eq("ativo", true)
        .is("deleted_at", null)
        .order("nome");
      setEditPacotes((data ?? []) as Option[]);
    } else {
      setEditPacotes([]);
    }
  };

  const handleEditProdutoChange = async (prodId: string) => {
    setEditValues((p) => p ? { ...p, produto_id: prodId, pacote_id: null } : p);
    if (prodId) {
      const { data } = await supabase
        .from("pacotes_internet")
        .select("id, nome")
        .eq("produto_id", prodId)
        .eq("ativo", true)
        .is("deleted_at", null)
        .order("nome");
      setEditPacotes((data ?? []) as Option[]);
    } else {
      setEditPacotes([]);
    }
  };

  const handleSaveEdit = async () => {
    if (!editingVenda || !editValues) return;
    setSavingEdit(true);
    try {
      const { error } = await supabase
        .from("vendas_internet")
        .update({
          data_venda: editValues.data_venda,
          vendedor_id: editValues.vendedor_id,
          produto_id: editValues.produto_id,
          pacote_id: editValues.pacote_id,
          forma_pagamento_id: editValues.forma_pagamento_id,
          cidade: editValues.cidade.trim(),
          origem_lead_id: editValues.origem_lead_id,
        })
        .eq("id", editingVenda.id);

      if (error) throw error;
      toast({ title: "Venda atualizada" });
      setEditingVenda(null);
      setEditValues(null);
      void fetchVendas();
    } catch (e: any) {
      toast({ title: "Erro ao atualizar", description: e?.message, variant: "destructive" });
    } finally {
      setSavingEdit(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingId) return;
    setDeleting(true);
    try {
      const { error } = await supabase
        .from("vendas_internet")
        .update({ ativo: false, deleted_at: new Date().toISOString() })
        .eq("id", deletingId);

      if (error) throw error;
      toast({ title: "Venda excluída" });
      setDeletingId(null);
      void fetchVendas();
    } catch (e: any) {
      toast({ title: "Erro ao excluir", description: e?.message, variant: "destructive" });
    } finally {
      setDeleting(false);
    }
  };

  const onSubmit = async (values: FormValues) => {
    if (pacoteObrigatorio && !values.pacote_id) {
      form.setError("pacote_id", { type: "manual", message: "Selecione um pacote" });
      return;
    }

    setSaving(true);
    try {
      const { error } = await supabase.from("vendas_internet").insert({
        data_venda: values.data_venda,
        vendedor_id: values.vendedor_id,
        produto_id: values.produto_id,
        pacote_id: values.pacote_id,
        forma_pagamento_id: values.forma_pagamento_id,
        cidade: values.cidade.trim(),
        origem_lead_id: values.origem_lead_id,
      });
      if (error) throw error;

      toast({ title: "Venda Internet cadastrada" });

      form.reset({
        data_venda: todayLocal(),
        vendedor_id: "",
        produto_id: "",
        pacote_id: null,
        forma_pagamento_id: "",
        cidade: "",
        origem_lead_id: null,
      });
      setPacotes([]);
      void fetchVendas();
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
        <h1 className="text-3xl font-bold tracking-tight">Cadastrar Venda Internet</h1>
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
            <Label>Origem do lead (opcional)</Label>
            <Select
              value={form.watch("origem_lead_id") ?? ""}
              onValueChange={(v) => form.setValue("origem_lead_id", v || null)}
            >
              <SelectTrigger className="h-12 text-base">
                <SelectValue placeholder={loading ? "Carregando…" : "Selecione (opcional)"} />
              </SelectTrigger>
              <SelectContent>
                {origens.map((o) => (
                  <SelectItem key={o.id} value={o.id}>
                    {o.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex justify-end">
          <Button type="submit" className="h-12 px-6 text-base" disabled={saving || loading}>
            {saving ? "Salvando…" : "Salvar venda"}
          </Button>
        </div>
      </form>

      {/* Lista de vendas */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold tracking-tight">Vendas cadastradas</h2>

        <div className="flex flex-wrap items-end gap-4">
          <div className="space-y-1">
            <Label>Início</Label>
            <Input type="date" className="h-10" value={listInicio} onChange={(e) => setListInicio(e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label>Fim</Label>
            <Input type="date" className="h-10" value={listFim} onChange={(e) => setListFim(e.target.value)} />
          </div>
          <Button type="button" variant="secondary" className="h-10" onClick={() => { setListInicio(today); setListFim(today); }}>
            Hoje
          </Button>
        </div>

        <div className="rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data</TableHead>
                <TableHead>Vendedor</TableHead>
                <TableHead>Produto</TableHead>
                <TableHead>Pacote</TableHead>
                <TableHead>Cidade</TableHead>
                <TableHead>Forma Pgto</TableHead>
                <TableHead>Origem</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loadingList ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center text-muted-foreground">
                    Carregando…
                  </TableCell>
                </TableRow>
              ) : vendasList.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center text-muted-foreground">
                    Nenhuma venda encontrada no período.
                  </TableCell>
                </TableRow>
              ) : (
                vendasList.map((v) => (
                  <TableRow key={v.id}>
                    <TableCell>{v.data_venda.split("-").reverse().join("/")}</TableCell>
                    <TableCell>{v.vendedor?.nome ?? "—"}</TableCell>
                    <TableCell>{v.produto?.nome ?? "—"}</TableCell>
                    <TableCell>{v.pacote?.nome ?? "—"}</TableCell>
                    <TableCell>{v.cidade ?? "—"}</TableCell>
                    <TableCell>{v.forma?.nome ?? "—"}</TableCell>
                    <TableCell>{v.origem?.nome ?? "—"}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="icon" onClick={() => openEdit(v)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => setDeletingId(v.id)}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </section>

      {/* Dialog de edição */}
      <Dialog open={!!editingVenda} onOpenChange={(open) => { if (!open) { setEditingVenda(null); setEditValues(null); } }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar Venda Internet</DialogTitle>
          </DialogHeader>
          {editValues && (
            <div className="grid gap-4 py-4 lg:grid-cols-2">
              <div className="space-y-1">
                <Label>Data</Label>
                <Input type="date" className="h-10" value={editValues.data_venda} onChange={(e) => setEditValues((p) => p ? { ...p, data_venda: e.target.value } : p)} />
              </div>
              <div className="space-y-1">
                <Label>Cidade</Label>
                <Input className="h-10" value={editValues.cidade} onChange={(e) => setEditValues((p) => p ? { ...p, cidade: e.target.value } : p)} />
              </div>
              <div className="space-y-1">
                <Label>Vendedor</Label>
                <Select value={editValues.vendedor_id} onValueChange={(v) => setEditValues((p) => p ? { ...p, vendedor_id: v } : p)}>
                  <SelectTrigger className="h-10"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {vendedores.map((o) => <SelectItem key={o.id} value={o.id}>{o.nome}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label>Forma de pagamento</Label>
                <Select value={editValues.forma_pagamento_id} onValueChange={(v) => setEditValues((p) => p ? { ...p, forma_pagamento_id: v } : p)}>
                  <SelectTrigger className="h-10"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {formas.map((o) => <SelectItem key={o.id} value={o.id}>{o.nome}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label>Produto</Label>
                <Select value={editValues.produto_id} onValueChange={(v) => handleEditProdutoChange(v)}>
                  <SelectTrigger className="h-10"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {produtos.map((o) => <SelectItem key={o.id} value={o.id}>{o.nome}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label>Pacote</Label>
                <Select value={editValues.pacote_id ?? ""} onValueChange={(v) => setEditValues((p) => p ? { ...p, pacote_id: v || null } : p)} disabled={editPacotes.length === 0}>
                  <SelectTrigger className="h-10"><SelectValue placeholder={editPacotes.length ? "Selecione" : "Sem pacotes"} /></SelectTrigger>
                  <SelectContent>
                    {editPacotes.map((o) => <SelectItem key={o.id} value={o.id}>{o.nome}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label>Origem do lead</Label>
                <Select value={editValues.origem_lead_id ?? ""} onValueChange={(v) => setEditValues((p) => p ? { ...p, origem_lead_id: v || null } : p)}>
                  <SelectTrigger className="h-10"><SelectValue placeholder="Selecione (opcional)" /></SelectTrigger>
                  <SelectContent>
                    {origens.map((o) => <SelectItem key={o.id} value={o.id}>{o.nome}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => { setEditingVenda(null); setEditValues(null); }}>Cancelar</Button>
            <Button onClick={handleSaveEdit} disabled={savingEdit}>{savingEdit ? "Salvando…" : "Salvar"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* AlertDialog de exclusão */}
      <AlertDialog open={!!deletingId} onOpenChange={(open) => { if (!open) setDeletingId(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir venda</AlertDialogTitle>
            <AlertDialogDescription>Tem certeza que deseja excluir esta venda? Esta ação não pode ser desfeita.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} disabled={deleting}>{deleting ? "Excluindo…" : "Excluir"}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </section>
  );
}
