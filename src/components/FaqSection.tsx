import React, { useState } from 'react';
import { HelpCircle, ChevronDown, Sparkles } from 'lucide-react';

interface FaqItem {
  q: string;
  a: string;
}

const FAQS: FaqItem[] = [
  {
    q: 'كيف يتم ربط وتوصيل قارئات البطاقات الذكية RFID بالنظام؟',
    a: 'يتميز Redox Ta3limi بدعم التوصيل المباشر (Plug & Play)؛ بمجرد ربط أي قارئ RFID عادي عبر منفذ USB بالحاسوب أو عبر الشبكة المحلية، يتعرف عليه النظام فوراً دون الحاجة لتثبيت أي برامج وسيطة معقدة. كما يدعم جميع الترددات الشائعة (125KHz و 13.56MHz Mifare).'
  },
  {
    q: 'هل تشمل الباقات الأقل سعراً كافة الميزات ونظام المحاسبة؟',
    a: 'نعم كلياً! حرصنا في Redox على ألا نخفي أي ميزة عن أي مدرسة؛ جميع الباقات الـ 6 تشمل كافة ميزات النظام الـ 10 (بما في ذلك دعم RFID، المحاسبة المتقدمة، عمولات الأساتذة، وبوابة الطالب). المعيار الوحيد للاختلاف هو الطاقة الاستيعابية لعدد الطلاب.'
  },
  {
    q: 'ما هو مفتاح المدرسة (schoolKey) وما أهميته؟',
    a: 'هو رمز مشفر وفريد يولد آلياً لكل مدرسة فور تسجيلها (مثال: RDX-W16-2026-4821). يعمل هذا المفتاح كبصمة رقمية لربط قاعدة بيانات مدرستكم، تسجيل دخول الإداريين، ومزامنة قارئات الحضور الذكية بأمان تام.'
  },
  {
    q: 'كيف يعمل نظام احتساب عمولات الأساتذة تلقائياً؟',
    a: 'يمكن للإدارة تحديد نمط تعاقد كل أستاذ بسهولة (نسبة مئوية من رسوم الطلاب مثل 60%، أو مبلغ ثابت لكل حصة، أو نظام الجولات الدراسية). وبمجرد تسجيل حضور الطلاب وبدء الحصة، يحتسب النظام حصة الأستاذ وصافي ربح المدرسة تلقائياً دون أي خطأ بشري.'
  },
  {
    q: 'ما هي طرق الدفع المعتمدة للاشتراك في الجزائر؟',
    a: 'نوفر جميع وسائل الدفع المعتمدة محلياً لتسهيل العملية: تطبيق بريدي موب (BaridiMob) للدفع الفوري، حساب بريدي جاري (CCP)، التحويل البنكي الرسمي مع توفير فواتير قانونية للمؤسسات، أو الدفع نقداً بالوكالة.'
  },
  {
    q: 'هل يتطلب النظام أجهزة كمبيوتر بمواصفات عالية؟',
    a: 'إطلاقاً. نظراً لأن Redox Ta3limi مبني بأحدث تقنيات Angular السريعة وNode.js السحابي خفيف الظل، فهو يعمل بسلاسة فائقة على أي حاسوب مكتبي أو محمول عادي، وحتى على الأجهزة اللوحية والهواتف الذكية عبر المتصفح.'
  }
];

export const FaqSection: React.FC = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const toggleFaq = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <section id="faq" className="py-20 bg-slate-900/40 border-t border-slate-800 relative">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-950/60 border border-cyan-800/60 text-cyan-400 text-xs font-semibold">
            <HelpCircle className="w-3.5 h-3.5" />
            <span>إجابات واضحة وشفافة</span>
          </div>

          <h2 className="text-2xl sm:text-4xl font-extrabold text-white">
            الأسئلة الشائعة حول نظام{' '}
            <span className="bg-gradient-to-r from-cyan-400 to-indigo-400 bg-clip-text text-transparent">
              Redox Ta3limi
            </span>
          </h2>

          <p className="text-xs sm:text-sm text-slate-400">
            كل ما يهم مدراء المدارس ومراكز دروس الدعم معرفته قبل بدء الاشتراك.
          </p>
        </div>

        {/* FAQs Accordion */}
        <div className="mt-10 space-y-3">
          {FAQS.map((faq, index) => {
            const isOpen = openIndex === index;

            return (
              <div
                key={index}
                className={`rounded-2xl border transition-all overflow-hidden ${
                  isOpen 
                    ? 'bg-slate-900/90 border-cyan-500/50 shadow-lg shadow-cyan-500/5' 
                    : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                }`}
              >
                <button
                  onClick={() => toggleFaq(index)}
                  className="w-full text-right p-4 sm:p-5 flex items-center justify-between gap-4 cursor-pointer"
                >
                  <span className="font-bold text-sm sm:text-base text-white">
                    {faq.q}
                  </span>
                  <div className={`p-1.5 rounded-lg bg-slate-800 text-slate-300 transition-transform duration-200 shrink-0 ${
                    isOpen ? 'rotate-180 bg-cyan-500/20 text-cyan-300' : ''
                  }`}>
                    <ChevronDown className="w-4 h-4" />
                  </div>
                </button>

                {isOpen && (
                  <div className="px-5 pb-5 pt-1 text-xs sm:text-sm text-slate-300 leading-relaxed border-t border-slate-800/60">
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
};
