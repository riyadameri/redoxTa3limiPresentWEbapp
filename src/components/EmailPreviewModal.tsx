import React, { useState } from 'react';
import { 
  X, 
  Mail, 
  Building2, 
  KeyRound, 
  Copy, 
  Check, 
  CheckCircle2, 
  ShieldCheck, 
  Printer,
  Radio,
  ExternalLink,
  Phone
} from 'lucide-react';
import { SchoolOrder } from '../types';

import { RedoxLogo } from './RedoxLogo';

interface EmailPreviewModalProps {
  order: SchoolOrder | null;
  isOpen: boolean;
  onClose: () => void;
}

export const EmailPreviewModal: React.FC<EmailPreviewModalProps> = ({
  order,
  isOpen,
  onClose
}) => {
  const [copiedKey, setCopiedKey] = useState(false);

  if (!isOpen || !order) return null;

  const copyKey = () => {
    navigator.clipboard.writeText(order.schoolKey);
    setCopiedKey(true);
    setTimeout(() => setCopiedKey(false), 2000);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-2xl my-6 bg-slate-900 border border-slate-700/90 rounded-2xl shadow-2xl overflow-hidden text-right flex flex-col max-h-[90vh]">
        
        {/* Top bar simulating an email client header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-800 bg-slate-950/80">
          <div className="flex items-center gap-2 text-xs text-slate-300">
            <Mail className="w-4 h-4 text-cyan-400" />
            <span>معاينة إشعار البريد الإلكتروني الفوري (Email Notification Preview)</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
              title="طباعة الإشعار"
            >
              <Printer className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Email Meta Info Bar */}
        <div className="p-4 bg-slate-950/40 border-b border-slate-800 text-xs space-y-1.5 text-slate-400">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-300 w-16">من:</span>
            <span className="font-mono text-cyan-300 font-semibold">Redox Ta3limi System &lt;contact@rudeox.cloud&gt;</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-300 w-16">إلى:</span>
            <span className="font-mono text-slate-200">{order.email}</span>
            <span className="text-slate-500">({order.directorName} - {order.schoolName})</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-300 w-16">الموضوع:</span>
            <span className="font-bold text-white">
              تم بنجاح تقديم طلبك - سنقوم بمراجعته والتواصل معك [{order.schoolName}]
            </span>
          </div>
        </div>

        {/* Email Body Template */}
        <div className="p-6 overflow-y-auto space-y-5 text-slate-200 text-xs sm:text-sm leading-relaxed bg-slate-900/90">
          
          {/* Email Brand Header */}
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <RedoxLogo size="md" />
              <div>
                <span className="font-mono font-black text-white text-base">REDOX تعليمي</span>
                <p className="text-[11px] text-slate-400">منظومة إدارة المدارس السحابية المتكاملة</p>
              </div>
            </div>

            <span className="px-3 py-1 rounded-full text-[11px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              تم التقديم بنجاح ✓
            </span>
          </div>

          {/* Review In Progress Banner */}
          <div className="p-3.5 rounded-xl bg-indigo-950/60 border border-indigo-500/40 text-indigo-200 text-xs space-y-1">
            <strong className="text-white flex items-center gap-1.5 font-bold">
              🔍 سنقوم بإلقاء نظرة على طلبكم ومراجعته:
            </strong>
            <p className="leading-relaxed">
              فريقنا الإداري والتقني يقوم حالياً بدراسة ومراجعة بيانات مؤسستكم، وسيتصل بكم مستشارنا الفني هاتفياً أو عبر الواتساب في أقرب وقت لتأكيد التفعيل وتقديم الدعم الكامل لتشغيل المنظومة.
            </p>
          </div>

          {/* Greeting */}
          <div className="space-y-2">
            <h4 className="text-sm font-bold text-white">
              حضرة المدير الفاضل / {order.directorName} المحترم،
            </h4>
            <p className="text-slate-300 text-xs leading-relaxed">
              نود إعلامكم وتأكيد أنه <strong className="text-emerald-400 font-bold">تم بنجاح تقديم طلبكم</strong> للاشتراك في منظومة Redox التعليمية لمؤسستكم الموقرة <strong className="text-white">"{order.schoolName}"</strong>.
            </p>
          </div>

          {/* School Key Highlight Card */}
          <div className="p-4 rounded-xl bg-gradient-to-br from-slate-950 to-slate-900 border-2 border-cyan-500/60 shadow-lg text-center space-y-2">
            <span className="text-xs font-bold text-cyan-400 flex items-center justify-center gap-1.5">
              <KeyRound className="w-4 h-4 text-cyan-400" />
              مفتاح المدرسة الموحد لتسجيل الدخول والربط (schoolKey):
            </span>

            <div className="inline-flex items-center gap-3 bg-slate-900 px-4 py-2 rounded-xl border border-slate-700">
              <span className="font-mono font-black text-lg sm:text-xl text-white tracking-widest">
                {order.schoolKey}
              </span>
              <button
                onClick={copyKey}
                className="px-2.5 py-1 rounded bg-cyan-500/20 text-cyan-300 hover:bg-cyan-500/30 text-xs font-bold flex items-center gap-1 cursor-pointer transition-all"
              >
                {copiedKey ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedKey ? 'تم النسخ' : 'نسخ'}</span>
              </button>
            </div>

            <p className="text-[11px] text-slate-400">
              هذا المفتاح مخصص حصرياً لإدارتكم؛ استخدمه عند فتح برنامج Redox لأول مرة لربط قاعدة بيانات مدرستكم.
            </p>
          </div>

          {/* Subscription Summary */}
          <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-2 text-xs">
            <h5 className="font-bold text-white pb-1 border-b border-slate-800 flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              تفاصيل الاشتراك المعتمد:
            </h5>
            <div className="grid grid-cols-2 gap-2 text-slate-300">
              <div>• الباقة: <span className="font-bold text-white">{order.planName}</span></div>
              <div>• نوع الفوترة: <span className="font-semibold text-cyan-300">{order.billingCycle === 'yearly' ? 'سنوي (وفر حتى شهرين)' : 'شهري'}</span></div>
              <div>• الطاقة الاستيعابية: <span className="font-semibold text-white">حتى {order.studentCountEstimate} طالب</span></div>
              <div>• المبلغ: <span className="font-bold font-mono text-emerald-400">{order.priceDzd.toLocaleString()} دج</span> ({order.priceCentimes.split('/')[0]})</div>
              <div>• الولاية: <span className="text-slate-300">{order.wilaya}</span></div>
              <div>• طريقة الدفع: <span className="uppercase text-cyan-300">{order.paymentMethod}</span></div>
            </div>
          </div>

          {/* Quick Setup Instructions */}
          <div className="space-y-2 text-xs">
            <h5 className="font-bold text-white">خطوات البدء السريع لتشغيل النظام في مدرستكم:</h5>
            <ol className="list-decimal list-inside space-y-1.5 text-slate-300 pr-1">
              <li>افتح الرابط الرسمي لبوابة المدرسة: <span className="font-mono text-cyan-300 underline">https://app.redox-ta3limi.dz</span></li>
              <li>أدخل مفتاح المدرسة <span className="font-mono font-bold text-white bg-slate-800 px-1 rounded">{order.schoolKey}</span> ورقم هاتفك المسجل.</li>
              <li>قم بتوصيل قارئ RFID المتوافق عبر منفذ USB، سيتعرف عليه النظام مباشرة.</li>
              <li>يمكنك تصدير واستيراد قائمة الطلاب وأفواج الأساتذة من ملف Excel بضغطة زر.</li>
            </ol>
          </div>

          {/* Support Contacts */}
          <div className="p-3.5 rounded-xl bg-indigo-950/30 border border-indigo-900/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2">
              <Phone className="w-4 h-4 text-cyan-400 shrink-0" />
              <div className="text-slate-300">
                <span>فريق الدعم الفني والمرافقة متاح لمساعدتكم:</span>
                <div className="flex flex-wrap items-center gap-3 mt-1">
                  <a href="tel:0698128674" className="font-mono text-cyan-300 font-bold" dir="ltr">
                    هاتف: 0698 12 86 74
                  </a>
                  <span className="text-slate-600">•</span>
                  <a href="https://wa.me/213559581957" target="_blank" rel="noopener noreferrer" className="font-mono text-green-400 font-bold" dir="ltr">
                    واتساب: 0559 58 19 57
                  </a>
                </div>
              </div>
            </div>
            <span className="text-[11px] text-slate-400">السبت - الخميس (08:00 - 18:00)</span>
          </div>

        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/80 flex items-center justify-between">
          <span className="text-xs text-slate-400">
            تم إرسال هذا الإشعار تلقائياً عبر خادم البريد المخصص لـ Redox
          </span>

          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold cursor-pointer"
          >
            إغلاق المعاينة
          </button>
        </div>

      </div>
    </div>
  );
};
