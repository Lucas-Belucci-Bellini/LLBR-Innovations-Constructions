/**
 * admin.js — Lógica completa do painel de administração da LLBR
 * ==============================================================
 * Script standalone (sem bundler, sem imports ES6 de módulos externos).
 * Carregado diretamente pelo admin.html via <script src="/admin.js">.
 *
 * Funcionalidades:
 *   - Login com senha (barreira simples, não criptografia real)
 *   - Carregamento do site-data.json e população dos formulários
 *   - Edição de contato, serviços, galeria, antes/depois e tags
 *   - Salvamento via GitHub API: cria branch + atualiza arquivo + abre PR
 *   - Token PAT armazenado na sessionStorage (só durante a sessão)
 *
 * ATENÇÃO DE SEGURANÇA:
 *   Este painel NÃO é um sistema seguro de autenticação.
 *   A senha é apenas uma barreira superficial para evitar edições acidentais.
 *   O JSON de dados é público no GitHub de qualquer forma.
 *   Para acesso real ao repositório é necessário o Personal Access Token (PAT).
 */

'use strict'

// ─────────────────────────────────────────────────────────────
// CONFIGURAÇÃO
// ─────────────────────────────────────────────────────────────

/** Senha do painel (barreira simples — mude conforme necessário) */
const ADMIN_PASSWORD = 'llbr2026'

/** Repositório GitHub onde o JSON vive */
const REPO = 'Lucas-Belucci-Bellini/LLBR-Innovations-Constructions'

/** Caminho do arquivo JSON dentro do repositório */
const JSON_PATH = 'public/data/site-data.json'

/** Branch base para criação dos PRs */
const BASE_BRANCH = 'main'

/** URL base da API REST do GitHub */
const GITHUB_API = 'https://api.github.com'

// ─────────────────────────────────────────────────────────────
// ESTADO GLOBAL
// ─────────────────────────────────────────────────────────────

/**
 * dadosAtuais — Cópia em memória do JSON carregado do servidor.
 * É atualizado quando o usuário edita campos e clica em "Salvar".
 * @type {Object|null}
 */
let dadosAtuais = null

// ─────────────────────────────────────────────────────────────
// AUTENTICAÇÃO
// ─────────────────────────────────────────────────────────────

/**
 * login() — Verifica a senha e exibe o painel se correta.
 * Chamada pelo botão "Entrar" na tela de login.
 * A senha é verificada localmente (sem servidor).
 */
function login() {
  const senhaDigitada = document.getElementById('admin-pass').value
  const msgErro = document.getElementById('login-error')

  if (senhaDigitada !== ADMIN_PASSWORD) {
    msgErro.textContent = 'Senha incorreta. Tente novamente.'
    document.getElementById('admin-pass').value = ''
    document.getElementById('admin-pass').focus()
    return
  }

  // Oculta a tela de login e exibe o painel
  document.getElementById('login-screen').style.display = 'none'
  document.getElementById('admin-panel').removeAttribute('hidden')

  // Restaura o PAT da sessionStorage se já havia sido digitado antes
  const patSalvo = sessionStorage.getItem('llbr_admin_pat')
  if (patSalvo) {
    document.getElementById('pat-field').value = patSalvo
  }

  // Carrega os dados do JSON
  carregarDados()
}

/**
 * logout() — Limpa o estado e volta para a tela de login.
 */
function logout() {
  dadosAtuais = null
  document.getElementById('admin-panel').setAttribute('hidden', '')
  document.getElementById('login-screen').style.display = 'flex'
  document.getElementById('admin-pass').value = ''
  document.getElementById('login-error').textContent = ''
}

// ─────────────────────────────────────────────────────────────
// CARREGAMENTO DE DADOS
// ─────────────────────────────────────────────────────────────

/**
 * carregarDados() — Busca o JSON do servidor e popula todos os formulários.
 * Adiciona cache-buster para garantir dados frescos durante edição.
 */
