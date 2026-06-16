const aramaInput = document.getElementById('aramaInput');
const araBtn = document.getElementById('araBtn');
const anasayfa = document.getElementById('anasayfa');
const aramaAlani = document.getElementById('aramaAlani');
const filmler = document.getElementById('filmler');
const bolumBaslik = document.getElementById('bolumBaslik');
const bolumAciklama = document.getElementById('bolumAciklama');
const favoriler = document.getElementById('favoriler');
const filmModal = document.getElementById('filmModal');
const modalBody = document.getElementById('modalBody');
const modalKapat = document.getElementById('modalKapat');
const siralamaSelect = document.getElementById('siralamaSelect');
const favorilereGit = document.getElementById('favorilereGit');
const favorilerBolum = document.getElementById('favorilerBolum');
const dilSelect = document.getElementById('dilSelect');
const altyaziSelect = document.getElementById('altyaziSelect');
const kategoriSelect = document.getElementById('kategoriSelect');
let favoriAdlari = new Set();
let sonAramaSonuclari = [];

const DIL_ADLARI = {
  '': 'Tüm diller', tr: 'Türkçe', en: 'İngilizce', fr: 'Fransızca',
  de: 'Almanca', es: 'İspanyolca', ko: 'Korece', ja: 'Japonca'
};

function filtreQuery() {
  let q = '';
  if (dilSelect.value) q += `&dil=${dilSelect.value}`;
  if (altyaziSelect.value) q += `&altyazi=${altyaziSelect.value}`;
  return q;
}

function altyaziMetin(film) {
  if (film.turkce_film || film.original_language === 'tr') return 'Türkçe film';
  if (film.turkce_altyazi) return 'TR altyazı var';
  return 'TR altyazı yok';
}

function altyaziEtiketHTML(film) {
  const metin = altyaziMetin(film);
  const sinif = (film.turkce_film || film.original_language === 'tr' || film.turkce_altyazi)
    ? 'etiket-alt-var'
    : 'etiket-alt-yok';
  return `<span class="etiket-kucuk ${sinif}">${metin}</span>`;
}

function dilEtiketHTML(film) {
  const dil = film.dil_adi || '—';
  return `<span class="etiket-kucuk etiket-dil">${dil}</span>`;
}

function bildirimGoster(mesaj, tip = 'basari') {
  const alan = document.getElementById('bildirimAlani');
  const toast = document.createElement('div');
  toast.className = `bildirim bildirim-${tip}`;
  toast.textContent = mesaj;
  alan.appendChild(toast);

  requestAnimationFrame(() => toast.classList.add('goster'));

  setTimeout(() => {
    toast.classList.remove('goster');
    toast.classList.add('kaybol');
    toast.addEventListener('transitionend', () => toast.remove(), { once: true });
  }, 2800);
}

function yukleniyorHTML(metin) {
  return `<p class="bos-mesaj yukleniyor-anim">${metin}<span class="yukleniyor-noktalar"><span></span><span></span><span></span></span></p>`;
}

function kartAnimasyonu(kart, index) {
  kart.classList.add('giris-anim');
  kart.style.animationDelay = `${Math.min(index * 0.06, 0.45)}s`;
}

function favorideMi(ad) {
  return favoriAdlari.has(ad.toLowerCase());
}

function favoriButonlariniGuncelle() {
  document.querySelectorAll('.favori-btn').forEach(btn => {
    const ad = btn.dataset.filmAdi;
    if (!ad) return;
    if (favorideMi(ad)) {
      btn.textContent = 'Eklendi ✓';
      btn.classList.add('eklendi');
      btn.disabled = true;
    } else {
      btn.textContent = 'Favoriye ekle';
      btn.classList.remove('eklendi');
      btn.disabled = false;
    }
  });
}

function filmleriSirala(liste, tip) {
  const kopya = [...liste];
  if (tip === 'puan') {
    return kopya.sort((a, b) => (b.vote_average || 0) - (a.vote_average || 0));
  }
  if (tip === 'yil') {
    return kopya.sort((a, b) => {
      const yA = a.release_date ? parseInt(a.release_date.slice(0, 4), 10) : 0;
      const yB = b.release_date ? parseInt(b.release_date.slice(0, 4), 10) : 0;
      return yB - yA;
    });
  }
  return kopya;
}

