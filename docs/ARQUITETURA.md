# LLBR Innovations / Constructions — Arquitetura Técnica

## Estrutura de pastas

```
llbr-innovations-constructions/
├── index.html                  # Entry point do Vite
├── vite.config.js              # Config do Vite
├── package.json
├── .gitignore
├── vercel.json
├── robots.txt
├── 404.html
├── start.bat                   # Dev server no Windows
│
├── public/
│   └── assets/
│       ├── obras/              # Fotos de obras (galeria)
│       │   ├── estrutura.jpeg
│       │   ├── eletrica.jpeg
│       │   ├── telhado.jpeg
│       │   ├── reforma-corredor.jpeg
│       │   ├── cozinha.jpeg
│       │   └── alvenaria.jpeg
│       ├── antes-depois/       # Fotos antes/depois
│       │   ├── corredor-antes.jpeg
│       │   ├── corredor-depois.jpeg
│       │   ├── cozinha-antes.jpeg
│       │   ├── cozinha-depois.jpeg
│       │   ├── estrutura-antes.jpeg
│       │   └── estrutura-depois.jpeg
│       └── og-image.jpeg       # Imagem Open Graph
│
├── src/
│   ├── main.js                 # Entry point JS (importa tudo)
│   │
│   ├── data/
│   │   ├── services.js         # Array com todos os serviços
│   │   ├── gallery.js          # Metadados das fotos de obra
│   │   └── before-after.js     # Pares antes/depois
│   │
│   ├── layout/
│   │   ├── header.js           # Header + nav + hamburguer
│   │   ├── hero.js             # Hero section + facts DL
│   │   ├── intro.js            # Banda de intro
│   │   ├── services.js         # Grade de cards de serviços
│   │   ├── gallery.js          # Grid de fotos de obra
│   │   ├── before-after.js     # Cards antes/depois
│   │   ├── process.js          # Lista numerada de processo
│   │   ├── tags.js             # Tag list de areas
│   │   ├── project.js          # Seção sobre o projeto/criador
│   │   └── footer.js           # Footer + contato
│   │
│   ├── utils/
│   │   ├── dom.js              # Helpers: el(), on(), qs()
│   │   ├── scroll.js           # Smooth scroll + active nav
│   │   └── observer.js         # Intersection Observer (animações)
│   │
│   └── styles/
│       ├── main.css            # Importa todos os outros
│       ├── tokens.css          # Variáveis CSS (cores, tipo, espaço)
│       ├── base.css            # Reset + estilos globais
│       ├── components.css      # Buttons, cards, tags, grid
│       └── layout.css          # Header, footer, sections, hero
│
└── docs/
    ├── PLANO.md
    └── ARQUITETURA.md
```

---

## Design Tokens

```css
/* src/styles/tokens.css */
:root {
  /* Cores base */
  --color-bg:          #0f0f0f;
  --color-bg-alt:      #1a1a1a;
  --color-bg-band:     #111111;
  --color-surface:     #1e1e1e;
  --color-border:      #2a2a2a;

  /* Accent: amarelo-ocre construção */
  --color-accent:      #c9933a;
  --color-accent-hover: #d9a44a;
  --color-accent-text: #0f0f0f;

  /* Texto */
  --color-text:        #e8e8e8;
  --color-text-muted:  #888888;
  --color-text-light:  #ffffff;

  /* Tipografia */
  --font-base:         system-ui, -apple-system, 'Segoe UI', sans-serif;
  --font-size-sm:      0.875rem;
  --font-size-base:    1rem;
  --font-size-lg:      1.125rem;
  --font-size-xl:      1.5rem;
  --font-size-2xl:     2rem;
  --font-size-3xl:     3rem;
  --font-size-4xl:     4rem;
  --font-weight-normal: 400;
  --font-weight-semi:  600;

  /* Espacamento */
  --space-1:  0.25rem;
  --space-2:  0.5rem;
  --space-3:  0.75rem;
  --space-4:  1rem;
  --space-6:  1.5rem;
  --space-8:  2rem;
  --space-12: 3rem;
  --space-16: 4rem;
  --space-24: 6rem;

  /* Layout */
  --max-width: 1200px;
  --header-height: 4rem;
  --radius-sm: 4px;
  --radius-md: 8px;
}
```

---

## Padrão de módulo de layout

Cada arquivo em `src/layout/` exporta uma função que retorna um elemento HTML:

```js
// src/layout/services.js
import { services } from '../data/services.js'
import { el } from '../utils/dom.js'

export function renderServices() {
  const section = el('section', { class: 'section', id: 'servicos' })

  // monta o HTML interno...

  return section
}
```

`src/main.js` importa todos e monta o `<main>`:

```js
// src/main.js
import '../src/styles/main.css'
import { renderHeader }    from './layout/header.js'
import { renderHero }      from './layout/hero.js'
import { renderServices }  from './layout/services.js'
// ...

document.body.prepend(renderHeader())
document.getElementById('app').append(
  renderHero(),
  renderServices(),
  // ...
)
```

---

## Seções do site

| ID | Seção | Componente | Conteúdo |
|---|---|---|---|
| `#inicio` | Hero | `hero.js` | Título, subtítulo, CTAs, facts |
| — | Intro | `intro.js` | Frase de posicionamento |
| `#servicos` | Serviços | `services.js` | 8 cards de serviço |
| `#obras` | Galeria | `gallery.js` | 6 fotos com legenda |
| `#antes-depois` | Antes/Depois | `before-after.js` | 3 pares de imagens |
| `#processo` | Processo | `process.js` | 3 etapas numeradas |
| — | Tags | `tags.js` | 32 areas de atendimento |
| `#projeto` | Sobre | `project.js` | Créditos e links GitHub |
| `#contato` | Contato | `footer.js` | Tel, email, endereço, redes |

---

## vite.config.js

```js
import { defineConfig } from 'vite'

export default defineConfig({
  base: '/',
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: false,
  },
  server: {
    port: 3000,
    open: true,
  },
})
```

---

## Responsividade

| Breakpoint | Largura | Layout |
|---|---|---|
| Mobile | < 640px | 1 coluna, nav oculta (hamburguer) |
| Tablet | 640px–1024px | 2 colunas nos cards |
| Desktop | > 1024px | 3–4 colunas, nav inline |

Grid de serviços: `grid-template-columns: repeat(auto-fill, minmax(280px, 1fr))`

---

## Decisão: por que migrar para Vite?

- **Hot Module Replacement** durante desenvolvimento
- **Build minificado** com hash em assets para cache busting
- **Imports ES Modules** nativos — código organizado sem bundle manual
- **Mesma stack** do projeto-baluarte — reutiliza padrões já estabelecidos
- **Sem dependências extras** — apenas `vite` como devDependency
