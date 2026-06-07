# Arquitetura do site LLBR — banco de dados e integração entre repositórios

Este documento descreve como o site funciona por dentro e como ele foi
preparado para, no futuro, se **conectar com outros sites/repositórios**.

---

## 1. Visão geral

O site é um projeto **Vite** (HTML + CSS + JavaScript), publicado na
**Vercel**. O conteúdo dinâmico (serviços, fotos, contato, etc.) NÃO está
escrito direto no HTML — ele vem de um **banco de dados em JSON**.

```
┌─────────────────────────────────────────────────────────────┐
│  public/data/site-data.json   ← "BANCO DE DADOS" do site      │
│  (contato, hero, serviços, galeria, antes/depois, tags)       │
└───────────────┬─────────────────────────────────────────────┘
                │ fetch()
                ▼
┌─────────────────────────────────────────────────────────────┐
│  src/modules/content.js   ← lê o JSON e monta a página         │
│  renderServicos / renderGaleria / renderAntesDepois / ...      │
└─────────────────────────────────────────────────────────────┘
```

### Por que JSON e não um banco SQL?
- É **simples, versionado pelo Git** (todo histórico de mudanças fica salvo).
- Não precisa servidor nem custo de hospedagem de banco.
- Cada alteração vira um **Pull Request** revisável.
- Funciona 100% em site estático (Vercel/GitHub Pages).

Se um dia precisar de um banco "de verdade" (muitas escritas simultâneas,
busca complexa), dá para trocar o `content.js` para buscar de uma API
(Supabase, Firebase, etc.) sem reescrever o resto do site.

---

## 2. Como o Ricardo edita (fluxo de edição → PR)

```
Ricardo abre /admin.html
   │
   ├─ digita senha + token GitHub
   │
   ├─ edita contato / serviços / galeria / ...
   │
   └─ clica "Salvar"
        │
        ▼
   admin.js chama a API do GitHub:
     1. GET   sha atual do site-data.json
     2. POST  cria branch  admin/update-AAAA-MM-DD-HHMM
     3. PUT   grava o novo JSON na branch
     4. POST  abre um Pull Request
        │
        ▼
   Lucas revisa o PR → faz merge → Vercel publica
```

Arquivo responsável: `public/admin.js`. Guia para o pai: `docs/MANUAL-DO-RICARDO.md`.

---

## 3. Sincronização com o Google Drive

Workflow: `.github/workflows/drive-sync.yml`

- Roda **todo dia** (e pode ser disparado na mão pela aba Actions).
- Baixa as fotos da pasta do Drive com `gdown`.
- Se houver fotos novas, cria uma branch e abre um PR automático em
  `public/fotos/drive-sync/`.

Pasta do Drive monitorada (atual):
`https://drive.google.com/drive/folders/1JRtGxGdYsQ4xkmoZ1kbv6r6Y6SXrNkYz`

> A pasta tem um documento/PDF de orientação que indica quais fotos usar e
> como organizá-las (galeria x antes/depois). Esse guia direciona a curadoria
> antes de publicar.
>
> Para pastas privadas, é preciso configurar um Service Account do Google e
> salvar a credencial no secret `GDRIVE_CREDENTIALS`. Para pastas públicas
> (qualquer um com o link), funciona direto.

---

## 4. Integração futura com OUTROS repositórios/sites

O pedido é: *"no futuro esse site vai ter conexão com outros sites e ele tem
que estar preparado para isso."* Veja como a arquitetura já deixa isso pronto:

### 4.1. Contrato de dados estável (`site-data.json`)
O JSON tem um campo `_version`. Qualquer outro site/repositório que quiser
**consumir** os dados da LLBR pode buscar:

```
https://SEU-SITE/data/site-data.json
```

e ler os mesmos serviços, fotos e contato. É uma **API pública de leitura**
de graça. Outros projetos (ex: um portfólio, um site irmão) podem importar
esses dados sem duplicar conteúdo.

### 4.2. Como conectar um novo repositório (passo a passo futuro)
1. **Leitura compartilhada:** o novo site faz `fetch()` do
   `site-data.json` deste site. Pronto — os dois compartilham conteúdo.
2. **Escrita compartilhada:** o novo site pode usar a mesma lógica do
   `admin.js` (criar PR via API do GitHub) apontando para o repositório
   certo. Basta trocar a constante `REPO`.
3. **Eventos entre repositórios:** dá para usar `repository_dispatch` do
   GitHub Actions — quando algo muda aqui, dispara um workflow no outro
   repositório (e vice-versa). Isso mantém vários sites sincronizados.

### 4.3. Onde mexer quando chegar a hora
| Quero... | Mexer em... |
|----------|-------------|
| Outro site ler estes dados | nada — só apontar o `fetch` para `/data/site-data.json` |
| Outro repositório receber atualização | criar workflow com `repository_dispatch` |
| Centralizar o banco em um lugar só | trocar a URL do `fetch` em `content.js` |
| Trocar JSON por API real | reescrever só `carregarDados()` em `content.js` |

---

## 5. Estrutura de pastas

```
LLBR-Innovations-Constructions/
├── index.html              ← página principal (containers vazios)
├── public/
│   ├── admin.html          ← painel de administração (Ricardo)
│   ├── admin.js            ← lógica do painel (cria PRs)
│   ├── data/
│   │   └── site-data.json  ← BANCO DE DADOS do site
│   └── fotos/
│       ├── galeria/        ← fotos da galeria
│       ├── antes/          ← fotos "antes"
│       ├── depois/         ← fotos "depois"
│       └── drive-sync/     ← fotos baixadas do Drive (automático)
├── src/
│   ├── main.js             ← ponto de entrada
│   ├── modules/
│   │   ├── content.js      ← lê o JSON e monta a página
│   │   ├── improvements.js ← formulário de pedidos → issues GitHub
│   │   ├── slider.js       ← sliders antes/depois
│   │   ├── lightbox.js     ← zoom nas fotos
│   │   ├── menu.js         ← menu mobile
│   │   └── scroll.js       ← animações de scroll
│   └── styles/main.css     ← design completo
├── .github/workflows/
│   └── drive-sync.yml      ← robô que baixa fotos do Drive
└── docs/
    ├── MANUAL-DO-RICARDO.md ← guia simples para o pai
    └── ARQUITETURA.md       ← este arquivo
```

---

## 6. Como rodar localmente

```bash
npm install     # instala o Vite
npm run dev     # servidor de desenvolvimento (localhost:3000)
npm run build   # gera a pasta dist/ para produção
npm run preview # pré-visualiza o build
```

No Windows, dá para usar o `start.bat` (instala dependências se faltarem e
sobe o servidor).
