import { defineConfig } from 'vitest/config'
import vue from '@vitejs/plugin-vue'
import { viteSingleFile } from 'vite-plugin-singlefile'

// Le build produit un unique dist/index.html (JS et CSS intégrés)
// pour pouvoir ouvrir l'outil par double-clic, sans serveur.
export default defineConfig({
  plugins: [vue(), viteSingleFile()],
  test: {
    environment: 'jsdom',
    include: ['tests/**/*.spec.ts'],
  },
})
