import React, { useState } from 'react';
import { 
  Building2, 
  GraduationCap, 
  UserCheck, 
  CalendarDays, 
  Receipt, 
  Radio, 
  ClipboardCheck, 
  MailCheck, 
  Smartphone, 
  BarChart3, 
  CheckCircle2, 
  Sparkles, 
  Layers,
  ArrowRight
} from 'lucide-react';
import { SYSTEM_FEATURES } from '../data/plans';
import { FeatureItem } from '../types';

interface FeaturesSectionProps {
  onSelectFeature?: (feature: FeatureItem) => void;
}

export const FeaturesSection: React.FC<FeaturesSectionProps> = () => {
  const [activeCategory, setActiveCategory] = useState<'all' | 'academic' | 'finance' | 'tech' | 'core'>('all');
  const [selectedFeature, setSelectedFeature] = useState<FeatureItem | null>(null);

  const getFeatureIcon = (iconName: string) => {
    const iconClass = "w-6 h-6";
    switch (iconName) {
      case 'Building2': return <Building2 className={iconClass} />;
      case 'GraduationCap': return <GraduationCap className={iconClass} />;
      case 'UserCheck': return <UserCheck className={iconClass} />;
      case 'CalendarDays': return <CalendarDays className={iconClass} />;
      case 'Receipt': return <Receipt className={iconClass} />;
      case 'Radio': return <Radio className={iconClass} />;
      case 'ClipboardCheck': return <ClipboardCheck className={iconClass} />;
      case 'MailCheck': return <MailCheck className={iconClass} />;
      case 'Smartphone': return <Smartphone className={iconClass} />;
      case 'BarChart3': return <BarChart3 className={iconClass} />;
      default: return <Sparkles className={iconClass} />;
    }
  };

  const filteredFeatures = SYSTEM_FEATURES.filter(f => {
    if (activeCategory === 'all') return true;
    return f.category === activeCategory;
  });

  return (
    <section id="features" className="py-20 lg:py-28 relative">
      {/* Background accents */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-slate-900/30 to-transparent pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-950/60 border border-cyan-800/60 text-cyan-300 text-xs font-semibold">
            <Layers className="w-3.5 h-3.5 text-cyan-400" />
            <span>الميزات الـ 10 الأساسية</span>
          </div>
          
          <h2 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight">
            كل ما تحتاجه لإدارة مؤسستك في{' '}
            <span className="bg-gradient-to-r from-cyan-400 to-indigo-400 bg-clip-text text-transparent">
              منظومة واحدة متكاملة
            </span>
          </h2>

          <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
            تم تصميم كل ميزة في Redox Ta3limi لتلبي التحديات الحقيقية للمدارس ومراكز دروس الدعم في الجزائر، من ضبط الحسابات إلى حضور الطلاب بالبطاقات الذكية.
          </p>

          {/* Category Filter Pills */}
          <div className="pt-3 flex flex-wrap items-center justify-center gap-2">
            {[
              { id: 'all', label: 'كافة الميزات (10)' },
              { id: 'academic', label: 'الطلاب والتدريس' },
              { id: 'finance', label: 'المحاسبة والعمولات' },
              { id: 'tech', label: 'RFID والتقنية الذكية' },
              { id: 'core', label: 'الإدارة والتحليلات' },
            ].map(cat => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id as any)}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  activeCategory === cat.id
                    ? 'bg-gradient-to-r from-cyan-600 to-indigo-600 text-white shadow-md shadow-indigo-600/20'
                    : 'bg-slate-900/80 border border-slate-800 text-slate-300 hover:text-white hover:bg-slate-800'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        {/* 10 Feature Cards Grid */}
        <div className="mt-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredFeatures.map((feature, idx) => (
            <div
              key={feature.id}
              className="group relative rounded-2xl bg-slate-900/70 border border-slate-800/80 p-6 hover:border-cyan-500/50 hover:bg-slate-900/95 transition-all duration-300 flex flex-col justify-between hover:shadow-xl hover:shadow-indigo-950/40"
            >
              <div>
                {/* Card Top: Number, Icon, Badge */}
                <div className="flex items-start justify-between gap-3">
                  <div className="w-12 h-12 rounded-xl bg-slate-800/90 border border-slate-700/80 text-cyan-400 flex items-center justify-center group-hover:scale-105 group-hover:bg-indigo-600/20 group-hover:border-cyan-500/40 transition-all">
                    {getFeatureIcon(feature.iconName)}
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold text-slate-400">0{feature.id}</span>
                    <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-indigo-950/80 text-indigo-300 border border-indigo-800/50">
                      {feature.badge}
                    </span>
                  </div>
                </div>

                {/* Title & Subtitle */}
                <div className="mt-5 space-y-1">
                  <h3 className="text-lg font-bold text-white group-hover:text-cyan-300 transition-colors">
                    {feature.title}
                  </h3>
                  <p className="text-xs font-semibold text-slate-400">
                    {feature.subtitle}
                  </p>
                </div>

                {/* Description */}
                <p className="mt-3 text-xs sm:text-sm text-slate-300/90 leading-relaxed">
                  {feature.description}
                </p>
              </div>

              {/* Highlights bullets */}
              <div className="mt-5 pt-4 border-t border-slate-800/70 space-y-2">
                {feature.highlights.map((h, i) => (
                  <div key={i} className="flex items-center gap-2 text-xs text-slate-300">
                    <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                    <span>{h}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
};
