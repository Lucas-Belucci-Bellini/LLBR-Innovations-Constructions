import './styles/main.css'
import { initMenu } from './modules/menu.js'
import { initSliders } from './modules/slider.js'
import { initLightbox } from './modules/lightbox.js'
import { initScroll } from './modules/scroll.js'

const start = () => {
  initMenu()
  initSliders()
  initLightbox()
  initScroll()
}

if (document.readyState !== 'loading') {
  start()
} else {
  document.addEventListener('DOMContentLoaded', start)
}
