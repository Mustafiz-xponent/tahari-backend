// vitest.unit.config.ts
import { configDefaults, defineConfig, mergeConfig } from "vitest/config";
import vitestConfig from "./vitest.config.ts"; // Y 

export default mergeConfig(
  vitestConfig,
  defineConfig({
    test: {
      exclude: [
        ...configDefaults.exclude,
        "**/*.e2e-{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}",
      ],
    },
  })
);
