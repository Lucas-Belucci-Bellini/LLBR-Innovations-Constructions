// Lightbox com navegação (galeria filtrável + álbuns de projetos).
// Mantém um overlay único e reutilizável. Suporta um "grupo" de imagens
// com setas, teclado (←/→/Esc) e contador.

let overlay, imgEl, captionEl, counterEl, prevBtn, nextBtn, closeBtn
let group = []
let idx = 0

function ensureOverlay() {
  if (overlay) return
  overlay = document.createElement('div')
  overlay.className = 'lightbox'
  overlay.setAttribute('role', 'dialog')
  overlay.setAttribute('aria-modal', 'true')
  overlay.setAttribute('aria-hidden', 'true')
  overlay.innerHTML =
    '<button class="lightbox-close" type="button" aria-label="Fechar">&times;</button>' +
    '<button class="lightbox-nav lightbox-prev" type="button" aria-label="Imagem anterior">&#8249;</button>' +
    '<figure class="lightbox-figure">' +
      '<img class="lightbox-img" alt="">' +
      '<figcaption class="lightbox-caption"></figcaption>' +
    '</figure>' +
    '<button class="lightbox-nav lightbox-next" type="button" aria-label="Próxima imagem">&#8250;</button>' +
    '<span class="lightbox-counter" aria-hidden="true"></span>'
  document.body.appendChild(overlay)

  imgEl = overlay.querySelector('.lightbox-img')
  captionEl = overlay.querySelector('.lightbox-caption')
  counterEl = overlay.querySelector('.lightbox-counter')
  prevBtn = overlay.querySelector('.lightbox-prev')
  nextBtn = overlay.querySelector('.lightbox-next')
  closeBtn = overlay.querySelector('.lightbox-close')

  overlay.addEventListener('click', (event) => {
    if (event.target === overlay || event.target === closeBtn) close()
  })
  prevBtn.addEventListener('click', (e) => { e.stopPropagation(); step(-1) })
  nextBtn.addEventListener('click', (e) => { e.stopPropagation(); step(1) })
  window.addEventListener('keydown', onKey)
}

function render() {
  const item = group[idx]
  if (!item) return
  imgEl.src = item.src
  imgEl.alt = item.alt || ''
  const legenda = item.caption || item.alt || ''
  captionEl.textContent = legenda
  captionEl.hidden = !legenda
  const multi = group.length > 1
  counterEl.textContent = multi ? `${idx + 1} / ${group.length}` : ''
  prevBtn.hidden = !multi
  nextBtn.hidden = !multi
}

function step(delta) {
  if (!group.length) return
  idx = (idx + delta + group.length) % group.length
  render()
}

function onKey(event) {
  if (!overlay || !overlay.classList.contains('is-open')) return
  if (event.key === 'Escape') close()
  else if (event.key === 'ArrowLeft') step(-1)
  else if (event.key === 'ArrowRight') step(1)
}

function open(items, start) {
  ensureOverlay()
  group = items
  idx = start || 0
  render()
  overlay.classList.add('is-open')
  overlay.setAttribute('aria-hidden', 'false')
  document.body.classList.add('nav-open')
}

function close() {
  if (!overlay) return
  overlay.classList.remove('is-open')
  overlay.setAttribute('aria-hidden', 'true')
  document.body.classList.remove('nav-open')
}

/**
 * Abre o lightbox com um grupo arbitrário de imagens.
 * Usado pelos álbuns de projetos (content.js).
 * @param {Array<{src,alt,caption}>} items
 * @param {number} [start=0]
 */
export function openLightboxGroup(items, start = 0) {
  if (Array.isArray(items) && items.length) open(items, start)
}

/**
 * Liga o lightbox às imagens dentro de containers [data-lightbox] (a galeria).
 * Clicar numa foto abre o grupo inteiro, permitindo navegar com as setas.
 */
export function initLightbox() {
  ensureOverlay()
  const containers = document.querySelectorAll('[data-lightbox]')

  containers.forEach((container) => {
    const imgs = Array.from(container.querySelectorAll('img'))
    if (!imgs.length) return

    // Monta o grupo a partir das figuras (na ordem do DOM)
    const items = imgs.map((img) => ({
      src: img.currentSrc || img.src,
      alt: img.alt,
      caption: img.closest('figure')?.querySelector('figcaption')?.textContent || img.alt,
    }))

    imgs.forEach((img, i) => {
      img.style.cursor = 'zoom-in'
      img.addEventListener('click', () => open(items, i))
    })
  })
}
