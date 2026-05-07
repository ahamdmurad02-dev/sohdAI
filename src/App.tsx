/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { Menu, X, Sparkles, Check, CreditCard } from 'lucide-react';
import { Sidebar } from './components/Sidebar';
import { Chatbot } from './components/Chatbot';
import { ImageStudio } from './components/ImageStudio';
import { GameStudio } from './components/GameStudio';
import { AnimationStudio } from './components/AnimationStudio';
import { Animation3DStudio } from './components/Animation3DStudio';
import { WebAppStudio } from './components/WebAppStudio';
import { AudioStudio } from './components/AudioStudio';
import { VideoStudio } from './components/VideoStudio';
import { auth } from './firebase';
import { onAuthStateChanged, User } from 'firebase/auth';

export type Tool = 'chat' | 'image' | 'game' | 'animation' | 'animation3d' | 'webapp' | 'audio' | 'video';

export default function App() {
  const [activeTool, setActiveTool] = useState<Tool>('chat');
  const [user, setUser] = useState<User | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);

  const handleCheckout = async (method: string) => {
    try {
      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan: selectedPlan, method })
      });
      const data = await response.json();
      if (data.success) {
        alert(data.message);
        setShowUpgradeModal(false);
        setSelectedPlan(null);
      }
    } catch (e) {
      alert('حدث خطأ أثناء معالجة الدفع بشكل آمن.');
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  return (
    <div className="flex h-screen w-full bg-[#0a0a0a] text-white overflow-hidden font-sans relative">
      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/60 z-40 md:hidden backdrop-blur-sm"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar - Desktop & Mobile */}
      <div className={`fixed inset-y-0 left-0 z-50 transform transition-transform duration-300 ease-in-out md:relative md:translate-x-0 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <Sidebar activeTool={activeTool} setActiveTool={(tool) => { setActiveTool(tool); setIsSidebarOpen(false); }} user={user} onUpgradeClick={() => setShowUpgradeModal(true)} />
      </div>

      <main className="flex-1 relative overflow-hidden flex flex-col w-full h-full">
        {/* Mobile Header for Hamburger */}
        <div className="md:hidden h-14 border-b border-[#222] bg-[#111] flex items-center px-4 shrink-0 justify-between z-30 relative">
          <div className="flex items-center gap-2">
            <h1 className="text-sm font-bold text-white tracking-tight">sohdAI Studio</h1>
          </div>
          <button 
            onClick={() => setIsSidebarOpen(true)}
            className="p-1.5 text-zinc-400 hover:text-white rounded-md bg-[#1a1a1a] border border-[#333]"
          >
            <Menu size={18} />
          </button>
        </div>

        {activeTool === 'chat' && <Chatbot />}
        {activeTool === 'image' && <ImageStudio />}
        {activeTool === 'game' && <GameStudio />}
        {activeTool === 'animation' && <AnimationStudio />}
        {activeTool === 'animation3d' && <Animation3DStudio />}
        {activeTool === 'webapp' && <WebAppStudio />}
        {activeTool === 'audio' && <AudioStudio />}
        {activeTool === 'video' && <VideoStudio />}
      </main>

      {/* Upgrade Modal */}
      {showUpgradeModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4" dir="rtl">
          <div className="bg-[#111] border border-[#333] rounded-3xl w-full max-w-6xl max-h-[90vh] overflow-y-auto relative shadow-2xl p-6 md:p-10">
            <div className="absolute top-4 left-4 z-20">
              <button 
                onClick={() => {
                  if (selectedPlan) {
                    setSelectedPlan(null);
                  } else {
                    setShowUpgradeModal(false);
                  }
                }} 
                className="text-zinc-400 hover:text-white bg-[#222] hover:bg-[#333] rounded-full p-2 transition-colors">
                <X size={20} />
              </button>
            </div>
            
            {selectedPlan ? (
              <div className="max-w-md mx-auto text-center py-8">
                <h2 className="text-3xl font-bold text-white tracking-tight mb-2">إتمام الدفع</h2>
                <p className="text-zinc-400 mb-8">اختر طريقة الدفع للاشتراك في خطة {selectedPlan}</p>
                
                <div className="space-y-4">
                  <button onClick={() => handleCheckout('Credit Card')} className="w-full flex items-center justify-center gap-3 py-4 border border-[#333] hover:border-orange-500/50 hover:bg-[#222] bg-[#1a1a1a] text-white rounded-xl transition-all shadow-lg">
                    <CreditCard size={24} className="text-zinc-300" />
                    <span className="font-bold text-lg text-zinc-200">الدفع بالبطاقة الائتمانية</span>
                  </button>
                  <button onClick={() => handleCheckout('PayPal')} className="w-full relative overflow-hidden group flex items-center justify-center py-4 border border-[#00457C]/40 hover:border-[#0079C1] hover:bg-[#002f5a] bg-[#001f3f] text-white rounded-xl transition-all shadow-lg text-lg font-bold">
                    <span className="text-[#0079C1] group-hover:text-white transition-colors mr-2 text-2xl font-black italic">Pay</span><span className="text-[#00457C] group-hover:text-[#00a6e0] transition-colors text-2xl font-black italic">Pal</span>
                  </button>
                  <button onClick={() => handleCheckout('Google Pay')} className="w-full flex items-center justify-center gap-2 py-4 border border-zinc-700 hover:border-white hover:bg-zinc-800 bg-zinc-900 text-white rounded-xl transition-all shadow-lg text-lg font-bold">
                    <svg className="w-12 h-6" viewBox="0 0 40 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M14.9312 7.74756C14.9312 7.15175 14.8812 6.6433 14.7812 6.13486H7.63123V9.0526H11.8312C11.7312 9.87896 11.2312 10.9701 10.3312 11.6041V13.4354H12.7562C14.2312 12.0838 14.9312 10.0886 14.9312 7.74756Z" fill="#4285F4"/>
                      <path d="M7.63123 15.1764C9.68123 15.1764 11.4062 14.5028 12.6562 13.4354L10.3312 11.6041C9.65623 12.0734 8.78123 12.3595 7.63123 12.3595C5.48123 12.3595 3.65623 10.9572 3.03123 9.03472H0.506226V10.9234C1.83123 13.5137 4.53123 15.1764 7.63123 15.1764Z" fill="#34A853"/>
                      <path d="M3.03123 9.0347C2.85623 8.56545 2.75623 8.04618 2.75623 7.50284C2.75623 6.9595 2.85623 6.44023 3.03123 5.97098V4.08228H0.506226C-0.018774 5.09706 -0.193774 6.24151 0.106226 7.42629C0.406226 8.61107 1.05623 9.69747 1.95623 10.5907L3.03123 9.0347Z" fill="#FBBC04"/>
                      <path d="M7.63123 2.66598C9.05623 2.66598 10.0562 3.26873 10.6312 3.79374L12.8062 1.63724C11.4312 0.355139 9.68123 -0.228516 7.63123 -0.228516C4.53123 -0.228516 1.83123 1.43419 0.506226 4.02451L3.03123 5.91321C3.65623 3.99071 5.48123 2.66598 7.63123 2.66598Z" fill="#EA4335"/>
                      <path d="M21.0562 6.00843V14.7H18.7312V6.00843H21.0562ZM20.8562 4.14856C20.8562 4.41018 20.7562 4.67181 20.5562 4.87181C20.3562 5.07181 20.0812 5.17181 19.8062 5.17181C19.5312 5.17181 19.2562 5.07181 19.0562 4.87181C18.8562 4.67181 18.7562 4.41018 18.7562 4.14856C18.7562 3.88693 18.8562 3.6253 19.0562 3.42531C19.2562 3.22531 19.5312 3.12531 19.8062 3.12531C20.0812 3.12531 20.3562 3.22531 20.5562 3.42531C20.7562 3.6253 20.8562 3.88693 20.8562 4.14856ZM28.5312 9.07157C28.5312 7.78946 27.5062 6.77114 26.2562 6.77114C24.9312 6.77114 23.9562 7.78946 23.9562 9.07157C23.9562 10.3537 24.9312 11.372 26.2562 11.372C27.5562 11.372 28.5312 10.3537 28.5312 9.07157ZM30.8562 9.07157C30.8562 12.0169 28.7062 13.9016 26.2312 13.9016C23.7562 13.9016 21.6062 12.0169 21.6062 9.07157C21.6062 6.1262 23.7562 4.24151 26.2312 4.24151C28.7062 4.24151 30.8562 6.1262 30.8562 9.07157ZM39.6062 9.42157H33.8812C34.0062 10.5975 35.0312 11.5137 36.3312 11.5137C37.2812 11.5137 38.0062 11.0137 38.5312 10.2285L40.4062 11.372C39.4062 12.872 38.0062 13.9016 36.3312 13.9016C33.7312 13.9016 31.5562 12.0416 31.5562 9.07157C31.5562 6.10156 33.7062 4.24151 36.2312 4.24151C38.7562 4.24151 40.7562 6.1512 40.7562 9.17157V9.42157ZM33.881C8.17156 34.2062 7.02156 35.0312 6.57156 36.2312 6.57156C37.4062 6.57156 38.3812 7.22156 38.5562 8.17156H33.881Z" fill="white"/>
                    </svg>
                    Pay
                  </button>
                </div>
              </div>
            ) : (
              <>
            <div className="text-center mb-10">
              <h2 className="text-3xl font-bold text-white tracking-tight">ترقية خطتك</h2>
              <p className="text-zinc-400 mt-2">اختر الخطة التي تناسب احتياجاتك</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* Free Tier */}
              <div className="bg-[#1a1a1a] border border-[#333] rounded-2xl p-6 flex flex-col relative transition-transform hover:-translate-y-1 hover:border-[#444]">
                <h3 className="text-2xl font-bold text-white mb-2">المجانية</h3>
                <div className="flex items-baseline gap-1 mb-2">
                  <span className="text-zinc-400 font-medium">د.إ</span>
                  <span className="text-4xl font-extrabold text-white">0</span>
                  <span className="text-zinc-400 font-medium">/شهر</span>
                </div>
                <p className="text-zinc-400 text-sm mb-6 min-h-[40px]">تعرف على قدرات الذكاء الاصطناعي</p>
                
                <button className="w-full py-3 rounded-xl bg-[#2a2a2a] text-zinc-400 font-bold mb-6 cursor-default border border-[#333]">
                  خطتك الحالية
                </button>
                
                <ul className="space-y-4 mb-6 flex-1">
                  {[
                    'النموذج الأساسي',
                    'إمكانية محدودة لعدد الرسائل وعمليات التحميل',
                    'إمكانية محدودة لإنشاء الصور',
                    'سعة ذاكرة محدودة'
                  ].map((feature, i) => (
                    <li key={i} className="flex items-start gap-3 text-zinc-300 text-sm">
                      <Check size={16} className="text-zinc-500 shrink-0 mt-0.5" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
                <div className="mt-auto pt-4 text-xs text-zinc-500 text-center border-t border-[#333]">
                  هل لديك خطة اشتراك بالفعل؟ <a href="#" className="underline hover:text-white">تعرف على تعليمات الفواتير</a>
                </div>
              </div>

              {/* Go Tier */}
              <div className="bg-[#1a1a1a] border border-[#333] rounded-2xl p-6 flex flex-col relative transition-transform hover:-translate-y-1 hover:border-[#444]">
                <h3 className="text-2xl font-bold text-white mb-2">Go</h3>
                <div className="flex items-baseline gap-1 mb-2">
                  <span className="text-zinc-400 font-medium">د.إ</span>
                  <span className="text-4xl font-extrabold text-white">30</span>
                  <span className="text-zinc-400 font-medium">/شهر</span>
                </div>
                <p className="text-zinc-400 text-sm mb-6 min-h-[40px]">استمر في الدردشة بإمكانيات وصول موسّعة</p>
                
                <button onClick={() => setSelectedPlan('Go')} className="w-full py-3 rounded-xl bg-[#2a2a2a] hover:bg-[#333] text-white font-bold mb-6 transition-colors border border-[#444]">
                  الترقية إلى Go
                </button>
                
                <ul className="space-y-4 mb-6 flex-1">
                  {[
                    'النموذج الأساسي',
                    'المزيد من الرسائل والتحميلات',
                    'إنشاء المزيد من الصور',
                    'ذاكرة أطول',
                    'وضع صوتي موسّع'
                  ].map((feature, i) => (
                    <li key={i} className="flex items-start gap-3 text-zinc-300 text-sm">
                      <Check size={16} className="text-zinc-500 shrink-0 mt-0.5" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
                <div className="mt-auto pt-4 text-[11px] text-zinc-500 text-center border-t border-[#333]">
                  قد تتضمن هذه الخطة إعلانات · <a href="#" className="underline hover:text-white">تعرف على المزيد</a>
                </div>
              </div>

              {/* Plus Tier (Highlighted) */}
              <div className="bg-gradient-to-b from-[#2a1a1a] to-[#1a1a1a] border-2 border-orange-500/50 rounded-2xl p-6 flex flex-col relative transition-transform hover:-translate-y-1 shadow-[0_0_30px_-5px_rgba(249,115,22,0.15)] z-10 scale-105">
                <div className="absolute -top-3 right-1/2 translate-x-1/2 bg-gradient-to-r from-orange-500 to-red-600 text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg whitespace-nowrap">
                  الأكثر استخدامًا
                </div>
                
                <h3 className="text-2xl font-bold text-white mb-2 flex items-center gap-2 mt-2">
                  Plus <Sparkles size={18} className="text-orange-500" />
                </h3>
                <div className="flex items-baseline gap-1 mb-2">
                  <span className="text-orange-400 font-medium">د.إ</span>
                  <span className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-red-500">80</span>
                  <span className="text-zinc-400 font-medium">/شهر</span>
                </div>
                <p className="text-zinc-300 text-sm mb-6 min-h-[40px]">التمتع بتجربة جميع الميزات</p>
                
                <button onClick={() => setSelectedPlan('Plus')} className="w-full py-3 rounded-xl bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 text-white font-bold mb-6 transition-all shadow-lg shadow-orange-500/20 border border-orange-400/30">
                  الترقية إلى Plus
                </button>
                
                <ul className="space-y-4 mb-6 flex-1">
                  {[
                    'النماذج المتقدمة',
                    'والمزيد من الرسائل والتحميلات',
                    'إنشاء متقدم للصور باستخدام Thinking',
                    'ذاكرة موسّعة عبر الدردشات المختلفة',
                    'وكيل كتابة الأكواد البرمجية Codex',
                    'تم توسيع نطاق البحث المتعمق',
                    'المشروعات ونماذج GPT المخصصة'
                  ].map((feature, i) => (
                    <li key={i} className="flex items-start gap-3 text-zinc-200 text-sm">
                      <Check size={16} className="text-orange-500 shrink-0 mt-0.5" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Pro Tier */}
              <div className="bg-[#1a1a1a] border border-[#333] rounded-2xl p-6 flex flex-col relative transition-transform hover:-translate-y-1 hover:border-[#444]">
                <h3 className="text-2xl font-bold text-white mb-2">Pro</h3>
                <div className="flex items-baseline gap-1 mb-2">
                  <span className="text-zinc-500 font-normal text-sm">من</span>
                  <span className="text-zinc-400 font-medium mr-1">د.إ</span>
                  <span className="text-4xl font-extrabold text-white">385</span>
                  <span className="text-zinc-400 font-medium">/شهر</span>
                </div>
                <p className="text-zinc-400 text-sm mb-6 min-h-[40px]">مستوى الأداء الأعلى لتلبية متطلبات العمل</p>
                
                <button onClick={() => setSelectedPlan('Pro')} className="w-full py-3 rounded-xl bg-[#2a2a2a] hover:bg-[#333] text-white font-bold mb-6 transition-colors border border-[#444]">
                  الترقية إلى Pro
                </button>
                
                <ul className="space-y-4 mb-6 flex-1">
                   <li className="flex items-start gap-3 text-zinc-300 text-sm">
                      <Check size={16} className="text-zinc-500 shrink-0 mt-0.5" />
                      <span>تتضمن كل ميزات Plus</span>
                   </li>
                   <li className="flex items-start gap-3 text-zinc-300 text-sm">
                      <Check size={16} className="text-zinc-500 shrink-0 mt-0.5" />
                      <span>أمان وخصوصية بمستوى المؤسسات</span>
                   </li>
                   <li className="flex items-start gap-3 text-zinc-300 text-sm">
                      <Check size={16} className="text-zinc-500 shrink-0 mt-0.5" />
                      <span>مساحات عمل مخصصة</span>
                   </li>
                </ul>
              </div>

            </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