const KATEGORILER = [
  { ad: 'Macera', id: 12 },
  { ad: 'Bilim Kurgu', id: 878 },
  { ad: 'Romantik', id: 10749 },
  { ad: 'Aksiyon', id: 28 },
  { ad: 'Komedi', id: 35 },
  { ad: 'Korku', id: 27 }
];

function favoriBtnOlustur(ad, poster, yil, onFavori) {
  const btn = document.createElement('button');
  btn.className = 'favori-btn';
  btn.dataset.filmAdi = ad;

  if (favorideMi(ad)) {
    btn.textContent = 'Eklendi ✓';
    btn.classList.add('eklendi');
    btn.disabled = true;
  } else {
    btn.textContent = 'Favoriye ekle';
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      onFavori(ad, poster, yil);
    });
  }

  return btn;
}

function filmKartiOlustur(film, onFavori, onSil) {
  const poster = film.poster || (film.poster_path
    ? `https://image.tmdb.org/t/p/w200${film.poster_path}`
    : '');
  const ad = film.film_adi || film.title;
  const yil = film.yil || (film.release_date ? film.release_date.slice(0, 4) : '—');
  const puan = film.vote_average ? film.vote_average.toFixed(1) : null;
  const tmdbId = film.title ? film.id : null;

  const kart = document.createElement('div');
  kart.className = 'film-karti';

  const posterHTML = poster
    ? `<img src="${poster}" alt="${ad}">`
    : `<div class="poster-yok">Poster yok</div>`;

  const puanHTML = puan ? `<span class="puan">⭐ ${puan}</span>` : '';

  const etiketHTML = (film.dil_adi || film.turkce_altyazi !== undefined)
    ? `<div class="film-etiketler">${dilEtiketHTML(film)}${altyaziEtiketHTML(film)}</div>`
    : '';

  kart.innerHTML = `
    <div class="poster-alani">
      ${posterHTML}
    </div>
    <div class="bilgi">
      <h3>${ad}</h3>
      <p class="detay">${yil} ${puanHTML}</p>
      ${etiketHTML}
    </div>
  `;

  kart.addEventListener('click', (e) => {
    if (e.target.closest('button')) return;
    if (tmdbId) filmDetayAc(tmdbId);
    else favoriDetayGoster(film);
  });

  if (onFavori) {
    kart.querySelector('.bilgi').appendChild(favoriBtnOlustur(ad, poster, yil, onFavori));
  }

  if (onSil && film.id) {
    const silBtn = document.createElement('button');
    silBtn.className = 'sil-btn';
    silBtn.innerHTML = '&#10005;';
    silBtn.title = 'Favorilerden çıkar';
    silBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      onSil(film.id);
    });
    kart.querySelector('.poster-alani').appendChild(silBtn);
  }

  return kart;
}

function filmleriGoster(filmListesi, alan) {
  alan.innerHTML = '';

  if (!filmListesi || filmListesi.length === 0) {
    alan.innerHTML = '<p class="bos-mesaj">Film bulunamadı.</p>';
    return;
  }

  filmListesi.forEach((film, i) => {
    const kart = filmKartiOlustur(film, favoriEkle);
    kartAnimasyonu(kart, i);
    alan.appendChild(kart);
  });
}

function aramaSonuclariniGoster() {
  const sirali = filmleriSirala(sonAramaSonuclari, siralamaSelect.value);
  filmleriGoster(sirali, filmler);
}

function anasayfayiGoster() {
  anasayfa.style.display = 'block';
  aramaAlani.style.display = 'none';
  anasayfa.classList.remove('sayfa-giris');
  void anasayfa.offsetWidth;
  anasayfa.classList.add('sayfa-giris');
}

function aramaAlaniGoster() {
  anasayfa.style.display = 'none';
  aramaAlani.style.display = 'block';
  aramaAlani.classList.remove('sayfa-giris');
  void aramaAlani.offsetWidth;
  aramaAlani.classList.add('sayfa-giris');
}

function filtreleriUygula() {
  if (aramaAlani.style.display !== 'none' && aramaInput.value.trim()) {
    filmAra();
  } else {
    anasayfayiGoster();
    kategorileriYukle();
  }
}