async function carregarDados() {
  try {
    mostrarGlobalStatus('Carregando dados...', 'loading')

    // Cache-buster para evitar dados desatualizados
    const url = `/data/site-data.json?t=${Date.now()}`
    const resposta = await fetch(url)

    if (!resposta.ok) throw new Error(`HTTP ${resposta.status}`)

    dadosAtuais = await resposta.json()

    // Popula todos os formulários com os dados carregados
    popularFormContato(dadosAtuais.contact)
    popularListaServicos(dadosAtuais.services)
    popularListaGaleria(dadosAtuais.gallery)
    popularListaBA(dadosAtuais.beforeAfter)
    popularTags(dadosAtuais.tags)
    popularJsonEditor(dadosAtuais)

    mostrarGlobalStatus('Dados carregados com sucesso!', 'ok', 2500)

  } catch (erro) {
    mostrarGlobalStatus('Erro ao carregar dados: ' + erro.message, 'err', 5000)
    console.error('[admin.js] Erro ao carregar dados:', erro)
  }
}

// ─────────────────────────────────────────────────────────────
// POPULAR FORMULÁRIOS
// ─────────────────────────────────────────────────────────────

/**
 * Popula os campos de contato com os dados do JSON.
 * @param {Object} contato
 */
function popularFormContato(contato) {
  if (!contato) return
  val('c-name',      contato.name)
  val('c-phone',     contato.phone)
  val('c-whatsapp',  contato.whatsapp)
  val('c-email',     contato.email)
  val('c-instagram', contato.instagram)
  val('c-address',   contato.address)
}

/**
 * Popula a lista de cards de serviços.
 * Cada serviço vira um card colapsável com campos editáveis.
 * @param {Array} servicos
 */
function popularListaServicos(servicos) {
  const container = document.getElementById('services-list')
  if (!container || !Array.isArray(servicos)) return

  container.innerHTML = servicos.map((s, i) => criarCardServico(s, i)).join('')
}

/**
 * Cria o HTML de um card de serviço.
 * @param {Object} servico - {code, title, desc, featured}
 * @param {number} index
 * @returns {string}
 */
function criarCardServico(servico, index) {
  return `
    <div class="item-card" data-service-index="${index}">
      <div class="item-card-header" onclick="toggleCard(this)">
        <span class="item-card-title">${esc(servico.title)} <small style="font-weight:400;color:#5a6370">[${esc(servico.code)}]</small></span>
        <span style="color:#5a6370;font-size:0.82rem">&#9660;</span>
      </div>
      <div class="item-card-body is-collapsed">
        <div class="form-group">
          <label>Código (badge)</label>
          <input type="text" data-field="code" value="${esc(servico.code)}" placeholder="GESTÃO">
        </div>
        <div class="form-group">
          <label>Título</label>
          <input type="text" data-field="title" value="${esc(servico.title)}" placeholder="Nome do serviço">
        </div>
        <div class="form-group">
          <label>Descrição</label>
          <textarea data-field="desc" rows="3">${esc(servico.desc)}</textarea>
        </div>
        <div class="featured-row">
          <input type="checkbox" data-field="featured" id="featured-${index}" ${servico.featured ? 'checked' : ''}>
          <label for="featured-${index}">Destaque (card maior no grid)</label>
        </div>
        <div class="item-actions">
          <button class="btn btn-sm btn-danger" onclick="removerItem('services', ${index})">Remover</button>
        </div>
      </div>
    </div>
  `
}

/**
 * Popula a lista de fotos da galeria.
 * @param {Array} galeria
 */
function popularListaGaleria(galeria) {
  const container = document.getElementById('gallery-list')
  if (!container || !Array.isArray(galeria)) return

  container.innerHTML = galeria.map((foto, i) => criarCardGaleria(foto, i)).join('')
}

/**
 * Cria o HTML de um card de foto da galeria.
 * @param {Object} foto - {src, alt, caption}
 * @param {number} index
 * @returns {string}
 */
function criarCardGaleria(foto, index) {
  return `
    <div class="item-card" data-gallery-index="${index}">
      <div class="item-card-header" onclick="toggleCard(this)">
        <span class="item-card-title">${esc(foto.caption || foto.src)}</span>
        <span style="color:#5a6370;font-size:0.82rem">&#9660;</span>
      </div>
      <div class="item-card-body is-collapsed">
        <div class="form-group">
          <label>Caminho da foto (src)</label>
          <input type="text" data-field="src" value="${esc(foto.src)}" placeholder="/fotos/galeria/foto.jpeg">
        </div>
        <div class="form-group">
          <label>Texto alternativo (acessibilidade)</label>
          <input type="text" data-field="alt" value="${esc(foto.alt)}" placeholder="Descrição da foto">
        </div>
        <div class="form-group">
          <label>Legenda</label>
          <input type="text" data-field="caption" value="${esc(foto.caption)}" placeholder="Legenda exibida">
        </div>
        <div class="item-actions">
          <button class="btn btn-sm btn-danger" onclick="removerItem('gallery', ${index})">Remover</button>
        </div>
      </div>
    </div>
  `
}

