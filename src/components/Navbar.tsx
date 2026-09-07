import React, { useState } from 'react';
import { 
  Menu, 
  X, 
  Sparkles, 
  PhoneCall, 
  LayoutDashboard,
  ShieldCheck
} from 'lucide-react';
import { SchoolOrder } from '../types';
import { RedoxLogo } from './RedoxLogo';

interface NavbarProps {
  onOpenDemo: () => void;
  onOpenPricing: () => void;
  onOpenAdmin: () => void;
  orders: SchoolOrder[];
}

export const Navbar: React.FC<NavbarProps> = ({
  onOpenDemo,
  onOpenPricing,
  onOpenAdmin,
  orders
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const pendingCount = orders.filter(o => o.status === 'pending_payment').length;

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-800/80 bg-slate-950/90 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          
          {/* Official Brand Logo */}
          <a href="#" className="flex items-center gap-3 group">
            <RedoxLogo size="md" />
            <div className="flex flex-col">
              <div className="flex items-center gap-1.5">
                <span className="text-xl font-bold bg-gradient-to-r from-orange-400 via-amber-300 to-cyan-400 bg-clip-text text-transparent">تعليمي</span>
              </div>
              <span className="text-[11px] text-slate-400 tracking-wide font-medium">نظام إدارة المدارس المتكامل</span>
            </div>
          </a>

          {/* Desktop Nav Links */}
          <nav className="hidden lg:flex items-center gap-8 text-sm font-medium text-slate-300">
            <a href="#features" className="hover:text-orange-400 transition-colors">
              الميزات الـ 10
            </a>
            <a href="#why-us" className="hover:text-orange-400 transition-colors">
              لماذا Redox خيارك؟
            </a>
            <a href="#pricing" className="hover:text-orange-400 transition-colors">
              الباقات والأسعار
            </a>
            <a href="#faq" className="hover:text-orange-400 transition-colors">
              الأسئلة الشائعة
            </a>
          </nav>

          {/* Right Action Buttons */}
          <div className="hidden sm:flex items-center gap-3">
            {/* Redox Admin Central Access Button */}


            {/* Request Demo Button */}
            <button
              onClick={onOpenDemo}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-lg border border-cyan-500/40 text-cyan-300 hover:bg-cyan-500/10 transition-all cursor-pointer"
            >
              <PhoneCall className="w-3.5 h-3.5 text-cyan-400" />
              <span>طلب عرض توضيحي</span>
            </button>

            {/* Subscribe CTA Button */}
            <button
              onClick={onOpenPricing}
              className="inline-flex items-center gap-2 px-4.5 py-2 text-xs font-bold rounded-lg bg-gradient-to-r from-orange-500 via-indigo-600 to-cyan-500 text-white hover:opacity-95 hover:shadow-lg hover:shadow-orange-500/20 transition-all cursor-pointer active:scale-98"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-200" />
              <span>اشترك الآن</span>
            </button>
          </div>

          {/* Mobile menu button */}
          <div className="flex items-center gap-2 lg:hidden">
            <button
              onClick={onOpenAdmin}
              className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-orange-400 text-xs flex items-center gap-1 font-mono"
            >
              <LayoutDashboard className="w-4 h-4" />
              <span className="text-[10px]">Admin</span>
            </button>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/80 transition-colors"
              aria-label="القائمة"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>

        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-b border-slate-800 bg-slate-950/98 px-4 pt-3 pb-6 space-y-3">
          <nav className="flex flex-col space-y-2 text-sm font-medium text-slate-300">
            <a 
              href="#features" 
              onClick={() => setMobileMenuOpen(false)}
              className="px-3 py-2 rounded-md hover:bg-slate-800 hover:text-orange-400 transition-colors"
            >
              الميزات الـ 10 الأساسية
            </a>
            <a 
              href="#why-us" 
              onClick={() => setMobileMenuOpen(false)}
              className="px-3 py-2 rounded-md hover:bg-slate-800 hover:text-orange-400 transition-colors"
            >
              مقارنة Redox بالأنظمة الأخرى
            </a>
            <a 
              href="#pricing" 
              onClick={() => setMobileMenuOpen(false)}
              className="px-3 py-2 rounded-md hover:bg-slate-800 hover:text-orange-400 transition-colors"
            >
              باقات الاشتراك والأسعار
            </a>
            <a 
              href="#faq" 
              onClick={() => setMobileMenuOpen(false)}
              className="px-3 py-2 rounded-md hover:bg-slate-800 hover:text-orange-400 transition-colors"
            >
              الأسئلة الشائعة
            </a>
          </nav>

          <div className="pt-3 border-t border-slate-800 flex flex-col gap-2.5">
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                onOpenDemo();
              }}
              className="w-full py-2.5 px-4 text-center rounded-lg border border-cyan-500/40 text-cyan-300 text-sm font-semibold hover:bg-cyan-500/10"
            >
              طلب عرض توضيحي (Demo Walkthrough)
            </button>
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                onOpenPricing();
              }}
              className="w-full py-2.5 px-4 text-center rounded-lg bg-gradient-to-r from-orange-500 via-indigo-600 to-cyan-500 text-white text-sm font-bold shadow-md shadow-indigo-600/30"
            >
              اشترك في النظام الآن
            </button>
          </div>
        </div>
      )}
    </header>
  );
};
