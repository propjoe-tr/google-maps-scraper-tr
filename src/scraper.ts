import { chromium, Browser, Page } from 'playwright';
import { BusinessResultFast, BusinessResultDetailed } from './types';

export class GoogleMapsScraper {
  private browser: Browser | null = null;
  private page: Page | null = null;

  async init(): Promise<void> {
    this.browser = await chromium.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
    });

    const context = await this.browser.newContext({
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      viewport: { width: 1920, height: 1080 },
      locale: 'tr-TR'
    });

    this.page = await context.newPage();
  }

  async search(query: string, detailed: boolean = false): Promise<BusinessResultFast[] | BusinessResultDetailed[]> {
    if (!this.page) throw new Error('Scraper not initialized');

    console.log(`🔍 Aranıyor: ${query}${detailed ? ' (detaylı mod)' : ''}`);
    await this.page.goto(`https://www.google.com/maps/search/${encodeURIComponent(query)}`, { 
      waitUntil: 'networkidle' 
    });

    try {
      const btn = this.page.locator('button[aria-label="Tümünü kabul et"]').first();
      if (await btn.isVisible({ timeout: 3000 })) {
        await btn.click();
        await this.page.waitForTimeout(2000);
      }
    } catch {}

    if (detailed) {
      return await this.scrapeDetailed();
    } else {
      return await this.scrapeFast();
    }
  }

  private async scrollToEnd(): Promise<void> {
    if (!this.page) return;

    const feed = this.page.locator('div[role="feed"]');
    if (!await feed.isVisible({ timeout: 5000 })) return;

    console.log('📜 Yükleniyor...');

    let prevCount = 0, stable = 0;
    for (let i = 0; i < 60 && stable < 5; i++) {
      await feed.evaluate(el => el.scrollTop = el.scrollHeight);
      await this.page.waitForTimeout(1500);
      
      const endMessage = await this.page.locator('text=Listenin sonuna ulaştınız').isVisible().catch(() => false);
      if (endMessage) {
        console.log('📜 Liste sonu');
        break;
      }

      const count = await this.page.locator('a[href*="/maps/place"]').count();
      if (count === prevCount) stable++;
      else { stable = 0; console.log(`📜 ${count} sonuç...`); }
      prevCount = count;
    }
  }

  private async scrapeFast(): Promise<BusinessResultFast[]> {
    if (!this.page) return [];

    await this.scrollToEnd();
    console.log('⚡ Veriler çekiliyor...');
    
    const data = await this.page.evaluate(() => {
      const results: any[] = [];
      const seen = new Set<string>();
      const links = document.querySelectorAll('a[href*="/maps/place"]');
      
      links.forEach(link => {
        const anchor = link as HTMLAnchorElement;
        const name = anchor.getAttribute('aria-label');
        if (!name || seen.has(name)) return;
        seen.add(name);

        const mapsUrl = anchor.href;
        const container = anchor.closest('div[jsaction]');
        if (!container) return;

        let rating: number | null = null;
        let reviewCount: number | null = null;
        
        const ratingImg = container.querySelector('span[role="img"]');
        if (ratingImg) {
          const label = ratingImg.getAttribute('aria-label') || '';
          const rMatch = label.match(/(\d[,.]?\d?)\s*yıldız/i);
          const cMatch = label.match(/(\d+(?:[.,]\d+)*)\s*(?:yorum|review)/i);
          if (rMatch) rating = parseFloat(rMatch[1].replace(',', '.'));
          if (cMatch) reviewCount = parseInt(cMatch[1].replace(/[.,]/g, ''));
        }

        const allText = container.textContent || '';
        
        let phone: string | null = null;
        const phoneMatch = allText.match(/(\+90[\s\d]{10,})/);
        if (phoneMatch) phone = phoneMatch[1].trim();

        let category: string | null = null;
        const spans = container.querySelectorAll('span');
        for (const span of spans) {
          const t = span.textContent?.trim();
          if (t && t.length > 2 && t.length < 30 && 
              !t.match(/yıldız|Açık|Kapalı|^\d|€|₺|\(/i)) {
            category = t;
            break;
          }
        }

        results.push({ name, rating, reviewCount, phone, category, mapsUrl });
      });

      return results;
    });

    console.log(`✅ ${data.length} firma bulundu`);
    return data;
  }

  private async scrapeDetailed(): Promise<BusinessResultDetailed[]> {
    if (!this.page) return [];

    await this.scrollToEnd();

    const urls: string[] = await this.page.evaluate(() => {
      const links = document.querySelectorAll('a[href*="/maps/place"]');
      const seen = new Set<string>();
      const result: string[] = [];
      links.forEach(l => {
        const href = (l as HTMLAnchorElement).href;
        if (!seen.has(href)) {
          seen.add(href);
          result.push(href);
        }
      });
      return result;
    });

    console.log(`📋 ${urls.length} firma, detaylar çekiliyor...`);

    const results: BusinessResultDetailed[] = [];

    for (let i = 0; i < urls.length; i++) {
      const result = await this.getDetails(urls[i]);
      if (result) results.push(result);
      process.stdout.write(`\r⚡ ${i + 1}/${urls.length} işlendi`);
    }

    console.log(`\n✅ ${results.length} firma tamamlandı`);
    return results;
  }

  private async getDetails(url: string): Promise<BusinessResultDetailed | null> {
    if (!this.page) return null;

    try {
      await this.page.goto(url, { waitUntil: 'domcontentloaded', timeout: 15000 });
      await this.page.waitForTimeout(1200);

      const name = await this.page.locator('h1').first().textContent({ timeout: 5000 }).catch(() => null);
      if (!name) return null;

      let rating: number | null = null;
      const ratingLabel = await this.page.locator('div[role="img"][aria-label*="yıldız"]').first()
        .getAttribute('aria-label').catch(() => null);
      if (ratingLabel) {
        const m = ratingLabel.match(/(\d[,.]?\d?)\s*yıldız/i);
        if (m) rating = parseFloat(m[1].replace(',', '.'));
      }

      let reviewCount: number | null = null;
      const txt = await this.page.locator('div[role="main"]').first().textContent().catch(() => '') || '';
      const rm = txt.match(/\((\d+(?:[.,]\d+)*)\)/);
      if (rm) reviewCount = parseInt(rm[1].replace(/[.,]/g, ''));

      const category = await this.page.locator('button[jsaction*="category"]').first().textContent().catch(() => null);

      let address: string | null = null;
      const addrBtn = this.page.locator('button[data-item-id="address"]');
      if (await addrBtn.isVisible({ timeout: 500 }).catch(() => false)) {
        const l = await addrBtn.getAttribute('aria-label').catch(() => null);
        if (l) address = l.replace(/^Adres:\s*/i, '').trim();
      }

      let phone: string | null = null;
      const phoneBtn = this.page.locator('button[data-item-id^="phone:"]');
      if (await phoneBtn.isVisible({ timeout: 500 }).catch(() => false)) {
        const l = await phoneBtn.getAttribute('aria-label').catch(() => null);
        if (l) phone = l.replace(/^Telefon:\s*/i, '').trim();
      }

      let website: string | null = null;
      const webBtn = this.page.locator('a[data-item-id="authority"]');
      if (await webBtn.isVisible({ timeout: 500 }).catch(() => false)) {
        website = await webBtn.getAttribute('href').catch(() => null);
      }

      return {
        name: name.trim(),
        rating,
        reviewCount,
        address,
        phone,
        website,
        category: category?.trim() || null,
        mapsUrl: url
      };
    } catch {
      return null;
    }
  }

  async close(): Promise<void> {
    if (this.browser) await this.browser.close();
  }
}
