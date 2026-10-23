import { syncSeo } from "./seo.js";

export const SUPPORTED_LANGUAGES = Object.freeze(["tr", "en", "ru"]);
export const CITIES = Object.freeze([
  "Lefkoşa", "Gazimağusa", "Girne", "İskele", "Güzelyurt", "Lefke"
]);
export const CATEGORY_IDS = Object.freeze([
  "ac-repair", "plumbing-electric", "cleaning", "moving", "locksmith-tow"
]);

export const dictionary = {
  tr: {
    brand: {
      title: "HALLET | KKTC Usta Bul ve Ücretsiz Fiyat Teklifi Al",
      description: "KKTC’de klima, tesisat, temizlik, nakliye ve çilingir için usta bulun. Bölgenizdeki ustaları karşılaştırın, WhatsApp’tan yazın veya ücretsiz fiyat teklifi isteyin."
    },
    nav: {
      home: "Anasayfa", pros: "Usta bul", how: "Nasıl çalışır?",
      dashboard: "Usta Paneli", login: "Giriş yap", registerPro: "Usta olarak katıl",
      logout: "Çıkış yap", language: "Dil seçimi", menu: "Menüyü aç veya kapat"
    },
    common: {
      allCities: "Tüm ilçeler", allCategories: "Tüm hizmetler",
      city: "İlçe", neighborhood: "Mahalle / Bölge", category: "Hizmet",
      fullName: "Ad soyad", phone: "Telefon", email: "E-posta", password: "Şifre",
      loading: "Yükleniyor…", saving: "Kaydediliyor…", save: "Kaydet",
      cancel: "Vazgeç", close: "Kapat", back: "Geri", next: "Devam et",
      retry: "Tekrar dene", required: "Zorunlu", optional: "İsteğe bağlı",
      yes: "Evet", no: "Hayır"
    },
    cities: {
      "Lefkoşa": "Lefkoşa", "Gazimağusa": "Gazimağusa", "Girne": "Girne",
      "İskele": "İskele", "Güzelyurt": "Güzelyurt", "Lefke": "Lefke"
    },
    categories: {
      "ac-repair": "Klima Tamir ve Bakım",
      "plumbing-electric": "Su ve Elektrik Tesisatı",
      cleaning: "Ev ve Ofis Temizliği",
      moving: "Nakliye ve Eşya Taşıma",
      "locksmith-tow": "Çilingir ve Oto Kurtarma"
    },
    home: {
      eyebrow: "KKTC hizmet ve usta rehberi",
      title: "KKTC Genelinde Onaylı Ustalarla İşini Hallet",
      subtitle: "İlçeni ve ihtiyacını seç. Ustaları karşılaştır, doğrudan görüş veya fiyat teklifi talebi bırak.",
      searchTitle: "Bölgenizdeki Ustaları Karşılaştırın", searchAction: "Ustaları göster",
      requestTitle: "İşini anlat, ustalar sana ulaşsın",
      requestDescription: "İhtiyacını birkaç adımda paylaş. Bölgenizdeki ustalar işin detaylarını görüp sizinle görüşsün.",
      requestAction: "Ücretsiz Fiyat Teklifi Alın",
      prosTitle: "Bölgenizdeki ustalar", prosDescription: "Sponsorlu profiller önce gösterilir.",
      results: "Usta sayısı: {count}", emptyTitle: "Bu seçimde usta bulunamadı",
      emptyText: "Filtreleri değiştirebilir veya işiniz için talep bırakabilirsiniz.",
      clearFilters: "Filtreleri temizle",
      demo: "Örnek görünüm. Bu profiller tanıtım amaçlıdır; mesaj ve talep gönderimi henüz kullanıma açılmadı.",
      loadError: "Usta listesi alınamadı. Lütfen tekrar deneyin."
    },
    pro: {
      sponsored: "Sponsorlu", verified: "Onaylı Usta", unverified: "Kimlik onayı bekleniyor",
      whatsapp: "WhatsApp'tan Yaz", reviews: "{count} yorum", noReviews: "Henüz yorum yok",
      rating: "5 üzerinden {rating}", profileUnavailable: "İletişim bilgisi henüz eklenmedi",
      whatsappMessage: "Merhaba {proName}, HALLET ({hostname}) ilanınız üzerinden ulaşıyorum. {category} için müsaitlik ve fiyat bilgisi alabilir miyim?"
    },
    how: {
      title: "HALLET nasıl çalışır?", directoryTitle: "Ustaları karşılaştır",
      directoryText: "İlçe ve hizmet türüne göre profillere, onay bilgisine ve yorumlara bak.",
      contactTitle: "Doğrudan görüş", contactText: "Seçtiğin ustaya WhatsApp üzerinden işini anlat.",
      requestTitle: "Fiyat teklifi iste", requestText: "Talep bırak; bölgenizdeki uygun ustalar sizinle iletişime geçsin."
    },
    wizard: {
      title: "Fiyat teklifi talebi", step: "Adım {current} / {total}",
      detailStep: "İhtiyaç detayı", timeStep: "Zamanlama", locationStep: "İlçe ve mahalle",
      contactStep: "İletişim bilgileri", detailLabel: "Yapılacak işi anlatın",
      detailPlaceholder: "Örneğin: Salondaki klima soğutmuyor. İç ve dış üniteye ulaşılabiliyor.",
      urgencyLabel: "Ne zaman yapılsın?", acil: "Acil", bu_hafta: "Bu hafta", esnek: "Tarih esnek",
      neighborhoodPlaceholder: "Örneğin: Gönyeli, Sakarya, Alsancak, Long Beach",
      contactNote: "Telefon numaranız, talebinizle ilgilenen ve erişim hakkı alan ustalarla paylaşılır.",
      consent: "İletişim bilgilerimin bu talep için ilgili ustalarla paylaşılmasını kabul ediyorum.",
      submit: "Talebi gönder", successTitle: "Talebiniz alındı",
      successText: "Bölgenizdeki ilgili ustalar talebinizi görebilir. Sizinle paylaştığınız telefon numarasından iletişime geçecekler."
    },
    auth: {
      loginTitle: "HALLET'e giriş yap", registerTitle: "HALLET hesabı oluştur",
      customer: "Hizmet almak istiyorum", pro: "Usta olarak çalışıyorum",
      google: "Google ile devam et", separator: "veya",
      create: "Hesap oluştur", haveAccount: "Hesabınız var mı?", noAccount: "Hesabınız yok mu?",
      forgotPassword: "Şifremi unuttum", resetSent: "Bu e-posta ile bir hesap varsa şifre yenileme bağlantısı gönderildi.",
      passwordHint: "En az 8 karakter kullanın.", proCategories: "Verdiğiniz hizmetler",
      bio: "Kendinizi ve yaptığınız işi anlatın", bioPlaceholder: "Çalıştığınız bölge, deneyiminiz ve sunduğunuz hizmetler",
      welcomeCredit: "Yeni usta hesabınıza 3 başlangıç kredisi tanımlanır.",
      needLogin: "Paneli kullanmak için giriş yapın.",
      profileIncomplete: "Profilinizi tamamlayarak hizmet verdiğiniz ilçe ve kategorileri seçin."
    },
    dashboard: {
      title: "HALLET — Usta ve Admin Paneli", welcome: "Merhaba, {name}",
      credits: "Kredi bakiyesi", creditUnit: "{count} kredi", clicks: "WhatsApp tıklamaları",
      openRequests: "Açık iş talepleri", profile: "Profilim", requestsTab: "Uygun talepler",
      unlockedTab: "Açtığım talepler", adminTab: "Yönetim", emptyRequests: "Şu an bu listede talep yok.",
      loadError: "Panel bilgileri alınamadı. Lütfen tekrar deneyin.",
      unlock: "1 Kredi Kullan ve Numarayı Gör", alreadyUnlocked: "Numara erişiminiz var",
      noCredits: "Krediniz yetersiz. Kredi yüklemek için HALLET yönetimiyle görüşün.",
      closed: "Talep kapandı", details: "İşin detayı", customer: "Talep sahibi",
      contact: "İletişim", createdAt: "Talep tarihi", profileSaved: "Profiliniz kaydedildi.",
      restricted: "Bu alanı görüntüleme yetkiniz bulunmuyor.", managePros: "Usta hesapları",
      loadCredits: "Kredi yükle", creditAmount: "Eklenecek kredi", featured: "VIP vitrin",
      featuredUntil: "VIP bitiş tarihi", verified: "Kimlik onayı", actions: "İşlemler",
      adminSaved: "Usta hesabı güncellendi.",
      confirmUnlock: "Bu talebin iletişim bilgilerini açmak için 1 kredi kullanılacak.",
      closeRequest: "Talebi kapat", requestClosed: "Talep kapatıldı."
    },
    errors: {
      config: "Hizmet henüz kullanıma açılmadı. Lütfen daha sonra tekrar deneyin.",
      required: "Lütfen zorunlu alanları doldurun.", phone: "0533 8XX XX XX veya 0548 8XX XX XX biçiminde bir KKTC numarası yazın.",
      email: "Geçerli bir e-posta adresi yazın.", password: "Şifre en az 8 karakter olmalı.",
      details: "İşin detayını 20 ile 2000 karakter arasında yazın.", city: "Listeden bir ilçe seçin.",
      category: "Listeden bir hizmet seçin.", categories: "En az bir hizmet kategorisi seçin.",
      consent: "Devam etmek için iletişim bilgisi paylaşımına onay verin.",
      emailInUse: "Bu e-posta adresiyle bir hesap var. Giriş yapabilirsiniz.",
      invalidCredentials: "E-posta veya şifre doğru değil.", popupClosed: "Google ile giriş tamamlanmadı.",
      popupBlocked: "Tarayıcı giriş penceresini engelledi. Açılır pencerelere izin verip tekrar deneyin.",
      unauthorizedDomain: "Bu alan adı için Google ile giriş henüz etkinleştirilmedi.",
      tooManyRequests: "Çok fazla deneme yapıldı. Bir süre sonra tekrar deneyin.",
      network: "Bağlantı kurulamadı. İnternet bağlantınızı kontrol edin.",
      permission: "Bu işlem için yetkiniz bulunmuyor.", unavailable: "Hizmete şu an ulaşılamıyor. Lütfen tekrar deneyin.",
      notFound: "Kayıt bulunamadı.", unknown: "İşlem tamamlanamadı. Lütfen tekrar deneyin.",
      creditAmount: "1 ile 1000 arasında tam sayı girin.", featuredUntil: "VIP için gelecekte bir bitiş tarihi seçin."
    },
    footer: {
      text: "KKTC genelinde hizmet ve usta rehberi.", copyright: "© {year} HALLET. Tüm hakları saklıdır."
    }
  },
  en: {
    brand: {
      title: "HALLET | Local Services & Tradespeople in North Cyprus",
      description: "Find local tradespeople in North Cyprus for air conditioning, plumbing, cleaning, removals and locksmith services. Contact them on WhatsApp or request free quotes."
    },
    nav: {
      home: "Home", pros: "Find a professional", how: "How it works",
      dashboard: "Professional dashboard", login: "Sign in", registerPro: "Join as a professional",
      logout: "Sign out", language: "Select language", menu: "Open or close menu"
    },
    common: {
      allCities: "All districts", allCategories: "All services",
      city: "District", neighborhood: "Neighbourhood / Area", category: "Service",
      fullName: "Full name", phone: "Phone", email: "Email", password: "Password",
      loading: "Loading…", saving: "Saving…", save: "Save",
      cancel: "Cancel", close: "Close", back: "Back", next: "Continue",
      retry: "Try again", required: "Required", optional: "Optional",
      yes: "Yes", no: "No"
    },
    cities: {
      "Lefkoşa": "Nicosia (Lefkoşa)", "Gazimağusa": "Famagusta (Gazimağusa)", "Girne": "Kyrenia (Girne)",
      "İskele": "İskele", "Güzelyurt": "Güzelyurt", "Lefke": "Lefke"
    },
    categories: {
      "ac-repair": "Air Conditioning Repairs & Servicing",
      "plumbing-electric": "Plumbing & Electrical Work",
      cleaning: "Home & Office Cleaning",
      moving: "Removals & Transport",
      "locksmith-tow": "Locksmiths & Vehicle Recovery"
    },
    home: {
      eyebrow: "Local services across North Cyprus",
      title: "Get the job done with verified local professionals",
      subtitle: "Choose your district and the service you need. Compare professionals, contact them directly or ask for quotes.",
      searchTitle: "Compare professionals in your area", searchAction: "Show professionals",
      requestTitle: "Describe the job and hear from professionals",
      requestDescription: "Post the details in a few steps. Professionals working in your area can review your request and get in touch.",
      requestAction: "Request a free quote",
      prosTitle: "Professionals in your area", prosDescription: "Sponsored profiles appear first.",
      results: "Professionals: {count}", emptyTitle: "No professionals match your search",
      emptyText: "Try different filters or post a request for the job.",
      clearFilters: "Clear filters",
      demo: "Sample view. These are demonstration profiles. Messaging and request submission are not available yet.",
      loadError: "We couldn't load the professionals. Please try again."
    },
    pro: {
      sponsored: "Sponsored", verified: "Verified professional", unverified: "Identity verification pending",
      whatsapp: "Message on WhatsApp", reviews: "Reviews: {count}", noReviews: "No reviews yet",
      rating: "{rating} out of 5", profileUnavailable: "Contact details haven't been added yet",
      whatsappMessage: "Hello {proName}, I found your listing on HALLET ({hostname}). Could you let me know your availability and pricing for {category}?"
    },
    how: {
      title: "How HALLET works", directoryTitle: "Compare professionals",
      directoryText: "Browse profiles, verification details and reviews by district and service.",
      contactTitle: "Get in touch directly", contactText: "Tell your chosen professional about the job on WhatsApp.",
      requestTitle: "Ask for quotes", requestText: "Post a request so suitable professionals in your area can contact you."
    },
    wizard: {
      title: "Request a quote", step: "Step {current} of {total}",
      detailStep: "Job details", timeStep: "Timing", locationStep: "District and area",
      contactStep: "Contact details", detailLabel: "Describe the job",
      detailPlaceholder: "For example: The living room air conditioner isn't cooling. Both the indoor and outdoor units are accessible.",
      urgencyLabel: "When do you need it done?", acil: "Urgent", bu_hafta: "This week", esnek: "Flexible",
      neighborhoodPlaceholder: "For example: Gönyeli, Sakarya, Alsancak, Long Beach",
      contactNote: "Your phone number will be shared with professionals who are interested in your request and obtain access.",
      consent: "I agree to share my contact details with relevant professionals for this request.",
      submit: "Submit request", successTitle: "Your request has been received",
      successText: "Relevant professionals in your area can now see your request. They can contact you on the phone number you provided."
    },
    auth: {
      loginTitle: "Sign in to HALLET", registerTitle: "Create a HALLET account",
      customer: "I need a service", pro: "I provide services",
      google: "Continue with Google", separator: "or",
      create: "Create account", haveAccount: "Already have an account?", noAccount: "Don't have an account?",
      forgotPassword: "Forgot password?", resetSent: "If an account uses this email, a password reset link has been sent.",
      passwordHint: "Use at least 8 characters.", proCategories: "Services you provide",
      bio: "Tell customers about your work", bioPlaceholder: "Your service area, experience and the work you do",
      welcomeCredit: "New professional accounts receive 3 starting credits.",
      needLogin: "Sign in to use the dashboard.",
      profileIncomplete: "Complete your profile and choose your district and services."
    },
    dashboard: {
      title: "HALLET — Professional & Admin Dashboard", welcome: "Hello, {name}",
      credits: "Credit balance", creditUnit: "Credits: {count}", clicks: "WhatsApp clicks",
      openRequests: "Open job requests", profile: "My profile", requestsTab: "Matching requests",
      unlockedTab: "Unlocked requests", adminTab: "Admin", emptyRequests: "There are no requests in this list yet.",
      loadError: "We couldn't load your dashboard. Please try again.",
      unlock: "Use 1 credit to view the number", alreadyUnlocked: "You have access to this number",
      noCredits: "You don't have enough credits. Contact HALLET to top up.",
      closed: "Request closed", details: "Job details", customer: "Customer",
      contact: "Contact", createdAt: "Date posted", profileSaved: "Your profile has been saved.",
      restricted: "You don't have permission to view this area.", managePros: "Professional accounts",
      loadCredits: "Add credits", creditAmount: "Credits to add", featured: "VIP listing",
      featuredUntil: "VIP expiry date", verified: "Identity verified", actions: "Actions",
      adminSaved: "The professional's account has been updated.",
      confirmUnlock: "Viewing the contact details for this request costs 1 credit.",
      closeRequest: "Close request", requestClosed: "The request has been closed."
    },
    errors: {
      config: "This service is not available yet. Please try again later.",
      required: "Please fill in the required fields.", phone: "Enter a North Cyprus number in the format 0533 8XX XX XX or 0548 8XX XX XX.",
      email: "Enter a valid email address.", password: "Your password must contain at least 8 characters.",
      details: "Describe the job in 20 to 2000 characters.", city: "Choose a district from the list.",
      category: "Choose a service from the list.", categories: "Select at least one service category.",
      consent: "Please agree to share your contact details to continue.",
      emailInUse: "An account already uses this email. You can sign in instead.",
      invalidCredentials: "The email or password is incorrect.", popupClosed: "Google sign-in wasn't completed.",
      popupBlocked: "Your browser blocked the sign-in window. Allow pop-ups and try again.",
      unauthorizedDomain: "Google sign-in hasn't been enabled for this domain yet.",
      tooManyRequests: "Too many attempts. Please wait a while and try again.",
      network: "Couldn't connect. Check your internet connection.",
      permission: "You don't have permission to do this.", unavailable: "The service is temporarily unavailable. Please try again.",
      notFound: "The record couldn't be found.", unknown: "The action couldn't be completed. Please try again.",
      creditAmount: "Enter a whole number between 1 and 1000.", featuredUntil: "Choose a future expiry date for the VIP listing."
    },
    footer: {
      text: "Local services and tradespeople across North Cyprus.", copyright: "© {year} HALLET. All rights reserved."
    }
  },
  ru: {
    brand: {
      title: "HALLET | Мастера и бытовые услуги на Северном Кипре",
      description: "Мастера на Северном Кипре: кондиционеры, сантехника, уборка, переезды и вскрытие замков. Сравните специалистов, напишите в WhatsApp или запросите стоимость работ."
    },
    nav: {
      home: "Главная", pros: "Найти мастера", how: "Как это работает",
      dashboard: "Кабинет мастера", login: "Войти", registerPro: "Стать мастером",
      logout: "Выйти", language: "Выбрать язык", menu: "Открыть или закрыть меню"
    },
    common: {
      allCities: "Все районы", allCategories: "Все услуги",
      city: "Район", neighborhood: "Квартал / Населённый пункт", category: "Услуга",
      fullName: "Имя и фамилия", phone: "Телефон", email: "Электронная почта", password: "Пароль",
      loading: "Загрузка…", saving: "Сохранение…", save: "Сохранить",
      cancel: "Отмена", close: "Закрыть", back: "Назад", next: "Далее",
      retry: "Повторить", required: "Обязательно", optional: "Необязательно",
      yes: "Да", no: "Нет"
    },
    cities: {
      "Lefkoşa": "Никосия (Lefkoşa)", "Gazimağusa": "Фамагуста (Gazimağusa)", "Girne": "Кирения (Girne)",
      "İskele": "Искеле (İskele)", "Güzelyurt": "Гюзельюрт (Güzelyurt)", "Lefke": "Лефке (Lefke)"
    },
    categories: {
      "ac-repair": "Ремонт и обслуживание кондиционеров",
      "plumbing-electric": "Сантехника и электрика",
      cleaning: "Уборка квартир и офисов",
      moving: "Переезды и перевозка вещей",
      "locksmith-tow": "Вскрытие замков и эвакуация авто"
    },
    home: {
      eyebrow: "Мастера и услуги на Северном Кипре",
      title: "Доверьте работу проверенным местным мастерам",
      subtitle: "Выберите район и услугу. Сравните мастеров, свяжитесь напрямую или оставьте заявку на расчёт стоимости.",
      searchTitle: "Сравните мастеров в вашем районе", searchAction: "Показать мастеров",
      requestTitle: "Опишите задачу — мастера свяжутся с вами",
      requestDescription: "Оставьте заявку в несколько шагов. Мастера, работающие в вашем районе, смогут прочитать её и связаться с вами.",
      requestAction: "Бесплатно узнать стоимость",
      prosTitle: "Мастера в вашем районе", prosDescription: "Рекламные профили показаны первыми.",
      results: "Найдено мастеров: {count}", emptyTitle: "По вашему запросу мастера не найдены",
      emptyText: "Попробуйте изменить фильтры или оставьте заявку на работу.",
      clearFilters: "Сбросить фильтры",
      demo: "Демонстрационный режим. Профили приведены для примера. Связь с мастерами и отправка заявок пока недоступны.",
      loadError: "Не удалось загрузить список мастеров. Попробуйте ещё раз."
    },
    pro: {
      sponsored: "Реклама", verified: "Проверенный мастер", unverified: "Личность пока не подтверждена",
      whatsapp: "Написать в WhatsApp", reviews: "Отзывов: {count}", noReviews: "Пока нет отзывов",
      rating: "{rating} из 5", profileUnavailable: "Контактные данные пока не добавлены",
      whatsappMessage: "Здравствуйте, {proName}! Нашёл ваше объявление на HALLET ({hostname}). Подскажите, пожалуйста, когда вы свободны и сколько стоит услуга «{category}»?"
    },
    how: {
      title: "Как работает HALLET", directoryTitle: "Сравните мастеров",
      directoryText: "Выберите район и услугу, посмотрите профили, отметки о проверке и отзывы.",
      contactTitle: "Свяжитесь напрямую", contactText: "Напишите выбранному мастеру в WhatsApp и расскажите о задаче.",
      requestTitle: "Узнайте стоимость", requestText: "Оставьте заявку, и подходящие мастера из вашего района смогут с вами связаться."
    },
    wizard: {
      title: "Заявка на расчёт стоимости", step: "Шаг {current} из {total}",
      detailStep: "Описание задачи", timeStep: "Сроки", locationStep: "Район и адрес",
      contactStep: "Контактные данные", detailLabel: "Опишите, что нужно сделать",
      detailPlaceholder: "Например: Кондиционер в гостиной не охлаждает. К внутреннему и наружному блокам есть доступ.",
      urgencyLabel: "Когда нужно выполнить работу?", acil: "Срочно", bu_hafta: "На этой неделе", esnek: "По договорённости",
      neighborhoodPlaceholder: "Например: Gönyeli, Sakarya, Alsancak, Long Beach",
      contactNote: "Ваш номер получат мастера, которые заинтересуются заявкой и откроют доступ к контактам.",
      consent: "Я согласен на передачу моих контактных данных мастерам для работы по этой заявке.",
      submit: "Отправить заявку", successTitle: "Заявка принята",
      successText: "Мастера вашего района, оказывающие нужную услугу, смогут увидеть заявку и связаться с вами по указанному телефону."
    },
    auth: {
      loginTitle: "Войти в HALLET", registerTitle: "Создать аккаунт HALLET",
      customer: "Мне нужна услуга", pro: "Я оказываю услуги",
      google: "Продолжить с Google", separator: "или",
      create: "Создать аккаунт", haveAccount: "Уже есть аккаунт?", noAccount: "Нет аккаунта?",
      forgotPassword: "Забыли пароль?", resetSent: "Если аккаунт с такой почтой существует, на неё отправлена ссылка для сброса пароля.",
      passwordHint: "Используйте не менее 8 символов.", proCategories: "Ваши услуги",
      bio: "Расскажите о себе и своей работе", bioPlaceholder: "Где вы работаете, ваш опыт и какие услуги предлагаете",
      welcomeCredit: "Новый аккаунт мастера получает 3 стартовых кредита.",
      needLogin: "Войдите, чтобы открыть кабинет.",
      profileIncomplete: "Заполните профиль, выберите район работы и услуги."
    },
    dashboard: {
      title: "HALLET — Кабинет мастера и администратора", welcome: "Здравствуйте, {name}",
      credits: "Баланс кредитов", creditUnit: "Кредитов: {count}", clicks: "Переходы в WhatsApp",
      openRequests: "Открытые заявки", profile: "Мой профиль", requestsTab: "Подходящие заявки",
      unlockedTab: "Открытые мной контакты", adminTab: "Управление", emptyRequests: "В этом списке пока нет заявок.",
      loadError: "Не удалось загрузить кабинет. Попробуйте ещё раз.",
      unlock: "Открыть номер за 1 кредит", alreadyUnlocked: "У вас есть доступ к номеру",
      noCredits: "Недостаточно кредитов. Для пополнения свяжитесь с администрацией HALLET.",
      closed: "Заявка закрыта", details: "Описание задачи", customer: "Заказчик",
      contact: "Контакты", createdAt: "Дата заявки", profileSaved: "Профиль сохранён.",
      restricted: "У вас нет доступа к этому разделу.", managePros: "Аккаунты мастеров",
      loadCredits: "Начислить кредиты", creditAmount: "Количество кредитов", featured: "VIP-размещение",
      featuredUntil: "Дата окончания VIP", verified: "Личность подтверждена", actions: "Действия",
      adminSaved: "Аккаунт мастера обновлён.",
      confirmUnlock: "За доступ к контактам по этой заявке будет списан 1 кредит.",
      closeRequest: "Закрыть заявку", requestClosed: "Заявка закрыта."
    },
    errors: {
      config: "Сервис пока не запущен. Попробуйте позже.",
      required: "Заполните обязательные поля.", phone: "Введите номер Северного Кипра в формате 0533 8XX XX XX или 0548 8XX XX XX.",
      email: "Укажите действительный адрес электронной почты.", password: "Пароль должен содержать не менее 8 символов.",
      details: "Опишите задачу: от 20 до 2000 символов.", city: "Выберите район из списка.",
      category: "Выберите услугу из списка.", categories: "Выберите хотя бы одну категорию услуг.",
      consent: "Для продолжения подтвердите согласие на передачу контактных данных.",
      emailInUse: "Аккаунт с такой почтой уже существует. Вы можете войти.",
      invalidCredentials: "Неверная почта или пароль.", popupClosed: "Вход через Google не завершён.",
      popupBlocked: "Браузер заблокировал окно входа. Разрешите всплывающие окна и попробуйте ещё раз.",
      unauthorizedDomain: "Вход через Google для этого домена ещё не настроен.",
      tooManyRequests: "Слишком много попыток. Подождите и попробуйте ещё раз.",
      network: "Не удалось подключиться. Проверьте интернет-соединение.",
      permission: "У вас нет прав на это действие.", unavailable: "Сервис временно недоступен. Попробуйте ещё раз.",
      notFound: "Запись не найдена.", unknown: "Не удалось выполнить действие. Попробуйте ещё раз.",
      creditAmount: "Введите целое число от 1 до 1000.", featuredUntil: "Выберите будущую дату окончания VIP-размещения."
    },
    footer: {
      text: "Мастера и услуги по всему Северному Кипру.", copyright: "© {year} HALLET. Все права защищены."
    }
  }
};

