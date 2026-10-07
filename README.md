# Ravoq

**Muloqotdan hamkorlikka.** Expo / React Native asosidagi suhbatlar, mahalliy qaydlar va hujjat nusxalarini tekshirish ilovasi. Ravoq hozircha ishchi brend nomi.

## Ishga tushirish

Node.js 24 va npm bilan tekshirildi. Windows PowerShell uchun:

```powershell
npm.cmd ci
npm.cmd ci --prefix backend
npm.cmd run backend
```

Boshqa terminalda:

```powershell
npm.cmd run web
```

Ilovada profil yarating. **Profil → Server sozlamalari** orqali `http://localhost:3001` manzilini kiriting. Ikki foydalanuvchini sinash uchun ikkita alohida brauzer profilidan foydalaning; suhbatdoshning Profil bo‘limidagi manzilini kiriting. Telefonda `localhost` o‘rniga kompyuterning lokal tarmoq IP manzilini ishlating.

Server manzilini `.env` orqali ham belgilash mumkin:

```dotenv
EXPO_PUBLIC_API_URL=http://localhost:3001
```

Profil ichida saqlangan server manzili `.env` qiymatidan ustun. Serversiz ishlash uchun mahalliy qayd yarating.

## Android APKni mahalliy yig'ish (Windows)

Expo akkaunti talab qilinmaydi. Node.js, Java JDK 17 yoki 21, Android SDK 36,
Build Tools 36.0.0, NDK 27.1.12297006 va CMake kerak. Yetishmayotgan Android
komponentlari va Gradle kutubxonalarini yuklash uchun internet kerak bo'ladi.
Android Studio JDKsi yoki Eclipse Adoptium avtomatik topiladi; boshqa JDK uchun
`JAVA_HOME`, boshqa Android SDK uchun `ANDROID_HOME` ni belgilang.

```powershell
npm.cmd run build:apk:local
```

Natija: `artifacts/android/ravoq-preview.apk`. Bu ARM32 va ARM64 telefonlar uchun,
JavaScript ichiga joylangan, Metro serverisiz ishlaydigan `Ravoq Preview` ilovasi.
Sinov kaliti bilan imzolanadi; Google Play uchun alohida release kaliti kerak.
Ilova alohida `com.rawshanbek.blockchat.preview` package bilan o'rnatiladi.
Onlayn suhbat uchun Profil bo'limida ishlaydigan backend manzilini kiriting.

Oldindan yaratilgan preview Android loyihasini qayta ishlatish uchun:

```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass -File scripts/build-android-preview.ps1 -SkipPrebuild -Architectures arm64-v8a
```

## Web preview va tekshiruvlar

```powershell
npm.cmd run typecheck
npm.cmd test
npm.cmd run build:web
npm.cmd run preview
```

Preview: http://127.0.0.1:4173

Brauzer sinovlari uchun bir marta `npx.cmd playwright install chromium`, keyin `npm.cmd run test:e2e`. Sinov konfiguratsiyasi preview va backendni avtomatik ishga tushiradi; ochiq serverlardan ham foydalana oladi. Sinovlar faqat ajratilgan mahalliy backendga qarshi bajarilsin.

## Yangilangan imkoniyatlar

- Yangi Ravoq belgisi, ranglar, kirish sahifasi va ish maydoni.
- Kompyuterda yon menyu; planshet va telefonda pastki navigatsiya.
- Suhbat, oxirgi xabar va manzil bo‘yicha qidiruv; o‘qilmagan va mahalliy qayd filtrlari.
- Mahalliy qayd va haqiqiy profil manziliga onlayn suhbat alohida yaratiladi.
- Server javobidan keyin xabar yuborilgan deb qabul qilinadi. Xato bo‘lsa matn kiritish maydonida qoladi.
- Qayta ulanishda mahalliy suhbatlar va oldingi xabarlar saqlanadi; server xabari takror qo‘shilmaydi.
- Faylning haqiqiy baytlaridan SHA-256 hisoblanadi; bir xil fayl nomi o‘zgarsa ham taniladi. Limit: 20 MB.
- Tekshiruv barcha bloklar bog‘lanishini va yangi qaydlardagi fayl metama’lumotlarini qamrab oladi.
- Kerakli to‘rtta Inter shrifti va Feather ikonkalari alohida yuklanadi. Web JS yig‘ilishi dastlabki 2.9 MB dan taxminan 2.4 MB ga kamaydi (siqilmagan).

