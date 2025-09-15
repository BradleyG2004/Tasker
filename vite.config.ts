import { reactRouter } from "@react-router/dev/vite";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig(({ command, mode }) => {
  const isTest = mode === 'test' || process.env.CYPRESS === 'true';
  
  return {
    plugins: [
      tailwindcss(), 
      ...(isTest ? [] : [reactRouter()]), // Exclure reactRouter en mode test
      tsconfigPaths()
    ],
  };
});