const additionalTranslations = {
  "tr": {
    "a11y": {
      "skip": "İçeriğe geç",
      "navigation": "Ana menü",
      "footer": "Alt menü"
    },
    "privacy": {
      "title": "Veri kullanımı",
      "body": "HALLET, hesap bilgileriniz ve oluşturduğunuz iş taleplerini Firebase üzerinde saklar. Usta profiline eklediğiniz ad, telefon, ilçe ve tanıtım bilgileri rehberde yayımlanır.",
      "contact": "Talep telefonları herkese açık değildir. İlgili talep için kredi kullanan ustalar ve yönetim iletişim bilgilerine erişebilir. İş açıklamasına telefon veya açık adres yazmayın.",
      "storage": "Dil tercihiniz bu tarayıcıda saklanır. Google ile girişte Google, WhatsApp görüşmelerinde WhatsApp kendi koşullarını uygular. Veri talepleri için giriş yaptıktan sonra talep numaranızla HALLET yönetimine başvurun."
    },
    "home": {
      "requestEyebrow": "ÜCRETSİZ TALEP",
      "coverage": "Altı ilçede, günlük işleriniz için.",
      "directoryEyebrow": "HALLET USTA REHBERİ",
      "proJoinTitle": "KKTC'de hizmet mi veriyorsunuz?",
      "clickNotCounted": "Görüşme bağlantısı açıldı; tıklama istatistiği kaydedilemedi."
    },
    "auth": {
      "accountActions": "Hesap işlemleri",
      "accountType": "Hesap türü"
    },
    "dashboard": {
      "heading": "İşleriniz ve hesabınız",
      "publicProfile": "Usta profilindeki ad, telefon, ilçe, hizmetler ve tanıtım metni herkese açık rehberde görünür.",
      "reviewModeration": "Yorum onayı",
      "approve": "Onayla",
      "unapprove": "Onayı kaldır",
      "reviewSaved": "Yorum onayı güncellendi.",
      "customerAccount": "Bu hesap hizmet almak için açılmış. Profilinizi buradan düzenleyebilirsiniz. Usta hesabı için yönetimle görüşün.",
      "ref": "Talep no: {id}"
    },
    "reviews": {
      "title": "Usta yorumları",
      "write": "Yorum bırak",
      "rating": "Puan",
      "comment": "Yorumunuz",
      "submit": "Yorumu gönder",
      "pending": "Yorumunuz alındı. Yönetim onayından sonra yayımlanır.",
      "empty": "Henüz onaylı yorum yok.",
      "login": "Yorum bırakmak için giriş yapın.",
      "invalid": "20 ile 1000 karakter arasında bir yorum ve 1–5 arası puan girin."
    }
  },
  "en": {
    "a11y": {
      "skip": "Skip to content",
      "navigation": "Main navigation",
      "footer": "Footer navigation"
    },
    "privacy": {
      "title": "Data use",
      "body": "HALLET stores account details and job requests in Firebase. The name, phone number, district and description you add to a professional profile are published in the directory.",
      "contact": "Request phone numbers are private. Professionals who spend a credit on the request and administrators can access the contact details. Please keep phone numbers and full addresses out of the job description.",
      "storage": "Your language choice is saved in this browser. Google sign-in and WhatsApp conversations are subject to those services’ own terms. For data requests, sign in and contact HALLET administration with your request reference."
    },
    "home": {
      "requestEyebrow": "FREE REQUEST",
      "coverage": "Everyday services across all six districts.",
      "directoryEyebrow": "HALLET DIRECTORY",
      "proJoinTitle": "Do you provide services in North Cyprus?",
      "clickNotCounted": "The contact link was opened, but the click could not be recorded."
    },
    "auth": {
      "accountActions": "Account actions",
      "accountType": "Account type"
    },
    "dashboard": {
      "heading": "Your jobs and account",
      "publicProfile": "Your professional name, phone number, district, services and description appear in the public directory.",
      "reviewModeration": "Review moderation",
      "approve": "Approve",
      "unapprove": "Remove approval",
      "reviewSaved": "Review approval updated.",
      "customerAccount": "This account was created to request services. You can edit your profile here. Contact administration to discuss a professional account.",
      "ref": "Request reference: {id}"
    },
    "reviews": {
      "title": "Customer reviews",
      "write": "Leave a review",
      "rating": "Rating",
      "comment": "Your review",
      "submit": "Submit review",
      "pending": "Your review has been received. It will appear after moderation.",
      "empty": "No approved reviews yet.",
      "login": "Sign in to leave a review.",
      "invalid": "Enter a review of 20–1000 characters and a rating from 1 to 5."
    }
  },
  "ru": {
    "a11y": {
      "skip": "Перейти к содержимому",
      "navigation": "Главное меню",
      "footer": "Меню внизу страницы"
    },
    "privacy": {
      "title": "Использование данных",
      "body": "HALLET хранит данные аккаунтов и заявки в Firebase. Имя, телефон, район и описание, добавленные в профиль мастера, публикуются в каталоге.",
      "contact": "Телефоны в заявках скрыты. Контакты доступны администрации и мастерам, потратившим кредит на эту заявку. Не указывайте телефон и точный адрес в описании работы.",
      "storage": "Выбранный язык сохраняется в этом браузере. Для входа через Google и переписки в WhatsApp действуют условия соответствующих сервисов. По вопросам данных войдите в аккаунт и обратитесь к администрации HALLET, указав номер заявки."
    },
    "home": {
      "requestEyebrow": "БЕСПЛАТНАЯ ЗАЯВКА",
      "coverage": "Бытовые услуги во всех шести районах.",
      "directoryEyebrow": "КАТАЛОГ HALLET",
      "proJoinTitle": "Вы оказываете услуги на Северном Кипре?",
      "clickNotCounted": "Ссылка для связи открыта, но переход не удалось учесть."
    },
    "auth": {
      "accountActions": "Действия с аккаунтом",
      "accountType": "Тип аккаунта"
    },
    "dashboard": {
      "heading": "Ваши заказы и аккаунт",
      "publicProfile": "Имя, телефон, район, услуги и описание профиля мастера видны в открытом каталоге.",
      "reviewModeration": "Модерация отзывов",
      "approve": "Одобрить",
      "unapprove": "Снять одобрение",
      "reviewSaved": "Статус отзыва обновлён.",
      "customerAccount": "Этот аккаунт создан для заказа услуг. Здесь можно изменить профиль. По вопросам аккаунта мастера обратитесь к администрации.",
      "ref": "Номер заявки: {id}"
    },
    "reviews": {
      "title": "Отзывы о мастере",
      "write": "Оставить отзыв",
      "rating": "Оценка",
      "comment": "Ваш отзыв",
      "submit": "Отправить отзыв",
      "pending": "Отзыв получен и появится после проверки.",
      "empty": "Одобренных отзывов пока нет.",
      "login": "Войдите, чтобы оставить отзыв.",
      "invalid": "Напишите отзыв длиной от 20 до 1000 символов и выберите оценку от 1 до 5."
    }
  }
};
for (const language of SUPPORTED_LANGUAGES) {
  for (const [section, values] of Object.entries(additionalTranslations[language])) {
    dictionary[language][section] = { ...dictionary[language][section], ...values };
  }
}

