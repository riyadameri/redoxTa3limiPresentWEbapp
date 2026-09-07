import React, { useState } from 'react';
import { 
  Check, 
  Sparkles, 
  CreditCard, 
  Users, 
  ArrowLeft, 
  ShieldCheck, 
  CheckCircle2,
  Gift,
  Tag
} from 'lucide-react';
import { PLANS } from '../data/plans';
import { BillingCycle, Plan } from '../types';

interface PricingSectionProps {
  onSelectPlan: (plan: Plan, cycle: BillingCycle) => void;
}

export const PricingSection: React.FC<PricingSectionProps> = ({ onSelectPlan }) => {
  // Monthly is the default primary view as requested by user
  const [billingCycle, setBillingCycle] = useState<BillingCycle>('monthly');

  return (
    <section id="pricing" className="py-20 lg:py-28 relative">
      {/* Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[500px] bg-gradient-to-r from-orange-950/10 via-indigo-900/15 to-transparent blur-3xl pointer-events-none -z-10" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-950/60 border border-indigo-800/60 text-indigo-300 text-xs font-semibold">
            <CreditCard className="w-3.5 h-3.5 text-orange-400" />
            <span>باقات اشتراك واضحة ومناسبة لمختلف طاقات الاستيعاب</span>
          </div>

          <h2 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight">
            اختر الباقة المناسبة{' '}
            <span className="bg-gradient-to-r from-orange-400 via-amber-300 to-indigo-400 bg-clip-text text-transparent">
              لطاقة مدرستك الاستيعابية
            </span>
          </h2>

          <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
            لا قيود على الميزات! جميع الباقات تتمتع بكامل خصائص النظام الـ 10 (RFID، المحاسبة، الحضور، الحصص، وبوابة الطالب). السعر يتحدد فقط حسب عدد الطلاب المسجلين.
          </p>

          {/* Billing Cycle Switcher: Monthly as Primary Default, Yearly as Discount */}
          <div className="pt-4 flex flex-col items-center justify-center gap-2">
            <div className="p-1.5 rounded-2xl bg-slate-900 border border-slate-800 flex items-center gap-2 shadow-xl">
              
              {/* Monthly Button - Primary Default */}
              <button
                type="button"
                onClick={() => setBillingCycle('monthly')}
                className={`relative px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer flex items-center gap-2 ${
                  billingCycle === 'monthly'
                    ? 'bg-gradient-to-r from-orange-500 to-indigo-600 text-white shadow-lg'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <span>الدفع الشهري</span>
                <span className="px-1.5 py-0.5 rounded text-[10px] bg-slate-950/60 border border-white/20 text-slate-200">
                  الأساسي
                </span>
              </button>

              {/* Yearly Button - Discount Option */}
              <button
                type="button"
                onClick={() => setBillingCycle('yearly')}
                className={`relative px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer flex items-center gap-2 ${
                  billingCycle === 'yearly'
                    ? 'bg-gradient-to-r from-emerald-600 to-cyan-600 text-white shadow-lg'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <span>الدفع السنوي</span>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-400 text-slate-950">
                  <Gift className="w-2.5 h-2.5" />
                  تخفيض (وفر حتى شهرين)
                </span>
              </button>

            </div>

            <span className="text-[11px] text-slate-400">
              {billingCycle === 'monthly' 
                ? 'الدفع الشهري مرن وبدون التزام طويل المدى، مع إمكانية الترقية للدفع السنوي للاستفادة من التخفيض'
                : 'الدفع السنوي يمنحك تخفيضاً كبيراً يعادل توفير شهرين مجاناً لكل باقة'
              }
            </span>
          </div>

          {/* All features guarantee banner */}
          <div className="pt-1">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-950/40 border border-emerald-800/40 text-emerald-300 text-xs font-semibold">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>ملاحظة هامة: جميع الباقات الـ 6 تشمل كافة ميزات النظام الـ 10 دون أي استثناء أو رسوم إضافية.</span>
            </div>
          </div>
        </div>

        {/* 6 Plans Grid */}
        <div className="mt-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {PLANS.map((plan) => {
            const isPopular = plan.popular;
            const priceLabel = billingCycle === 'yearly' ? plan.yearlyCentimes : plan.monthlyCentimes;
            const priceDzd = billingCycle === 'yearly' ? plan.yearlyDzd : plan.monthlyDzd;
            const cycleWord = billingCycle === 'yearly' ? 'عام' : 'شهر';

            return (
              <div
                key={plan.id}
                className={`relative rounded-2xl border p-6 flex flex-col justify-between transition-all duration-300 hover:scale-101 ${
                  isPopular
                    ? 'bg-gradient-to-b from-orange-950/30 via-slate-900 to-slate-950 border-orange-500/80 shadow-2xl shadow-orange-950/40 ring-1 ring-orange-500/30'
                    : 'bg-slate-900/70 border-slate-800/90 hover:border-slate-700'
                }`}
              >
                {/* Popular or Tag Badge */}
                {plan.tag && (
                  <div className="absolute -top-3.5 right-6">
                    <span className={`px-3 py-1 rounded-full text-xs font-extrabold shadow-md flex items-center gap-1 ${
                      isPopular 
                        ? 'bg-gradient-to-r from-orange-400 to-amber-500 text-slate-950'
                        : 'bg-slate-800 text-orange-300 border border-slate-700'
                    }`}>
                      <Sparkles className="w-3 h-3" />
                      {plan.tag}
                    </span>
                  </div>
                )}

                <div>
                  {/* Plan Name & Capacity */}
                  <div className="flex items-center justify-between pb-3 border-b border-slate-800/80">
                    <div>
                      <h3 className="text-xl font-black text-white">{plan.name}</h3>
                      <p className="text-xs text-slate-400 mt-0.5">{plan.description}</p>
                    </div>
                  </div>

                  {/* Student Limit Highlight */}
                  <div className="mt-4 p-3 rounded-xl bg-slate-950/80 border border-slate-800/90 flex items-center justify-between">
                    <span className="text-xs text-slate-400">الطاقة الاستيعابية:</span>
                    <div className="flex items-center gap-1.5 text-orange-300 font-extrabold text-sm">
                      <Users className="w-4 h-4" />
                      <span>{plan.studentLimitLabel}</span>
                    </div>
                  </div>

                  {/* Price Block */}
                  <div className="mt-5 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-slate-400 block">
                        سعر الاشتراك ({cycleWord}):
                      </span>
                      {billingCycle === 'yearly' && (
                        <span className="text-[11px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                          وفر شهرين كاملين
                        </span>
                      )}
                    </div>
                    
                    {/* Centimes (Traditional Algerian Market Term) */}
                    <div className="text-2xl sm:text-3xl font-black text-white font-mono tracking-tight text-right">
                      {billingCycle === 'yearly' ? (
                        <span className="text-emerald-400">{plan.yearlyCentimes.split('/')[0].trim()}</span>
                      ) : (
                        <span className="text-orange-300">{plan.monthlyCentimes.split('/')[0].trim()}</span>
                      )}
                      <span className="text-xs font-normal text-slate-400 mr-1">/ {cycleWord}</span>
                    </div>

                    {/* DZD Equivalent */}
                    <div className="flex items-center gap-2 pt-0.5">
                      <span className="text-xs text-slate-200 font-mono font-bold">
                        {priceDzd.toLocaleString()} دج
                      </span>
                      <span className="text-[11px] text-slate-400 font-medium">بالدينار الجزائري</span>
                    </div>

                    {/* Discount comparison note when in monthly view */}
                    {billingCycle === 'monthly' && (
                      <div className="mt-2 pt-2 border-t border-slate-800/50 flex items-center justify-between text-[11px] text-slate-400">
                        <span className="flex items-center gap-1 text-emerald-400 font-semibold">
                          <Tag className="w-3 h-3" />
                          أو بالدفع السنوي (تخفيض):
                        </span>
                        <span className="font-mono text-slate-200 font-bold">
                          {plan.yearlyCentimes.split('/')[0].trim()}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Features Included Checklist */}
                  <div className="mt-6 pt-5 border-t border-slate-800/80 space-y-2.5 text-xs text-slate-300">
                    <div className="flex items-center gap-2 font-bold text-white text-[13px] pb-1">
                      <CheckCircle2 className="w-4 h-4 text-orange-400" />
                      <span>تشمل كل خصائص النظام بدون استثناء:</span>
                    </div>

                    <div className="flex items-center gap-2 text-slate-300">
                      <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      <span>دعم بطاقات RFID وقارئات الحضور الذكية</span>
                    </div>

                    <div className="flex items-center gap-2 text-slate-300">
                      <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      <span>أتمتة عمولات الأساتذة ومستحقات الحصص</span>
                    </div>

                    <div className="flex items-center gap-2 text-slate-300">
                      <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      <span>نظام المحاسبة، الفواتير وسندات القبض</span>
                    </div>

                    <div className="flex items-center gap-2 text-slate-300">
                      <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      <span>بوابة الطالب وولي الأمر للمتابعة</span>
                    </div>

                    <div className="flex items-center gap-2 text-slate-300">
                      <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      <span>توليد مفتاح المدرسة (schoolKey) فوري</span>
                    </div>

                    <div className="flex items-center gap-2 text-slate-300">
                      <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      <span>دعم فني وتحديثات سحابية مستمرة مجاناً</span>
                    </div>
                  </div>
                </div>

                {/* Plan Action CTA */}
                <div className="mt-7">
                  <button
                    onClick={() => onSelectPlan(plan, billingCycle)}
                    className={`w-full py-3 px-4 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                      isPopular
                        ? 'bg-gradient-to-r from-orange-500 via-indigo-600 to-cyan-500 text-white shadow-lg shadow-orange-600/25 hover:opacity-95'
                        : 'bg-slate-800 hover:bg-slate-700 text-white border border-slate-700'
                    }`}
                  >
                    <span>طلب هذه الباقة وتفعيل الحساب</span>
                    <ArrowLeft className="w-4 h-4" />
                  </button>
                </div>

              </div>
            );
          })}
        </div>

        {/* Payment Methods Guarantee Bar */}
        <div className="mt-12 p-6 rounded-2xl bg-slate-900/60 border border-slate-800 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-orange-500/15 border border-orange-500/30 text-orange-400 flex items-center justify-center shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-white">طرق دفع محلية مرنة ومعتمدة في الجزائر</h4>
              <p className="text-xs text-slate-400">بريدي موب (BaridiMob)، حساب بريدي جاري (CCP)، تحويل بنكي، أو الدفع نقداً بالوكالة.</p>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs font-semibold text-slate-300">
            <span className="px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800">BaridiMob ⚡</span>
            <span className="px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800">CCP بريد الجزائر ✉</span>
            <span className="px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800">Virement Bancaire 🏛</span>
          </div>
        </div>

      </div>
    </section>
  );
};
