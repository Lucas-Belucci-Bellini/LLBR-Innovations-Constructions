/**
 * content.js — Módulo de conteúdo dinâmico
 * =========================================
 * Carrega o arquivo JSON com os dados do site (/data/site-data.json)
 * e renderiza dinamicamente os seguintes elementos:
 *   - Cards de serviços na seção #servicos
 *   - Grade de galeria na seção #obras
 *   - Sliders antes/depois na seção #resultados
 *   - Lista de tags na seção #lista-title (ul#tag-list)
 *   - Informações de contato no footer e link WhatsApp flutuante
 *
 * Por que carregar do JSON?
 * O pai (Ricardo) pode editar o JSON via painel admin sem precisar mexer
 * no HTML diretamente. Cada edição gera um Pull Request no GitHub,
 * que é revisado pelo Lucas antes de ir ao ar.
 *
 * Fluxo de execução:
 *   1. initContent() é chamada em src/main.js
 *   2. Busca o JSON com fetch()
 *   3. Renderiza cada seção usando os dados
 *   4. Reinicializa lightbox e sliders para os novos elementos
 */

import { initSliders } from './slider.js'
import { initLightbox, openLightboxGroup } from './lightbox.js'
import { initScroll } from './scroll.js'

// ─────────────────────────────────────────────────────────────
// BUSCA DE DADOS
// ─────────────────────────────────────────────────────────────

/**
 * Busca e retorna o JSON de dados do site.
 * Em caso de erro (arquivo não encontrado, JSON inválido), loga no console
 * e retorna null para que o restante do site continue funcionando.
 *
 * @returns {Promise<Object|null>}
 */
async function carregarDados() {
  try {
    // Adiciona timestamp para evitar cache agressivo durante desenvolvimento
    const url = '/data/site-data.json'
    const resposta = await fetch(url)

    if (!resposta.ok) {
      console.warn(`[content.js] Não foi possível carregar site-data.json (HTTP ${resposta.status})`)
      return null
    }

    const dados = await resposta.json()
    return dados
  } catch (erro) {
    // Não quebra o site se o JSON falhar — apenas loga o problema
    console.warn('[content.js] Erro ao carregar dados do site:', erro)
    return null
  }
}

// ─────────────────────────────────────────────────────────────
// RENDERIZAÇÃO DE SERVIÇOS
// ─────────────────────────────────────────────────────────────

/**
 * Renderiza os cards de serviço dentro do container informado.
 * Cada serviço ganha um badge de código (ex: GESTÃO, TÉCNICO),
 * um título e uma descrição.
 *
 * O primeiro serviço com "featured: true" recebe a classe "featured"
 * que o torna mais largo (span 2 colunas) e com fundo escuro.
 *
 * @param {Array} servicos - Array de objetos {code, title, desc, featured}
 * @param {HTMLElement} container - Elemento onde os cards serão inseridos
 */
function renderServicos(servicos, container) {
  if (!container || !Array.isArray(servicos)) return

  // Ícones UTF-8 para cada tipo de serviço, mapeados pelo código
  const icones = {
    'GESTÃO':  '&#9733;', // estrela — destaque para administração
    'PROJETO': '&#9632;', // quadrado — representa planta/projeto
    'OBRA':    '&#9650;', // triângulo — crescimento, construção
    'TÉCNICO': '&#9889;', // raio — elétrica e hidráulica
    'ACAB.':   '&#127775;', // brilho — acabamento fino
    'EXTERNO': '&#127968;', // casa — coberturas externas
    'APOIO':   '&#128295;', // chave — manutenção e apoio
  }

  // Índices de delay para animação de entrada escalonada (1, 2, 3, 1, 2, 3...)
  let delayIndex = 0

  const html = servicos.map((servico) => {
    // Incrementa o delay ciclicamente para o efeito escalonado
    delayIndex = (delayIndex % 3) + 1

    // Classe "featured" expande o card para 2 colunas no grid
    const classeDestaque = servico.featured ? ' featured' : ''

    // Ícone baseado no código, com fallback para ferramenta genérica
    const icone = icones[servico.code] || '&#128295;'

    return `
      <article class="service-card${classeDestaque}" data-reveal data-delay="${delayIndex}">
        <span class="card-code">${escapeHtml(servico.code)}</span>
        <div class="service-card-icon" aria-hidden="true">${icone}</div>
        <h3>${escapeHtml(servico.title)}</h3>
        <p>${escapeHtml(servico.desc)}</p>
      </article>
    `
  }).join('')

  container.innerHTML = html
}

