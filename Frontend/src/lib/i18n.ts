// Internationalization (i18n) configuration
// Supports multiple languages with fallback to English

export type Language = "en" | "hi" | "ta" | "te" | "kn" | "ml";

export const languages: { code: Language; name: string; nativeName: string }[] =
  [
    { code: "en", name: "English", nativeName: "English" },
    { code: "hi", name: "Hindi", nativeName: "हिंदी" },
    { code: "ta", name: "Tamil", nativeName: "தமிழ்" },
    { code: "te", name: "Telugu", nativeName: "తెలుగు" },
    { code: "kn", name: "Kannada", nativeName: "ಕನ್ನಡ" },
    { code: "ml", name: "Malayalam", nativeName: "മലയാളം" },
  ];

// Translation dictionaries
const translations: Record<Language, Record<string, string>> = {
  en: {
    // Common
    "common.home": "Home",
    "common.products": "Products",
    "common.about": "About",
    "common.contact": "Contact",
    "common.login": "Login",
    "common.register": "Register",
    "common.logout": "Logout",
    "common.profile": "Profile",
    "common.cart": "Cart",
    "common.orders": "Orders",
    "common.search": "Search",
    "common.searchPlaceholder": "Search products...",
    "common.loading": "Loading...",
    "common.error": "Error",
    "common.success": "Success",
    "common.save": "Save",
    "common.cancel": "Cancel",
    "common.delete": "Delete",
    "common.edit": "Edit",
    "common.add": "Add",
    "common.viewAll": "View All",
    "common.learnMore": "Learn More",
    "common.buyNow": "Buy Now",
    "common.addToCart": "Add to Cart",
    "common.checkout": "Checkout",
    "common.total": "Total",
    "common.subtotal": "Subtotal",
    "common.shipping": "Shipping",
    "common.tax": "Tax",
    "common.inr": "₹",

    // Navigation
    "nav.home": "Home",
    "nav.products": "Products",
    "nav.about": "About Us",
    "nav.contact": "Contact",
    "nav.faq": "FAQ",
    "nav.trackOrder": "Track Order",

    // Auth
    "auth.loginTitle": "Login to Your Account",
    "auth.registerTitle": "Create an Account",
    "auth.email": "Email Address",
    "auth.password": "Password",
    "auth.confirmPassword": "Confirm Password",
    "auth.forgotPassword": "Forgot Password?",
    "auth.noAccount": "Don't have an account?",
    "auth.hasAccount": "Already have an account?",
    "auth.loginButton": "Login",
    "auth.registerButton": "Register",
    "auth.orContinueWith": "Or continue with",
    "auth.loginSuccess": "Login successful!",
    "auth.registerSuccess": "Registration successful!",
    "auth.invalidCredentials": "Invalid email or password",
    "auth.emailRequired": "Email is required",
    "auth.passwordRequired": "Password is required",

    // Products
    "products.title": "Our Products",
    "products.allProducts": "All Products",
    "products.categories": "Categories",
    "products.filterBy": "Filter By",
    "products.sortBy": "Sort By",
    "products.priceRange": "Price Range",
    "products.inStock": "In Stock",
    "products.outOfStock": "Out of Stock",
    "products.addToCart": "Add to Cart",
    "products.description": "Description",
    "products.reviews": "Reviews",
    "products.relatedProducts": "Related Products",
    "products.noProducts": "No products found",

    // Cart
    "cart.title": "Shopping Cart",
    "cart.empty": "Your cart is empty",
    "cart.continueShopping": "Continue Shopping",
    "cart.removeItem": "Remove Item",
    "cart.quantity": "Quantity",
    "cart.subtotal": "Subtotal",
    "cart.shipping": "Shipping",
    "cart.total": "Total",
    "cart.checkout": "Proceed to Checkout",
    "cart.applyCoupon": "Apply Coupon",

    // Checkout
    "checkout.title": "Checkout",
    "checkout.shippingAddress": "Shipping Address",
    "checkout.paymentMethod": "Payment Method",
    "checkout.orderSummary": "Order Summary",
    "checkout.placeOrder": "Place Order",
    "checkout.cod": "Cash on Delivery",
    "checkout.online": "Online Payment",

    // Orders
    "orders.title": "My Orders",
    "orders.orderNumber": "Order Number",
    "orders.date": "Date",
    "orders.status": "Status",
    "orders.total": "Total",
    "orders.actions": "Actions",
    "orders.viewDetails": "View Details",
    "orders.trackOrder": "Track Order",
    "orders.cancelOrder": "Cancel Order",

    // Footer
    "footer.about": "About Orgobloom",
    "footer.aboutText":
      "Premium organic fertilizers for healthy plants and sustainable farming.",
    "footer.quickLinks": "Quick Links",
    "footer.customerService": "Customer Service",
    "footer.contactUs": "Contact Us",
    "footer.privacyPolicy": "Privacy Policy",
    "footer.termsOfService": "Terms of Service",
    "footer.shippingPolicy": "Shipping Policy",
    "footer.returnPolicy": "Return Policy",
    "footer.newsletter": "Newsletter",
    "footer.newsletterText":
      "Subscribe to get updates on new products and offers.",
    "footer.subscribe": "Subscribe",
    "footer.emailPlaceholder": "Enter your email",
    "footer.copyright": "© 2024 Orgobloom. All rights reserved.",

    // Contact
    "contact.title": "Contact Us",
    "contact.name": "Your Name",
    "contact.email": "Your Email",
    "contact.subject": "Subject",
    "contact.message": "Message",
    "contact.send": "Send Message",
    "contact.success": "Message sent successfully!",
  },

  hi: {
    // Common
    "common.home": "होम",
    "common.products": "उत्पाद",
    "common.about": "हमारे बारे में",
    "common.contact": "संपर्क",
    "common.login": "लॉग इन",
    "common.register": "पंजीकरण",
    "common.logout": "लॉग आउट",
    "common.profile": "प्रोफाइल",
    "common.cart": "कार्ट",
    "common.orders": "ऑर्डर",
    "common.search": "खोजें",
    "common.searchPlaceholder": "उत्पाद खोजें...",
    "common.loading": "लोड हो रहा है...",
    "common.error": "त्रुटि",
    "common.success": "सफल",
    "common.save": "सहेजें",
    "common.cancel": "रद्द करें",
    "common.delete": "हटाएं",
    "common.edit": "संपादित करें",
    "common.add": "जोड़ें",
    "common.viewAll": "सभी देखें",
    "common.learnMore": "और जानें",
    "common.buyNow": "अभी खरीदें",
    "common.addToCart": "कार्ट में जोड़ें",
    "common.checkout": "चेकआउट",
    "common.total": "कुल",
    "common.subtotal": "उप-योग",
    "common.shipping": "शिपिंग",
    "common.tax": "कर",
    "common.inr": "₹",

    // Navigation
    "nav.home": "होम",
    "nav.products": "उत्पाद",
    "nav.about": "हमारे बारे में",
    "nav.contact": "संपर्क",
    "nav.faq": "अक्सर पूछे जाने वाले प्रश्न",
    "nav.trackOrder": "ऑर्डर ट्रैक करें",

    // Auth
    "auth.loginTitle": "अपने खाते में लॉग इन करें",
    "auth.registerTitle": "खाता बनाएं",
    "auth.email": "ईमेल पता",
    "auth.password": "पासवर्ड",
    "auth.confirmPassword": "पासवर्ड की पुष्टि करें",
    "auth.forgotPassword": "पासवर्ड भूल गए?",
    "auth.noAccount": "खाता नहीं है?",
    "auth.hasAccount": "पहले से खाता है?",
    "auth.loginButton": "लॉग इन",
    "auth.registerButton": "पंजीकरण",
    "auth.orContinueWith": "या इससे जारी रखें",
    "auth.loginSuccess": "लॉग इन सफल!",
    "auth.registerSuccess": "पंजीकरण सफल!",
    "auth.invalidCredentials": "अमान्य ईमेल या पासवर्ड",
    "auth.emailRequired": "ईमेल आवश्यक है",
    "auth.passwordRequired": "पासवर्ड आवश्यक है",

    // Products
    "products.title": "हमारे उत्पाद",
    "products.allProducts": "सभी उत्पाद",
    "products.categories": "श्रेणियाँ",
    "products.filterBy": "फ़िल्टर",
    "products.sortBy": "क्रमबद्ध",
    "products.priceRange": "मूल्य सीमा",
    "products.inStock": "स्टॉक में",
    "products.outOfStock": "स्टॉक में नहीं",
    "products.addToCart": "कार्ट में जोड़ें",
    "products.description": "विवरण",
    "products.reviews": "समीक्षाएं",
    "products.relatedProducts": "संबंधित उत्पाद",
    "products.noProducts": "कोई उत्पाद नहीं मिला",

    // Cart
    "cart.title": "शॉपिंग कार्ट",
    "cart.empty": "आपका कार्ट खाली है",
    "cart.continueShopping": "खरीदारी जारी रखें",
    "cart.removeItem": "आइटम हटाएं",
    "cart.quantity": "मात्रा",
    "cart.subtotal": "उप-योग",
    "cart.shipping": "शिपिंग",
    "cart.total": "कुल",
    "cart.checkout": "चेकआउट करें",
    "cart.applyCoupon": "कूपन लागू करें",

    // Checkout
    "checkout.title": "चेकआउट",
    "checkout.shippingAddress": "शिपिंग पता",
    "checkout.paymentMethod": "भुगतान विधि",
    "checkout.orderSummary": "ऑर्डर सारांश",
    "checkout.placeOrder": "ऑर्डर दें",
    "checkout.cod": "कैश ऑन डिलीवरी",
    "checkout.online": "ऑनलाइन भुगतान",

    // Orders
    "orders.title": "मेरे ऑर्डर",
    "orders.orderNumber": "ऑर्डर नंबर",
    "orders.date": "तारीख",
    "orders.status": "स्थिति",
    "orders.total": "कुल",
    "orders.actions": "कार्रवाई",
    "orders.viewDetails": "विवरण देखें",
    "orders.trackOrder": "ऑर्डर ट्रैक करें",
    "orders.cancelOrder": "ऑर्डर रद्द करें",

    // Footer
    "footer.about": "ऑर्गोब्लूम के बारे में",
    "footer.aboutText":
      "स्वस्थ पौधों और टिकाऊ खेती के लिए प्रीमियम जैविक उर्वरक।",
    "footer.quickLinks": "त्वरित लिंक",
    "footer.customerService": "ग्राहक सेवा",
    "footer.contactUs": "संपर्क करें",
    "footer.privacyPolicy": "गोपनीयता नीति",
    "footer.termsOfService": "सेवा की शर्तें",
    "footer.shippingPolicy": "शिपिंग नीति",
    "footer.returnPolicy": "वापसी नीति",
    "footer.newsletter": "न्यूज़लेटर",
    "footer.newsletterText":
      "नए उत्पादों और ऑफर पर अपडेट पाने के लिए सब्सक्राइब करें।",
    "footer.subscribe": "सब्सक्राइब",
    "footer.emailPlaceholder": "अपना ईमेल दर्ज करें",
    "footer.copyright": "© 2024 ऑर्गोब्लूम। सर्वाधिकार सुरक्षित।",

    // Contact
    "contact.title": "संपर्क करें",
    "contact.name": "आपका नाम",
    "contact.email": "आपका ईमेल",
    "contact.subject": "विषय",
    "contact.message": "संदेश",
    "contact.send": "संदेश भेजें",
    "contact.success": "संदेश सफलतापूर्वक भेजा गया!",
  },

  // Tamil, Telugu, Kannada, Malayalam - Using English as fallback for now
  ta: {},
  te: {},
  kn: {},
  ml: {},
};

