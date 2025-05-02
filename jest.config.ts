// jest.config.ts
import type { Config } from "jest";

const config: Config = {
  preset: "ts-jest",
  testEnvironment: "node",
  setupFiles: ["<rootDir>/jest.setup.ts"],
  moduleFileExtensions: ["ts", "js", "json"],
  testMatch: ["**/tests/**/*.test.ts"],
};

export default config;
