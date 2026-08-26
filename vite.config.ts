import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  // Los recursos relativos permiten publicar la misma compilación tanto en la
  // dirección anterior (/mi-mapa/) como en la raíz de mi-mapa.github.io.
  base: './',
})