/**
 * Popula a lista de comparações antes/depois.
 * @param {Array} itens
 */
function popularListaBA(itens) {
  const container = document.getElementById('ba-list')
  if (!container || !Array.isArray(itens)) return

  container.innerHTML = itens.map((item, i) => criarCardBA(item, i)).join('')
}

/**
 * Cria o HTML de um card de comparação antes/depois.
 * @param {Object} item
 * @param {number} index
 * @returns {string}
 */
function criarCardBA(item, index) {
  return `
    <div class="item-card" data-ba-index="${index}">
      <div class="item-card-header" onclick="toggleCard(this)">
        <span class="item-card-title">${esc(item.title)}</span>
        <span style="color:#5a6370;font-size:0.82rem">&#9660;</span>
      </div>
      <div class="item-card-body is-collapsed">
        <div class="form-group">
          <label>Título da comparação</label>
          <input type="text" data-field="title" value="${esc(item.title)}" placeholder="Ex: Reforma de corredor">
        </div>
        <div class="form-group">
          <label>Label ARIA (acessibilidade)</label>
          <input type="text" data-field="label" value="${esc(item.label)}" placeholder="Descrição completa para leitores de tela">
        </div>
        <fieldset style="border:1px solid var(--line);border-radius:8px;padding:12px;margin:0">
          <legend style="font-weight:800;font-size:0.85rem;padding:0 6px">Imagem ANTES</legend>
          <div class="form-group">
            <label>Caminho (src)</label>
            <input type="text" data-field="before.src" value="${esc(item.before.src)}" placeholder="/fotos/antes/...">
          </div>
          <div class="form-group">
            <label>Texto alternativo</label>
            <input type="text" data-field="before.alt" value="${esc(item.before.alt)}" placeholder="Estado antes da obra">
          </div>
        </fieldset>
        <fieldset style="border:1px solid var(--line);border-radius:8px;padding:12px;margin:0">
          <legend style="font-weight:800;font-size:0.85rem;padding:0 6px">Imagem DEPOIS</legend>
          <div class="form-group">
            <label>Caminho (src)</label>
            <input type="text" data-field="after.src" value="${esc(item.after.src)}" placeholder="/fotos/depois/...">
          </div>
          <div class="form-group">
            <label>Texto alternativo</label>
            <input type="text" data-field="after.alt" value="${esc(item.after.alt)}" placeholder="Estado depois da obra">
          </div>
        </fieldset>
        <div class="item-actions">
          <button class="btn btn-sm btn-danger" onclick="removerItem('beforeAfter', ${index})">Remover</button>
        </div>
      </div>
    </div>
  `
}

/**
 * Popula o editor de tags (uma por linha).
 * @param {Array<string>} tags
 */
function popularTags(tags) {
  const el = document.getElementById('tags-editor')
  if (!el || !Array.isArray(tags)) return
  el.value = tags.join('\n')
}

/**
 * Popula o editor JSON bruto com o objeto completo formatado.
 * @param {Object} dados
 */
function popularJsonEditor(dados) {
  const el = document.getElementById('json-editor')
  if (!el) return
  el.value = JSON.stringify(dados, null, 2)
}

// ─────────────────────────────────────────────────────────────
// LEITURA DOS FORMULÁRIOS
// ─────────────────────────────────────────────────────────────

/**
 * Lê o estado atual dos formulários e retorna o objeto de dados atualizado.
 * Combina os dados originais com as edições feitas nos formulários.
 * @returns {Object} - Objeto completo site-data.json atualizado
 */
