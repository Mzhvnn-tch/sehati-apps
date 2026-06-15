/// <reference types="vitest" />
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
        manualChunks: {
          // Vendor splitting for better caching
          'vendor-react': ['react', 'react-dom', 'react-hook-form'],
          'vendor-ui': ['@radix-ui/react-dialog', '@radix-ui/react-tabs', '@radix-ui/react-toast'],
          'vendor-charts': ['recharts'],
          'vendor-web3': ['wagmi', 'viem', 'ethers'],
          'vendor-motion': ['framer-motion'],
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
      'wagmi', 'viem', 'ethers', 
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
