#!/usr/bin/env tsx
import { createPrismaCompatClient } from '@lib/db/prisma-compat';

async function main() {
  const url = process.env.OMNI_DATABASE_URL || process.argv[2];
  if (!url) {
    console.error('Pass OMNI_DATABASE_URL or argv url');
    process.exit(1);
  }
  const omni = createPrismaCompatClient({
    datasources: { omni: { url } },
  });
  await omni.$connect();
  const count = await omni.omniCrawlHistory.count();
  console.log('omniCrawlHistory count=', count);
  await omni.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