function lerFormularios() {
  if (!dadosAtuais) return null

  // Cópia profunda dos dados originais para não mutar o estado
  const dados = JSON.parse(JSON.stringify(dadosAtuais))

  // ── Contato ────────────────────────────────────────────────
  dados.contact = {
    name:      getVal('c-name'),
    phone:     getVal('c-phone'),
    whatsapp:  getVal('c-whatsapp'),
    email:     getVal('c-email'),
    instagram: getVal('c-instagram'),
    address:   getVal('c-address'),
  }

  // ── Serviços ───────────────────────────────────────────────
  const cardsServicos = document.querySelectorAll('#services-list .item-card')
  dados.services = Array.from(cardsServicos).map((card) => ({
    code:     getFieldVal(card, 'code'),
    title:    getFieldVal(card, 'title'),
    desc:     getFieldVal(card, 'desc'),
    featured: card.querySelector('[data-field="featured"]')?.checked || false,
  }))

  // ── Galeria ────────────────────────────────────────────────
  const cardsGaleria = document.querySelectorAll('#gallery-list .item-card')
  dados.gallery = Array.from(cardsGaleria).map((card) => ({
    src:     getFieldVal(card, 'src'),
    alt:     getFieldVal(card, 'alt'),
    caption: getFieldVal(card, 'caption'),
  }))

  // ── Antes/Depois ───────────────────────────────────────────
  const cardsBA = document.querySelectorAll('#ba-list .item-card')
  dados.beforeAfter = Array.from(cardsBA).map((card) => ({
    title: getFieldVal(card, 'title'),
    label: getFieldVal(card, 'label'),
    before: {
      src: getFieldVal(card, 'before.src'),
      alt: getFieldVal(card, 'before.alt'),
    },
    after: {
      src: getFieldVal(card, 'after.src'),
      alt: getFieldVal(card, 'after.alt'),
    },
  }))

  // ── Tags ───────────────────────────────────────────────────
  const tagsTexto = document.getElementById('tags-editor')?.value || ''
  dados.tags = tagsTexto
    .split('\n')
    .map((t) => t.trim())
    .filter((t) => t.length > 0)

  // Atualiza timestamp de edição
  dados._updated = new Date().toISOString().slice(0, 10)

  return dados
}

// ─────────────────────────────────────────────────────────────
// AÇÕES DE EDIÇÃO
// ─────────────────────────────────────────────────────────────

/**
 * toggleCard() — Abre/fecha um card colapsável.
 * @param {HTMLElement} header - O elemento do cabeçalho clicado
 */
function toggleCard(header) {
  const body = header.nextElementSibling
  if (!body) return
  body.classList.toggle('is-collapsed')
  // Atualiza o ícone de seta
  const icone = header.querySelector('span:last-child')
  if (icone) icone.textContent = body.classList.contains('is-collapsed') ? '▼' : '▲'
}

/**
 * removerItem() — Remove um item de uma lista (serviço, foto ou comparação).
 * @param {string} tipo   - 'services', 'gallery' ou 'beforeAfter'
 * @param {number} index  - Índice do item na lista
 */
function removerItem(tipo, index) {
  if (!dadosAtuais || !Array.isArray(dadosAtuais[tipo])) return

  const confirmacao = confirm(`Tem certeza que deseja remover este item?`)
  if (!confirmacao) return

  // Remove do array de dados em memória
  dadosAtuais[tipo].splice(index, 1)

  // Re-renderiza a lista atualizada
  if (tipo === 'services')    popularListaServicos(dadosAtuais.services)
  if (tipo === 'gallery')     popularListaGaleria(dadosAtuais.gallery)
  if (tipo === 'beforeAfter') popularListaBA(dadosAtuais.beforeAfter)
}

/**
 * addService() — Adiciona um novo serviço vazio à lista.
 */
function addService() {
  if (!dadosAtuais) return
  dadosAtuais.services = dadosAtuais.services || []
  dadosAtuais.services.push({
    code: 'NOVO',
    title: 'Novo serviço',
    desc: 'Descrição do serviço...',
    featured: false,
  })
  popularListaServicos(dadosAtuais.services)
  // Abre automaticamente o último card
  const cards = document.querySelectorAll('#services-list .item-card')
  const ultimo = cards[cards.length - 1]
  if (ultimo) {
    const body = ultimo.querySelector('.item-card-body')
    if (body) body.classList.remove('is-collapsed')
  }
}

/**
 * addGalleryItem() — Adiciona uma nova foto vazia à galeria.
 */
function addGalleryItem() {
  if (!dadosAtuais) return
  dadosAtuais.gallery = dadosAtuais.gallery || []
  dadosAtuais.gallery.push({
    src: '/fotos/galeria/nova-foto.jpeg',
    alt: 'Descrição da foto',
    caption: 'Legenda',
  })
  popularListaGaleria(dadosAtuais.gallery)
}

/**
 * addBAItem() — Adiciona uma nova comparação antes/depois vazia.
 */