function kategoriyeGit(katId) {
  if (!katId) return;
  aramaInput.value = '';
  anasayfayiGoster();
  const hedef = document.getElementById(`kat-${katId}`);
  if (hedef) hedef.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function dilMetni(film) {
  if (film.spoken_languages?.length) {
    return [...new Set(film.spoken_languages.map(d => d.name))].join(', ');
  }
  return film.dil_adi || '—';
}

function filmBilgiHTML(film) {
  const altyazi = film.turkce_film
    ? { metin: 'Gerekmez', sinif: 'durum-var' }
    : film.turkce_altyazi
      ? { metin: 'Var', sinif: 'durum-var' }
      : { metin: 'Yok', sinif: 'durum-yok' };

  const yasSinif = film.yas_siniri === '18+' ? 'yas-18' : '';

  return `
    <div class="modal-film-bilgi">
      <h4>Film Hakkında</h4>
      <div class="film-ozet-grid">
        <div class="film-ozet-kutu">
          <span class="film-ozet-baslik">Dil</span>
          <span class="film-ozet-deger">${dilMetni(film)}</span>
        </div>
        <div class="film-ozet-kutu">
          <span class="film-ozet-baslik">Altyazı</span>
          <span class="film-ozet-deger ${altyazi.sinif}">${altyazi.metin}</span>
        </div>
        <div class="film-ozet-kutu">
          <span class="film-ozet-baslik">Yaş</span>
          <span class="film-ozet-deger yas-deger ${yasSinif}">${film.yas_siniri || '—'}</span>
        </div>
      </div>
    </div>
  `;
}

function fragmanHTML(fragman) {
  if (!fragman) {
    return '<p class="modal-bos">Bu film için fragman bulunamadı.</p>';
  }
  return `
    <div class="fragman-wrapper">
      <iframe
        src="https://www.youtube.com/embed/${fragman.key}"
        title="${fragman.ad}"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowfullscreen
      ></iframe>
    </div>
  `;
}

function izlemeHTML(izleme, izlemeLink) {
  const linkHTML = izlemeLink
    ? `<a class="izleme-link" href="${izlemeLink}" target="_blank" rel="noopener">Tüm izleme seçeneklerini gör →</a>`
    : '';

  if (!izleme || izleme.length === 0) {
    return `
      <p class="modal-bos">Platform listesi bulunamadı.</p>
      ${linkHTML || '<p class="modal-bos">İzleme linki de bulunamadı.</p>'}
    `;
  }

  const platformlar = izleme.map(p => {
    const logo = p.logo_path
      ? `https://image.tmdb.org/t/p/w45${p.logo_path}`
      : '';
    const kartIcerik = `
      ${logo ? `<img src="${logo}" alt="${p.provider_name}">` : ''}
      <div>
        <span class="platform-ad">${p.provider_name}</span>
        <span class="platform-tip">${p.tip}</span>
      </div>
    `;

    if (izlemeLink) {
      return `
        <a class="platform-karti platform-link" href="${izlemeLink}" target="_blank" rel="noopener">
          ${kartIcerik}
        </a>
      `;
    }

    return `<div class="platform-karti">${kartIcerik}</div>`;
  }).join('');

  return `<div class="platform-listesi">${platformlar}</div>${linkHTML}`;
}

async function filmDetayAc(tmdbId) {
  filmModal.classList.add('acik');
  modalBody.innerHTML = '<p class="modal-yukleniyor">Yükleniyor<span class="yukleniyor-noktalar"><span></span><span></span><span></span></span></p>';

  try {
    const cevap = await fetch(`/api/film/${tmdbId}`);
    const film = await cevap.json();

    if (film.hata) {
      modalBody.innerHTML = '<p class="modal-yukleniyor">Film bilgisi yüklenemedi.</p>';
      return;
    }

    const poster = film.poster_path
      ? `https://image.tmdb.org/t/p/w500${film.poster_path}`
      : '';
    const yil = film.release_date ? film.release_date.slice(0, 4) : '—';
    const sure = film.runtime ? `${film.runtime} dk` : '—';
    const turler = film.genres ? film.genres.map(g => g.name).join(', ') : '—';
    const puan = film.vote_average ? film.vote_average.toFixed(1) : '—';
    const favoride = favorideMi(film.title);

    modalBody.innerHTML = `
      <div class="modal-grid modal-icerik-yuklendi">
        <div class="modal-sol">
          <div class="modal-poster">
            ${poster ? `<img src="${poster}" alt="${film.title}">` : '<div class="poster-yok">Poster yok</div>'}
          </div>
          <div class="modal-fragman">
            <h4>Fragman</h4>
            ${fragmanHTML(film.fragman)}
          </div>
        </div>
        <div class="modal-bilgi">
          <h2>${film.title}</h2>
          <div class="modal-etiketler">
            <span class="etiket">⭐ ${puan}</span>
            <span class="etiket">${yil}</span>
            <span class="etiket">${sure}</span>
          </div>
          <p class="modal-tur">${turler}</p>
          ${filmBilgiHTML(film)}
          <h4>Özet</h4>
          <p class="modal-ozet">${film.overview || 'Özet bulunamadı.'}</p>
          <div class="modal-izleme">
            <h4>Nerede İzlenir?</h4>
            ${izlemeHTML(film.izleme, film.izlemeLink)}
          </div>
          <button class="modal-favori-btn favori-btn ${favoride ? 'eklendi' : ''}" id="modalFavoriBtn" data-film-adi="${film.title}" ${favoride ? 'disabled' : ''}>${favoride ? 'Eklendi ✓' : 'Favoriye Ekle'}</button>
        </div>
      </div>
    `;

    if (!favoride) {
      document.getElementById('modalFavoriBtn').addEventListener('click', () => {
        favoriEkle(film.title, poster, yil);
      });
    }
  } catch {
    modalBody.innerHTML = '<p class="modal-yukleniyor">Film bilgisi yüklenemedi.</p>';
  }
}

function favoriDetayGoster(film) {
  filmModal.classList.add('acik');
  modalBody.innerHTML = `
    <div class="modal-grid modal-icerik-yuklendi">
      <div class="modal-poster">
        ${film.poster ? `<img src="${film.poster}" alt="${film.film_adi}">` : '<div class="poster-yok">Poster yok</div>'}
      </div>
      <div class="modal-bilgi">
        <h2>${film.film_adi}</h2>
        <div class="modal-etiketler">
          <span class="etiket">${film.yil || '—'}</span>
          <span class="etiket">Favorilerim</span>
        </div>
        <p class="modal-ozet">Bu film favorilerinizde kayıtlı.</p>
      </div>
    </div>
  `;
}

function modalKapatFn() {
  filmModal.classList.remove('acik');
}

modalKapat.addEventListener('click', modalKapatFn);
filmModal.addEventListener('click', (e) => {
  if (e.target === filmModal) modalKapatFn();
});
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') modalKapatFn();
});