// ─────────────────────────────────────────────────────────────
// RENDERIZAÇÃO DOS CARDS "ENTENDA CADA SERVIÇO"
// ─────────────────────────────────────────────────────────────

/**
 * Renderiza os cards explicativos da seção "Entenda cada serviço".
 * Diferente dos cards de serviço (que listam o que a LLBR faz), estes
 * explicam em linguagem simples o que é cada área e quando o cliente
 * deve chamar — para ele identificar se o problema dele se encaixa.
 *
 * Cada explicador tem:
 *   - icon: emoji ilustrativo (vem direto do JSON)
 *   - title: nome da área (Hidráulica, Marcenaria, Marmoraria...)
 *   - what: o que é, em linguagem fácil
 *   - when: quando chamar / sinais de que o cliente precisa
 *
 * @param {Array} explainers - Array de {icon, title, what, when}
 * @param {HTMLElement} container - Elemento onde os cards serão inseridos
 */
function renderExplainers(explainers, container) {
  if (!container || !Array.isArray(explainers)) return

  let delayIndex = 0

  const html = explainers.map((item) => {
    delayIndex = (delayIndex % 3) + 1
    return `
      <article class="explainer-card" data-reveal data-delay="${delayIndex}">
        <div class="explainer-icon" aria-hidden="true">${escapeHtml(item.icon)}</div>
        <h3>${escapeHtml(item.title)}</h3>
        <p class="explainer-what">${escapeHtml(item.what)}</p>
        <p class="explainer-when"><strong>Quando chamar:</strong> ${escapeHtml(item.when)}</p>
      </article>
    `
  }).join('')

  container.innerHTML = html
}

// ─────────────────────────────────────────────────────────────
// RENDERIZAÇÃO DE GALERIA
// ─────────────────────────────────────────────────────────────

/**
 * Renderiza a grade de fotos da galeria.
 * Cada foto é um <figure> com <img> e <figcaption>.
 * O atributo data-lightbox no container é lido pelo módulo lightbox.js
 * para habilitar o zoom ao clicar.
 *
 * @param {Array} galeria - Array de {src, alt, caption}
 * @param {HTMLElement} container - Elemento com data-lightbox
 */
function renderGaleria(galeria, container) {
  if (!container || !Array.isArray(galeria)) return

  // Delay escalonado para animação sequencial das fotos.
  // data-category alimenta o filtro por tipo de serviço (renderGalleryFilters).
  const html = galeria.map((foto, i) => {
    const delay = (i % 3) + 1
    return `
      <figure data-reveal data-delay="${delay}" data-category="${escapeHtml(foto.category || '')}">
        <img
          src="${foto.src}"
          alt="${escapeHtml(foto.alt)}"
          loading="lazy"
        >
        <figcaption>${escapeHtml(foto.caption)}</figcaption>
      </figure>
    `
  }).join('')

  container.innerHTML = html
}

// ─────────────────────────────────────────────────────────────
// FILTROS DA GALERIA (por categoria de serviço)
// ─────────────────────────────────────────────────────────────

/**
 * Renderiza os chips de filtro e liga o comportamento de filtragem.
 * Ao clicar num chip, esconde/mostra as <figure> da galeria cujo
 * data-category não bate com o filtro. "todos" mostra tudo.
 *
 * @param {Array<{slug,label}>} categorias
 * @param {HTMLElement} filterContainer - onde os chips são inseridos
 * @param {HTMLElement} gridContainer - a galeria (#gallery-grid)
 */
function renderGalleryFilters(categorias, filterContainer, gridContainer) {
  if (!filterContainer || !gridContainer || !Array.isArray(categorias)) return

  filterContainer.innerHTML = categorias.map((cat, i) => `
    <button type="button" class="gallery-chip${i === 0 ? ' is-active' : ''}" data-filter="${escapeHtml(cat.slug)}">
      ${escapeHtml(cat.label)}
    </button>
  `).join('')

  filterContainer.addEventListener('click', (evento) => {
    const botao = evento.target.closest('.gallery-chip')
    if (!botao) return

    filterContainer.querySelectorAll('.gallery-chip').forEach((b) => b.classList.remove('is-active'))
    botao.classList.add('is-active')

    const filtro = botao.dataset.filter
    gridContainer.querySelectorAll('figure').forEach((fig) => {
      const mostra = filtro === 'todos' || fig.dataset.category === filtro
      fig.hidden = !mostra
    })
  })
}

// ─────────────────────────────────────────────────────────────
// PROJETOS EM DESTAQUE (álbuns)
// ─────────────────────────────────────────────────────────────