// Get translation
export function t(key: string, language: Language = "en"): string {
  const langTranslations = translations[language] || translations.en;
  return langTranslations[key] || translations.en[key] || key;
}

// Get current language from localStorage or browser
export function getCurrentLanguage(): Language {
  if (typeof window === "undefined") return "en";

  const saved = localStorage.getItem("language") as Language | null;
  if (saved && translations[saved]) return saved;

  // Detect browser language
  const browserLang = navigator.language.split("-")[0] as Language;
  if (translations[browserLang]) return browserLang;

  return "en";
}

// Set language
export function setLanguage(language: Language): void {
  if (typeof window !== "undefined") {
    localStorage.setItem("language", language);
    document.documentElement.lang = language;
  }
}

// Format currency
export function formatCurrency(
  amount: number,
  language: Language = "en",
): string {
  const formatters: Record<Language, Intl.NumberFormat> = {
    en: new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" }),
    hi: new Intl.NumberFormat("hi-IN", { style: "currency", currency: "INR" }),
    ta: new Intl.NumberFormat("ta-IN", { style: "currency", currency: "INR" }),
    te: new Intl.NumberFormat("te-IN", { style: "currency", currency: "INR" }),
    kn: new Intl.NumberFormat("kn-IN", { style: "currency", currency: "INR" }),
    ml: new Intl.NumberFormat("ml-IN", { style: "currency", currency: "INR" }),
  };

  return formatters[language].format(amount);
}

// Format date
export function formatDate(
  date: Date | string,
  language: Language = "en",
): string {
  const d = typeof date === "string" ? new Date(date) : date;
  const locales: Record<Language, string> = {
    en: "en-IN",
    hi: "hi-IN",
    ta: "ta-IN",
    te: "te-IN",
    kn: "kn-IN",
    ml: "ml-IN",
  };

  return d.toLocaleDateString(locales[language], {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export default {
  t,
  languages,
  getCurrentLanguage,
  setLanguage,
  formatCurrency,
  formatDate,
};