async function kategorileriYukle() {
  anasayfa.innerHTML = yukleniyorHTML('Kategoriler yükleniyor');

  try {
    const cevap = await fetch(`/api/kategoriler?${filtreQuery().slice(1)}`);
    const veri = await cevap.json();

    if (veri.hata) {
      anasayfa.innerHTML = '<p class="bos-mesaj">Kategoriler yüklenemedi.</p>';
      return;
    }

    anasayfa.innerHTML = '';

    const doluKategoriler = veri.filter(kat => kat.filmler && kat.filmler.length > 0);

    if (doluKategoriler.length === 0) {
      anasayfa.innerHTML = '<p class="bos-mesaj">Seçilen filtrelere uygun film bulunamadı.</p>';
      return;
    }

    const aktifFiltreler = [];
    if (dilSelect.value) aktifFiltreler.push(DIL_ADLARI[dilSelect.value]);
    if (altyaziSelect.value === 'var') aktifFiltreler.push('Türkçe altyazılı');
    if (altyaziSelect.value === 'yok') aktifFiltreler.push('Altyazısız');

    if (aktifFiltreler.length > 0) {
      const bilgi = document.createElement('p');
      bilgi.className = 'filtre-bilgi';
      bilgi.textContent = `Aktif filtre: ${aktifFiltreler.join(' · ')}`;
      anasayfa.appendChild(bilgi);
    }

    doluKategoriler.forEach((kat, katIndex) => {
      const katId = KATEGORILER.find(k => k.ad === kat.kategori)?.id || '';
      const bolum = document.createElement('div');
      bolum.className = 'kategori-bolum bolum-giris';
      bolum.style.animationDelay = `${katIndex * 0.12}s`;
      bolum.id = `kat-${katId}`;

      const baslik = document.createElement('h2');
      baslik.className = 'bolum-baslik';
      baslik.textContent = kat.kategori;

      const liste = document.createElement('div');
      liste.className = 'film-listesi';

      kat.filmler.forEach((film, i) => {
        const kart = filmKartiOlustur(film, favoriEkle);
        kartAnimasyonu(kart, i);
        liste.appendChild(kart);
      });

      bolum.appendChild(baslik);
      bolum.appendChild(liste);
      anasayfa.appendChild(bolum);
    });

    favoriButonlariniGuncelle();
  } catch {
    anasayfa.innerHTML = '<p class="bos-mesaj">Kategoriler yüklenemedi. Backend çalışıyor mu?</p>';
  }
}