function addBAItem() {
  if (!dadosAtuais) return
  dadosAtuais.beforeAfter = dadosAtuais.beforeAfter || []
  dadosAtuais.beforeAfter.push({
    title: 'Nova comparação',
    label: 'Comparação: antes e depois',
    before: { src: '/fotos/antes/nova-antes.jpeg', alt: 'Antes' },
    after:  { src: '/fotos/depois/nova-depois.jpeg', alt: 'Depois' },
  })
  popularListaBA(dadosAtuais.beforeAfter)
}

// ─────────────────────────────────────────────────────────────
// NAVEGAÇÃO POR ABAS
// ─────────────────────────────────────────────────────────────

/**
 * Inicializa a navegação por abas.
 * Cada botão na sidebar ativa o painel correspondente.
 */
function initTabs() {
  const nav = document.getElementById('tab-nav')
  if (!nav) return

  // Inclui também os botões fora do nav principal (como o JSON)
  const allTabBtns = document.querySelectorAll('.tab-btn')

  allTabBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      const tab = btn.dataset.tab
      if (!tab) return

      // Remove active de todos os botões e painéis
      allTabBtns.forEach((b) => b.classList.remove('is-active'))
      document.querySelectorAll('.tab-panel').forEach((p) => p.classList.remove('is-active'))

      // Ativa o botão e o painel correspondente
      btn.classList.add('is-active')
      const painel = document.getElementById(`tab-${tab}`)
      if (painel) painel.classList.add('is-active')
    })
  })
}

// ─────────────────────────────────────────────────────────────
// GITHUB API — CRIAÇÃO DE PR
// ─────────────────────────────────────────────────────────────

/**
 * saveSection() — Salva uma seção específica criando um PR no GitHub.
 * Lê todos os formulários, atualiza o JSON e envia para o GitHub.
 *
 * @param {string} secao - Nome da seção (ex: 'contact', 'services')
 */
async function saveSection(secao) {
  // Lê o PAT da sessionStorage ou do campo
  const pat = obterPAT()
  if (!pat) {
    mostrarGlobalStatus(
      'Insira seu GitHub Personal Access Token (PAT) no campo do cabeçalho.',
      'err', 5000
    )
    document.getElementById('pat-field').focus()
    return
  }

  const statusId = `status-${secao}`
  mostrarStatus(statusId, 'Preparando dados...', 'loading')

  try {
    // Lê o estado atual de todos os formulários
    const dadosAtualizados = lerFormularios()
    if (!dadosAtualizados) throw new Error('Não foi possível ler os formulários.')

    // Atualiza a cópia em memória
    dadosAtuais = dadosAtualizados

    // Também atualiza o editor JSON para refletir as mudanças
    popularJsonEditor(dadosAtuais)

    // Cria o PR no GitHub
    const resultado = await criarPR(dadosAtualizados, secao, pat)

    mostrarStatus(statusId, `PR criado com sucesso! ${resultado.url}`, 'ok')
    mostrarGlobalStatus(`PR criado! Acesse: ${resultado.url}`, 'ok', 8000)

  } catch (erro) {
    mostrarStatus(statusId, `Erro: ${erro.message}`, 'err')
    mostrarGlobalStatus(`Erro ao criar PR: ${erro.message}`, 'err', 6000)
    console.error('[admin.js] Erro ao salvar seção:', erro)
  }
}

/**
 * saveRawJson() — Salva o JSON bruto do editor de texto, criando um PR.
 */
async function saveRawJson() {
  const pat = obterPAT()
  if (!pat) {
    mostrarGlobalStatus(
      'Insira seu GitHub PAT no cabeçalho para criar um PR.',
      'err', 5000
    )
    return
  }

  const jsonTexto = document.getElementById('json-editor')?.value || ''

  // Valida o JSON antes de enviar
  let dadosParsed
  try {
    dadosParsed = JSON.parse(jsonTexto)
  } catch (erroJson) {
    mostrarStatus('status-json', `JSON inválido: ${erroJson.message}`, 'err')
    mostrarGlobalStatus('JSON inválido — corrija o erro e tente novamente.', 'err', 5000)
    return
  }

  mostrarStatus('status-json', 'Enviando para o GitHub...', 'loading')

  try {
    const resultado = await criarPR(dadosParsed, 'json-completo', pat)
    mostrarStatus('status-json', `PR criado! ${resultado.url}`, 'ok')
    mostrarGlobalStatus(`PR criado! Acesse: ${resultado.url}`, 'ok', 8000)
    dadosAtuais = dadosParsed
  } catch (erro) {
    mostrarStatus('status-json', `Erro: ${erro.message}`, 'err')
    mostrarGlobalStatus(`Erro: ${erro.message}`, 'err', 5000)
  }
}

