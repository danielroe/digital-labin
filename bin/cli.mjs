#!/usr/bin/env node
// @ts-check

import { runMain, defineCommand } from 'citty'
import {
  build,
  copyPublicAssets,
  createDevServer,
  createNitro,
  prepare,
  prerender,
  writeTypes,
} from 'nitropack'
import { defineNitroConfig } from 'nitropack/config'
import { loadConfig } from 'c12'
import { defineLazyEventHandler, fromNodeMiddleware } from 'h3'
import { build as buildVite, createServer, defineConfig } from 'vite'
import vitePluginVue from '@vitejs/plugin-vue'
import rollupPluginVue from 'rollup-plugin-vue'

const defaultViteConfig = defineConfig({
  plugins: [vitePluginVue()],
  build: {
    outDir: '.nitro/client',
  },
})

const defaultNitroConfig = defineNitroConfig({
  publicAssets: [
    {
      baseURL: '/assets',
      dir: '.nitro/client/assets',
      maxAge: 31536000,
    },
  ],
  bundledStorage: ['templates'],
  handlers: [
    {
      route: '/**',
      handler: 'app/server.ts',
    },
  ],
  devHandlers: [
    {
      route: '/__vite',
      handler: defineLazyEventHandler(async () => {
        const server = await createServer({
          base: '/__vite',
          appType: 'custom',
          server: {
            middlewareMode: true,
          },
          ...defaultViteConfig,
        })
        return fromNodeMiddleware(server.middlewares)
      }),
    },
  ],
  rollupConfig: {
    plugins: [rollupPluginVue()],
  },
})

runMain(
  defineCommand({
    subCommands: {
      dev: {
        async run() {
          const { config } = await loadConfig({
            defaultConfig: defaultNitroConfig,
            overrides: {
              dev: true,
              storage: {
                templates: {
                  driver: 'fs',
                  base: '.nitro/templates',
                },
              },
            },
            configFile: 'labin.config',
          })
          const nitro = await createNitro(config)
          /** @type {string} */
          const template = await nitro.storage.getItem('root:index.html')
          await nitro.storage.setItem(
            'templates:index.html',
            template.replace(
              '<script type="module" src="./app/client.ts"></script>',
              `<script type="module" src="/__vite/app/client.ts"></script>
  <script type="module" src="/__vite/@vite/client"></script>`
            )
          )
          const server = createDevServer(nitro)
          await server.listen(3000)
          await prepare(nitro)
          await build(nitro)
        },
      },
      build: {
        async run() {
          const { config } = await loadConfig({
            defaultConfig: defaultNitroConfig,
            overrides: {},
            configFile: 'labin.config',
          })
          const nitro = await createNitro(config)
          await prepare(nitro)
          await writeTypes(nitro)
          await buildVite(defaultViteConfig)
          const template = await nitro.storage.getItem('build:client:index.html')
          await nitro.storage.setItem('templates:index.html', template)
          await copyPublicAssets(nitro)
          await prerender(nitro)
          await build(nitro)
          await nitro.close()
        },
      },
    },
  })
)