/**
 * Renderiza os cards de projetos em destaque. Cada card mostra uma capa
 * e a quantidade de fotos; clicar abre o álbum no lightbox com navegação.
 *
 * @param {Array} projetos - {key,title,location,desc,cover,photos[]}
 * @param {HTMLElement} container - #projects-grid
 */
function renderProjects(projetos, container) {
  if (!container || !Array.isArray(projetos)) return

  container.innerHTML = projetos.map((p, i) => {
    const delay = (i % 3) + 1
    const total = Array.isArray(p.photos) ? p.photos.length : 0
    return `
      <article class="project-card" data-reveal data-delay="${delay}">
        <button type="button" class="project-cover" data-project="${i}" aria-label="Abrir álbum: ${escapeHtml(p.title)}">
          <img src="${p.cover}" alt="${escapeHtml(p.alt || p.title)}" loading="lazy">
          <span class="project-count">${total} fotos</span>
        </button>
        <div class="project-info">
          <h3>${escapeHtml(p.title)}</h3>
          ${p.location ? `<p class="project-loc">${escapeHtml(p.location)}</p>` : ''}
          <p class="project-desc">${escapeHtml(p.desc || '')}</p>
        </div>
      </article>
    `
  }).join('')

  container.addEventListener('click', (evento) => {
    const botao = evento.target.closest('[data-project]')
    if (!botao) return
    const projeto = projetos[Number(botao.dataset.project)]
    if (projeto && Array.isArray(projeto.photos)) {
      const itens = projeto.photos.map((ph) => ({ src: ph.src, alt: ph.alt, caption: projeto.title }))
      openLightboxGroup(itens, 0)
    }
  })
}

// ─────────────────────────────────────────────────────────────
// DICAS & SEGURANÇA
// ─────────────────────────────────────────────────────────────

/**
 * Renderiza os cards educativos (autoridade + SEO).
 * @param {Array} dicas - {icon,title,body,images[]}
 * @param {HTMLElement} container - #tips-grid
 */
function renderTips(dicas, container) {
  if (!container || !Array.isArray(dicas)) return

  container.innerHTML = dicas.map((t, i) => {
    const delay = (i % 3) + 1
    const img = Array.isArray(t.images) ? t.images[0] : null
    return `
      <article class="tip-card" data-reveal data-delay="${delay}">
        ${img ? `<img class="tip-img" src="${img}" alt="${escapeHtml(t.title)}" loading="lazy">` : ''}
        <div class="tip-body">
          <div class="tip-icon" aria-hidden="true">${escapeHtml(t.icon || '💡')}</div>
          <h3>${escapeHtml(t.title)}</h3>
          <p>${escapeHtml(t.body)}</p>
        </div>
      </article>
    `
  }).join('')
}

// ─────────────────────────────────────────────────────────────
// FAQ
// ─────────────────────────────────────────────────────────────

/**
 * Renderiza o FAQ como acordeão acessível (<details>/<summary>).
 * @param {Array<{q,a}>} faq
 * @param {HTMLElement} container - #faq-list
 */
function renderFaq(faq, container) {
  if (!container || !Array.isArray(faq)) return

  container.innerHTML = faq.map((item) => `
    <details class="faq-item" data-reveal>
      <summary>${escapeHtml(item.q)}</summary>
      <div class="faq-answer"><p>${escapeHtml(item.a)}</p></div>
    </details>
  `).join('')
}

// ─────────────────────────────────────────────────────────────
// NÚMEROS / PROVAS SOCIAIS
// ─────────────────────────────────────────────────────────────

/**
 * Renderiza a faixa de números/credibilidade.
 * @param {Array<{number,label}>} stats
 * @param {HTMLElement} container - #stats-grid
 */
function renderStats(stats, container) {
  if (!container || !Array.isArray(stats)) return

  container.innerHTML = stats.map((s, i) => `
    <div class="stat" data-reveal data-delay="${(i % 3) + 1}">
      <span class="stat-num">${escapeHtml(s.number)}</span>
      <span class="stat-label">${escapeHtml(s.label)}</span>
    </div>
  `).join('')
}

// ─────────────────────────────────────────────────────────────
// RENDERIZAÇÃO DE SLIDERS ANTES/DEPOIS
// ─────────────────────────────────────────────────────────────

/**
 * Renderiza os cards de comparação antes/depois.
 * Cada card contém:
 *   - Título da obra
 *   - Slider interativo (data-ba) com as duas imagens sobrepostas
 *   - Dica de uso (seta para arrastar)
 *
 * A estrutura HTML gerada aqui é exatamente a mesma que o slider.js
 * espera encontrar para inicializar o comportamento de arrastar.
 *
 * @param {Array} itens - Array de {title, label, before, after}
 * @param {HTMLElement} container - Elemento onde os cards serão inseridos
 */
