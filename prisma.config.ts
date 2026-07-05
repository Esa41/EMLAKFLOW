import path from 'node:path'
import { defineConfig } from 'prisma/config'

export default defineConfig({
  seed: {
    provider: 'tsx',
    args: [path.join(__dirname, 'prisma', 'seed.ts')],
  },
})

