🗺️ **Google Maps Firma Scraper**

Google Maps'te firma araması yapıp sonuçları JSON formatında kaydeden CLI aracı.

✨ **Özellikler**

- 🚀 **Hızlı Mod** - Liste görünümünden veri çeker, saniyeler içinde tamamlanır
- 📋 **Detaylı Mod** - Her firmanın sayfasına girip tam bilgileri çeker
- 🔍 **Headless** - Tarayıcı penceresi açmadan arka planda çalışır
- 📁 **Otomatik dosya adı** - Arama sorgusundan dosya adı oluşturur

📦 **Kurulum**

```bash
git clone https://github.com/propjoe-tr/google-maps-scraper-tr.git
cd google-maps-scraper-tr
npm install
npx playwright install chromium
```

🚀 **Kullanım**

⚡ Hızlı Mod (Varsayılan)
```bash
npx ts-node src/index.ts "internet cafe pendik"
```

Çıktı: `internetcafependik.json`

```json
{
  "query": "internet cafe pendik",
  "timestamp": "2026-01-16T...",
  "mode": "fast",
  "total": 31,
  "results": [
    {
      "name": "Blue Gaming Cafe",
      "rating": 4.3,
      "reviewCount": 223,
      "phone": "+90 532 xxx xx xx",
      "category": "İnternet kafe",
      "mapsUrl": "https://www.google.com/maps/place/..."
    }
  ]
}
```

📋 Detaylı Mod
```bash
npx ts-node src/index.ts "restoran kadıköy" --detailed
```

Detaylı modda ek olarak `address` ve `website` bilgileri de çekilir.

📊 **Çıktı Alanları**

| Alan | Hızlı Mod | Detaylı Mod |
|------|-----------|-------------|
| name | ✅ | ✅ |
| rating | ✅ | ✅ |
| reviewCount | ✅ | ✅ |
| phone | ✅ | ✅ |
| category | ✅ | ✅ |
| mapsUrl | ✅ | ✅ |
| address | ❌ | ✅ |
| website | ❌ | ✅ |

🛠️ **Gereksinimler**

- Node.js 18+
- npm veya yarn

📄 **Lisans**

MIT

⚠️ **Uyarı**

Bu araç eğitim amaçlıdır. Google Maps'in kullanım şartlarına uygun şekilde kullanınız.
