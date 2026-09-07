import React, { useState } from 'react';
import { 
  X, 
  CheckCircle2, 
  Sparkles, 
  Building2, 
  Mail, 
  Phone, 
  User, 
  MapPin, 
  CreditCard, 
  Copy, 
  Check, 
  ArrowLeft, 
  Send, 
  ShieldCheck, 
  KeyRound,
  ExternalLink,
  Printer,
  Eye,
  Clock,
  RefreshCw,
  MessageSquare
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { ALGERIA_WILAYAS } from '../data/plans';
import { BillingCycle, PaymentMethod, Plan, SchoolOrder, SchoolType } from '../types';
import { createOrderAsync } from '../utils/orderStorage';
import { RedoxLogo } from './RedoxLogo';

interface CheckoutModalProps {
  plan: Plan;
  initialBillingCycle: BillingCycle;
  isOpen: boolean;
  onClose: () => void;
  onOrderCreated: (newOrder: SchoolOrder) => void;
  onViewEmail: (order: SchoolOrder) => void;
  onOpenAdmin: () => void;
}

export const CheckoutModal: React.FC<CheckoutModalProps> = ({
  plan,
  initialBillingCycle,
  isOpen,
  onClose,
  onOrderCreated,
  onViewEmail,
  onOpenAdmin
}) => {
  const [billingCycle, setBillingCycle] = useState<BillingCycle>(initialBillingCycle);
  const [schoolName, setSchoolName] = useState('');
  const [schoolType, setSchoolType] = useState<SchoolType>('مدرسة خاصة');
  const [wilaya, setWilaya] = useState('16 - الجزائر العاصمة');
  const [address, setAddress] = useState('');
  const [directorName, setDirectorName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [studentCount, setStudentCount] = useState<number>(plan.studentLimit);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('baridimob');
  const [adminUsername, setAdminUsername] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [createdOrder, setCreatedOrder] = useState<SchoolOrder | null>(null);
  const [copiedKey, setCopiedKey] = useState(false);
  const [emailStatus, setEmailStatus] = useState<{ sent: boolean; messageId?: string; error?: string } | null>(null);
  const [isResendingEmail, setIsResendingEmail] = useState(false);
  const [resendFeedback, setResendFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleResendEmail = async () => {
    if (!createdOrder) return;
    setIsResendingEmail(true);
    setResendFeedback(null);
    try {
      const res = await fetch(`/api/orders/${createdOrder.id}/send-email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setResendFeedback({
          type: 'success',
          text: `✓ تم إرسال رسالة التأكيد مجدداً بنجاح إلى ${createdOrder.email}. يرجى فحص صندوق الوارد أو مجلد Spam.`
        });
      } else {
        setResendFeedback({
          type: 'error',
          text: data.message || 'تعذر إعادة إرسال البريد حالياً. يمكنك التواصل معنا مباشرة.'
        });
      }
    } catch (e: any) {
      setResendFeedback({
        type: 'error',
        text: 'حدث خطأ في الاتصال بالخادم. يرجى التواصل عبر الواتساب لتأكيد طلبك.'
      });
    } finally {
      setIsResendingEmail(false);
    }
  };

  if (!isOpen) return null;

  const currentPriceCentimes = billingCycle === 'yearly' ? plan.yearlyCentimes : plan.monthlyCentimes;
  const currentPriceDzd = billingCycle === 'yearly' ? plan.yearlyDzd : plan.monthlyDzd;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!schoolName || !phone || !email || !directorName) {
      alert('يرجى ملء جميع الحقول الإلزامية لتأكيد التسجيل.');
      return;
    }

    setIsSubmitting(true);
    setEmailStatus(null);

    const result = await createOrderAsync({
      schoolName,
      schoolType,
      wilaya,
      address,
      directorName,
      phone,
      email,
      studentCountEstimate: Number(studentCount) || plan.studentLimit,
      planId: plan.id,
      planName: plan.name,
      billingCycle,
      priceCentimes: currentPriceCentimes,
      priceDzd: currentPriceDzd,
      paymentMethod,
      adminUsername: adminUsername.trim() || undefined,
      adminPassword: adminPassword.trim() || undefined,
      notes: notes || undefined
    });

    setCreatedOrder(result.order);
    setEmailStatus({
      sent: result.emailSent,
      messageId: result.emailMessageId,
      error: result.emailError
    });
    onOrderCreated(result.order);
    setIsSubmitting(false);

    // Trigger celebratory confetti
    try {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 }
      });
    } catch (err) {
      // Safe fallback
    }
  };

  const copySchoolKey = (key: string) => {
    navigator.clipboard.writeText(key);
    setCopiedKey(true);
    setTimeout(() => setCopiedKey(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-3xl my-6 bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden text-right">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center gap-3">
            <RedoxLogo size="md" />
            <div>
              <h3 className="text-lg font-extrabold text-white">
                {createdOrder ? 'تم تأكيد طلب الاشتراك وتوليد المفتاح!' : 'نموذج طلب الاشتراك وتفعيل المدرسة'}
              </h3>
              <p className="text-xs text-slate-400">
                {createdOrder 
                  ? 'تم إرسال الطلب بنجاح إلى لوحة التحكم المركزية (Redox Admin)'
                  : `${plan.name} (${plan.studentLimitLabel})`
                }
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content */}
        {createdOrder ? (
          /* SUCCESS SCREEN */
          <div className="p-6 sm:p-8 space-y-5">
            
            {/* Success Header */}
            <div className="text-center space-y-2.5">
              <div className="w-16 h-16 rounded-full bg-emerald-500/20 border-2 border-emerald-500/50 text-emerald-400 flex items-center justify-center mx-auto shadow-xl shadow-emerald-500/10 animate-bounce">
                <CheckCircle2 className="w-9 h-9" />
              </div>

              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold">
                <Check className="w-3.5 h-3.5" />
                <span>تم استلام طلبكم بنجاح</span>
              </div>

              <h4 className="text-xl sm:text-2xl font-black text-white">
                تم بنجاح تقديم طلبك لمؤسسة "{createdOrder.schoolName}"
              </h4>
            </div>

            {/* "We will review your order" Notice Box */}
            <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-indigo-950/70 to-slate-950 border border-indigo-500/50 shadow-lg space-y-2 text-right">
              <div className="flex items-center gap-2 text-indigo-300 font-bold text-sm sm:text-base">
                <Eye className="w-5 h-5 text-indigo-400 shrink-0" />
                <span>طلبك قيد المراجعة والدراسة الآن:</span>
              </div>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                لقد تم إرسال طلبكم مباشرة إلى فريق إدارة <strong className="text-white">Redox Ta3limi</strong>. سنقوم بإلقاء نظرة على طلبكم ومراجعة بيانات مؤسستكم في أقرب وقت، وسيتصل بكم مستشارنا الفني هاتفياً أو عبر الواتساب لتأكيد تفعيل المنظومة وربط قارئات البطاقات الذكية RFID.
              </p>
              <div className="flex items-center gap-2 pt-1 text-[11px] text-indigo-300/80 font-medium">
                <Clock className="w-3.5 h-3.5" />
                <span>متوسط وقت المراجعة والتواصل: خلال ساعات العمل الرسمية (08:00 - 18:00)</span>
              </div>
            </div>

            {/* Email Confirmation Notice Box */}
            <div className={`p-4 rounded-2xl border flex items-start gap-3 text-xs ${
              emailStatus?.error && !emailStatus?.sent
                ? 'bg-amber-950/40 border-amber-500/40 text-amber-200'
                : 'bg-emerald-950/40 border-emerald-500/40 text-emerald-200'
            }`}>
              <Mail className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
              <div className="leading-relaxed space-y-1.5 w-full">
                <div className="flex items-center justify-between flex-wrap gap-1">
                  <strong className="text-emerald-300 block font-bold text-xs sm:text-sm">
                    {emailStatus?.error && !emailStatus?.sent 
                      ? 'تم تسجيل طلبك وحفظه بنجاح (سيتم التواصل معك هاتفياً):'
                      : 'تم بنجاح إرسال بريد إلكتروني رسمي يؤكد تقديم طلبك:'}
                  </strong>
                  {emailStatus?.messageId && (
                    <span className="text-[10px] font-mono text-emerald-400/80 bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-500/30">
                      ID: {emailStatus.messageId.replace(/[<>]/g, '').slice(0, 18)}...
                    </span>
                  )}
                </div>

                <p className="text-slate-200">
                  أرسلنا تفاصيل الترخيص وبيانات الطلب والدفع إلى بريدكم: <strong className="font-mono text-white underline underline-offset-2">{createdOrder.email}</strong> من خلال <span className="text-cyan-300 font-mono">contact@rudeox.cloud</span>.
                </p>

                {/* Important Spam / Junk Alert & Actions */}
                <div className="p-3 rounded-xl bg-slate-900/95 border border-amber-500/30 text-amber-200 text-[11px] leading-relaxed space-y-2 mt-1">
                  <div className="flex items-start gap-2">
                    <span className="text-amber-400 font-bold shrink-0">⚠️ أين تجد الرسالة؟</span>
                    <span>
                      إذا لم تجد الرسالة في <strong>صندوق الوارد الرئيسي (Inbox)</strong>، يرجى فحص مجلد <strong>الرسائل غير المرغوب فيها (Spam / Junk)</strong> أو قسم <strong>الترويجات (Promotions)</strong>، والنقر على <em>«ليس بريداً غير مرغوب فيه (Report Not Spam)»</em>.
                    </span>
                  </div>

                  {/* Action Buttons for Email */}
                  <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-slate-800">
                    <button
                      type="button"
                      onClick={handleResendEmail}
                      disabled={isResendingEmail}
                      className="px-3 py-1.5 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 text-[11px] font-bold flex items-center gap-1.5 cursor-pointer transition-all disabled:opacity-50"
                    >
                      <RefreshCw className={`w-3 h-3 ${isResendingEmail ? 'animate-spin' : ''}`} />
                      <span>{isResendingEmail ? 'جارٍ إعادة الإرسال...' : 'إعادة إرسال رسالة التأكيد'}</span>
                    </button>

                    <a
                      href={`https://mail.google.com/mail/u/0/#search/from%3Acontact%40rudeox.cloud+OR+rudeox`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-1.5 rounded-lg bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-300 border border-indigo-500/40 text-[11px] font-bold flex items-center gap-1.5 transition-all"
                    >
                      <ExternalLink className="w-3 h-3" />
                      <span>البحث في Gmail عن الرسالة</span>
                    </a>

                    <a
                      href={`https://wa.me/213559581957?text=${encodeURIComponent(`السلام عليكم، قمت بطلب باقة (${createdOrder.planName}) لمؤسسة (${createdOrder.schoolName}). مفتاح الترخيص: ${createdOrder.schoolKey}`)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-1.5 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 border border-emerald-600/40 text-[11px] font-bold flex items-center gap-1.5 transition-all"
                    >
                      <MessageSquare className="w-3 h-3" />
                      <span>تأكيد الطلب فوراً عبر واتساب</span>
                    </a>
                  </div>

                  {resendFeedback && (
                    <div className={`p-2 rounded-lg text-[11px] font-medium ${
                      resendFeedback.type === 'success' 
                        ? 'bg-emerald-900/60 text-emerald-200 border border-emerald-500/40' 
                        : 'bg-red-900/60 text-red-200 border border-red-500/40'
                    }`}>
                      {resendFeedback.text}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Generated School Key Box */}
            <div className="p-5 rounded-2xl bg-slate-950 border border-cyan-500/50 shadow-xl relative">
              <span className="text-xs font-bold text-cyan-400 flex items-center gap-1.5 mb-1.5">
                <KeyRound className="w-4 h-4 text-cyan-400" />
                مفتاح المدرسة لتفعيل الحساب (schoolKey):
              </span>

              <div className="flex items-center justify-between bg-slate-900/90 p-3 rounded-xl border border-slate-700">
                <span className="font-mono text-lg sm:text-xl font-black text-white tracking-widest selection:bg-cyan-500">
                  {createdOrder.schoolKey}
                </span>

                <button
                  onClick={() => copySchoolKey(createdOrder.schoolKey)}
                  className="px-3.5 py-1.5 rounded-lg bg-cyan-500/20 border border-cyan-500/40 text-cyan-300 hover:bg-cyan-500/30 text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-all active:scale-95"
                >
                  {copiedKey ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span>تم النسخ!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>نسخ المفتاح</span>
                    </>
                  )}
                </button>
              </div>

              <p className="mt-2 text-[11px] text-slate-400">
                احتفظ بهذا المفتاح، فهو المعرف الحصري لمدرستكم لتسجيل الدخول وربط قارئات البطاقات الذكية RFID.
              </p>
            </div>

            {/* Order Details Summary */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800">
                <span className="text-slate-400 block text-[11px]">الباقة:</span>
                <span className="font-bold text-white mt-0.5 block">{createdOrder.planName}</span>
              </div>

              <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800">
                <span className="text-slate-400 block text-[11px]">نوع الاشتراك:</span>
                <span className="font-bold text-white mt-0.5 block">
                  {createdOrder.billingCycle === 'yearly' ? 'اشتراك سنوي (خصم خاص)' : 'اشتراك شهري'}
                </span>
              </div>

              <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800">
                <span className="text-slate-400 block text-[11px]">المبلغ:</span>
                <span className="font-bold text-emerald-400 font-mono mt-0.5 block">
                  {createdOrder.priceDzd.toLocaleString()} دج
                </span>
                <span className="text-[10px] text-slate-400">{createdOrder.priceCentimes.split('/')[0]}</span>
              </div>

              <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800">
                <span className="text-slate-400 block text-[11px]">طريقة الدفع:</span>
                <span className="font-bold text-cyan-300 mt-0.5 block uppercase">
                  {createdOrder.paymentMethod === 'baridimob' ? 'بريدي موب (BaridiMob)' : createdOrder.paymentMethod}
                </span>
              </div>
            </div>

            {/* Actions */}
            <div className="pt-2 flex flex-col sm:flex-row items-center gap-3">
              <button
                onClick={() => onViewEmail(createdOrder)}
                className="w-full sm:w-1/2 py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs sm:text-sm border border-slate-700 flex items-center justify-center gap-2 cursor-pointer transition-all"
              >
                <Mail className="w-4 h-4 text-cyan-400" />
                <span>معاينة نص الإشعار المرسل للبريد</span>
              </button>

              <button
                onClick={onClose}
                className="w-full sm:w-1/2 py-3 px-4 rounded-xl bg-gradient-to-r from-orange-500 via-indigo-600 to-cyan-500 text-white font-bold text-xs sm:text-sm shadow-lg shadow-indigo-600/30 hover:opacity-95 flex items-center justify-center gap-2 cursor-pointer transition-all"
              >
                <Check className="w-4 h-4" />
                <span>تم، إغلاق والعودة للموقع</span>
              </button>
            </div>

          </div>
        ) : (
          /* FORM SCREEN */
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            
            {/* Selected Plan Bar with Toggle */}
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex flex-wrap items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-base font-black text-white">{plan.name}</span>
                  <span className="text-xs px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 font-semibold">
                    {plan.studentLimitLabel}
                  </span>
                </div>
                <div className="mt-1 flex items-center gap-2 text-xs">
                  <span className="text-emerald-400 font-mono font-bold">{currentPriceDzd.toLocaleString()} دج</span>
                  <span className="text-slate-400">({currentPriceCentimes})</span>
                </div>
              </div>

              {/* Cycle Toggle */}
              <div className="flex items-center bg-slate-900 p-1 rounded-lg border border-slate-800">
                <button
                  type="button"
                  onClick={() => setBillingCycle('monthly')}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all cursor-pointer ${
                    billingCycle === 'monthly' ? 'bg-cyan-600 text-white' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  شهري
                </button>
                <button
                  type="button"
                  onClick={() => setBillingCycle('yearly')}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all cursor-pointer ${
                    billingCycle === 'yearly' ? 'bg-cyan-600 text-white' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  سنوي (خصم)
                </button>
              </div>
            </div>

            {/* Form Fields: School & Manager Details */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              
              {/* School Name */}
              <div>
                <label className="block text-slate-300 font-bold mb-1.5">
                  اسم المؤسسة / المدرسة / المركز <span className="text-rose-400">*</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    value={schoolName}
                    onChange={(e) => setSchoolName(e.target.value)}
                    placeholder="مثال: مدرسة الرجاء الخاصة، مركز المتفوقين"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 text-xs"
                  />
                  <Building2 className="w-4 h-4 text-slate-500 absolute left-3 top-3 pointer-events-none" />
                </div>
              </div>

              {/* School Type */}
              <div>
                <label className="block text-slate-300 font-bold mb-1.5">
                  نوع المؤسسة التعليمية <span className="text-rose-400">*</span>
                </label>
                <select
                  value={schoolType}
                  onChange={(e) => setSchoolType(e.target.value as SchoolType)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 text-xs cursor-pointer"
                >
                  <option value="مدرسة خاصة">مدرسة خاصة (ابتدائي / متوسط / ثانوي)</option>
                  <option value="مركز دروس دعم">مركز دروس دعم وتقوية</option>
                  <option value="معهد لغات">معهد لغات وترجمة</option>
                  <option value="مدرسة قرآنية">مدرسة قرآنية / زاوية تعليمية</option>
                  <option value="مؤسسة تكوينية">مؤسسة تكوينية خاصة</option>
                  <option value="أخرى">أخرى</option>
                </select>
              </div>

              {/* Wilaya Dropdown */}
              <div>
                <label className="block text-slate-300 font-bold mb-1.5">
                  الولاية <span className="text-rose-400">*</span>
                </label>
                <div className="relative">
                  <select
                    value={wilaya}
                    onChange={(e) => setWilaya(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 text-xs cursor-pointer"
                  >
                    {ALGERIA_WILAYAS.map((w) => (
                      <option key={w} value={w}>{w}</option>
                    ))}
                  </select>
                  <MapPin className="w-4 h-4 text-slate-500 absolute left-3 top-3 pointer-events-none" />
                </div>
              </div>

              {/* Address / City */}
              <div>
                <label className="block text-slate-300 font-bold mb-1.5">
                  البلدية / العنوان التقريبي
                </label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="مثال: دالي براهيم، وهران وسط، سطيف..."
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 text-xs"
                />
              </div>

              {/* Director / Manager Name */}
              <div>
                <label className="block text-slate-300 font-bold mb-1.5">
                  اسم المدير أو المشرف المسؤول <span className="text-rose-400">*</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    value={directorName}
                    onChange={(e) => setDirectorName(e.target.value)}
                    placeholder="مثال: الأستاذ محمد قدور"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 text-xs"
                  />
                  <User className="w-4 h-4 text-slate-500 absolute left-3 top-3 pointer-events-none" />
                </div>
              </div>

              {/* Phone Number */}
              <div>
                <label className="block text-slate-300 font-bold mb-1.5">
                  رقم الهاتف (للتواصل وتفعيل الحساب) <span className="text-rose-400">*</span>
                </label>
                <div className="relative">
                  <input
                    type="tel"
                    required
                    dir="ltr"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="0550 12 34 56"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 text-xs text-right font-mono"
                  />
                  <Phone className="w-4 h-4 text-slate-500 absolute left-3 top-3 pointer-events-none" />
                </div>
              </div>

              {/* Email Address */}
              <div>
                <label className="block text-slate-300 font-bold mb-1.5">
                  البريد الإلكتروني (لتلقي مفتاح التفعيل) <span className="text-rose-400">*</span>
                </label>
                <div className="relative">
                  <input
                    type="email"
                    required
                    dir="ltr"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="director@school-domain.dz"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 text-xs text-right"
                  />
                  <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-3 pointer-events-none" />
                </div>
              </div>

              {/* Student Count Estimate */}
              <div>
                <label className="block text-slate-300 font-bold mb-1.5">
                  عدد الطلاب التقديري حالياً
                </label>
                <input
                  type="number"
                  min={1}
                  max={10000}
                  value={studentCount}
                  onChange={(e) => setStudentCount(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 text-xs font-mono"
                />
              </div>

            </div>

            {/* Optional Director Login Preferences */}
            <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <KeyRound className="w-4 h-4 text-cyan-400" />
                  <span className="text-xs font-bold text-white">بيانات حساب المدير المفضل (اختياري)</span>
                </div>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 font-mono">
                  اختياري - يولد تلقائياً إن ترك فارغاً
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                يمكنك تحديد اسم المستخدم وكلمة المرور المفضلة للدخول كمدير للمنظومة، أو تركها فارغة وسيقوم مشرف النظام بإنشائها وإرسالها لك فور قبول الطلب.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="block text-slate-300 font-medium mb-1">
                    اسم مستخدم المدير (Username)
                  </label>
                  <input
                    type="text"
                    dir="ltr"
                    value={adminUsername}
                    onChange={(e) => setAdminUsername(e.target.value)}
                    placeholder="مثال: admin_nokhba"
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white placeholder-slate-600 focus:outline-none focus:border-cyan-500 font-mono text-xs"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-medium mb-1">
                    كلمة المرور المفضلة (Password)
                  </label>
                  <input
                    type="text"
                    dir="ltr"
                    value={adminPassword}
                    onChange={(e) => setAdminPassword(e.target.value)}
                    placeholder="أدخل كلمة سر أو اتركها فارغة"
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white placeholder-slate-600 focus:outline-none focus:border-cyan-500 font-mono text-xs"
                  />
                </div>
              </div>
            </div>

            {/* Payment Method Selection */}
            <div>
              <label className="block text-xs text-slate-300 font-bold mb-2">
                طريقة الدفع وتأكيد الاشتراك المفضلة:
              </label>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
                {[
                  { id: 'baridimob', name: 'بريدي موب (BaridiMob)', badge: 'الأسرع' },
                  { id: 'ccp', name: 'حساب CCP بريد الجزائر', badge: 'شائع' },
                  { id: 'bank_transfer', name: 'تحويل بنكي رسمي', badge: 'فواتير' },
                  { id: 'cash', name: 'نقداً بالوكالة أو صك', badge: 'مباشر' },
                ].map((item) => (
                  <label
                    key={item.id}
                    className={`p-3 rounded-xl border flex flex-col justify-between cursor-pointer transition-all ${
                      paymentMethod === item.id
                        ? 'bg-indigo-950/40 border-cyan-500 shadow-sm'
                        : 'bg-slate-950/60 border-slate-800 hover:bg-slate-900'
                    }`}
                  >
                    <div className="flex items-center justify-between pb-1">
                      <input
                        type="radio"
                        name="paymentMethod"
                        value={item.id}
                        checked={paymentMethod === item.id}
                        onChange={() => setPaymentMethod(item.id as PaymentMethod)}
                        className="text-cyan-500"
                      />
                      <span className="text-[10px] text-cyan-400 font-semibold">{item.badge}</span>
                    </div>
                    <span className="font-bold text-slate-200 text-[11px] mt-1">{item.name}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Submit Action */}
            <div className="pt-3 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="text-xs text-slate-400 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>يتم إرسال الطلب مباشرة للوحة Redox Admin وتوليد المفتاح فوراً</span>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full sm:w-auto px-7 py-3 rounded-xl bg-gradient-to-r from-cyan-500 via-indigo-500 to-violet-600 text-white font-bold text-sm shadow-xl shadow-indigo-600/25 hover:opacity-95 active:scale-98 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>جاري تسجيل المدرسة وتوليد المفتاح...</span>
                  </>
                ) : (
                  <>
                    <span>تأكيد الطلب وتوليد مفتاح المدرسة (schoolKey)</span>
                    <ArrowLeft className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>

          </form>
        )}

      </div>
    </div>
  );
};
