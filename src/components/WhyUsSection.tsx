import React from 'react';
import { 
  Check, 
  X, 
  Sparkles, 
  ShieldCheck, 
  Cpu, 
  Laptop, 
  Radio, 
  Award,
  Zap
} from 'lucide-react';
import { COMPARISON_DATA } from '../data/plans';

export const WhyUsSection: React.FC = () => {
  return (
    <section id="why-us" className="py-20 lg:py-28 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-violet-950/60 border border-violet-800/60 text-violet-300 text-xs font-semibold">
            <Award className="w-3.5 h-3.5 text-violet-400" />
            <span>مقارنة الميزات والتكنولوجيا</span>
          </div>

          <h2 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight">
            لماذا نظام{' '}
            <span className="bg-gradient-to-r from-cyan-400 via-indigo-300 to-violet-400 bg-clip-text text-transparent">
              Redox Ta3limi
            </span>{' '}
            هو خيارك الأفضل؟
          </h2>

          <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
            مقارنة تقنية وعملية واضحة تبرز الفارق بين برمجيات Redox الحديثة والأنظمة التقليدية أو القديمة المتوفرة في السوق.
          </p>
        </div>

        {/* Comparison Table for Desktop & Cards for Mobile */}
        <div className="mt-12 overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/60 shadow-2xl backdrop-blur-sm">
          
          {/* Table Header */}
          <div className="grid grid-cols-1 md:grid-cols-12 border-b border-slate-800 bg-slate-950/80 p-4 sm:p-6 text-sm font-bold">
            <div className="md:col-span-4 text-slate-300 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-cyan-400" />
              <span>الميزة والمعيار التقني</span>
            </div>
            
            <div className="hidden md:flex md:col-span-4 items-center justify-between px-3 py-1.5 rounded-lg bg-indigo-950/50 border border-indigo-500/30 text-cyan-300 font-extrabold">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-cyan-400" />
                <span>برنامج Redox Ta3limi (المقترح)</span>
              </div>
              <span className="text-[11px] px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300">الريادة</span>
            </div>

            <div className="hidden md:flex md:col-span-4 items-center text-slate-400 pr-4">
              <span>الأنظمة التقليدية والبرامج الأخرى</span>
            </div>
          </div>

          {/* Table Rows */}
          <div className="divide-y divide-slate-800/80">
            {COMPARISON_DATA.map((row, index) => (
              <div 
                key={index}
                className="grid grid-cols-1 md:grid-cols-12 p-4 sm:p-5 text-xs sm:text-sm hover:bg-slate-800/30 transition-colors gap-3 md:gap-4 items-center"
              >
                {/* Feature Name */}
                <div className="md:col-span-4 font-bold text-white flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 shrink-0" />
                  <span>{row.feature}</span>
                </div>

                {/* Redox Column */}
                <div className="md:col-span-4 p-3 rounded-xl md:rounded-none bg-indigo-950/30 md:bg-transparent border md:border-none border-indigo-500/20">
                  <div className="md:hidden text-[11px] font-bold text-cyan-400 mb-1 flex items-center gap-1">
                    <Check className="w-3.5 h-3.5 text-cyan-400" />
                    <span>برنامج Redox Ta3limi:</span>
                  </div>
                  <div className="flex items-start gap-2.5 text-slate-200">
                    <div className="w-5 h-5 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
                      <Check className="w-3.5 h-3.5" />
                    </div>
                    <span className="font-medium text-slate-200 leading-relaxed">{row.redox}</span>
                  </div>
                </div>

                {/* Others Column */}
                <div className="md:col-span-4 p-3 rounded-xl md:rounded-none bg-slate-950/40 md:bg-transparent border md:border-none border-slate-800">
                  <div className="md:hidden text-[11px] font-bold text-slate-400 mb-1 flex items-center gap-1">
                    <X className="w-3.5 h-3.5 text-rose-400" />
                    <span>الأنظمة التقليدية الأخرى:</span>
                  </div>
                  <div className="flex items-start gap-2.5 text-slate-400">
                    <div className="w-5 h-5 rounded-full bg-rose-500/10 border border-rose-500/30 text-rose-400 flex items-center justify-center shrink-0 mt-0.5">
                      <X className="w-3.5 h-3.5" />
                    </div>
                    <span className="leading-relaxed">{row.others}</span>
                  </div>
                </div>

              </div>
            ))}
          </div>

        </div>

        {/* 4 Pillars Summary Box */}
        <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-4 rounded-xl bg-slate-900/40 border border-slate-800/80 space-y-2">
            <div className="w-9 h-9 rounded-lg bg-cyan-500/10 text-cyan-400 flex items-center justify-center">
              <Cpu className="w-5 h-5" />
            </div>
            <h4 className="text-sm font-bold text-white">تطوير بـ Angular & Node.js</h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              سرعة استجابة فائقة، تحميل فوري للصفحات، وأمان تام ضد الثغرات وهجمات الاختراق.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-900/40 border border-slate-800/80 space-y-2">
            <div className="w-9 h-9 rounded-lg bg-indigo-500/10 text-indigo-400 flex items-center justify-center">
              <Laptop className="w-5 h-5" />
            </div>
            <h4 className="text-sm font-bold text-white">واجهة عربية سهلة وسلسة</h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              مصممة للأشخاص العاديين وموظفي الاستقبال بدون الحاجة لأي خلفية تقنية معقدة.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-900/40 border border-slate-800/80 space-y-2">
            <div className="w-9 h-9 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
              <Radio className="w-5 h-5" />
            </div>
            <h4 className="text-sm font-bold text-white">دعم تقنية RFID فوري</h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              توصيل واستخدام فوري (Plug & Play) مع مختلف أجهزة وبطاقات RFID الذكية.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-900/40 border border-slate-800/80 space-y-2">
            <div className="w-9 h-9 rounded-lg bg-violet-500/10 text-violet-400 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h4 className="text-sm font-bold text-white">نظام شامل ومتكامل</h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              يغنيك عن شراء عدة برامج منفصلة؛ كل ما تحتاجه المدرسة موجود في مكان واحد.
            </p>
          </div>
        </div>

      </div>
    </section>
  );
};
