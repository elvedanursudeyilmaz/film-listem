# Film Listem

TMDB API ile film arama, favoriler (MySQL) ve kategori filtreleri.

## Kurulum

1. XAMPP → MySQL açık
2. phpMyAdmin → `setup.sql` çalıştır
3. `backend/.env.example` dosyasını `.env` olarak kopyala, TMDB anahtarını yaz
4. Terminal:
   ```
   cd backend
   npm install
   cd ..
   npm install
   npm start
   ```
5. Tarayıcı: http://localhost:3000

## TMDB API Key

https://www.themoviedb.org/settings/api adresinden ücretsiz alınır.