const locales = { tr: "tr-TR", en: "en-GB", ru: "ru-RU" };
const storageKey = "hallet.language";
const boundRoots = new WeakSet();
let currentLanguage = "tr";

try {
  const path = window.location?.pathname;
  if (path === "/" || path === "/index.html") currentLanguage = "tr";
  else if (path === "/en" || path === "/en.html") currentLanguage = "en";
  else if (path === "/ru" || path === "/ru.html") currentLanguage = "ru";
  else {
    const stored = window.localStorage.getItem(storageKey);
    if (SUPPORTED_LANGUAGES.includes(stored)) currentLanguage = stored;
  }
} catch {
  currentLanguage = "tr";
}

export function getLanguage() {
  return currentLanguage;
}

function findTranslation(language, key) {
  return String(key).split(".").reduce((value, part) => {
    if (!value || !Object.hasOwn(value, part)) return undefined;
    return value[part];
  }, dictionary[language]);
}

export function t(key, variables = {}) {
  const value = findTranslation(currentLanguage, key) ?? findTranslation("tr", key);
  if (typeof value !== "string") return String(key);
  return value.replace(/\{(\w+)\}/g, (match, name) => (
    Object.hasOwn(variables, name) ? String(variables[name]) : match
  ));
}

function matchingElements(root, selector) {
  const elements = Array.from(root.querySelectorAll(selector));
  if (root instanceof Element && root.matches(selector)) elements.unshift(root);
  return elements;
}