async function filmAra() {
  const kelime = aramaInput.value.trim();
  if (!kelime) {
    anasayfayiGoster();
    return;
  }

  aramaAlaniGoster();
  bolumBaslik.textContent = 'Arama Sonuçları';
  const filtreler = [];
  if (dilSelect.value) filtreler.push(DIL_ADLARI[dilSelect.value]);
  if (altyaziSelect.value === 'var') filtreler.push('altyazılı');
  if (altyaziSelect.value === 'yok') filtreler.push('altyazısız');
  const filtreMetin = filtreler.length ? ` · ${filtreler.join(', ')}` : '';
  bolumAciklama.textContent = `"${kelime}" için sonuçlar${filtreMetin}`;
  filmler.innerHTML = yukleniyorHTML('Aranıyor');

  const cevap = await fetch(`/api/ara?q=${encodeURIComponent(kelime)}${filtreQuery()}`);
  const veri = await cevap.json();
  sonAramaSonuclari = veri.results || [];
  siralamaSelect.value = 'varsayilan';
  aramaSonuclariniGoster();
}

async function favoriEkle(film_adi, poster, yil) {
  if (favorideMi(film_adi)) {
    bildirimGoster('Bu film zaten favorilerde!', 'hata');
    favoriButonlariniGuncelle();
    return;
  }

  try {
    const cevap = await fetch('/api/favori', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ film_adi, poster, yil })
    });

    const veri = await cevap.json();
    if (veri.mesaj) {
      favoriAdlari.add(film_adi.toLowerCase());
      bildirimGoster(veri.mesaj, 'basari');
      favoriButonlariniGuncelle();
      favoriListele();
    } else {
      bildirimGoster(veri.hata || 'Bir hata oluştu', 'hata');
      if (veri.zaten) favoriButonlariniGuncelle();
    }
  } catch {
    bildirimGoster('Backend\'e ulaşılamadı', 'hata');
  }
}

async function favoriSil(id) {
  try {
    const cevap = await fetch(`/api/favori/${id}`, {
      method: 'DELETE'
    });
    const veri = await cevap.json();
    if (veri.mesaj) {
      bildirimGoster(veri.mesaj, 'basari');
      favoriListele();
      favoriButonlariniGuncelle();
    } else {
      bildirimGoster(veri.hata || 'Silinemedi', 'hata');
    }
  } catch {
    bildirimGoster('Backend\'e ulaşılamadı', 'hata');
  }
}

async function favoriListele() {
  const cevap = await fetch('/api/favoriler');
  const liste = await cevap.json();

  favoriler.innerHTML = '';

  if (!Array.isArray(liste) || liste.length === 0) {
    favoriAdlari = new Set();
    favoriler.innerHTML = '<p class="bos-mesaj">Henüz favori yok.</p>';
    favoriButonlariniGuncelle();
    return;
  }

  favoriAdlari = new Set(liste.map(f => f.film_adi.toLowerCase()));

  liste.forEach((film, i) => {
    const kart = filmKartiOlustur(film, null, favoriSil);
    kartAnimasyonu(kart, i);
    favoriler.appendChild(kart);
  });

  favoriButonlariniGuncelle();
}

favorilereGit.addEventListener('click', () => {
  favorilerBolum.scrollIntoView({ behavior: 'smooth', block: 'start' });
});

araBtn.addEventListener('click', filmAra);
aramaInput.addEventListener('keypress', (e) => {
  if (e.key === 'Enter') filmAra();
});
siralamaSelect.addEventListener('change', () => {
  if (sonAramaSonuclari.length > 0) aramaSonuclariniGoster();
});

dilSelect.addEventListener('change', filtreleriUygula);
altyaziSelect.addEventListener('change', filtreleriUygula);
kategoriSelect.addEventListener('change', () => kategoriyeGit(kategoriSelect.value));

kategorileriYukle();
favoriListele();
