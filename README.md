# Film Listem

TMDB (The Movie Database) API kullanan, film arama ve favori listesi oluşturma uygulaması.  
Frontend HTML/CSS/JavaScript, backend Node.js/Express, favoriler MySQL veritabanında saklanır.

---

## Özellikler

- **Film arama** — TMDB üzerinden isimle arama
- **Anasayfa kategorileri** — Macera, Bilim Kurgu, Romantik, Aksiyon, Komedi, Korku
- **Gelişmiş filtreler** — film dili, Türkçe altyazı, kategori
- **Sıralama** — puana veya yıla göre
- **Film detay modalı** — özet, puan, süre, türler, dil, altyazı, yaş sınırı
- **YouTube fragman** — detay sayfasında gömülü oynatıcı
- **Nerede izlenir** — platform listesi ve TMDB izleme linki
- **Favoriler** — MySQL'e kayıt, tekrar ekleme engeli, silme
- **Toast bildirimleri** — kullanıcı dostu geri bildirim
- **Responsive arayüz** — modern ve animasyonlu tasarım

---

## Kullanılan Teknolojiler

| Katman | Teknolojiler |
|--------|--------------|
| Frontend | HTML5, CSS3, JavaScript (Vanilla) |
| Backend | Node.js, Express |
| Veritabanı | MySQL (XAMPP) |
| API | TMDB REST API |

---

## Proje Yapısı

```
film-listem/
├── index.html          # Ana sayfa
├── app.js              # Frontend mantığı
├── style.css           # Stiller
├── package.json        # Başlatma scriptleri
├── setup.sql           # Veritabanı tablosu
├── README.md
└── backend/
    ├── server.js       # API sunucusu
    ├── package.json
    ├── .env.example    # Ortam değişkenleri şablonu
    └── .env            # Yerel ayarlar (GitHub'a yüklenmez)
```

---

## Kurulum

### Gereksinimler

- [Node.js](https://nodejs.org/) (v18+)
- [XAMPP](https://www.apachefriends.org/) (MySQL için)
- [TMDB API Key](https://www.themoviedb.org/settings/api) (ücretsiz)

### Adımlar

**1.** XAMPP Control Panel → **MySQL**'i başlat.

**2.** phpMyAdmin'e gir → **SQL** sekmesi → `setup.sql` dosyasının içeriğini çalıştır.  
Bu işlem `film_arama` veritabanında `favoriler` tablosunu oluşturur.

**3.** `backend/.env.example` dosyasını kopyalayıp `backend/.env` olarak kaydet.  
TMDB anahtarını `.env` içine yaz:

```env
API_KEY=buraya_tmdb_anahtarin
DB_HOST=127.0.0.1
DB_USER=root
DB_PASSWORD=
DB_NAME=film_arama
DB_PORT=3306
DB_SSL=false
```

**4.** Terminalde proje klasörüne gir ve bağımlılıkları kur:

```bash
cd backend
npm install
cd ..
npm install
```

**5.** Uygulamayı başlat:

```bash
npm start
```

**6.** Tarayıcıda aç: **http://localhost:3000**

> `index.html` dosyasına çift tıklayarak açmayın — backend çalışmadan API istekleri başarısız olur.

---

## API Uç Noktaları

| Metot | Uç nokta | Açıklama |
|-------|----------|----------|
| GET | `/api/ara?q=...` | Film arama |
| GET | `/api/film/:id` | Film detayı (fragman, izleme, dil, yaş) |
| GET | `/api/kategoriler` | Anasayfa kategori listesi |
| GET | `/api/kategori/:id` | Kategoriye göre filmler |
| GET | `/api/favoriler` | Kayıtlı favoriler |
| POST | `/api/favori` | Favori ekle |
| DELETE | `/api/favori/:id` | Favori sil |

---

## Notlar

- Proje **yerelde** çalışacak şekilde tasarlanmıştır.
- `.env` dosyası API anahtarını içerir — **asla GitHub'a yüklemeyin**.
- MySQL kapalıysa arama ve detay çalışır; favoriler devre dışı kalır.

---


