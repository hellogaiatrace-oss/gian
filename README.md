# GaiaTrace — çalışan temel sürüm (geliştirmeye açık)

Bu proje **çalışır** ve üstüne geliştirme yapmaya uygundur:
- Auth: Email/Şifre + Google (+ Phone OTP sayfası)
- Profil: fotoğraf, ülke/şehir, GaiaCredit, unvan
- Bağlantı (takip): **Bağlan / Bağlantıyı Kes** (istek/kabul)
- Karbon: katalogdan aktivite seç + miktar + otomatik CO2 + GaiaCredit
- GaiaChat: Public akış + yorum + beğeni
- GaiaChat Stories: hızlı paylaşımlar
- Masallar: çocuklar için doğa masalları bölümü (admin ekler)
- Admin: katalog/masal yönetimi + moderasyon

## Çalıştır
```bash
npm install
npm run dev
```

## Firebase ayarı
Firebase Console > Authentication:
- Email/Password ENABLE
- Google ENABLE
- Phone ENABLE (Phone OTP için)

Firestore Database + Storage aç.

## Admin olmak
Firestore `users/{uid}` dokümanında:
- `role: "admin"`

## Firestore rules (örnek)
`firestore.rules.txt` dosyasına bak.

## PWA (kolay app)
Android/Chrome: Menü > "Ana ekrana ekle" ile app gibi kullanılır.


## Added
- Help & Support page with searchable FAQ.
- Map country click panel (based on GaiaTrace user data).
- Fixed Echo (Yankı) repost.
- Login required for main routes.
