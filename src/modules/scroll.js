// Animações de entrada ao rolar + destaque do link de navegação ativo.
export function initScroll() {
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  const revealables = document.querySelectorAll('[data-reveal]')

  if (reduce || !('IntersectionObserver' in window)) {
    revealables.forEach((el) => el.classList.add('is-visible'))
  } else {
    const revealObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible')
            revealObserver.unobserve(entry.target)
          }
        })
      },
      { threshold: 0.12 }
    )
    revealables.forEach((el) => revealObserver.observe(el))
  }

  const navLinks = Array.from(document.querySelectorAll('.site-nav a[href^="#"]'))
  const sections = navLinks
    .map((link) => document.querySelector(link.getAttribute('href')))
    .filter(Boolean)

  if (sections.length && 'IntersectionObserver' in window) {
    const spy = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return
          const id = '#' + entry.target.id
          navLinks.forEach((link) =>
            link.classList.toggle('is-active', link.getAttribute('href') === id)
          )
        })
      },
      { rootMargin: '-45% 0px -50% 0px' }
    )
    sections.forEach((section) => spy.observe(section))
  }
}
