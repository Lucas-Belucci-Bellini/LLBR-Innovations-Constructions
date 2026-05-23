import { defineConfig } from 'vite'
import { viteStaticCopy } from 'vite-plugin-static-copy'

// As imagens originais ficam na raiz do repo (assets/ e pastas WhatsApp).
// Em vez de movê-las, copiamos para dist/ no build, preservando os caminhos
// usados nas URLs absolutas do HTML/CSS (/assets/... e /WhatsApp%20Unknown.../...).
export default defineConfig({
  base: '/',
  plugins: [
    viteStaticCopy({
      targets: [
        { src: 'assets', dest: '.' },
        { src: 'WhatsApp Unknown 2026-05-20 at 13.07.41', dest: '.' },
        { src: 'WhatsApp Unknown 2026-05-20 at 13.07.43', dest: '.' },
        { src: 'WhatsApp Unknown 2026-05-20 at 13.07.46', dest: '.' },
        { src: 'robots.txt', dest: '.' },
        { src: '404.html', dest: '.' }
      ]
    })
  ],
  build: {
    outDir: 'dist',
    sourcemap: false
  },
  server: {
    port: 3000,
    open: true
  }
})
