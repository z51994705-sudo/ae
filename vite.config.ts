import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  // Set the third parameter to '' to load all env regardless of the `VITE_` prefix.
  const env = loadEnv(mode, (process as any).cwd(), '');
  
  return {
    plugins: [react()],
    define: {
      // Vercel injects environment variables during the build process.
      // We safely inject the API_KEY into the client bundle.
      // Using `env.API_KEY` allows it to work with local .env files AND Vercel dashboard variables.
      // Fallback to "" ensures we don't inject "undefined" literal which causes crashes.
      'process.env.API_KEY': JSON.stringify(env.API_KEY || ""),
    },
  };
});