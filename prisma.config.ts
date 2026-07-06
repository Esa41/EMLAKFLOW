import path from "node:path";
import { defineConfig } from "prisma/config";
import { config as loadEnv } from "dotenv";

// Prisma config dosyası varken CLI (db push/studio/migrate) artık .env'i
// otomatik yüklemiyor — next build/dev bundan etkilenmez (Next kendi yükler).
loadEnv({ path: ".env" });
loadEnv({ path: ".env.local", override: true });

export default defineConfig({
  migrations: {
    seed: `tsx ${path.join("prisma", "seed.ts")}`,
  },
});
