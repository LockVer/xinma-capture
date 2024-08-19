import { defineConfig } from 'vite';
import { fileURLToPath, URL } from 'node:url';
import vue from '@vitejs/plugin-vue';
import electron from 'vite-plugin-electron';

export default defineConfig({
  plugins: [
    vue(),
    electron({
      entry: 'src/electron/main.js', // Electron 主进程入口文件
      vite: {
        build: {
          outDir: 'dist/electron', // 指定输出目录
          emptyOutDir: true, // 构建时清空输出目录
          rollupOptions: {
            input: 'src/electron/main.js', // Electron 入口文件
          },
        },
      },
    }),
  ],
  base: './', // 用于正确加载资源
  build: {
    outDir: 'dist/renderer', // 渲染进程输出目录
    emptyOutDir: true, // 构建时清空输出目录
    rollupOptions: {
      input: 'index.html', // 渲染进程入口文件
    },
  },
  optimizeDeps: {
    exclude: ['electron'], // 避免预打包 Electron 模块
  },
  resolve:{
    alias:{
      '@':fileURLToPath(new URL('./src',import.meta.url))
    }
  }
});
