# Manual do Painel de Administração — LLBR

Este guia explica como o **Ricardo** pode atualizar o site sozinho, sem
precisar mexer em código. Toda alteração feita no painel vira um **pedido
(Pull Request) no GitHub**, que o Lucas revisa e aprova. Depois de aprovado,
o site se atualiza sozinho.

---

## 1. Como abrir o painel

1. Acesse o site normalmente.
2. No rodapé (final da página), clique em **"Painel de administração"**.
   - Ou acesse direto: `https://SEU-SITE/admin.html`
3. Digite a senha do painel: **`llbr2026`**
   - (essa senha pode ser trocada pelo Lucas no arquivo `public/admin.js`)

---

## 2. O que você precisa uma vez só: o Token do GitHub

Para o painel conseguir salvar as mudanças, ele precisa de um **token** do
GitHub (uma espécie de "chave"). Você cria uma vez e cola no painel.

### Como criar o token

1. Entre em https://github.com/settings/tokens
2. Clique em **"Generate new token"** → **"Generate new token (classic)"**
3. Dê um nome, por exemplo: `Painel LLBR`
4. Em **"Expiration"**, escolha um prazo (ex: 90 dias ou "No expiration")
5. Marque a permissão **`repo`** (controle total dos repositórios)
6. Clique em **"Generate token"** e **copie** o código que aparece
   (começa com `ghp_...`)
7. Cole esse código no campo de token do painel quando ele pedir.

> O token fica guardado só na sua sessão do navegador. Se fechar e abrir de
> novo, talvez precise colar de novo. **Nunca compartilhe esse token.**

---

## 3. O que dá para editar

No painel você tem abas para cada parte do site:

| Aba | O que muda |
|-----|------------|
| **Contato** | Telefone, WhatsApp, e-mail, Instagram, endereço |
| **Serviços** | Os cartões de serviços (título, descrição, código) |
| **Galeria** | As fotos de obras (endereço da foto + legenda) |
| **Antes/Depois** | Os comparativos arrasta-e-vê (foto antes + foto depois) |
| **Tags** | A lista de áreas de atendimento |

Cada aba tem um botão **"Salvar"**. Ao clicar:
1. O painel cria um pedido (PR) no GitHub com as mudanças.
2. O Lucas recebe e revisa.
3. Quando ele aprovar, o site atualiza.

---

## 4. Como adicionar fotos novas

As fotos ficam guardadas no repositório, na pasta `public/fotos/`. Há
**duas formas** de adicionar fotos novas:

### Forma A — Pelo Google Drive (automática)
1. Jogue as fotos na pasta do Google Drive combinada:
   https://drive.google.com/drive/folders/1uqqYv74uaX1eeCN396wlADE3Cynwipq0
2. Um robô (workflow do GitHub) baixa as fotos automaticamente uma vez por
   dia e cria um pedido (PR) com elas.
3. O Lucas revisa, organiza e publica.

### Forma B — Pedindo pelo site
1. Use a seção **"Pedidos de melhoria"** no final do site.
2. Escolha o tipo **"Foto"** e descreva o que quer.
3. Vira um pedido (issue) no GitHub.

> Depois que as fotos estiverem no repositório, use a aba **Galeria** ou
> **Antes/Depois** do painel para colocá-las no lugar certo.

---

## 5. Seção de pedidos de melhoria

No final do site existe a seção **"Pedidos de melhoria do site"**. Qualquer
pessoa (você, clientes, o Lucas) pode mandar uma sugestão, relatar um erro ou
pedir uma mudança. Cada envio vira um pedido organizado no GitHub.

---

## Dúvidas?

Fale com o Lucas. Tudo que você faz no painel é **reversível** — nada é
publicado sem a revisão dele primeiro.
