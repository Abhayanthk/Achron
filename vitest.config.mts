import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

/**
 * Domain tests only. Everything under test here is pure TypeScript with no
 * React and no database, so the node environment is all it needs.
 */
export default defineConfig({
      test: {
            environment: "node",
            include: ["lib/**/*.test.ts"],
      },
      resolve: {
            alias: {
                  "@": fileURLToPath(new URL(".", import.meta.url)),
            },
      },
});