## Saqlangan ma’lumotlar bilan moslik

`blockchat:*` saqlash kalitlari, Android package, Expo slug va mavjud EAS project identifikatori moslik uchun saqlandi. Yangi o‘rnatish ham, eski lokal ma’lumotlar ham shu kalitlardan foydalanadi.

Oldingi versiya fayl baytlari o‘rniga nomi, hajmi va URI asosida hash hisoblagan. Eski qaydlar tarixda saqlanadi, ammo yangi tarkib tekshiruvi uchun faylni qayta qayd etish kerak. Yangi bloklar `version: 2` formatida yoziladi.

## Hozirgi chegaralar

Bu tekshiriladigan rivojlantirish versiyasi. Internetga ommaviy chiqarishdan oldin quyidagi backend ishlari zarur:

1. Hozir backend ma’lumotlari operativ xotirada. Server qayta ishga tushsa uning xonalari va xabarlari yo‘qoladi; qurilmada keshlangan nusxa qoladi. PostgreSQL, migratsiya va zaxiralash kerak.
2. Profil manzili shaxsni kriptografik tasdiqlamaydi. Backendda haqiqiy autentifikatsiya, har bir xona uchun ruxsat tekshiruvi va so‘rov cheklovlari kerak.
3. Uchidan uchigacha shifrlash mavjud emas. Hujjat reyestri qurilmadagi hash zanjiri; bu ommaviy blokcheyn, elektron imzo yoki huquqiy tasdiq emas.
4. Hujjat kartasi hash va metama’lumotlarni ulashadi. Faylning o‘zi serverga yuklanmaydi; boshqa qurilmadan yuklab olish uchun fayl ombori kerak.
5. Onlayn xabarlar uchun avtomatik oflayn yuborish navbati yo‘q. Tarmoq xatosida qoralama ochiq oynada qoladi. Server xabarni qabul qilib, javobi yo‘qolgan holat uchun idempotent yuborish mexanizmi kerak.
6. Android/iOS jismoniy qurilma sinovi va APK yig‘ilishi bu yangilanishda bajarilmadi. `server/serve.js` eski Replit manifest serveri; yangi web preview uchun `server/preview.js` ishlatiladi.

## Keyingi platforma bosqichi

Birinchi navbat: ma’lumotlar bazasi + akkaunt va sessiyalar + xona ruxsatlari + qayta yuborishda takrorlanmas xabarlar. Keyin fayl ombori, guruhlar, bildirishnomalar, global xabar qidiruvi va ishlab chiqarish muhitiga joylash.

Hash implementatsiyasi Expo 55 [Crypto](https://docs.expo.dev/versions/v55.0.0/sdk/crypto/) va [FileSystem](https://docs.expo.dev/versions/v55.0.0/sdk/filesystem/) APIlariga tayangan.
## 2026-10-06 tekshiruv natijalari

- TypeScript: xatosiz.
- Web export: muvaffaqiyatli; yakuniy JS taxminan 2.4 MB (siqilmagan).
- 10 ta unit test: hammasi o‘tdi.
- 7 ta brauzer ssenariysi: hammasi o‘tdi (asosiy 6 ta bir yurishda, server sozlamalari sinovi testdagi dialog kutishi tuzatilgach alohida qayta o‘tkazildi).
- O‘lchamlar: 1440, 768 va 390 px; gorizontal chiqib ketish yo‘q.
- Ikki mustaqil profil bilan xabar yuborish, javob olish, dublikatlarning yo‘qligi va qayta yuklash tekshirildi.
- Tarmoq so‘rovi uzilganda yuborilmagan matn qolishi tekshirildi.
- Haqiqiy faylni qayd qilish, nomini o‘zgartirib tekshirish va o‘zgargan tarkibni rad etish brauzerda tekshirildi.
- Dizayn rasmlari: `artifacts/` (gitga kiritilmaydi).
- Android/iOS qurilma sinovi, production deploy va xavfsizlik auditi bajarilmagan.
