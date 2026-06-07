/**
 * main.js — Ponto de entrada da aplicação LLBR
 * =============================================
 * Importa e inicializa todos os módulos do site na ordem correta.
 *
 * Ordem de inicialização:
 *   1. initContent() — busca o JSON e popula serviços, galeria, sliders, tags e contato
 *                      Internamente reinicializa slider, lightbox e scroll após renderizar.
 *   2. initMenu()    — hambúrguer e fechamento do menu mobile
 *   3. initImprovements() — formulário de pedidos de melhoria (issues GitHub)
 *
 * Nota: initSliders(), initLightbox() e initScroll() são chamados dentro de
 * initContent() após o conteúdo dinâmico ser inserido no DOM, para garantir
 * que os elementos existam antes de serem inicializados.
 */

import './styles/main.css'
import { initContent }      from './modules/content.js'
import { initMenu }         from './modules/menu.js'
import { initImprovements } from './modules/improvements.js'

/**
 * start() — Função principal de inicialização.
 * É chamada quando o DOM está pronto (DOMContentLoaded ou imediatamente,
 * se o script já foi carregado depois do DOM).
 */
async function start() {
  // 1. Carrega conteúdo dinâmico do JSON e reinicializa sliders/lightbox/scroll
  await initContent()

  // 2. Inicializa o menu mobile (hambúrguer)
  initMenu()

  // 3. Inicializa o formulário de melhorias / issues GitHub
  initImprovements()
}

// Garante que o DOM existe antes de inicializar
// (o script é carregado com type="module" que já adia a execução,
//  mas esta verificação dupla é uma boa prática)
if (document.readyState !== 'loading') {
  start()
} else {
  document.addEventListener('DOMContentLoaded', start)
}
