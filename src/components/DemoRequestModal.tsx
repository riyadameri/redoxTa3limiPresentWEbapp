import React, { useState } from 'react';
import { 
  X, 
  PlayCircle, 
  Building2, 
  Phone, 
  Mail, 
  User, 
  MapPin, 
  Calendar, 
  CheckCircle2, 
  Sparkles,
  ArrowLeft
} from 'lucide-react';
import { ALGERIA_WILAYAS } from '../data/plans';
import { saveDemoRequest } from '../utils/orderStorage';

interface DemoRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DemoRequestModal: React.FC<DemoRequestModalProps> = ({
  isOpen,
  onClose
}) => {
  const [schoolName, setSchoolName] = useState('');
  const [contactName, setContactName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [wilaya, setWilaya] = useState('16 - الجزائر العاصمة');
  const [notes, setNotes] = useState('');
  const [demoType, setDemoType] = useState<'online' | 'onsite'>('online');
  const [isSubmitted, setIsSubmitted] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!schoolName || !phone || !contactName) {
      alert('يرجى كتابة اسم المؤسسة والشخص المسؤول ورقم الهاتف.');
      return;
    }

    saveDemoRequest({
      schoolName,
      contactName,
      phone,
      email,
      wilaya,
      notes: `نوع العرض: ${demoType === 'online' ? 'عبر الإنترنت (Google Meet)' : 'زيارة ميدانية'} | ملاحظات: ${notes}`
    });

    setIsSubmitted(true);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-xl my-6 bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden text-right">
        
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-800 bg-slate-950/80">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/20 border border-cyan-500/30 text-cyan-400 flex items-center justify-center">
              <PlayCircle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-black text-white">طلب عرض توضيحي مباشر (Demo)</h3>
              <p className="text-xs text-slate-400">جولة استكشافية حية لنظام Redox Ta3limi مع أحد خبرائنا</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        {isSubmitted ? (
          <div className="p-8 text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <h4 className="text-xl font-bold text-white">تم استلام طلب العرض التوضيحي بنجاح!</h4>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed max-w-md mx-auto">
              شكراً لاهتمامكم بنظام <span className="text-cyan-400 font-bold">Redox Ta3limi</span>. سيتصل بكم مستشارنا التقني خلال ساعات قليلة عبر رقم الهاتف المسجل لجدولة العرض التوضيحي المخصص لمدرستكم.
            </p>

            <button
              onClick={onClose}
              className="mt-4 px-6 py-2.5 rounded-xl bg-gradient-to-r from-cyan-600 to-indigo-600 text-white font-bold text-xs cursor-pointer"
            >
              تم، شكراً لكم
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="block text-slate-300 font-bold mb-1">اسم المؤسسة أو المركز *</label>
                <input
                  type="text"
                  required
                  value={schoolName}
                  onChange={(e) => setSchoolName(e.target.value)}
                  placeholder="مدرسة الإشراق الخاصة"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-cyan-500 text-xs"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-bold mb-1">اسم المسؤول / المدير *</label>
                <input
                  type="text"
                  required
                  value={contactName}
                  onChange={(e) => setContactName(e.target.value)}
                  placeholder="الأستاذ عبد القادر"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-cyan-500 text-xs"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-bold mb-1">رقم الهاتف *</label>
                <input
                  type="tel"
                  required
                  dir="ltr"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="0550 00 00 00"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-cyan-500 text-xs text-right font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-bold mb-1">البريد الإلكتروني</label>
                <input
                  type="email"
                  dir="ltr"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="director@domain.dz"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-cyan-500 text-xs text-right"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-slate-300 font-bold mb-1">الولاية</label>
                <select
                  value={wilaya}
                  onChange={(e) => setWilaya(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-cyan-500 text-xs cursor-pointer"
                >
                  {ALGERIA_WILAYAS.map(w => (
                    <option key={w} value={w}>{w}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Demo format */}
            <div>
              <label className="block text-slate-300 font-bold mb-1.5">طريقة العرض التوضيحي المفضلة:</label>
              <div className="grid grid-cols-2 gap-3">
                <label className={`p-3 rounded-xl border flex items-center gap-2 cursor-pointer ${
                  demoType === 'online' ? 'bg-cyan-950/40 border-cyan-500' : 'bg-slate-950 border-slate-800'
                }`}>
                  <input
                    type="radio"
                    name="demoType"
                    checked={demoType === 'online'}
                    onChange={() => setDemoType('online')}
                  />
                  <span>عبر الإنترنت (Google Meet تفاعلي)</span>
                </label>

                <label className={`p-3 rounded-xl border flex items-center gap-2 cursor-pointer ${
                  demoType === 'onsite' ? 'bg-cyan-950/40 border-cyan-500' : 'bg-slate-950 border-slate-800'
                }`}>
                  <input
                    type="radio"
                    name="demoType"
                    checked={demoType === 'onsite'}
                    onChange={() => setDemoType('onsite')}
                  />
                  <span>زيارة ميدانية لمقر مدرستكم</span>
                </label>
              </div>
            </div>

            <div>
              <label className="block text-slate-300 font-bold mb-1">ملاحظات أو أسئلة محددة</label>
              <textarea
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="أخبرنا عن عدد الطلاب الحالي أو الأجهزة التي تستخدمونها..."
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-cyan-500 text-xs"
              />
            </div>

            <div className="pt-2 border-t border-slate-800 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-slate-400 hover:text-white"
              >
                إلغاء
              </button>
              <button
                type="submit"
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-cyan-600 to-indigo-600 text-white font-bold text-xs flex items-center gap-2 cursor-pointer shadow-lg"
              >
                <span>إرسال طلب العرض</span>
                <ArrowLeft className="w-3.5 h-3.5" />
              </button>
            </div>

          </form>
        )}

      </div>
    </div>
  );
};
