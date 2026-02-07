import { defineConfig } from "vite";

export default defineConfig({
  build: {
    rollupOptions: {
      external: ["@luffalab/luffa-endless-sdk"],
    },
  },
});
