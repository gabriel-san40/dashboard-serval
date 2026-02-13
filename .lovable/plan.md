
## Objetivo
Construir um sistema completo de dashboards de vendas (Sky, Internet e Administrativo) com cadastro de dados, painel de configurações e controle de acesso por perfil (usuario/gerente/admin), otimizado para TV 42” (1920×1080), com atualização em tempo real.

---

## Decisões/ajustes necessários (por segurança)
### Autenticação
Você pediu “tabela `usuarios` com senha”. Para manter o sistema seguro (e viável no Supabase), o plano será:
- **Login via Supabase Auth** (sessão, segurança e controle de acesso confiáveis).
- Criar **3 contas fixas** (usuario / gerente / admin).
- Guardar permissões via **tabela de papéis (roles) separada** (admin/gerente/usuario), e não “senha em tabela”.

> Resultado: você continua tendo exatamente os 3 usuários fixos com níveis de acesso, mas com autenticação segura e governança (RLS) correta.

---

## Escopo do que será entregue (completo, de primeira)
### 1) Estrutura de navegação e layout (TV 42”)
- Layout “dashboard” com:
  - **Header** com nome do sistema, usuário logado, botão de logout e indicador de ambiente.
  - **Sidebar/menu dinâmico por perfil** (usuario/gerente/admin).
  - Conteúdo com **cards grandes**, tipografia legível e alto contraste.
- Páginas principais:
  - Login
  - Dashboard Vendas Sky
  - Dashboard Vendas Internet
  - Dashboard Administrativo (admin)
  - Cadastrar Venda Sky (gerente/admin)
  - Cadastrar Venda Internet (gerente/admin)
  - Cadastrar Dados Administrativos (admin)
  - Configurações (admin)
  - Acesso Negado (403)
  - NotFound (404)

---

## 2) Controle de acesso (UX + regras)
- **Menus e rotas protegidas** por perfil:
  - **usuario (read-only)**: só dashboards Sky/Internet + logout
  - **gerente**: dashboards + cadastros de vendas + logout
  - **admin**: tudo (dashboards + cadastros + configurações + CRUDs)
- Se o usuário tentar abrir URL sem permissão:
  - Redirecionar para **“Acesso Negado”** com explicação clara e botão “Voltar ao Dashboard”.

---

## 3) Modelagem de dados (Supabase) e “cadastros base”
### Tabelas operacionais
- `vendas_sky` (somente leitura nos dashboards; inserção via formulário por gerente/admin)
- `vendas_internet` (mesma regra)
- `dados_administrativos` (somente admin pode inserir/consultar)
- `configuracoes` (metas Sky/Internet, somente admin edita)

### Tabelas de apoio (para selects e filtros)
- `vendedores` (ativo; soft delete)
- `produtos_sky` (ativo; soft delete)
- `pacotes_sky` (produto_id; ativo; soft delete)
- `produtos_internet` (ativo; soft delete)
- `pacotes_internet` (produto_id; ativo; soft delete)
- `formas_pagamento` (ativo; soft delete)
- `origens_lead` (ativo; soft delete)

### Regras importantes de UX já no desenho
- Em todos os **selects dos formulários**, mostrar **somente itens ativos**.
- Em “exclusão”, usar **soft delete** e confirmação.
- Ao tentar desativar/excluir “produto com pacotes”, bloquear com mensagem amigável (orientar primeiro desativar pacotes).

---

## 4) Dashboards (somente visualização)
### 4.1 Dashboard Vendas Sky (usuario/gerente/admin)
**Visões principais (cards + gráficos + ranking)**
- Total de vendas no período
- Série temporal (dia/semana/mês)
- Ranking por vendedor
- Vendas por produto
- Vendas por pacote
- Conversão com seguro (percentual + contagem)
- Top 10 cidades
- Vendas por origem de lead
- Meta vs realizado (com destaque visual e “progresso”)

**Filtros (barra superior)**
- Período (data inicial/final) + presets (Hoje / Semana / Mês)
- Vendedor
- Produto
- Cidade (texto)

