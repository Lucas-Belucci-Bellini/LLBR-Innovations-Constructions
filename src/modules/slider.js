// Slider de comparacao antes/depois: arraste o cabo para revelar a obra pronta.
export function initSliders() {
  const sliders = document.querySelectorAll('[data-ba]')

  sliders.forEach((slider) => {
    const range = slider.querySelector('.ba-range')
    const apply = (value) => {
      const pct = Math.max(0, Math.min(100, Number(value)))
      slider.style.setProperty('--pos', pct + '%')
      if (range) range.value = String(pct)
      slider.setAttribute('aria-valuenow', String(Math.round(pct)))
    }

    apply(range ? range.value : 50)

    if (range) {
      range.addEventListener('input', () => apply(range.value))
    }

    const setFromClientX = (clientX) => {
      const rect = slider.getBoundingClientRect()
      apply(((clientX - rect.left) / rect.width) * 100)
    }

    let dragging = false
    slider.addEventListener('pointerdown', (event) => {
      dragging = true
      slider.classList.add('is-dragging')
      setFromClientX(event.clientX)
    })
    window.addEventListener('pointermove', (event) => {
      if (dragging) setFromClientX(event.clientX)
    })
    window.addEventListener('pointerup', () => {
      dragging = false
      slider.classList.remove('is-dragging')
    })
  })
}
