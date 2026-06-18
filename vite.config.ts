/// <reference types="vitest" />
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";
import { metaImagesPlugin } from "./vite-plugin-meta-images";
import { nodePolyfills } from "vite-plugin-node-polyfills";

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    metaImagesPlugin(),
    nodePolyfills(),
  ],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "client", "src"),
      "@shared": path.resolve(import.meta.dirname, "shared"),
      "@assets": path.resolve(import.meta.dirname, "attached_assets"),
    },
  },

  root: path.resolve(import.meta.dirname, "client"),
  build: {
    outDir: path.resolve(import.meta.dirname, "dist/public"),
    emptyOutDir: true,
    // Performance optimizations
    rollupOptions: {
      output: {
        manualChunks(id) {
          // Vendor splitting for better caching
          if (id.includes('node_modules/react') || id.includes('node_modules/react-dom') || id.includes('node_modules/react-hook-form')) return 'vendor-react';
          if (id.includes('@radix-ui')) return 'vendor-ui';
          if (id.includes('recharts')) return 'vendor-charts';
          if (id.includes('framer-motion')) return 'vendor-motion';
          if (id.includes('wagmi') || id.includes('viem') || id.includes('@web3auth')) {
            return 'vendor-web3';
          }
        },
      },
    },
    // Chunk size limits
    chunkSizeWarningLimit: 1000,
    // Source maps for production debugging
    sourcemap: true,
    // Minification
    minify: 'esbuild',
  },
  optimizeDeps: {
    include: [
      'react', 'react-dom', 'react-dom/client', 
      'wagmi', 'viem', 
      '@web3auth/modal', '@web3auth/base', 
      'lucide-react', 'framer-motion', 'recharts'
    ]
  },
  server: {
    host: "0.0.0.0",
    allowedHosts: true,
    headers: {
      "Cross-Origin-Opener-Policy": "unsafe-none",
      "Cross-Origin-Embedder-Policy": "unsafe-none"
    },
    fs: {
      strict: true,
      deny: ["**/.*"],
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: './src/test/setup.ts',
  },
});
