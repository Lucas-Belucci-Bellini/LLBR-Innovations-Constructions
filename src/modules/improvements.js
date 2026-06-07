/**
 * improvements.js — Módulo do formulário de melhorias
 * =====================================================
 * Gerencia o formulário de "Pedidos de melhoria do site" na seção #melhorias.
 *
 * Quando o formulário é enviado, o módulo faz uma das duas coisas:
 *
 *   1. SEM TOKEN GitHub:
 *      Redireciona para a página de criação de issue no GitHub com o
 *      título e a descrição pré-preenchidos via parâmetros de URL.
 *      O usuário ainda precisará clicar em "Submit new issue" no GitHub.
 *
 *   2. COM TOKEN GitHub (ghp_...):
 *      Chama a API do GitHub diretamente para criar a issue sem sair do site.
 *      O token é lido do campo de senha e NÃO é armazenado — apenas usado
 *      durante a requisição. Ideal para uso do Lucas (desenvolvedor).
 *
 * Repositório alvo: Lucas-Belucci-Bellini/LLBR-Innovations-Constructions
 */

// ─────────────────────────────────────────────────────────────
// CONFIGURAÇÃO
// ─────────────────────────────────────────────────────────────

/** Repositório GitHub onde as issues serão criadas */
const REPO = 'Lucas-Belucci-Bellini/LLBR-Innovations-Constructions'

/** URL base da API REST do GitHub */
const GITHUB_API = 'https://api.github.com'

/** Mapeamento de tipo de pedido para label do GitHub */
const LABELS_POR_TIPO = {
  melhoria: ['enhancement'],
  bug:      ['bug'],
  conteudo: ['content'],
  foto:     ['photo'],
  outro:    [],
}

// ─────────────────────────────────────────────────────────────
// UTILITÁRIOS
// ─────────────────────────────────────────────────────────────

/**
 * Exibe uma mensagem de status abaixo do formulário.
 * A classe CSS (ok ou err) controla a cor do texto.
 *
 * @param {HTMLElement} el - Elemento <p class="form-status">
 * @param {string} msg     - Mensagem a exibir
 * @param {'ok'|'err'} tipo - Tipo da mensagem
 */
function mostrarStatus(el, msg, tipo) {
  if (!el) return
  el.textContent = msg
  el.className = `form-status ${tipo}`
}

/**
 * Limpa o status e reseta o botão de submit para o estado normal.
 *
 * @param {HTMLElement} statusEl - Elemento de status
 * @param {HTMLButtonElement} btn - Botão de submit
 */
function resetarUI(statusEl, btn) {
  if (statusEl) statusEl.textContent = ''
  if (btn) { btn.disabled = false; btn.textContent = 'Enviar pedido' }
}

// ─────────────────────────────────────────────────────────────
// CRIAÇÃO DE ISSUE VIA API (com token)
// ─────────────────────────────────────────────────────────────

/**
 * Cria uma issue no GitHub diretamente via API REST.
 * Requer um Personal Access Token (PAT) com escopo 'repo' ou 'public_repo'.
 *
 * @param {string} titulo    - Título da issue
 * @param {string} descricao - Corpo da issue (markdown suportado)
 * @param {string} tipo      - Tipo: melhoria | bug | conteudo | foto | outro
 * @param {string} token     - GitHub PAT (ghp_...)
 * @returns {Promise<{ok: boolean, url?: string, erro?: string}>}
 */
async function criarIssueAPI(titulo, descricao, tipo, token) {
  // Monta o corpo da issue com informações extras úteis
  const corpo = `## Descrição\n\n${descricao}\n\n---\n_Enviado via formulário do site LLBR em ${new Date().toLocaleDateString('pt-BR')}_`

  // Labels a aplicar na issue, baseadas no tipo selecionado
  const labels = LABELS_POR_TIPO[tipo] || []

  try {
    const resposta = await fetch(`${GITHUB_API}/repos/${REPO}/issues`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/vnd.github+json',
        'Content-Type': 'application/json',
        'X-GitHub-Api-Version': '2022-11-28',
      },
      body: JSON.stringify({
        title: titulo,
        body: corpo,
        labels: labels,
      }),
    })

    if (!resposta.ok) {
      // Tenta ler a mensagem de erro da API do GitHub
      const dados = await resposta.json().catch(() => ({}))
      const mensagemErro = dados.message || `HTTP ${resposta.status}`
      return { ok: false, erro: mensagemErro }
    }

    const issue = await resposta.json()
    return { ok: true, url: issue.html_url }

  } catch (erro) {
    // Erro de rede (sem conexão, CORS, etc.)
    return { ok: false, erro: 'Erro de conexão: ' + erro.message }
  }
}

