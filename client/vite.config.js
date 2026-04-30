import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// API requests are same-origin in production (served from Vercel) and same-origin
// under `vercel dev` locally. No dev proxy needed.
export default defineConfig({
  plugins: [react()],
});
