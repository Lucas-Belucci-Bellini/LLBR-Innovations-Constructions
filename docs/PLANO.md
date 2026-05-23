# LLBR Innovations / Constructions — Plano do Projeto

## Estado atual vs. objetivo

| Atual | Objetivo |
|---|---|
| HTML + CSS + JS puro na raiz | Vite + JS modular em `src/` |
| Um arquivo `index.html` monolítico | Páginas e seções separadas por módulo |
| Sem sistema de build | Build com Vite (minificação, hash de assets) |
| Estilo misto, sem design system | Design system limpo, variáveis CSS centralizadas |
| Imagens sem organização (pastas WhatsApp) | Assets organizados em `public/assets/` |
| Sem deploy automatizado | Deploy via Vercel com CI |

---

## Fases

### Fase 1 — Setup Vite (base do projeto)

- [ ] Inicializar `package.json` com Vite 5 (igual ao projeto-baluarte)
- [ ] Criar `vite.config.js` com `base: '/'`
- [ ] Mover `index.html` para a raiz (já está lá, ajustar imports)
- [ ] Criar estrutura de pastas `src/` conforme arquitetura
- [ ] Configurar `.gitignore` para `node_modules/` e `dist/`
- [ ] Criar `start.bat` para desenvolvimento local no Windows

### Fase 2 — Migrar HTML para módulos JS

- [ ] Criar `src/main.js` como entry point
- [ ] Quebrar seções em módulos em `src/layout/`
  - `header.js` — navbar + menu hamburguer
  - `hero.js` — seção inicial com facts
  - `services.js` — grade de serviços
  - `gallery.js` — fotos de obra
  - `before-after.js` — cards antes/depois
  - `process.js` — etapas da obra
  - `tags.js` — lista de areas de atendimento
  - `contact.js` — footer + contato
- [ ] Criar `src/data/services.js` com os dados de serviços
- [ ] Criar `src/data/gallery.js` com metadados das imagens
- [ ] Criar `src/utils/dom.js` com helpers de seleção/criação de elementos

### Fase 3 — Design system limpo

- [ ] Criar `src/styles/tokens.css` com variáveis de cor, tipografia e espaçamento
- [ ] Criar `src/styles/base.css` com reset e estilos globais
- [ ] Criar `src/styles/components.css` com botões, cards, grid
- [ ] Criar `src/styles/layout.css` com header, footer, sections
- [ ] Importar tudo em `src/styles/main.css`
- [ ] Paleta: neutros escuros + amarelo/laranja construção como accent
- [ ] Tipografia: fonte sem-serif limpa (Inter ou system-ui)

### Fase 4 — Organizar assets

- [ ] Mover fotos de obra para `public/assets/obras/`
- [ ] Mover fotos antes/depois para `public/assets/antes-depois/`
- [ ] Renomear arquivos com nomes descritivos (sem espaços)
- [ ] Otimizar imagens para web (máx 200 KB cada)
- [ ] Atualizar todas as referências no código

### Fase 5 — Funcionalidades interativas

- [ ] Menu hamburguer mobile funcional (já existe em `scripts.js`, migrar para módulo)
- [ ] Scroll suave entre seções
- [ ] Lazy loading de imagens (já tem `loading="lazy"`, garantir no Vite)
- [ ] Animações de entrada nas seções ao rolar (Intersection Observer)
- [ ] Galeria com lightbox simples (clique na foto amplia)

### Fase 6 — Deploy e SEO

- [ ] Configurar `vercel.json` para SPA
- [ ] Verificar `robots.txt` e `404.html`
- [ ] Adicionar Open Graph correto com imagem real
- [ ] Testar performance no Lighthouse (meta: >90 em todas as categorias)
- [ ] Testar responsividade em mobile (375px) e tablet (768px)

---

## Prioridades

1. **Fase 1 + 2** — base técnica primeiro (sem isso nada roda)
2. **Fase 3** — visual limpo é o diferencial do projeto
3. **Fase 4** — organizar assets desbloqueia a galeria funcionando
4. **Fase 5** — interatividade depois do visual estar certo
5. **Fase 6** — deploy só quando estiver apresentável

---

## Referência de identidade visual

- **Estilo:** clean, corporativo, sério — sem excessos decorativos
- **Cores:** base escura (cinza carvão) + accent amarelo/ocre construção
- **Tipografia:** system-ui / Inter, pesos 400 e 600
- **Espacamento:** generoso (seções com padding grande, respiro entre elementos)
- **Cards:** sem bordas coloridas — sombra sutil ou borda fina neutra
- **Botões:** dois tipos: primary (fundo accent, texto escuro) e secondary (outline)

---

## Decisoes tecnicas

| Decisão | Escolha | Motivo |
|---|---|---|
| Bundler | Vite 5 | Padrão do ecossistema LLBR |
| Framework | JavaScript puro | Sem overhead, sem dependências |
| CSS | CSS vanilla + custom properties | Sem preprocessador, fácil manutenção |
| Imagens | `public/` do Vite | Servidas direto, sem hash |
| Deploy | Vercel | Já em uso no projeto atual |
| Fontes | system-ui (fallback Inter) | Zero carregamento externo |
