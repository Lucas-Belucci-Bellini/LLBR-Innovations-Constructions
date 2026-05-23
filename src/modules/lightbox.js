// Lightbox simples para ampliar fotos da galeria.
export function initLightbox() {
  const images = document.querySelectorAll('[data-lightbox] img')
  if (!images.length) return

  const overlay = document.createElement('div')
  overlay.className = 'lightbox'
  overlay.setAttribute('role', 'dialog')
  overlay.setAttribute('aria-modal', 'true')
  overlay.setAttribute('aria-hidden', 'true')
  overlay.innerHTML =
    '<button class="lightbox-close" type="button" aria-label="Fechar">&times;</button>' +
    '<img class="lightbox-img" alt="">'
  document.body.appendChild(overlay)

  const imgEl = overlay.querySelector('.lightbox-img')
  const closeBtn = overlay.querySelector('.lightbox-close')

  const open = (src, alt) => {
    imgEl.src = src
    imgEl.alt = alt || ''
    overlay.classList.add('is-open')
    overlay.setAttribute('aria-hidden', 'false')
    document.body.classList.add('nav-open')
  }

  const close = () => {
    overlay.classList.remove('is-open')
    overlay.setAttribute('aria-hidden', 'true')
    document.body.classList.remove('nav-open')
  }

  images.forEach((img) => {
    img.style.cursor = 'zoom-in'
    img.addEventListener('click', () => open(img.currentSrc || img.src, img.alt))
  })

  overlay.addEventListener('click', (event) => {
    if (event.target === overlay || event.target === closeBtn) close()
  })
  window.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') close()
  })
}
