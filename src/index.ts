import * as fs from 'fs';
import * as path from 'path';
import { GoogleMapsScraper } from './scraper';

function generateFileName(query: string): string {
  const turkishMap: Record<string, string> = {
    'ç': 'c', 'ğ': 'g', 'ı': 'i', 'ö': 'o', 'ş': 's', 'ü': 'u',
    'Ç': 'c', 'Ğ': 'g', 'İ': 'i', 'Ö': 'o', 'Ş': 's', 'Ü': 'u'
  };

  let fileName = query.toLowerCase();
  for (const [tr, en] of Object.entries(turkishMap)) {
    fileName = fileName.replace(new RegExp(tr, 'g'), en);
  }
  fileName = fileName.replace(/[^a-z0-9]/g, '');
  
  return `${fileName}.json`;
}

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const detailed = args.includes('--detailed');
  const query = args.filter(a => a !== '--detailed').join(' ');

  if (!query) {
    console.log('❌ Kullanım:');
    console.log('   npx ts-node src/index.ts "arama sorgusu"           # Hızlı mod');
    console.log('   npx ts-node src/index.ts "arama sorgusu" --detailed # Detaylı mod');
    process.exit(1);
  }

  const scraper = new GoogleMapsScraper();

  try {
    console.log('🚀 Scraper başlatılıyor...');
    await scraper.init();

    const results = await scraper.search(query, detailed);

    const output = {
      query,
      timestamp: new Date().toISOString(),
      mode: detailed ? 'detailed' : 'fast',
      total: results.length,
      results
    };

    const fileName = generateFileName(query);
    fs.writeFileSync(path.join(process.cwd(), fileName), JSON.stringify(output, null, 2), 'utf-8');

    console.log(`📁 Dosya: ${fileName}`);

  } catch (error) {
    console.error('❌ Hata:', error);
    process.exit(1);
  } finally {
    await scraper.close();
  }
}

main();
