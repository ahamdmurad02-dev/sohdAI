import { useState, useEffect } from 'react';
import { X, Smartphone, Monitor, ChevronRight, CheckCircle2, Download, HelpCircle, Globe, FileDown } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface InstallAppModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function InstallAppModal({ isOpen, onClose }: InstallAppModalProps) {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isSupported, setIsSupported] = useState(false);
  const [platform, setPlatform] = useState<'android' | 'ios' | 'desktop'>('android');
  const [copiedLink, setCopiedLink] = useState(false);
  const [lang, setLang] = useState<'ar' | 'en'>('ar');

  useEffect(() => {
    // Detect system platform
    const ua = navigator.userAgent.toLowerCase();
    if (/android/.test(ua)) {
      setPlatform('android');
    } else if (/iphone|ipad|ipod/.test(ua)) {
      setPlatform('ios');
    } else {
      setPlatform('desktop');
    }

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setIsSupported(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // Check if app is already running in standalone mode (installed)
    if (window.matchMedia('(display-mode: standalone)').matches || (navigator as any).standalone) {
      setIsSupported(false);
    } else {
      // Browsers usually support PWA, trigger flag on compatible browsers
      setIsSupported(true);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) {
      alert(lang === 'ar' 
        ? 'يرجى اتباع الخطوات الموضحة أدناه لتثبيت التطبيق يدوياً عبر متصفحك.' 
        : 'Please refer to the steps below to manual install via your browser list.'
      );
      return;
    }
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setIsSupported(false);
      setDeferredPrompt(null);
    }
  };

  const copyAppUrl = () => {
    const url = window.location.origin === "null" || window.location.origin === "null" ? "https://sohdai.com" : window.location.href;
    navigator.clipboard.writeText(url)
      .then(() => {
        setCopiedLink(true);
        setTimeout(() => setCopiedLink(false), 2000);
      })
      .catch((err) => console.error('Could not copy text: ', err));
  };

  const content = {
    ar: {
      title: "تثبيت تطبيق sohdAI.com",
      subtitle: "قم بتشغيل التطبيق كبرنامج هاتف سريع وسهل العمل بدون إنترنت لنظام Android / iOS",
      androidTab: "أندرويد / بديل APK",
      iosTab: "آيفون وايباد iOS",
      desktopTab: "الكمبيوتر (PC / Mac)",
      directInstallTitle: "التثبيت المباشر متاح!",
      directInstallDesc: "متصفحك يدعم تثبيت تطبيق PWA مباشرة واختصار أيقونة على الشاشة.",
      installBtn: "تثبيت الآن",
      headlineHelp: "توضيح هام حول النطاق (Domain) وملف APK:",
      headlineHelpDesc: "موقع sohdAI.com هو الاسم التجاري للمنصة. لتجنب خطأ DNS (NXDOMAIN)، يرجى استخدام الرابط السحابي الرسمي لـ Google AI Studio الموجود في الأسفل. لا تحتاج إلى ملف APK تقليدي! حيث يتيح لك نظام PWA تثبيت التطبيق وتثبيت أيقونة تشغيل مخصصة على هاتفك فوراً بمميزات أسرع وأمان تفاعلي متواصل.",
      howToAndroid: "التثبيت على أجهزة Android (متصفح Chrome)",
      stepsAndroid: [
        "افتح الرابط السحابي للتطبيق في متصفح Chrome على هاتفك المحمول.",
        "اضغط على زر القائمة (النقاط الثلاث الرأسية ⋮) في أعلى يمين المتصفح.",
        "اختر 'تثبيت التطبيق' (Install app) أو 'إضافة إلى الشاشة الرئيسية'.",
        "قم بتأكيد التثبيت لتظهر أيقونة التطبيق الفاخرة على شاشتك فوراً!"
      ],
      howToIos: "التثبيت على أجهزة iOS / Apple (متصفح Safari)",
      stepsIos: [
        "تأكد من استخدام متصفح Safari الرسمي للاستفادة الكاملة.",
        "اضغط على زر 'مشاركة' (Share - المربع الذي يخرج منه سهم للأعلى) في أسفل الشاشة.",
        "قم بالتمرير للأسفل واضغط على 'إضافة إلى الصفحة الرئيسية' (Add to Home Screen).",
        "اضغط على 'إضافة' (Add) في الأعلى لإكمال التثبيت والبدء بالعمل في وضع ملء الشاشة."
      ],
      howToDesktop: "التثبيت على أجهزة الكمبيوتر (Chrome / Edge)",
      stepsDesktop: [
        "انظر إلى شريط العنوان (عنوان URL) لمتصفح Chrome أو Edge على الكمبيوتر.",
        "انقر على أيقونة التثبيت (شاشة كمبيوتر وبداخلها سهم لأسفل أو علامة زائد).",
        "اختر 'تثبيت' لإنشاء واجهة مستقلة بدون حواف لسطح المكتب!"
      ],
      cantInstallTitle: "هل تواجه مشكلة في التثبيت المباشر من نافذة المعاينة؟",
      cantInstallDesc: "نظرًا لوجود التطبيق حاليًا داخل إطار (iframe) معزول وآمن في Google AI Studio، فإن المتصفح يحظر التثبيت المباشر في بعض الأحيان. يرجى نسخ الرابط السحابي المباشر وتشغيله في Chrome أو Safari يدويًا:",
      copyLabel: "نسخ الرابط المباشر",
      copied: "تم النسخ!",
      apkExportTitle: "هل تريد الكود البرمجي بالكامل لتوليد ملف APK يدويًا؟",
      apkExportDesc: "يمكنك تحميل كافة ملفات المشروع كملف مضغوط ZIP بنقرة واحدة من أيقونة الإعدادات (Settings -> Export ZIP) في أعلى يمين محرّر Google AI Studio، ثم تحويله إلى تطبيق APK حقيقي باستخدام Capacitor أو Cordova بكل سهولة.",
      closeBtn: "إغلاق"
    },
    en: {
      title: "Install sohdAI.com Mobile App",
      subtitle: "Run as a fast, offline-ready native Android / iOS application",
      androidTab: "Android / APK Alternative",
      iosTab: "iOS (iPhone / iPad)",
      desktopTab: "Desktop (PC / Mac)",
      directInstallTitle: "Direct Installation Available!",
      directInstallDesc: "Your browser fully supports native PWA app shortcut installation.",
      installBtn: "Install Now",
      headlineHelp: "Important Note about Domain & APK:",
      headlineHelpDesc: "sohdAI.com is the app title and product brand. To avoid DNS errors (NXDOMAIN), use our secure Cloud Run live link below. A traditional APK is not strictly required! Progressive Web App (PWA) standard installs sohdAI as a high-performance native icon directly run on your phone.",
      howToAndroid: "Installation on Android Devices (Chrome)",
      stepsAndroid: [
        "Open the active Cloud Run URL in your mobile Chrome browser.",
        "Tap the menu icon (three vertical dots ⋮) on the top right corner.",
        "Select 'Install app' or 'Add to Home screen' from the list.",
        "Confirm the installation. The custom theme icon will be added to your home screen!"
      ],
      howToIos: "Installation on iOS / Apple Devices (Safari)",
      stepsIos: [
        "Ensure you are using the native Safari Browser.",
        "Tap the Share button (square with an arrow pointing up icon) at the bottom toolbar.",
        "Scroll down and tap 'Add to Home Screen'.",
        "Tap 'Add' in the top right to complete. Open it from your home screen for full-screen view!"
      ],
      howToDesktop: "Installation on Desktop PCs & Laptops (Chrome/Edge)",
      stepsDesktop: [
        "Look at the URL address bar on your Chrome or Edge browser.",
        "Click on the Install shortcut (an icon with a laptop/monitor and a download arrow or plus sign).",
        "Select 'Install' to create a desktop window workspace."
      ],
      cantInstallTitle: "Can't install directly from this Preview window?",
      cantInstallDesc: "If you are currently inside the Google AI Studio container iframe, native PWA install buttons are secure-blocked. Get the standalone URL to open in Chrome/Safari:",
      copyLabel: "Copy Link",
      copied: "Copied!",
      apkExportTitle: "Want to compile a physical APK yourself?",
      apkExportDesc: "You can download the complete source code as a ZIP from the top-right Settings menu (Export ZIP) in Google AI Studio, and easily build a solid APK using Capacitor or Cordova in just a few commands.",
      closeBtn: "Close"
    }
  };

  const t = content[lang];

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 15 }}
            className={`bg-[#111] border border-[#222] rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl flex flex-col max-h-[90vh] ${lang === 'ar' ? 'text-right' : 'text-left'}`}
            dir={lang === 'ar' ? 'rtl' : 'ltr'}
          >
            {/* Header */}
            <div className="p-6 border-b border-[#222] flex justify-between items-center bg-[#141414]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-orange-500/10 flex items-center justify-center text-orange-500 flex-shrink-0">
                  <Smartphone size={22} />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">{t.title}</h3>
                  <p className="text-xs text-zinc-400">{t.subtitle}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setLang(lang === 'ar' ? 'en' : 'ar')}
                  className="flex items-center gap-1 px-2.5 py-1 text-xs font-semibold bg-zinc-800 text-zinc-300 hover:text-white rounded-lg transition-colors border border-zinc-700 cursor-pointer"
                >
                  <Globe size={12} />
                  {lang === 'ar' ? 'English' : 'العربية'}
                </button>
                <button 
                  onClick={onClose}
                  className="p-1.5 hover:bg-[#222] rounded-lg text-zinc-400 hover:text-white transition-colors cursor-pointer"
                  id="btn-close-install-modal"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-[#222] bg-[#141414] px-4 text-xs">
              <button
                onClick={() => setPlatform('android')}
                className={`flex-1 py-3 text-center font-semibold border-b-2 transition-all cursor-pointer ${
                  platform === 'android'
                    ? 'border-orange-500 text-white font-bold'
                    : 'border-transparent text-zinc-400 hover:text-zinc-200'
                }`}
              >
                {t.androidTab}
              </button>
              <button
                onClick={() => setPlatform('ios')}
                className={`flex-1 py-3 text-center font-semibold border-b-2 transition-all cursor-pointer ${
                  platform === 'ios'
                    ? 'border-orange-500 text-white font-bold'
                    : 'border-transparent text-zinc-400 hover:text-zinc-200'
                }`}
              >
                {t.iosTab}
              </button>
              <button
                onClick={() => setPlatform('desktop')}
                className={`flex-1 py-3 text-center font-semibold border-b-2 transition-all cursor-pointer ${
                  platform === 'desktop'
                    ? 'border-orange-500 text-white font-bold'
                    : 'border-transparent text-zinc-400 hover:text-zinc-200'
                }`}
              >
                {t.desktopTab}
              </button>
            </div>

            {/* Body */}
            <div className="p-6 space-y-6 overflow-y-auto flex-1 text-sm text-zinc-300">
              
              {isSupported && (
                <div className="p-4 rounded-xl bg-gradient-to-r from-orange-500/20 to-amber-500/10 border border-orange-500/30 flex items-center justify-between gap-4">
                  <div className="space-y-1">
                    <p className="font-bold text-white flex items-center gap-1.5 text-xs sm:text-sm">
                      <CheckCircle2 size={16} className="text-orange-500 select-none" /> {t.directInstallTitle}
                    </p>
                    <p className="text-xs text-orange-200/80">{t.directInstallDesc}</p>
                  </div>
                  <button
                    onClick={handleInstallClick}
                    className="bg-orange-500 hover:bg-orange-600 font-bold text-white text-xs px-3 py-2 rounded-lg flex items-center gap-1 transition-all shadow-lg active:scale-95 shrink-0 cursor-pointer"
                  >
                    <Download size={14} /> {t.installBtn}
                  </button>
                </div>
              )}

              {/* Informative Header Description */}
              <div className="bg-[#161616] border border-[#222] p-4 rounded-xl flex gap-3 text-xs leading-relaxed text-zinc-400 text-start" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
                <HelpCircle size={24} className="text-orange-500 flex-shrink-0 mt-0.5" />
                <p>
                  <strong className="text-zinc-200">{t.headlineHelp}</strong> {t.headlineHelpDesc}
                </p>
              </div>

              {/* Steps per platform */}
              {platform === 'android' && (
                <div className="space-y-4 text-start" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
                  <h4 className="text-sm font-bold text-white flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-[#ff7600]/10 text-[#ff7600] flex items-center justify-center text-xs font-mono">1</span>
                    {t.howToAndroid}
                  </h4>
                  <ol className={`space-y-3 text-xs border-zinc-800 ${lang === 'ar' ? 'pr-4 border-r-2' : 'pl-4 border-l-2'}`}>
                    {t.stepsAndroid.map((step, idx) => (
                      <li key={idx} className="relative">
                        <div className={`absolute top-1.5 w-2 h-2 rounded-full bg-[#ff7600] ${lang === 'ar' ? '-right-[21px]' : '-left-[21px]'}`} />
                        {step}
                      </li>
                    ))}
                  </ol>
                </div>
              )}

              {platform === 'ios' && (
                <div className="space-y-4 text-start" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
                  <h4 className="text-sm font-bold text-white flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-[#ff7600]/10 text-[#ff7600] flex items-center justify-center text-xs font-mono">1</span>
                    {t.howToIos}
                  </h4>
                  <ol className={`space-y-3 text-xs border-zinc-800 ${lang === 'ar' ? 'pr-4 border-r-2' : 'pl-4 border-l-2'}`}>
                    {t.stepsIos.map((step, idx) => (
                      <li key={idx} className="relative">
                        <div className={`absolute top-1.5 w-2 h-2 rounded-full bg-[#ff7600] ${lang === 'ar' ? '-right-[21px]' : '-left-[21px]'}`} />
                        {step}
                      </li>
                    ))}
                  </ol>
                </div>
              )}

              {platform === 'desktop' && (
                <div className="space-y-4 text-start" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
                  <h4 className="text-sm font-bold text-white flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-[#ff7600]/10 text-[#ff7600] flex items-center justify-center text-xs font-mono">1</span>
                    {t.howToDesktop}
                  </h4>
                  <ol className={`space-y-3 text-xs border-zinc-800 ${lang === 'ar' ? 'pr-4 border-r-2' : 'pl-4 border-l-2'}`}>
                    {t.stepsDesktop.map((step, idx) => (
                      <li key={idx} className="relative">
                        <div className={`absolute top-1.5 w-2 h-2 rounded-full bg-[#ff7600] ${lang === 'ar' ? '-right-[21px]' : '-left-[21px]'}`} />
                        {step}
                      </li>
                    ))}
                  </ol>
                </div>
              )}

              {/* Share link option */}
              <div className="bg-[#181818] p-4 rounded-xl border border-[#222] space-y-3 text-start" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
                <p className="text-xs font-bold text-white">{t.cantInstallTitle}</p>
                <p className="text-zinc-400 text-xs leading-relaxed">
                  {t.cantInstallDesc}
                </p>
                <div className="flex gap-2">
                  <input 
                    type="text" 
                    readOnly
                    value={window.location.origin === "null" || window.location.origin === "null" ? "https://sohdai.com" : window.location.href}
                    className="flex-1 bg-[#111] border border-[#333] px-3 py-2 text-xs text-zinc-400 rounded-lg select-all text-left"
                    dir="ltr"
                  />
                  <button
                    onClick={copyAppUrl}
                    className="bg-zinc-800 hover:bg-[#ff7600] hover:text-white text-zinc-300 font-semibold px-4 py-2 rounded-lg text-xs transition-all whitespace-nowrap active:scale-95 cursor-pointer"
                  >
                    {copiedLink ? t.copied : t.copyLabel}
                  </button>
                </div>
              </div>

              {/* Explaining source code zip for APK */}
              <div className="bg-[#181818] p-4 rounded-xl border border-orange-500/10 space-y-2 text-start" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
                <p className="text-xs font-bold text-orange-500 flex items-center gap-1.5">
                  <FileDown size={14} />
                  {t.apkExportTitle}
                </p>
                <p className="text-zinc-400 text-xs leading-relaxed">
                  {t.apkExportDesc}
                </p>
              </div>

            </div>

            {/* Footer */}
            <div className="p-4 border-t border-[#222] bg-[#141414] flex justify-end gap-3 text-xs">
              <button
                onClick={onClose}
                className="bg-[#222] text-[#fff] px-4 py-2 rounded-lg hover:bg-[#333] transition-all font-semibold cursor-pointer"
                id="btn-close-install-footer"
              >
                {t.closeBtn}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
