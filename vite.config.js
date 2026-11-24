import { defineConfig } from 'vite'
import { resolve } from 'node:path'

const pages = [
  'index.html',
  'catalog.html',
  'book-details.html',
  'cart.html',
  'checkout.html',
  'orders.html',
  'admin.html',
  'login.html',
  'register.html',
]

export default defineConfig({
  base: '/bookhaven/',
  appType: 'mpa',
  build: {
    rollupOptions: {
      input: pages.map((page) => resolve(process.cwd(), page)),
    },
  },
})
