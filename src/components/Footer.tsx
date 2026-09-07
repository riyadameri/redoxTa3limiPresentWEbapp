import React from 'react';
import { 
  Phone, 
  Mail, 
  MapPin, 
  ShieldCheck, 
  Radio, 
  MessageCircle
} from 'lucide-react';
import { RedoxLogo } from './RedoxLogo';

interface FooterProps {
  onOpenAdmin: () => void;
  onOpenDemo: () => void;
}

export const Footer: React.FC<FooterProps> = ({ onOpenAdmin, onOpenDemo }) => {
  return (
    <footer className="border-t border-slate-800 bg-slate-950 text-slate-400 text-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8">
          
          {/* Col 1 & 2: Brand Info */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center gap-3">
              <RedoxLogo size="md" />
              <div>
                <span className="font-mono font-black text-lg text-white">REDOX تعليمي</span>
                <p className="text-[11px] text-slate-400">نظام إدارة المدارس المتكامل السحابي</p>
              </div>
            </div>

            <p className="text-slate-300 text-xs leading-relaxed max-w-sm">
              الحل الجزائري الرائد لإدارة المدارس الخاصة، مراكز دروس الدعم، ومعاهد اللغات. يجمع بين سهولة الاستخدام، قوة المحاسبة، ودقة البطاقات الذكية RFID.
            </p>

            <div className="pt-2 flex items-center gap-3 text-[11px] text-slate-400">
              <span className="flex items-center gap-1 text-emerald-400">
                <ShieldCheck className="w-4 h-4" />
                سيرفرات سحابية آمنة 100%
              </span>
              <span>•</span>
              <span className="flex items-center gap-1 text-orange-400">
                <Radio className="w-4 h-4" />
                دعم قارئات RFID المعتمدة
              </span>
            </div>
          </div>

          {/* Col 3: Fast Navigation */}
          <div className="space-y-3">
            <h4 className="text-sm font-bold text-white">روابط سريعة</h4>
            <ul className="space-y-2 text-xs">
              <li><a href="#features" className="hover:text-orange-400 transition-colors">الميزات الـ 10 الأساسية</a></li>
              <li><a href="#why-us" className="hover:text-orange-400 transition-colors">لماذا نحن خيارك الأفضل؟</a></li>
              <li><a href="#pricing" className="hover:text-orange-400 transition-colors">باقات الاشتراك والأسعار</a></li>
              <li><a href="#faq" className="hover:text-orange-400 transition-colors">الأسئلة المتكررة</a></li>
            </ul>
          </div>

          {/* Col 4: Management & System Portals */}
          <div className="space-y-3">
            <h4 className="text-sm font-bold text-white">البوابات والأنظمة</h4>
            <ul className="space-y-2 text-xs">
              <li>
                <button 
                  onClick={onOpenDemo}
                  className="hover:text-cyan-400 text-slate-300 flex items-center gap-1 cursor-pointer"
                >
                  <span>طلب تجربة النظام مع خبير</span>
                </button>
              </li>
              <li>
                <span className="text-slate-400">
                  بوابة الطالب وولي الأمر (تطبيق الويب)
                </span>
              </li>
              <li>
                <span className="text-slate-400">
                  إعداد قارئات RFID والتوصيل السحابي
                </span>
              </li>
            </ul>
          </div>

          {/* Col 5: Contact Info */}
          <div className="space-y-3">
            <h4 className="text-sm font-bold text-white">التواصل والمقر</h4>
            <ul className="space-y-2.5 text-xs text-slate-300">
              <li className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-cyan-400 shrink-0" />
                <span>الجزائر العاصمة - وهران - سطيف</span>
              </li>
              <li className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-emerald-400 shrink-0" />
                <a href="tel:0698128674" className="font-mono text-xs hover:text-emerald-300 transition-colors" dir="ltr">
                  0698 12 86 74
                </a>
              </li>
              <li className="flex items-center gap-2">
                <MessageCircle className="w-4 h-4 text-green-400 shrink-0" />
                <a 
                  href="https://wa.me/213559581957" 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="font-mono text-xs hover:text-green-300 transition-colors flex items-center gap-1.5" 
                  dir="ltr"
                >
                  <span>0559 58 19 57</span>
                  <span className="text-[10px] text-green-400 font-sans font-medium">(واتساب WhatsApp)</span>
                </a>
              </li>
              <li className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-indigo-400 shrink-0" />
                <a href="mailto:contact@rudeox.cloud" className="font-mono text-xs hover:text-indigo-300 transition-colors">
                  contact@rudeox.cloud
                </a>
              </li>
              <li className="text-[11px] text-slate-400 pt-1">
                فريق الدعم الفني متوفر على مدار الأسبوع
              </li>
            </ul>
          </div>

        </div>

        {/* Bottom copyright line */}
        <div className="mt-12 pt-6 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] text-slate-400">
          <p>© {new Date().getFullYear()} Redox Ta3limi. جميع الحقوق محفوظة لبرنامج إدارة المدارس المتكامل في الجزائر.</p>
          <div className="flex items-center gap-4">
            <span className="hover:text-slate-300 cursor-pointer">سياسة الخصوصية وأمان البيانات</span>
            <span>•</span>
            <span className="hover:text-slate-300 cursor-pointer">شروط الخدمة والترخيص</span>
          </div>
        </div>

      </div>
    </footer>
  );
};
