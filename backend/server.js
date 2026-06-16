const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const express = require('express');
const mysql = require('mysql2');

const API_KEY = process.env.API_KEY;
const PORT = process.env.PORT || 3000;

const dbConfig = {
  host: process.env.DB_HOST || '127.0.0.1',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'film_arama',
  port: Number(process.env.DB_PORT) || 3306
};

if (process.env.DB_SSL === 'true') {
  dbConfig.ssl = { rejectUnauthorized: false };
}

const db = mysql.createConnection(dbConfig);

let dbBagli = false;

db.connect((err) => {
  if (err) {
    console.warn('MySQL baglanamadi. XAMPP MySQL acik mi? (Favoriler calismaz)');
    return;
  }
  dbBagli = true;
  console.log('MySQL baglandi');
});

db.on('error', (err) => {
  console.warn('MySQL hatasi:', err.message);
  dbBagli = false;
});

function dbYoksa(res) {
  if (!dbBagli) {
    res.json({ hata: 'Veritabani baglantisi yok. XAMPP MySQL acin.' });
    return true;
  }
  return false;
}
const app = express();
app.use(express.json());
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    next();
  });
app.use(express.static(path.join(__dirname, '..')));

const KATEGORILER = [
  { ad: 'Macera', id: 12 },
  { ad: 'Bilim Kurgu', id: 878 },
  { ad: 'Romantik', id: 10749 },
  { ad: 'Aksiyon', id: 28 },
  { ad: 'Komedi', id: 35 },
  { ad: 'Korku', id: 27 }
];

const DIL_ADLARI = {
  tr: 'Türkçe', en: 'İngilizce', fr: 'Fransızca', de: 'Almanca',
  es: 'İspanyolca', ko: 'Korece', ja: 'Japonca', it: 'İtalyanca',
  ru: 'Rusça', ar: 'Arapça', hi: 'Hintçe', zh: 'Çince'
};

const altyaziCache = new Map();
function dilParam(dil) {
  return dil ? `&with_original_language=${dil}` : '';
}

function yasSiniriniFormatla(cert) {
  if (!cert) return 'Belirsiz';
  const harita = {
    G: 'Genel', PG: '7+', 'PG-13': '13+', R: '18+', 'NC-17': '18+',
    '13A': '13+', '15': '16+', '15+': '16+', '16': '16+', '18': '18+',
    AA: 'Genel', A: 'Genel', '6': '7+', '7': '7+', '13': '13+', '13+': '13+',
    '7+': '7+', '16+': '16+', '18+': '18+'
  };
  if (harita[cert]) return harita[cert];
  if (/18/.test(cert)) return '18+';
  if (/16|15/.test(cert)) return '16+';
  if (/13/.test(cert)) return '13+';
  if (/7|6|PG/i.test(cert)) return '7+';
  return cert;
}

function yasSiniriniParseEt(veri) {
  const tr = veri.results?.find(r => r.iso_3166_1 === 'TR');
  const us = veri.results?.find(r => r.iso_3166_1 === 'US');
  const certAl = (bolge) => {
    if (!bolge?.release_dates) return '';
    const sinema = bolge.release_dates.find(d => d.type === 3 && d.certification);
    const herhangi = bolge.release_dates.find(d => d.certification);
    return sinema?.certification || herhangi?.certification || '';
  };
  return yasSiniriniFormatla(certAl(tr) || certAl(us));
}

async function turkceAltyaziKontrol(filmId, orijinalDil) {
  if (orijinalDil === 'tr') return true;
  if (altyaziCache.has(filmId)) return altyaziCache.get(filmId);

  try {
    const url = `https://api.themoviedb.org/3/movie/${filmId}/translations?api_key=${API_KEY}`;
    const cevap = await fetch(url);
    const veri = await cevap.json();
    const varMi = veri.translations?.some(t => t.iso_639_1 === 'tr') || false;
    altyaziCache.set(filmId, varMi);
    return varMi;
  } catch {
    return false;
  }
}

async function filmleriZenginlestir(filmler) {
  return Promise.all(filmler.map(async (film) => {
    const turkceAltyazi = await turkceAltyaziKontrol(film.id, film.original_language);
    return {
      ...film,
      dil_adi: DIL_ADLARI[film.original_language] || film.original_language?.toUpperCase() || '—',
      turkce_altyazi: turkceAltyazi,
      turkce_film: film.original_language === 'tr'
    };
  }));
}

function altyaziFiltrele(filmler, altyazi) {
  if (!altyazi) return filmler;
  if (altyazi === 'var') return filmler.filter(f => f.turkce_altyazi);
  if (altyazi === 'yok') return filmler.filter(f => !f.turkce_altyazi);
  return filmler;
}

app.get('/api/ara', async (req, res) => {
  const arama = req.query.q;
  const dil = req.query.dil || '';
  const altyazi = req.query.altyazi || '';
  const url = `https://api.themoviedb.org/3/search/movie?api_key=${API_KEY}&language=tr-TR&query=${encodeURIComponent(arama)}`;

  const cevap = await fetch(url);
  const veri = await cevap.json();

  let sonuc = veri.results || [];
  if (dil) sonuc = sonuc.filter(f => f.original_language === dil);

  sonuc = await filmleriZenginlestir(sonuc);
  sonuc = altyaziFiltrele(sonuc, altyazi);

  res.json({ ...veri, results: sonuc });
});