function renderAntesDepois(itens, container) {
  if (!container || !Array.isArray(itens)) return

  const html = itens.map((item, i) => {
    const delay = (i % 3) + 1
    return `
      <div class="ba-card" data-reveal data-delay="${delay}">
        <h3>${escapeHtml(item.title)}</h3>
        <div
          class="ba-slider"
          data-ba
          role="img"
          aria-label="${escapeHtml(item.label)}"
          aria-valuenow="50"
          aria-valuemin="0"
          aria-valuemax="100"
        >
          <img
            class="ba-after"
            src="${item.after.src}"
            alt="${escapeHtml(item.after.alt)}"
            loading="lazy"
          >
          <img
            class="ba-before"
            src="${item.before.src}"
            alt="${escapeHtml(item.before.alt)}"
            loading="lazy"
          >
          <input
            class="ba-range"
            type="range"
            min="0"
            max="100"
            value="50"
            aria-label="Arraste para comparar antes e depois"
          >
          <div class="ba-handle" aria-hidden="true">
            <span class="ba-handle-icon">&#8644;</span>
          </div>
          <span class="ba-label ba-label-before">Antes</span>
          <span class="ba-label ba-label-after">Depois</span>
        </div>
        <p class="ba-hint">&#8592;&#8594; Arraste para comparar</p>
      </div>
    `
  }).join('')

  container.innerHTML = html
}

// ─────────────────────────────────────────────────────────────
// RENDERIZAÇÃO DE CONTATO
// ─────────────────────────────────────────────────────────────

/**
 * Atualiza as informações de contato no footer e no link WhatsApp flutuante.
 * Busca os elementos pelo seletor e atualiza href e texto conforme os dados.
 *
 * Se algum elemento não existir no HTML, a função ignora sem erro
 * (permite HTML parcialmente diferente do esperado).
 *
 * @param {Object} contato - {name, phone, whatsapp, email, instagram, address}
 */
function renderContato(contato) {
  if (!contato) return

  // ── Telefone ──────────────────────────────────────────────
  const linkTelefone = document.querySelector('a[data-contact="phone"]')
  if (linkTelefone) {
    linkTelefone.href = `tel:+${contato.whatsapp}`
    linkTelefone.textContent = contato.phone
  }

  // ── E-mail ────────────────────────────────────────────────
  const linkEmail = document.querySelector('a[data-contact="email"]')
  if (linkEmail) {
    linkEmail.href = `mailto:${contato.email}`
    linkEmail.textContent = contato.email
  }

  // ── Instagram ─────────────────────────────────────────────
  const linkInstagram = document.querySelector('a[data-contact="instagram"]')
  if (linkInstagram) {
    linkInstagram.href = `https://instagram.com/${contato.instagram}`
    linkInstagram.textContent = `@${contato.instagram}`
  }

  // ── Nome ──────────────────────────────────────────────────
  const spanNome = document.querySelector('[data-contact="name"]')
  if (spanNome) spanNome.textContent = contato.name

  // ── Endereço ──────────────────────────────────────────────
  const spanEndereco = document.querySelector('[data-contact="address"]')
  if (spanEndereco) spanEndereco.textContent = contato.address

  // ── Link WhatsApp flutuante ───────────────────────────────
  // Atualiza o href com o número do WhatsApp e a mensagem pré-definida
  const whatsappLinks = document.querySelectorAll('[data-contact="whatsapp"]')
  whatsappLinks.forEach((link) => {
    const msg = encodeURIComponent('Olá, gostaria de solicitar um orçamento')
    link.href = `https://wa.me/${contato.whatsapp}?text=${msg}`
  })
}

// ─────────────────────────────────────────────────────────────
// RENDERIZAÇÃO DE TAGS
// ─────────────────────────────────────────────────────────────

/**
 * Renderiza a lista de tags de áreas de atendimento.
 * Cada tag vira um <li> dentro de <ul id="tag-list">.
 *
 * @param {Array<string>} tags - Lista de strings com os serviços
 * @param {HTMLElement} container - O elemento <ul>
 */
function renderTags(tags, container) {
  if (!container || !Array.isArray(tags)) return

  const html = tags.map((tag) => `<li>${escapeHtml(tag)}</li>`).join('')
  container.innerHTML = html
}

