// biome-ignore lint/style/useNodejsImportProtocol: <explanation>
import { resolve } from 'path'
import { defineConfig, externalizeDepsPlugin } from 'electron-vite'
import react from '@vitejs/plugin-react'
// https://github.com/vdesjs/vite-plugin-monaco-editor/issues/21#issuecomment-1827562674
import monacoEditorPluginModule from 'vite-plugin-monaco-editor'
const isObjectWithDefaultFunction = (
  module: unknown
): module is { default: typeof monacoEditorPluginModule } =>
  module != null &&
  typeof module === 'object' &&
  'default' in module &&
  typeof module.default === 'function'
const monacoEditorPlugin = isObjectWithDefaultFunction(monacoEditorPluginModule)
  ? monacoEditorPluginModule.default
  : monacoEditorPluginModule

export default defineConfig({
  main: {
    plugins: [externalizeDepsPlugin()],
    build: {
      minify: false, // CI环境不需要压缩主进程代码，加快构建
      sourcemap: false
    },
  },
  preload: {
    plugins: [externalizeDepsPlugin()],
    build: {
      minify: false, // CI环境不需要压缩预加载脚本，加快构建
      sourcemap: false
    },
  },
  renderer: {
    build: {
      sourcemap: false, // 禁用sourcemap加速构建
      minify: 'esbuild', // 使用更快的esbuild压缩
      cssMinify: 'lightningcss', // 使用更快的CSS压缩
      reportCompressedSize: false, // 不报告压缩大小，提高性能
      chunkSizeWarningLimit: 5000, // 提高块大小警告限制
      rollupOptions: {
        input: {
          index: resolve('src/renderer/index.html'),
          floating: resolve('src/renderer/floating.html')
        },
        output: {
          manualChunks: {
            // 将常用库分块
            'react-vendor': ['react', 'react-dom', 'react-router-dom'],
            'ui-vendor': ['@heroui/react'],
          }
        }
      }
    },
    resolve: {
      alias: {
        '@renderer': resolve('src/renderer/src'),
        '@': resolve(__dirname, 'src/renderer/src')
      }
    },
    plugins: [
      react(),
      monacoEditorPlugin({
        // 减少语言worker，只保留最常用的几种
        languageWorkers: ['editorWorkerService', 'typescript', 'json'],
        customDistPath: (_, out) => `${out}/monacoeditorwork`,
        customWorkers: [
          {
            label: 'yaml',
            entry: 'monaco-yaml/yaml.worker'
          }
        ]
      })
    ],
    // 缓存构建结果
    optimizeDeps: {
      include: ['react', 'react-dom', 'react-router-dom', '@heroui/react']
    },
    server: {
      hmr: {
        overlay: false // 关闭HMR覆盖，加速热更新
      }
    }
  }
})
