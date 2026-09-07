import React from 'react';
import { 
  Sparkles, 
  ArrowLeft, 
  PlayCircle, 
  Radio, 
  CheckCircle2, 
  Receipt, 
  ShieldCheck, 
  Laptop, 
  Zap
} from 'lucide-react';
import { RedoxLogo } from './RedoxLogo';

interface HeroSectionProps {
  onOpenSubscribe: () => void;
  onOpenDemo: () => void;
}

export const HeroSection: React.FC<HeroSectionProps> = ({
  onOpenSubscribe,
  onOpenDemo
}) => {
  return (
    <section className="relative pt-12 pb-20 lg:pt-16 lg:pb-24 overflow-hidden">
      {/* Glow background effects */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-tr from-indigo-600/15 via-cyan-500/15 to-transparent rounded-full blur-3xl pointer-events-none -z-10" />
      <div className="absolute top-10 right-10 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl pointer-events-none -z-10" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Main Hero Header */}
        <div className="text-center max-w-4xl mx-auto space-y-6">
          
          {/* Brand Emblem & Top Pill Announcement */}
          <div className="flex flex-col items-center justify-center gap-3">
            <RedoxLogo size="xl" />

            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-indigo-500/30 bg-indigo-950/40 text-indigo-300 text-xs font-semibold shadow-inner">
              <span className="flex h-2 w-2 rounded-full bg-cyan-400 animate-ping" />
              <span className="text-cyan-300 font-bold">المنظومة السحابية الرائدة</span>
              <span className="text-slate-500">|</span>
              <span>نظام Redox Ta3limi لإدارة المدارس والدروس</span>
            </div>
          </div>

          {/* Main Title according to prompt */}
          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight leading-[1.2]">
            حل واحد لكل{' '}
            <span className="bg-gradient-to-r from-amber-400 via-orange-400 to-rose-400 bg-clip-text text-transparent">
              احتياجات مدرستك
            </span>
          </h1>

          {/* Subtitle with the 3 pillars */}
          <div className="flex items-center justify-center gap-4 text-xs sm:text-sm font-semibold text-cyan-300">
            <span className="flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              إدارة ذكية
            </span>
            <span className="text-slate-700">•</span>
            <span className="flex items-center gap-1">
              <Zap className="w-3.5 h-3.5 text-indigo-400" />
              أتمتة كاملة
            </span>
            <span className="text-slate-700">•</span>
            <span className="flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              شفافية مطلقة
            </span>
          </div>

          <p className="text-base sm:text-lg lg:text-xl text-slate-300 font-normal leading-relaxed max-w-3xl mx-auto">
            منظومة سحابية متكاملة مصممة خصيصاً للمدارس الخاصة، مراكز دروس الدعم، ومعاهد اللغات في الجزائر.
            تجمع بين إدارة الطلاب، أتمتة عمولات الأساتذة، المحاسبة الدقيقة، وتأكيد الحضور ببطاقات <span className="text-cyan-300 font-semibold">RFID</span> المتصلة بالأجهزة لحظة بلحظة.
          </p>

          {/* CTAs */}
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4">
            <button
              onClick={onOpenSubscribe}
              className="w-full sm:w-auto px-7 py-3.5 rounded-xl bg-gradient-to-r from-orange-500 via-indigo-600 to-cyan-500 text-white font-bold text-base shadow-xl shadow-indigo-600/30 hover:opacity-95 hover:scale-102 active:scale-98 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>اشترك في النظام الآن</span>
              <ArrowLeft className="w-4 h-4" />
            </button>

            <button
              onClick={onOpenDemo}
              className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-slate-900/90 border border-slate-700 text-slate-200 font-semibold text-base hover:bg-slate-800 hover:text-white hover:border-slate-600 transition-all flex items-center justify-center gap-2.5 cursor-pointer"
            >
              <PlayCircle className="w-5 h-5 text-cyan-400" />
              <span>طلب عرض توضيحي (Demo)</span>
            </button>
          </div>

          {/* Social Proof Badges */}
          <div className="pt-6 grid grid-cols-2 md:grid-cols-4 gap-3 text-right max-w-3xl mx-auto">
            <div className="p-3 rounded-lg bg-slate-900/40 border border-slate-800/80 flex items-center gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <div className="text-xs">
                <span className="font-bold text-slate-200">+150 مدرسة</span>
                <p className="text-slate-400 text-[11px]">في مختلف الولايات</p>
              </div>
            </div>

            <div className="p-3 rounded-lg bg-slate-900/40 border border-slate-800/80 flex items-center gap-2.5">
              <Radio className="w-4 h-4 text-cyan-400 shrink-0" />
              <div className="text-xs">
                <span className="font-bold text-slate-200">دعم RFID فوري</span>
                <p className="text-slate-400 text-[11px]">Plug & Play مباشر</p>
              </div>
            </div>

            <div className="p-3 rounded-lg bg-slate-900/40 border border-slate-800/80 flex items-center gap-2.5">
              <Laptop className="w-4 h-4 text-indigo-400 shrink-0" />
              <div className="text-xs">
                <span className="font-bold text-slate-200">سحابي فائق السرعة</span>
                <p className="text-slate-400 text-[11px]">Node.js & Angular</p>
              </div>
            </div>

            <div className="p-3 rounded-lg bg-slate-900/40 border border-slate-800/80 flex items-center gap-2.5">
              <Receipt className="w-4 h-4 text-amber-400 shrink-0" />
              <div className="text-xs">
                <span className="font-bold text-slate-200">محاسبة أوتوماتيكية</span>
                <p className="text-slate-400 text-[11px]">عمولات الأساتذة والأرباح</p>
              </div>
            </div>
          </div>
        </div>

      </div>
    </section>
  );
};
