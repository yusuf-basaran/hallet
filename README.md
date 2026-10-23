# HALLET

KKTC için hizmet pazaryeri ve usta rehberi. Saf HTML, CSS ve ES modülleri; Firebase 10.14.1 Modular SDK; Vercel üzerinde statik barındırma.

## Çalıştırma

Node.js 22 ve üzeriyle:

```bash
npm run dev
```

Uygulama `http://127.0.0.1:3000` adresinde açılır. `/dashboard` temiz URL'si geliştirme sunucusunda da çalışır. Geliştirme sunucusu yayın dosyalarını yerel adresle `dist/` altında üretir. Derleme için harici paket gerekmez. Firebase SDK dosyaları CDN'den yüklenir; internet bağlantısı gerekir.

Firebase yapılandırması boşken açıkça etiketlenmiş altı örnek profil gösterilir. Bu profillerin iletişim düğmeleri kapalıdır; veritabanına örnek kayıt yazılmaz. Bağlantı kurulunca yalnızca gerçek usta profilleri gösterilir.

## Firebase bağlantısı

Bu depodaki Web yapılandırması ve `.firebaserc` hedefi `hallet-823c7` projesine bağlıdır. Authentication sağlayıcılarının etkinleştirilmesi, Firestore veritabanının oluşturulması ve kuralların yayımlanması ayrıca Firebase hesabı üzerinden yapılır.

1. Firebase Console'da projenize bir Web uygulaması ekleyin. `js/firebase-config.js` içindeki `firebaseConfig` alanlarını Console'un verdiği Web yapılandırmasıyla doldurun. Servis hesabı anahtarı bu dosyaya konmaz.
2. Authentication → Sign-in method altında Email/Password ve Google sağlayıcılarını etkinleştirin. Google için destek e-postasını belirtin.
3. Authentication → Settings → Authorized domains listesine geliştirme sunucusunun alanını, Vercel adresini ve varsa özel alanı ekleyin. Protokol veya port eklemeyin. Domain değişince bu listeyi güncelleyin; uygulamadaki bağlantılar değişmez.
4. Cloud Firestore'un `(default)` veritabanını Firebase Web SDK ve Security Rules ile uyumlu modda oluşturun veya mevcut uyumlu veritabanını kullanın. Bölgeyi proje sahibi seçmelidir.
5. Projenize kuralları ve indeksleri gönderin:

```bash
npm ci
npx firebase-tools login
npx firebase-tools deploy --only firestore --project FIREBASE_PROJECT_ID
```

`FIREBASE_PROJECT_ID` yerine Web yapılandırmanızdaki gerçek `projectId` değerini kullanın. İndekslerin oluşturulması tamamlanmadan birleşik talepler/yorumlar sorguları hata verebilir. Vercel'e dosya göndermek Firebase kurallarını yayımlamaz.

İlk admin hesabı için uygulamada normal bir hesap oluşturun. Firebase Console'da bu UID'ye ait `users` belgesinin yalnızca `role` alanını `admin` yapın. Web istemcisi kendine admin rolü veremez; mevcut hesaplar istemciden rol değiştiremez. Yeni usta hesabı oluşturulurken 3 kredi verilir; giriş veya sayfa yenileme tekrar kredi eklemez.

## Otomatik Firebase bağlantısı

Yetkili Firebase hesabının bulunduğu bilgisayarda şu komutlar Web yapılandırmasını alır ve proje seçimini yazar:

```bash
npm ci
npm run firebase:login
npm run firebase:connect -- --project FIREBASE_PROJECT_ID --deploy
```

Birden fazla Web uygulaması varsa `--app WEB_APP_ID` ekleyin. Komut, `js/firebase-config.js` ile `.firebaserc` dosyalarını günceller; `--deploy` seçeneği mevcut Native Firestore veritabanını kontrol edip kuralları ve indeksleri yayımlar. Veritabanı veya Web uygulaması yoksa bunu bildirir; yeni proje oluşturmaz. Google ve e-posta giriş sağlayıcıları Firebase Console'da etkin olmalıdır.

Firebase Console'dan alınan Web yapılandırması JSON dosyası olarak mevcutsa hesap oturumu olmadan da istemci dosyaları hazırlanabilir:

```bash
npm run firebase:connect -- --config /dosya/yolu/firebase-web.json
```

Bu ikinci komut servisleri veya kuralları yayımlamaz. Yanlış proje kimliği, emülatör projesi ve servis hesabı özel anahtarı içeren dosyalar reddedilir. Doğrulama için `npm run test:config` kullanılır.

## Akışlar