// ─────────────────────────────────────────────────────────────
// UTILITÁRIO: ESCAPE DE HTML
// ─────────────────────────────────────────────────────────────

/**
 * Escapa caracteres especiais de HTML para evitar XSS.
 * Converte &, <, >, " e ' em suas entidades HTML equivalentes.
 *
 * @param {string} str - String a ser escapada
 * @returns {string}
 */
function escapeHtml(str) {
  if (typeof str !== 'string') return String(str ?? '')
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

// ─────────────────────────────────────────────────────────────
// PONTO DE ENTRADA PÚBLICO
// ─────────────────────────────────────────────────────────────

/**
 * initContent() — Ponto de entrada do módulo de conteúdo.
 *
 * Executado uma vez ao carregar a página, após o DOM estar pronto.
 * Busca os dados do JSON e renderiza todas as seções dinâmicas.
 * Depois de renderizar, reinicializa os módulos que dependem do DOM:
 *   - initSliders(): reconfigura os sliders antes/depois recém criados
 *   - initLightbox(): reconfigura o zoom das fotos recém criadas
 *   - initScroll(): observa os novos elementos [data-reveal] para animação
 *
 * @returns {Promise<void>}
 */
export async function initContent() {
  // Carrega os dados do JSON público
  const dados = await carregarDados()

  // Se não conseguiu carregar os dados, interrompe sem quebrar o site.
  // O HTML estático (se houver fallback) continuará visível.
  if (!dados) {
    console.warn('[content.js] Dados não disponíveis — usando HTML estático.')
    return
  }

  // ── Serviços ──────────────────────────────────────────────
  // O container #service-list foi esvaziado no HTML para ser preenchido aqui
  const containerServicos = document.getElementById('service-list')
  renderServicos(dados.services, containerServicos)

  // ── Entenda cada serviço ──────────────────────────────────
  // Cards em linguagem simples explicando cada área e quando chamar
  const containerExplainers = document.getElementById('explainer-list')
  renderExplainers(dados.serviceExplainers, containerExplainers)

  // ── Galeria ───────────────────────────────────────────────
  // O container #gallery-grid tem o atributo data-lightbox para o lightbox
  const containerGaleria = document.getElementById('gallery-grid')
  renderGaleria(dados.gallery, containerGaleria)

  // ── Filtros da galeria (por categoria) ────────────────────
  const containerFiltros = document.getElementById('gallery-filters')
  renderGalleryFilters(dados.galleryCategories, containerFiltros, containerGaleria)

  // ── Projetos em destaque (álbuns) ─────────────────────────
  const containerProjetos = document.getElementById('projects-grid')
  renderProjects(dados.projects, containerProjetos)

  // ── Dicas & Segurança ─────────────────────────────────────
  const containerDicas = document.getElementById('tips-grid')
  renderTips(dados.tips, containerDicas)

  // ── FAQ ───────────────────────────────────────────────────
  const containerFaq = document.getElementById('faq-list')
  renderFaq(dados.faq, containerFaq)

  // ── Números / provas sociais ──────────────────────────────
  const containerStats = document.getElementById('stats-grid')
  renderStats(dados.stats, containerStats)

  // ── Antes/Depois ─────────────────────────────────────────
  // O container #ba-grid será preenchido com os sliders interativos
  const containerBA = document.getElementById('ba-grid')
  renderAntesDepois(dados.beforeAfter, containerBA)

  // ── Contato ───────────────────────────────────────────────
  // Atualiza links de telefone, e-mail, Instagram e WhatsApp no footer
  renderContato(dados.contact)

  // ── Tags ──────────────────────────────────────────────────
  // A lista de áreas de atendimento (#tag-list)
  const containerTags = document.getElementById('tag-list')
  renderTags(dados.tags, containerTags)

  // ─────────────────────────────────────────────────────────
  // REINICIALIZAÇÃO DOS MÓDULOS DEPENDENTES DO DOM
  // ─────────────────────────────────────────────────────────
  // Como renderizamos elementos novos via JS, os módulos que fazem
  // querySelectorAll precisam ser rodados novamente para encontrar
  // os elementos recém inseridos no DOM.

  // Reinicializa os sliders de comparação antes/depois
  // (slider.js faz querySelectorAll('[data-ba]'))
  initSliders()

  // Reinicializa o lightbox para as novas fotos da galeria
  // (lightbox.js faz querySelectorAll('[data-lightbox] img'))
  initLightbox()

  // Reinicializa as animações de scroll reveal para os novos [data-reveal]
  // (scroll.js faz querySelectorAll('[data-reveal]'))
  initScroll()
}
