import path from "node:path";
import { defineConfig } from "prisma/config";

export default defineConfig({
  migrations: {
    seed: `tsx ${path.join("prisma", "seed.ts")}`,
  },
});