### 4.2 Dashboard Vendas Internet (usuario/gerente/admin)
Mesma estrutura e experiência do Sky (para consistência), mudando as dimensões (produto/pacote internet).

### 4.3 Dashboard Administrativo (somente admin)
**Visões**
- Cards com totais por canal (IA/ROBO/Facebook)
- Funil/conversão por canal (do lead → sem contato → negociação → cadastradas → habilitadas)
- Gráficos de taxas (cadastro e habilitação)
- Comparativo entre canais
- Evolução temporal

**Filtros**
- Período
- Canal

**Cálculos automáticos (apresentação)**
- Exibir taxas calculadas (cadastro/habilitação) com tratamento quando denominador = 0 (mostrar “—” e evitar infinito).

---

## 5) Páginas de cadastro (com validação + feedback)
### 5.1 Cadastrar Venda Sky (gerente/admin)
- Form com:
  - Data (padrão hoje)
  - Vendedor (select)
  - Produto (select)
  - Pacote (select dependente do produto)
  - Forma de pagamento
  - Seguro (toggle)
  - Cidade
  - Origem do lead
- Ao salvar:
  - Loading state no botão
  - Toast de sucesso/erro
  - Reset opcional para “cadastrar próxima” (atalho para alta produtividade)

### 5.2 Cadastrar Venda Internet (gerente/admin)
Idêntico ao Sky (mantendo consistência).

### 5.3 Cadastrar Dados Administrativos (admin)
- Form com todos os campos
- Exibir “taxas calculadas” em tempo real enquanto preenche (prévia), e após salvar mostrar resumo.

---

## 6) Painel de Configurações (somente admin)
### 6.1 Metas de Vendas
- Campos:
  - Meta Vendas Sky
  - Meta Vendas Internet
- Botão salvar + confirmação visual

### 6.2 CRUDs (telas padrão consistentes)
Para: vendedores, produtos/pacotes sky, produtos/pacotes internet, formas pagamento, origens lead
- Lista com busca, status (ativo/inativo), ações (editar/desativar)
- Criação/edição via modal ou página (padronizar)
- Confirmação antes de desativar
- Mensagens claras para dependências (ex.: produto não pode ser desativado se houver pacotes ativos vinculados)

---

## 7) Atualização em tempo real (Realtime)
- Dashboards reagem automaticamente a:
  - novas vendas
  - novos dados administrativos
  - alterações em configurações (metas)
- UX de “atualizado agora” (ex.: timestamp discreto) + fallback para recarregar caso conexão caia.

---

## 8) Qualidade, estados e segurança (experiência do usuário)
- Skeletons e placeholders durante carregamento
- Tratamento de erro com mensagens acionáveis (“Tente novamente”, “Verifique conexão”)
- Validação de formulários (campos obrigatórios, limites de tamanho, tipos)
- Auditoria básica de ações críticas (ex.: quem cadastrou venda) para rastreabilidade

---

## 9) Entrega por etapas (para construir “completo” sem perder controle)
1. Base do app: layout TV + rotas + páginas vazias + “Acesso Negado”
2. Autenticação + papéis + menu dinâmico por perfil
3. Banco (tabelas + regras de acesso) + cadastros base (CRUDs)
4. Cadastros de vendas (Sky/Internet) + dependências de selects
5. Dashboards Sky/Internet (cards + gráficos + filtros + ranking + meta vs realizado)
6. Dashboard Administrativo (cards + funis + taxas + filtros)
7. Realtime + polimento (loading/skeletons, erros, responsividade 1920×1080)
8. Checklist final: testes completos por perfil (usuario/gerente/admin) + validação end-to-end

---

## Checklist de aceitação (o que você verá funcionando)
- Login com 3 perfis fixos e menu correto para cada um
- Dashboards somente leitura para todos (ninguém edita lá)
- Gerente/admin conseguem cadastrar vendas; usuario não vê nem acessa as rotas
- Admin consegue cadastrar dados administrativos e mexer em metas/CRUDs
- Metas aparecem em “meta vs realizado” nos dashboards
- Atualização em tempo real refletindo novas inserções sem recarregar a página
- Layout legível e “de TV” (cards grandes, contraste e espaçamento)
