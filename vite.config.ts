import path from "path";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    proxy: {
      // Proxy requests from /api to your backend
      // '/api': {
      //   target: 'http://localhost:8001',
      //   changeOrigin: true,
      //   rewrite: (path) => path.replace(/^\/api/, ''), // Remove /api from the path
      // },
      // Proxy requests from /mcp-api to your MCP server
      '/mcp-api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/mcp-api/, '/mcp'), // Change path to /mcp
      },
    },
  },
})