app.get('/api/film/:id', async (req, res) => {
  const id = req.params.id;
  const key = `api_key=${API_KEY}&language=tr-TR`;
  const base = `https://api.themoviedb.org/3/movie/${id}`;

  try {
    const [filmRes, videoRes, providerRes, ceviriRes, yasRes] = await Promise.all([
      fetch(`${base}?${key}`),
      fetch(`${base}/videos?${key}`),
      fetch(`${base}/watch/providers?api_key=${API_KEY}`),
      fetch(`${base}/translations?api_key=${API_KEY}`),
      fetch(`${base}/release_dates?api_key=${API_KEY}`)
    ]);

    const film = await filmRes.json();
    const videolar = await videoRes.json();
    const saglayicilar = await providerRes.json();
    const ceviriler = await ceviriRes.json();
    const yasVeri = await yasRes.json();

    const fragmanVideo = videolar.results?.find(v => v.site === 'YouTube' && v.type === 'Trailer')
      || videolar.results?.find(v => v.site === 'YouTube');

    const bolge = saglayicilar.results?.TR || saglayicilar.results?.US;
    const izleme = [];

    if (bolge) {
      const ekle = (liste, tip) => {
        if (!liste) return;
        liste.forEach(p => {
          if (!izleme.some(x => x.provider_id === p.provider_id && x.tip === tip)) {
            izleme.push({ ...p, tip });
          }
        });
      };
      ekle(bolge.flatrate, 'Abonelik');
      ekle(bolge.rent, 'Kiralık');
      ekle(bolge.buy, 'Satın Al');
    }

    const turkceFilm = film.original_language === 'tr';
    const turkceAltyazi = turkceFilm || ceviriler.translations?.some(t => t.iso_639_1 === 'tr');

    res.json({
      ...film,
      dil_adi: DIL_ADLARI[film.original_language] || film.original_language?.toUpperCase(),
      konusulan_diller: film.spoken_languages?.map(d => d.name).join(', ') || '—',
      turkce_altyazi: turkceAltyazi,
      turkce_film: turkceFilm,
      yas_siniri: yasSiniriniParseEt(yasVeri),
      fragman: fragmanVideo ? { key: fragmanVideo.key, ad: fragmanVideo.name } : null,
      izleme,
      izlemeLink: bolge?.link || null
    });
  } catch {
    res.json({ hata: 'Film bilgisi alınamadı' });
  }
});

app.get('/api/kategori/:id', async (req, res) => {
  const dil = req.query.dil || '';
  const url = `https://api.themoviedb.org/3/discover/movie?api_key=${API_KEY}&language=tr-TR&with_genres=${req.params.id}${dilParam(dil)}&sort_by=popularity.desc&page=1`;
  const cevap = await fetch(url);
  const veri = await cevap.json();
  res.json(veri);
});

app.get('/api/kategoriler', async (req, res) => {
  const dil = req.query.dil || '';
  const altyazi = req.query.altyazi || '';
  try {
    const sonuc = await Promise.all(KATEGORILER.map(async (kat) => {
      const url = `https://api.themoviedb.org/3/discover/movie?api_key=${API_KEY}&language=tr-TR&with_genres=${kat.id}${dilParam(dil)}&sort_by=popularity.desc&page=1`;
      const cevap = await fetch(url);
      const veri = await cevap.json();
      let filmler = await filmleriZenginlestir(veri.results.slice(0, 6));
      filmler = altyaziFiltrele(filmler, altyazi);
      return { kategori: kat.ad, filmler };
    }));
    res.json(sonuc);
  } catch {
    res.json({ hata: 'Kategoriler yüklenemedi' });
  }
});

  app.post('/api/favori', (req, res) => {
    if (dbYoksa(res)) return;
    const { film_adi, poster, yil } = req.body;

    const kontrol = 'SELECT id FROM favoriler WHERE film_adi = ?';
    db.query(kontrol, [film_adi], (err, sonuc) => {
      if (err) return res.json({ hata: 'Kaydedilemedi' });
      if (sonuc.length > 0) return res.json({ hata: 'Bu film zaten favorilerde!', zaten: true });

      const sql = 'INSERT INTO favoriler (film_adi, poster, yil) VALUES (?, ?, ?)';
      db.query(sql, [film_adi, poster, yil], (err2) => {
        if (err2) return res.json({ hata: 'Kaydedilemedi' });
        res.json({ mesaj: 'Favoriye eklendi!' });
      });
    });
  });

app.get('/api/favoriler', (req, res) => {
  if (dbYoksa(res)) return;
  const sql = 'SELECT * FROM favoriler ORDER BY id DESC';
  db.query(sql, (err, sonuc) => {
    if (err) {
      return res.json({ hata: 'Favoriler alınamadı' });
    }
    res.json(sonuc);
  });
});

app.delete('/api/favori/:id', (req, res) => {
  if (dbYoksa(res)) return;
  const sql = 'DELETE FROM favoriler WHERE id = ?';
  db.query(sql, [req.params.id], (err) => {
    if (err) {
      return res.json({ hata: 'Silinemedi' });
    }
    res.json({ mesaj: 'Favorilerden çıkarıldı' });
  });
});

app.listen(PORT, () => {
  console.log(`Backend çalışıyor: http://localhost:${PORT}`);
});