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
import { initLightbox } from './lightbox.js'
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

  // Delay escalonado para animação sequencial das fotos
  const html = galeria.map((foto, i) => {
    const delay = (i % 3) + 1
    return `
      <figure data-reveal data-delay="${delay}">
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

  // ── Galeria ───────────────────────────────────────────────
  // O container #gallery-grid tem o atributo data-lightbox para o lightbox
  const containerGaleria = document.getElementById('gallery-grid')
  renderGaleria(dados.gallery, containerGaleria)

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