/**
 * criarPR() — Fluxo completo de criação de PR no GitHub.
 *
 * Passos:
 *   1. Busca o SHA atual do arquivo (necessário para fazer o update)
 *   2. Cria uma nova branch com nome baseado na data/hora
 *   3. Atualiza o arquivo com o novo conteúdo (em base64)
 *   4. Abre um Pull Request da nova branch para a branch base (main)
 *
 * @param {Object} dados - Objeto completo do site-data.json
 * @param {string} secao - Nome da seção modificada (para o título do PR)
 * @param {string} pat   - GitHub Personal Access Token
 * @returns {Promise<{url: string}>}
 */
async function criarPR(dados, secao, pat) {
  const headers = {
    'Authorization': `Bearer ${pat}`,
    'Accept': 'application/vnd.github+json',
    'Content-Type': 'application/json',
    'X-GitHub-Api-Version': '2022-11-28',
  }

  // ── 1. Busca o SHA atual do arquivo ────────────────────────
  const resArquivo = await fetch(
    `${GITHUB_API}/repos/${REPO}/contents/${JSON_PATH}?ref=${BASE_BRANCH}`,
    { headers }
  )

  if (!resArquivo.ok) {
    const err = await resArquivo.json().catch(() => ({}))
    throw new Error(`Não foi possível acessar o arquivo no GitHub: ${err.message || resArquivo.status}`)
  }

  const infoArquivo = await resArquivo.json()
  const shaAtual = infoArquivo.sha

  // ── 2. Cria uma nova branch ────────────────────────────────
  // Primeiro, busca o SHA do commit mais recente da branch base
  const resBranch = await fetch(
    `${GITHUB_API}/repos/${REPO}/git/ref/heads/${BASE_BRANCH}`,
    { headers }
  )

  if (!resBranch.ok) throw new Error('Não foi possível ler a branch base.')

  const infoBranch = await resBranch.json()
  const shaBase = infoBranch.object.sha

  // Nome da branch: admin/update-secao-YYYY-MM-DD-HHmm
  const agora = new Date()
  const nomeBranch = `admin/update-${secao}-${agora.toISOString().slice(0,16).replace(/[T:]/g, '-')}`

  const resCriarBranch = await fetch(
    `${GITHUB_API}/repos/${REPO}/git/refs`,
    {
      method: 'POST',
      headers,
      body: JSON.stringify({
        ref: `refs/heads/${nomeBranch}`,
        sha: shaBase,
      }),
    }
  )

  if (!resCriarBranch.ok) {
    const err = await resCriarBranch.json().catch(() => ({}))
    throw new Error(`Erro ao criar branch: ${err.message || resCriarBranch.status}`)
  }

  // ── 3. Atualiza o arquivo na nova branch ───────────────────
  // O conteúdo precisa estar em base64
  const conteudoJson = JSON.stringify(dados, null, 2)
  const conteudoBase64 = btoa(unescape(encodeURIComponent(conteudoJson)))

  const resUpdate = await fetch(
    `${GITHUB_API}/repos/${REPO}/contents/${JSON_PATH}`,
    {
      method: 'PUT',
      headers,
      body: JSON.stringify({
        message: `admin: atualiza ${secao} via painel — ${agora.toLocaleDateString('pt-BR')}`,
        content: conteudoBase64,
        sha: shaAtual,
        branch: nomeBranch,
      }),
    }
  )

  if (!resUpdate.ok) {
    const err = await resUpdate.json().catch(() => ({}))
    throw new Error(`Erro ao atualizar arquivo: ${err.message || resUpdate.status}`)
  }

  // ── 4. Cria o Pull Request ─────────────────────────────────
  const resPR = await fetch(
    `${GITHUB_API}/repos/${REPO}/pulls`,
    {
      method: 'POST',
      headers,
      body: JSON.stringify({
        title: `admin: atualiza ${secao} — ${agora.toLocaleDateString('pt-BR')}`,
        body: `## Atualização de conteúdo via painel admin\n\n**Seção modificada:** \`${secao}\`\n**Data:** ${agora.toLocaleString('pt-BR')}\n\nRevise as alterações e faça merge para publicar no site.`,
        head: nomeBranch,
        base: BASE_BRANCH,
      }),
    }
  )

  if (!resPR.ok) {
    const err = await resPR.json().catch(() => ({}))
    throw new Error(`Erro ao criar PR: ${err.message || resPR.status}`)
  }

  const pr = await resPR.json()
  return { url: pr.html_url }
}