- Rehber: ilçe/kategori filtreleri, süresi devam eden VIP profillerin önceliği, kimlik onayı, onaylı yorumlar ve WhatsApp görüşmesi.
- WhatsApp: mesajdaki kaynak alan adı `window.location.hostname` ile üretilir. Mesaj gönderilmez; WhatsApp görüşme ekranı açılır. `whatsappClicks` tıklama girişimlerinin sayısıdır, tekil ziyaretçi sayısı değildir. Dış bağlantı açılması görüşmenin başladığını veya mesajın gönderildiğini kanıtlamaz. İstemci sayacı bot trafiğine dayanıklı analitik olarak kullanılmamalıdır.
- Talepler: ihtiyaç, zamanlama, bölge ve iletişim olmak üzere dört adım. Gönderim sırasında kullanıcı giriş yapmamışsa e-posta/Google girişi açılır; form bilgileri korunur. Talep oluşturmak ücretsizdir.
- Usta paneli: yalnızca ilgili ilçe ve kategorilerdeki açık talepler; önceden açılan talepler; bakiye, WhatsApp tıklamaları ve profil düzenleme.
- Numara açma: kullanıcı kredisi, `unlockedBy` ve işlem belgesi tek transaction içinde yazılır. Ardından özel iletişim belgesi okunur. Aynı talebi tekrar açmak kredi düşürmez. İki farklı talep tek kredi karşılığında açılamaz.
- Admin: usta hesabına işlem başına 1–1000 kredi ekleme, VIP süresi ve kimlik onayı, talep kapatma, yorum onaylama veya onay kaldırma. Yorum moderasyonu puan ortalaması ve yorum sayısını transaction ile günceller. Kredi satışı için ödeme altyapısı eklenmemiştir; yüklemeyi admin yapar.
- Yorumlar: giriş yapan hesap, kendisi dışındaki bir ustaya tek yorum bırakabilir. Yorumlar yönetim onayına kadar herkese açık değildir.
- TR, EN, RU: bütün arayüz metinleri `js/i18n.js` sözlüğünden gelir; tercih tarayıcıda saklanır. Ustaların yazdığı tanıtım metinleri ve müşteri açıklamaları özgün dilinde kalır.

## Veri modeli ve telefon gizliliği

İstenen üç ana koleksiyon korunur: `users`, `job_requests`, `reviews`. Firestore bir belgenin bazı alanlarını okuyucuya açıp diğerlerini gizleyemez. Kredi kilidini uygulamak için şu uyarlama yapılmıştır:

| Yol | İçerik | Erişim |
| --- | --- | --- |
| `users/{uid}` | İstenen kullanıcı şeması | Sahibi ve admin; `role=pro` profilleri telefonlarıyla birlikte açık rehberde yayımlanır |
| `job_requests/{jobId}` | İstenen talep şeması; `customerPhone` maskeli, `details.description` iş açıklaması | İlgili açık talebe uygun ustalar, erişimi satın almış hesaplar ve admin |
| `job_requests/{jobId}/private/contact` | `customerPhone`: gerçek `90533…`/`90548…` numarası; `customerUid`: talebi oluşturan hesap | Talebin sahibi, erişimi satın almış hesaplar ve admin |
| `users/{uid}/private/unlock` | Son satın alınan `jobId` ve `createdAt` | Sahibi ve admin; yazma yalnızca ilgili atomik kredi işlemiyle |
| `reviews/{customerUid}_{proId}` | İstenen yorum şeması | Onaylı yorumlar herkese; onaysız yorum sahibi ve admin |

Gerçek müşteri numarası talep listesine indirilmez. Talep ve iletişim belgesi tek batch ile oluşturulur. Hesap türü, kredi, VIP, onay, puan ve tarih alanları genel profil düzenlemesiyle değiştirilemez. `unlockedBy` yalnızca kuralların doğruladığı satın alma işlemiyle genişletilir.

Ustaya verilen numara daha sonra geri alınamaz. Kullanıcılar iş açıklamasına telefon veya açık adres eklememelidir. Usta rehberine kayıt, profil ve telefonun herkese açık olarak yayımlanmasını içerir; form ve veri kullanımı penceresi bunu belirtir.

Bu Security Rules sürümü; rol yükseltmeyi, yetkisiz telefon erişimini ve atomik işlem dışındaki kredi değişikliklerini engellemek amacıyla hazırlanmış, emülatörde sınanmış bir prototiptir. Geniş kullanıma açmadan önce kendi proje ayarlarınız ve gerçek erişim senaryolarınızla ayrıca inceleyip doğrulayın.

## Vercel

Depoyu Vercel'e içe aktarın. `vercel.json`, bağımlılık gerektirmeyen Node.js derlemesini çalıştırır ve yalnızca `dist/` klasörünü yayınlar; `/`, `/en`, `/ru` ve `/dashboard` adreslerini destekler. Test araçlarının üretim için kurulmasına gerek yoktur. Testler, dağıtım betikleri ve Firebase kural dosyaları web çıktısına kopyalanmaz.

Uygulamanın kendi alan adı kodda sabit değildir. Sayfa bağlantıları kökten göreli, WhatsApp referansı mevcut alan adından türetilmiştir. Firebase ve WhatsApp gibi dış servislerin SDK/servis adresleri bu kuraldan bağımsızdır. Alan değişikliğinde Firebase Authorized domains ayarı yine güncellenmelidir.

## Kontroller