export function translatePage(root = document) {
  const variables = { year: new Date().getFullYear() };
  const attributes = [
    ["data-i18n", null],
    ["data-i18n-placeholder", "placeholder"],
    ["data-i18n-title", "title"],
    ["data-i18n-aria-label", "aria-label"],
    ["data-i18n-content", "content"]
  ];

  for (const [source, target] of attributes) {
    for (const element of matchingElements(root, `[${source}]`)) {
      const text = t(element.getAttribute(source), variables);
      if (target) element.setAttribute(target, text);
      else element.textContent = text;
    }
  }

  document.documentElement.lang = currentLanguage;
  document.documentElement.dir = "ltr";
  syncSeo(currentLanguage, dictionary[currentLanguage]);
  for (const button of matchingElements(root, "[data-language]")) {
    const selected = button.dataset.language.toLowerCase() === currentLanguage;
    button.setAttribute("aria-pressed", String(selected));
    button.classList.toggle("is-active", selected);
  }
  for (const select of matchingElements(root, "[data-language-select]")) {
    select.value = currentLanguage;
  }
}

export function setLanguage(language) {
  const nextLanguage = String(language).toLowerCase();
  if (!SUPPORTED_LANGUAGES.includes(nextLanguage)) return false;
  const changed = nextLanguage !== currentLanguage;
  currentLanguage = nextLanguage;
  try {
    window.localStorage.setItem(storageKey, currentLanguage);
  } catch {}
  translatePage();
  if (changed) {
    document.dispatchEvent(new CustomEvent("hallet:languagechange", {
      detail: { language: currentLanguage }
    }));
  }
  return true;
}

export function initI18n(root = document) {
  if (!boundRoots.has(root)) {
    root.addEventListener("click", event => {
      if (!(event.target instanceof Element)) return;
      const button = event.target.closest("[data-language]");
      if (button && !event.ctrlKey && !event.metaKey && !event.shiftKey && !event.altKey) {
        event.preventDefault();
        setLanguage(button.dataset.language);
      }
    });
    root.addEventListener("change", event => {
      if (event.target instanceof HTMLSelectElement && event.target.matches("[data-language-select]")) {
        setLanguage(event.target.value);
      }
    });
    boundRoots.add(root);
  }
  translatePage(root);
}

export function formatNumber(value, options = {}) {
  const number = Number(value);
  return Number.isFinite(number)
    ? new Intl.NumberFormat(locales[currentLanguage], options).format(number)
    : "—";
}

export function formatDate(value, options = {}) {
  if (value === null || value === undefined || value === "") return "—";
  const date = typeof value.toDate === "function" ? value.toDate() : new Date(value);
  if (!Number.isFinite(date.getTime())) return "—";
  return new Intl.DateTimeFormat(locales[currentLanguage], {
    day: "numeric", month: "short", year: "numeric", ...options
  }).format(date);
}