// ─────────────────────────────────────────────────────────────
// UTILITÁRIOS
// ─────────────────────────────────────────────────────────────

/**
 * Obtém e armazena o PAT do campo de cabeçalho.
 * Salva na sessionStorage para persistir durante a sessão.
 * @returns {string}
 */
function obterPAT() {
  const campo = document.getElementById('pat-field')
  const pat = campo?.value?.trim() || ''

  if (pat) {
    // Salva para não precisar redigitar ao mudar de aba
    sessionStorage.setItem('llbr_admin_pat', pat)
  }

  return pat || sessionStorage.getItem('llbr_admin_pat') || ''
}

/**
 * Obtém o valor de um input/textarea pelo ID.
 * @param {string} id
 * @returns {string}
 */
function getVal(id) {
  return document.getElementById(id)?.value?.trim() || ''
}

/**
 * Define o valor de um input/textarea pelo ID.
 * @param {string} id
 * @param {string} valor
 */
function val(id, valor) {
  const el = document.getElementById(id)
  if (el) el.value = valor || ''
}

/**
 * Lê o valor de um campo dentro de um card pelo data-field.
 * Suporta campos aninhados como "before.src" com separador ponto.
 * @param {HTMLElement} card - Elemento do card
 * @param {string} campo     - Valor do data-field (ex: 'title' ou 'before.src')
 * @returns {string}
 */
function getFieldVal(card, campo) {
  const el = card.querySelector(`[data-field="${campo}"]`)
  return el?.value?.trim() || ''
}

/**
 * Exibe uma mensagem de status em um elemento pelo ID.
 * @param {string} id   - ID do elemento .save-status
 * @param {string} msg  - Mensagem a exibir
 * @param {string} tipo - 'ok' | 'err' | 'loading'
 */
function mostrarStatus(id, msg, tipo) {
  const el = document.getElementById(id)
  if (!el) return
  el.textContent = msg
  el.className = `save-status ${tipo}`
}

/**
 * Exibe a notificação global no canto inferior direito.
 * Desaparece automaticamente após o tempo especificado.
 * @param {string} msg     - Mensagem
 * @param {string} tipo    - 'ok' | 'err' | 'loading'
 * @param {number} [duracao=3000] - Duração em ms antes de sumir
 */
function mostrarGlobalStatus(msg, tipo, duracao = 3000) {
  const el = document.getElementById('global-status')
  if (!el) return

  el.textContent = msg
  el.className = `global-status ${tipo}`

  // Fecha automaticamente após a duração
  if (duracao > 0) {
    clearTimeout(el._timer)
    el._timer = setTimeout(() => {
      el.className = 'global-status'
    }, duracao)
  }
}

/**
 * Escapa HTML para evitar problemas ao inserir valores nos atributos.
 * @param {string} str
 * @returns {string}
 */
function esc(str) {
  if (typeof str !== 'string') return String(str ?? '')
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

// ─────────────────────────────────────────────────────────────
// INICIALIZAÇÃO
// ─────────────────────────────────────────────────────────────

/**
 * Inicializa o painel quando o DOM estiver pronto.
 * Configura a navegação por abas e o listener de Enter no campo de senha.
 */
document.addEventListener('DOMContentLoaded', () => {
  // Permite confirmar o login com Enter
  const senhaInput = document.getElementById('admin-pass')
  if (senhaInput) {
    senhaInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') login()
    })
  }

  // Salva o PAT na sessionStorage quando o campo perde o foco
  const patField = document.getElementById('pat-field')
  if (patField) {
    patField.addEventListener('blur', () => {
      const pat = patField.value.trim()
      if (pat) sessionStorage.setItem('llbr_admin_pat', pat)
    })
  }

  // Inicializa a navegação por abas
  initTabs()
})

// Expõe funções globais chamadas pelos atributos onclick do HTML
window.login = login
window.logout = logout
window.toggleCard = toggleCard
window.removerItem = removerItem
window.addService = addService
window.addGalleryItem = addGalleryItem
window.addBAItem = addBAItem
window.saveSection = saveSection
window.saveRawJson = saveRawJson