// ─────────────────────────────────────────────────────────────
// CRIAÇÃO DE ISSUE VIA REDIRECIONAMENTO (sem token)
// ─────────────────────────────────────────────────────────────

/**
 * Abre a página de criação de issue no GitHub com título e corpo pré-preenchidos.
 * Usa a feature de "issue templates via URL" do GitHub.
 *
 * @param {string} titulo    - Título da issue
 * @param {string} descricao - Descrição da issue
 * @param {string} tipo      - Tipo: melhoria | bug | conteudo | foto | outro
 */
function abrirIssueGitHub(titulo, descricao, tipo) {
  const corpo = `## Descrição\n\n${descricao}\n\n---\n_Enviado via formulário do site LLBR em ${new Date().toLocaleDateString('pt-BR')}_`

  // Constrói a URL de nova issue com parâmetros pré-preenchidos
  const params = new URLSearchParams({
    title: titulo,
    body: corpo,
    labels: (LABELS_POR_TIPO[tipo] || []).join(','),
  })

  const url = `https://github.com/${REPO}/issues/new?${params.toString()}`

  // Abre em nova aba para não perder o site atual
  window.open(url, '_blank', 'noreferrer')
}

// ─────────────────────────────────────────────────────────────
// INICIALIZAÇÃO DO FORMULÁRIO
// ─────────────────────────────────────────────────────────────

/**
 * initImprovements() — Inicializa o formulário de pedidos de melhoria.
 *
 * Adiciona o listener de submit ao formulário #melhoria-form.
 * Chamada em src/main.js junto com os outros módulos.
 */
export function initImprovements() {
  const form = document.getElementById('melhoria-form')
  if (!form) return // Formulário não encontrado — ignora sem erro

  const statusEl = document.getElementById('form-status')
  const btnSubmit = form.querySelector('[type="submit"]')

  form.addEventListener('submit', async (evento) => {
    // Previne o comportamento padrão de recarregar a página
    evento.preventDefault()

    // Lê os valores do formulário
    const titulo    = form.querySelector('#melhoria-titulo').value.trim()
    const descricao = form.querySelector('#melhoria-desc').value.trim()
    const tipo      = form.querySelector('#melhoria-tipo').value
    const token     = form.querySelector('#melhoria-token').value.trim()

    // ── Validação básica ──────────────────────────────────────
    if (!titulo) {
      mostrarStatus(statusEl, 'Por favor, preencha o título do pedido.', 'err')
      form.querySelector('#melhoria-titulo').focus()
      return
    }

    if (!descricao) {
      mostrarStatus(statusEl, 'Por favor, preencha a descrição detalhada.', 'err')
      form.querySelector('#melhoria-desc').focus()
      return
    }

    // ── Feedback visual durante o envio ──────────────────────
    if (btnSubmit) {
      btnSubmit.disabled = true
      btnSubmit.textContent = 'Enviando...'
    }
    mostrarStatus(statusEl, '', 'ok')

    // ── Rota com token: cria issue via API ────────────────────
    if (token) {
      const resultado = await criarIssueAPI(titulo, descricao, tipo, token)

      if (resultado.ok) {
        // Sucesso: mostra link para a issue criada e reseta o formulário
        mostrarStatus(
          statusEl,
          `Issue criada com sucesso! Ver em: ${resultado.url}`,
          'ok'
        )
        form.reset()
      } else {
        // Erro na API: mostra mensagem de erro e reabilita o botão
        mostrarStatus(
          statusEl,
          `Erro ao criar issue: ${resultado.erro}`,
          'err'
        )
        resetarUI(null, btnSubmit)
      }

      if (btnSubmit) { btnSubmit.disabled = false; btnSubmit.textContent = 'Enviar pedido' }
      return
    }

    // ── Rota sem token: abre GitHub no navegador ──────────────
    // Redireciona para a página de nova issue com os dados pré-preenchidos
    abrirIssueGitHub(titulo, descricao, tipo)
    mostrarStatus(
      statusEl,
      'Redirecionando para o GitHub... Complete o envio por lá.',
      'ok'
    )

    // Reabilita o botão após redirecionar
    if (btnSubmit) { btnSubmit.disabled = false; btnSubmit.textContent = 'Enviar pedido' }
  })
}
