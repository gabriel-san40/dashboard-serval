import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CrudResource } from "@/components/admin/CrudResource";
import { MetaVendas } from "@/components/admin/MetaVendas";

const AdminCadastros = () => {
  return (
    <section className="space-y-6">
      <header className="space-y-1">
        <h1 className="text-3xl font-bold tracking-tight">Cadastros (Admin)</h1>
        <p className="text-base text-muted-foreground">Gerencie cadastros base. Ação de “Desativar” aplica soft delete.</p>
      </header>

      <Tabs defaultValue="vendedores" className="space-y-6">
        <TabsList className="flex h-auto flex-wrap justify-start gap-2">
          <TabsTrigger value="vendedores">Vendedores</TabsTrigger>
          <TabsTrigger value="sky_produtos">Sky: Produtos</TabsTrigger>
          <TabsTrigger value="sky_pacotes">Sky: Pacotes</TabsTrigger>
          <TabsTrigger value="net_produtos">Internet: Produtos</TabsTrigger>
          <TabsTrigger value="net_pacotes">Internet: Pacotes</TabsTrigger>
          <TabsTrigger value="formas">Formas Pgto</TabsTrigger>
          <TabsTrigger value="origens">Origens Lead</TabsTrigger>
          <TabsTrigger value="metas">Metas de Vendas</TabsTrigger>
        </TabsList>

        <TabsContent value="vendedores">
          <CrudResource
            resource={{
              kind: "nome",
              table: "vendedores",
              title: "Vendedores",
              description: "Usado em vendas e rankings.",
            }}
          />
        </TabsContent>

        <TabsContent value="sky_produtos">
          <CrudResource
            resource={{
              kind: "nome",
              table: "produtos_sky",
              title: "Produtos Sky",
            }}
          />
        </TabsContent>

        <TabsContent value="sky_pacotes">
          <CrudResource
            resource={{
              kind: "pacote",
              table: "pacotes_sky",
              produtoTable: "produtos_sky",
              title: "Pacotes Sky",
              description: "Pacotes vinculados a um produto Sky.",
            }}
          />
        </TabsContent>

        <TabsContent value="net_produtos">
          <CrudResource
            resource={{
              kind: "nome",
              table: "produtos_internet",
              title: "Produtos Internet",
            }}
          />
        </TabsContent>

        <TabsContent value="net_pacotes">
          <CrudResource
            resource={{
              kind: "pacote",
              table: "pacotes_internet",
              produtoTable: "produtos_internet",
              title: "Pacotes Internet",
              description: "Pacotes vinculados a um produto de Internet.",
            }}
          />
        </TabsContent>

        <TabsContent value="formas">
          <CrudResource
            resource={{
              kind: "nome",
              table: "formas_pagamento",
              title: "Formas de Pagamento",
            }}
          />
        </TabsContent>

        <TabsContent value="origens">
          <CrudResource
            resource={{
              kind: "nome",
              table: "origens_lead",
              title: "Origens de Lead",
            }}
          />
        </TabsContent>

        <TabsContent value="metas">
          <MetaVendas />
        </TabsContent>
      </Tabs>
    </section>
  );
};

export default AdminCadastros;
