// vitest.e2e.config.ts
import { defineConfig, mergeConfig } from "vitest/config";
import vitestConfig from "./vitest.config"; // Your base config file

export default mergeConfig(
  vitestConfig,
  defineConfig({
    test: {
      include: ["**/*.e2e-{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}"],
      environmentMatchGlobs: [["src/**", "prisma"]],
    },
  })
);