Test bağımlılıkları için `npm ci`, Firestore emülatörü için Java 21 gerekir. Tarayıcı testleri Chromium kullanır. Farklı bir kurulumda `CHROMIUM_PATH` ortam değişkenini Chromium çalıştırılabilir dosyasına ayarlayın.

```bash
npm run check
npm run test:rules
npm run test:browser
```

- Statik kontroller: JavaScript/JSON sözdizimi, üç dilde anahtar ve değişken eşleşmeleri, telefon dönüşümü ve tasarım kısıtlamaları.
- 16 Firestore testi: anonim/özel erişim, doğru sorgular, başlangıç kredisi, rol ve şema koruması, tek taraflı veya çoklu numara açma girişimleri, eşzamanlı kredi kullanımı, iletişim belgesi, admin işlemleri, yorum onayı ve sayaç alanı sınırları.
- Tarayıcı: 320, 390, 768 ve 1440 pikselde taşma kontrolü; filtreler; kalıcı dil tercihi; dört adımlı form; e-posta kaydı; müşteri talebi; krediyle gerçek numara açma; WhatsApp bağlantısının dinamik kaynağı; sayaç; admin kredi/VIP/onay işlemleri; yorum moderasyonu.

Testler `demo-hallet` adlı yerel emülatör projesi kullanır. Tarayıcı testleri, dosyada canlı proje bilgileri olsa da her istekte yapılandırmayı boş örnek görünüm veya yerel emülatör projesiyle değiştirir. Canlı Auth, Firestore ve token API uç noktaları test tarayıcısında engellenir; üretim yapılandırması değiştirilmez. Google düğmesi Modular SDK ile bağlıdır; gerçek Google OAuth ve canlı Firebase/Vercel ayarları yerel emülatör testinin kapsamında değildir.

## SEO ve çok dilli yayın

Vercel `node scripts/build.mjs` komutuyla yalnızca yayın dosyalarını `dist/` altında üretir. Türkçe `/`, İngilizce `/en` ve Rusça `/ru` sayfalarının başlıkları, açıklamaları ve görünür metinleri HTML içinde hazırdır; arama motorları ve paylaşım botları JavaScript çalıştırmadan okuyabilir. Dil değiştirme düğmeleri gerçek bağlantılardır; uygulama içinde form durumunu koruyarak adresi ve meta bilgilerini günceller. Paylaşılan dil adresi tarayıcıda kayıtlı dil tercihinden önce gelir.

Her dil için kendine işaret eden canonical, karşılıklı `hreflang` bağlantıları ve `x-default`, Open Graph ve X/Twitter kartları bulunur. Marka logosuyla hazırlanmış paylaşım görseli 1200×630 PNG’dir. JSON-LD verisi Organization, WebSite ve WebPage tanımlarını içerir. Adres, değerlendirme, hizmet bedeli veya sosyal hesap uydurulmaz.

Yayın adresi sırasıyla `SITE_ORIGIN`, `VERCEL_PROJECT_PRODUCTION_URL` ve `VERCEL_URL` değişkenlerinden alınır. Uygulama domaini kaynak kodda bulunmaz. Vercel sistem değişkenleri açık olduğunda mevcut yayın adresi otomatik kullanılır. Özel domaine geçerken Vercel’de `SITE_ORIGIN` değerini `https://` ile başlayan yeni ana adres olarak ayarlayıp yeniden yayınlayın; canonical, sosyal kart adresleri ve sitemap birlikte güncellenir. Eski adresin yeni domaine kalıcı yönlendirilmesi Vercel domain ayarlarından yapılır. Firebase Authorized domains listesine yeni alan adı ayrıca eklenir.

Yerel yayın dosyalarını üretmek için:

```bash
SITE_ORIGIN=http://127.0.0.1:3000 npm run build
```

`/robots.txt` taramaya izin verir ve mutlak sitemap adresini bildirir. `/sitemap.xml` yalnızca üç herkese açık dil sayfasını ve dil eşleşmelerini içerir; panel, arama filtreleri ve hesap işlemleri listelenmez. Panel hem HTML meta etiketi hem `X-Robots-Tag` HTTP başlığı ile `noindex, nofollow, noarchive` alır. Panel robots.txt ile engellenmez; böylece arama motoru `noindex` talimatını okuyabilir. Erişim güvenliğini Firebase Authentication ve Firestore kuralları sağlar.

Vercel Preview derlemeleri meta etiketlerinde `noindex, nofollow` içerir ve robots.txt tüm taramayı kapatır. Bilinmeyen yollar gerçek HTTP 404 ve `noindex` sayfasıyla yanıtlanır. `.html` ve sondaki eğik çizgi Vercel’in temiz URL ayarlarıyla kalıcı olarak normalleştirilir.

SEO kontrolleri:

```bash
npm run test:seo
```

Google Search Console ve Bing Webmaster sahiplik doğrulamaları hesap sahibine bağlıdır; doğrulama kodları veya takip kimlikleri uydurulmaz. Yayın sonrası Search Console’da siteyi doğrulayıp `sitemap.xml` gönderin. Arama motorlarının taraması ve sıralama zamanlaması harici hizmetlerin kararına bağlıdır.
