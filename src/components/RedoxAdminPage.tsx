import React, { useState, useEffect } from 'react';
import { 
  Lock, 
  KeyRound, 
  Search, 
  Filter, 
  CheckCircle2, 
  Clock, 
  XCircle, 
  AlertCircle, 
  Copy, 
  Check, 
  RefreshCw, 
  Mail, 
  Printer, 
  Download, 
  ArrowLeft, 
  Users, 
  Receipt, 
  TrendingUp, 
  Phone, 
  Building2, 
  ShieldCheck, 
  Eye, 
  EyeOff, 
  LogOut,
  Calendar,
  Sparkles,
  PlayCircle,
  FileSpreadsheet,
  Plus,
  Send,
  Database
} from 'lucide-react';
import { OrderStatus, SchoolOrder } from '../types';
import { 
  updateOrderStatus, 
  regenerateOrderKey, 
  getStoredOrders, 
  getStoredDemoRequests,
  syncOrdersWithBackend,
  syncDemosWithBackend
} from '../utils/orderStorage';
import { verifyAdminPin, checkServerHealth, fetchServerHealthInfo, ServerHealthInfo } from '../api/client';
import { RedoxLogo } from './RedoxLogo';

interface RedoxAdminPageProps {
  onNavigateHome: () => void;
  onViewEmail: (order: SchoolOrder) => void;
}

export const RedoxAdminPage: React.FC<RedoxAdminPageProps> = ({
  onNavigateHome,
  onViewEmail
}) => {
  // Authentication State
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return sessionStorage.getItem('redox_admin_auth') === 'true';
  });
  const [passwordInput, setPasswordInput] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [authError, setAuthError] = useState(false);

  // Admin Data State
  const [orders, setOrders] = useState<SchoolOrder[]>([]);
  const [demoRequests, setDemoRequests] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'orders' | 'demos'>('orders');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [actionNotice, setActionNotice] = useState<string | null>(null);
  const [isServerConnected, setIsServerConnected] = useState<boolean>(true);
  const [dbInfo, setDbInfo] = useState<ServerHealthInfo | null>(null);

  // Check server health and load data
  useEffect(() => {
    fetchServerHealthInfo().then(info => {
      if (info) {
        setIsServerConnected(info.status === 'ok');
        setDbInfo(info);
      } else {
        setIsServerConnected(false);
      }
    });
    if (isAuthenticated) {
      loadData();
    }
  }, [isAuthenticated]);

  const loadData = () => {
    setOrders(getStoredOrders());
    setDemoRequests(getStoredDemoRequests());
    
    // Sync live from Node.js backend
    syncOrdersWithBackend().then(syncedOrders => {
      if (syncedOrders && syncedOrders.length > 0) {
        setOrders(syncedOrders);
      }
    });
    syncDemosWithBackend().then(syncedDemos => {
      if (syncedDemos) {
        setDemoRequests(syncedDemos);
      }
    });
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const verification = await verifyAdminPin(passwordInput.trim());
    if (verification.success) {
      setIsAuthenticated(true);
      sessionStorage.setItem('redox_admin_auth', 'true');
      setAuthError(false);
      setPasswordInput('');
    } else {
      setAuthError(true);
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    sessionStorage.removeItem('redox_admin_auth');
    setPasswordInput('');
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(text);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleStatusChange = (orderId: string, newStatus: OrderStatus) => {
    updateOrderStatus(orderId, newStatus);
    loadData();
    const statusArabic = 
      newStatus === 'active' ? 'مفعل ونشط' :
      newStatus === 'paid' ? 'تم تأكيد الدفع' :
      newStatus === 'cancelled' ? 'ملغى' : 'بانتظار الدفع';
    
    setActionNotice(`تم تحديث حالة طلب المدرسة إلى: [${statusArabic}] بنجاح ✓`);
    setTimeout(() => setActionNotice(null), 4000);
  };

  const handleRegenerateKey = (orderId: string, schoolName: string) => {
    if (confirm(`هل أنت متأكد من رغبتك في توليد مفتاح جديد لمدرسة "${schoolName}"؟`)) {
      regenerateOrderKey(orderId);
      loadData();
      setActionNotice(`تم توليد مفتاح جديد للمدرسة وتحديث النظام بنجاح ✓`);
      setTimeout(() => setActionNotice(null), 4000);
    }
  };

  const [sendingEmailId, setSendingEmailId] = useState<string | null>(null);

  const handleSendEmail = async (order: SchoolOrder) => {
    if (!order.email) {
      alert('هذا الطلب لا يحتوي على بريد إلكتروني');
      return;
    }

    setSendingEmailId(order.id);
    try {
      const res = await fetch(`/api/orders/${order.id}/send-email`, { method: 'POST' });
      const data = await res.json();
      if (res.ok && data.success) {
        setActionNotice(`تم إرسال الإشعار بنجاح إلى بريد العميل: ${order.email} ✓`);
      } else {
        setActionNotice(`تنبيه: ${data.message || 'تعذر إرسال الإشعار عبر البريد'}`);
      }
    } catch (err: any) {
      setActionNotice(`خطأ في الإرسال: ${err?.message || 'تعذر الاتصال بالسيرفر'}`);
    } finally {
      setSendingEmailId(null);
      setTimeout(() => setActionNotice(null), 5000);
    }
  };

  // Export orders to CSV
  const exportToCsv = () => {
    if (orders.length === 0) {
      alert('لا توجد طلبات لتصديرها حالياً');
      return;
    }

    const headers = ['رقم الطلب', 'المدرسة', 'المدير', 'الهاتف', 'البريد', 'الولاية', 'الباقة', 'نوع الدفع', 'المبلغ دج', 'طريقة الدفع', 'الحالة', 'مفتاح المدرسة', 'التاريخ'];
    const rows = orders.map(o => [
      o.id,
      `"${o.schoolName}"`,
      `"${o.directorName}"`,
      `"${o.phone}"`,
      `"${o.email}"`,
      `"${o.wilaya}"`,
      `"${o.planName}"`,
      o.billingCycle === 'yearly' ? 'سنوي' : 'شهري',
      o.priceDzd,
      o.paymentMethod,
      o.status,
      o.schoolKey,
      o.createdAt
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `طلبات_مدارس_Redox_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Filtered orders
  const filteredOrders = orders.filter(order => {
    const q = searchQuery.toLowerCase();
    const matchesSearch = 
      order.schoolName.toLowerCase().includes(q) ||
      order.directorName.toLowerCase().includes(q) ||
      order.schoolKey.toLowerCase().includes(q) ||
      order.phone.includes(q) ||
      order.wilaya.toLowerCase().includes(q);

    if (!matchesSearch) return false;
    if (statusFilter === 'all') return true;
    return order.status === statusFilter;
  });

  // Financial and Operational KPIs
  const totalOrdersCount = orders.length;
  const activeCount = orders.filter(o => o.status === 'active').length;
  const pendingCount = orders.filter(o => o.status === 'pending_payment').length;
  const paidCount = orders.filter(o => o.status === 'paid').length;
  const totalRevenue = orders.reduce((sum, o) => sum + (o.status !== 'cancelled' ? o.priceDzd : 0), 0);

  // ----------------------------------------------------
  // LOGIN SCREEN (If not authenticated with 'riyad911')
  // ----------------------------------------------------
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 selection:bg-orange-500 selection:text-white">
        <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl relative overflow-hidden text-right">
          
          {/* Top glow accent */}
          <div className="absolute top-0 right-0 left-0 h-1 bg-gradient-to-r from-orange-500 via-indigo-500 to-cyan-500" />

          {/* Logo & Header */}
          <div className="flex flex-col items-center text-center space-y-3 mb-8">
            <RedoxLogo size="xl" />

            <div>
              <h1 className="text-xl sm:text-2xl font-black text-white">
                بوابة إدارة منظومة <span className="text-orange-400">REDOX</span>
              </h1>
              <p className="text-xs text-slate-400 mt-1 font-mono">
                لوحة الإدارة المركزية والتحكم بالطلبات (/redox-admin)
              </p>
            </div>
          </div>

          {/* Login Form */}
          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-2">
                كلمة سر الإدارة (Admin Password)
              </label>
              
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  autoFocus
                  dir="ltr"
                  value={passwordInput}
                  onChange={(e) => {
                    setPasswordInput(e.target.value);
                    if (authError) setAuthError(false);
                  }}
                  placeholder="أدخل كلمة المرور الخاصة بالإدارة..."
                  className={`w-full bg-slate-950 border rounded-xl py-3 px-4 text-white text-sm focus:outline-none transition-colors font-mono ${
                    authError 
                      ? 'border-rose-500 ring-2 ring-rose-500/20' 
                      : 'border-slate-700 focus:border-orange-500'
                  }`}
                />

                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white p-1 cursor-pointer"
                  title={showPassword ? 'إخفاء كلمة المرور' : 'إظهار كلمة المرور'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              {authError && (
                <p className="mt-2 text-xs text-rose-400 flex items-center gap-1.5 font-medium">
                  <XCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>كلمة السر غير صحيحة، يرجى المحاولة مرة أخرى.</span>
                </p>
              )}
            </div>

            <button
              type="submit"
              className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-orange-500 via-indigo-600 to-cyan-500 text-white font-bold text-sm shadow-xl shadow-orange-500/20 hover:opacity-95 active:scale-98 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <Lock className="w-4 h-4" />
              <span>دخول إلى لوحة إدارة Redox</span>
            </button>
          </form>

          {/* Return link */}
          <div className="mt-8 pt-5 border-t border-slate-800/80 text-center">
            <button
              onClick={onNavigateHome}
              className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-cyan-400 transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>الرجوع إلى الموقع الرئيسي</span>
            </button>
          </div>

        </div>
      </div>
    );
  }

  // ----------------------------------------------------
  // AUTHENTICATED DASHBOARD (Access to all customer orders)
  // ----------------------------------------------------
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-['Cairo',sans-serif]">
      
      {/* Top Admin Header */}
      <header className="sticky top-0 z-30 bg-slate-900/95 border-b border-slate-800 backdrop-blur-md px-4 sm:px-8 py-3.5">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-4">
          
          <div className="flex items-center gap-3">
            <RedoxLogo size="md" />
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base sm:text-lg font-black text-white">لوحة إدارة Redox المركزية</h1>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-orange-500/20 text-orange-300 border border-orange-500/30">
                  /redox-admin
                </span>
                <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-mono font-medium border ${
                  isServerConnected 
                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
                    : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                }`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${isServerConnected ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
                  {isServerConnected ? 'خادم Node.js نشط' : 'وضع محلي'}
                </span>

                {/* Database Engine Badge */}
                <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold border ${
                  dbInfo?.isMongoConnected
                    ? 'bg-green-950/60 text-emerald-300 border-emerald-500/40 shadow-sm'
                    : 'bg-indigo-950/50 text-indigo-300 border-indigo-500/30'
                }`}>
                  <Database className="w-3 h-3 text-emerald-400" />
                  <span>
                    {dbInfo?.isMongoConnected 
                      ? `MongoDB: ${dbInfo.mongoDbName || 'redox_ta3limi'} ✓` 
                      : 'قاعدة بيانات: MongoDB (وضع الجاهزية/Fallback)'}
                  </span>
                </span>
              </div>
              <p className="text-xs text-slate-400">متابعة وإدارة طلبات العملاء والاشتراكات وتفعيل الحسابات</p>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex items-center gap-3">
            <button
              onClick={loadData}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer"
              title="تحديث البيانات"
            >
              <RefreshCw className="w-4 h-4" />
            </button>

            <button
              onClick={exportToCsv}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold cursor-pointer border border-slate-700"
              title="تصدير إلى Excel / CSV"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
              <span className="hidden sm:inline">تصدير CSV</span>
            </button>

            <button
              onClick={onNavigateHome}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-300 text-xs font-semibold cursor-pointer border border-slate-700"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>الموقع الرئيسي</span>
            </button>

            <button
              onClick={handleLogout}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 text-xs font-semibold cursor-pointer border border-rose-800/40"
              title="تسجيل الخروج"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">خروج</span>
            </button>
          </div>

        </div>
      </header>

      {/* Action notification toast */}
      {actionNotice && (
        <div className="bg-emerald-950/90 border-b border-emerald-800 text-emerald-300 px-6 py-2.5 text-xs font-bold flex items-center justify-between animate-fadeIn">
          <div className="flex items-center gap-2 max-w-7xl mx-auto w-full">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{actionNotice}</span>
          </div>
        </div>
      )}

      {/* Main Body */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-8 py-8 space-y-8">
        
        {/* Top Metric Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3.5 sm:gap-4">
          
          <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col justify-between">
            <div className="flex items-center justify-between text-slate-400 text-xs">
              <span>إجمالي الطلبات</span>
              <Building2 className="w-4 h-4 text-cyan-400" />
            </div>
            <div className="mt-3">
              <span className="text-2xl sm:text-3xl font-black text-white font-mono">{totalOrdersCount}</span>
              <span className="text-[11px] text-slate-400 block mt-0.5">مؤسسة تعليمية مسجلة</span>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col justify-between">
            <div className="flex items-center justify-between text-slate-400 text-xs">
              <span>الاشتراكات المفعلة</span>
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="mt-3">
              <span className="text-2xl sm:text-3xl font-black text-emerald-400 font-mono">{activeCount}</span>
              <span className="text-[11px] text-emerald-300/80 block mt-0.5">مفتاح نشط حالياً</span>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col justify-between">
            <div className="flex items-center justify-between text-slate-400 text-xs">
              <span>بانتظار الدفع</span>
              <Clock className="w-4 h-4 text-amber-400" />
            </div>
            <div className="mt-3">
              <span className="text-2xl sm:text-3xl font-black text-amber-300 font-mono">{pendingCount}</span>
              <span className="text-[11px] text-amber-400/80 block mt-0.5">طلبات قيد المراجعة</span>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col justify-between">
            <div className="flex items-center justify-between text-slate-400 text-xs">
              <span>الدفعات المستلمة</span>
              <Receipt className="w-4 h-4 text-indigo-400" />
            </div>
            <div className="mt-3">
              <span className="text-2xl sm:text-3xl font-black text-indigo-300 font-mono">{paidCount}</span>
              <span className="text-[11px] text-slate-400 block mt-0.5">سند دفع مؤكد</span>
            </div>
          </div>

          <div className="col-span-2 lg:col-span-1 p-4 rounded-2xl bg-gradient-to-br from-slate-900 to-indigo-950/40 border border-indigo-800/50 flex flex-col justify-between">
            <div className="flex items-center justify-between text-slate-400 text-xs">
              <span>إجمالي المقبوضات</span>
              <TrendingUp className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="mt-3">
              <span className="text-xl sm:text-2xl font-black text-white font-mono">
                {totalRevenue.toLocaleString()} دج
              </span>
              <span className="text-[11px] text-emerald-400 block mt-0.5">إجمالي قيمة الاشتراكات</span>
            </div>
          </div>

        </div>

        {/* View Tabs: Customer Orders vs Demo Inquiries */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('orders')}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer flex items-center gap-2 ${
                activeTab === 'orders'
                  ? 'bg-orange-500 text-white shadow-md'
                  : 'text-slate-400 hover:text-white hover:bg-slate-900'
              }`}
            >
              <Building2 className="w-4 h-4" />
              <span>طلبات العملاء والاشتراكات</span>
              <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-slate-950/60 font-mono">
                {orders.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('demos')}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer flex items-center gap-2 ${
                activeTab === 'demos'
                  ? 'bg-orange-500 text-white shadow-md'
                  : 'text-slate-400 hover:text-white hover:bg-slate-900'
              }`}
            >
              <PlayCircle className="w-4 h-4" />
              <span>طلبات العروض التوضيحية (Demos)</span>
              <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-slate-950/60 font-mono">
                {demoRequests.length}
              </span>
            </button>
          </div>
        </div>

        {/* TAB 1: CUSTOMER SUBSCRIPTION ORDERS */}
        {activeTab === 'orders' && (
          <div className="space-y-4">
            
            {/* Search and Status Filters */}
            <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 bg-slate-900/60 p-3.5 rounded-2xl border border-slate-800">
              
              {/* Search input */}
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-500 absolute right-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="ابحث باسم المدرسة، المدير، الهاتف، الولاية، أو مفتاح المدرسة..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pr-10 pl-4 py-2 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-orange-500"
                />
              </div>

              {/* Status Filter buttons */}
              <div className="flex items-center gap-1 overflow-x-auto text-xs pb-1 md:pb-0">
                <button
                  onClick={() => setStatusFilter('all')}
                  className={`px-3 py-1.5 rounded-lg font-medium transition-colors cursor-pointer ${
                    statusFilter === 'all' ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  الكل ({orders.length})
                </button>

                <button
                  onClick={() => setStatusFilter('pending_payment')}
                  className={`px-3 py-1.5 rounded-lg font-medium transition-colors cursor-pointer ${
                    statusFilter === 'pending_payment' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  بانتظار الدفع ({pendingCount})
                </button>

                <button
                  onClick={() => setStatusFilter('paid')}
                  className={`px-3 py-1.5 rounded-lg font-medium transition-colors cursor-pointer ${
                    statusFilter === 'paid' ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  تم الدفع ({paidCount})
                </button>

                <button
                  onClick={() => setStatusFilter('active')}
                  className={`px-3 py-1.5 rounded-lg font-medium transition-colors cursor-pointer ${
                    statusFilter === 'active' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  مفعل ونشط ({activeCount})
                </button>
              </div>

            </div>

            {/* Orders List / Cards */}
            {filteredOrders.length === 0 ? (
              <div className="p-12 text-center bg-slate-900/40 border border-slate-800/80 rounded-2xl space-y-3">
                <Building2 className="w-10 h-10 text-slate-600 mx-auto" />
                <h3 className="text-sm font-bold text-white">لا توجد طلبات مطابقة للبحث</h3>
                <p className="text-xs text-slate-400">جرب تغيير كلمات البحث أو إزالة التصفية.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredOrders.map((order) => {
                  const isKeyCopied = copiedKey === order.schoolKey;

                  return (
                    <div
                      key={order.id}
                      className="p-5 rounded-2xl bg-slate-900 border border-slate-800/90 hover:border-slate-700 transition-all space-y-4"
                    >
                      {/* Top Row: School & Status */}
                      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-800">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-orange-500 to-indigo-600 flex items-center justify-center text-white font-bold shrink-0">
                            <Building2 className="w-5 h-5" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h3 className="text-base font-black text-white">{order.schoolName}</h3>
                              <span className="text-xs text-slate-400 font-mono">({order.wilaya})</span>
                            </div>
                            <p className="text-xs text-slate-400">
                              المدير: <span className="text-slate-200 font-semibold">{order.directorName}</span> • تاريخ التسجيل: {order.createdAt}
                            </p>
                          </div>
                        </div>

                        {/* Status badge */}
                        <div className="flex items-center gap-2">
                          <span className={`px-3 py-1 rounded-full text-xs font-bold border flex items-center gap-1.5 ${
                            order.status === 'active'
                              ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                              : order.status === 'paid'
                              ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40'
                              : order.status === 'cancelled'
                              ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                              : 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                          }`}>
                            {order.status === 'active' && <CheckCircle2 className="w-3.5 h-3.5" />}
                            {order.status === 'pending_payment' && <Clock className="w-3.5 h-3.5" />}
                            <span>
                              {order.status === 'active' ? 'مفعل ونشط ✓' :
                               order.status === 'paid' ? 'تم استلام الدفع' :
                               order.status === 'cancelled' ? 'ملغى' : 'بانتظار الدفع'}
                            </span>
                          </span>
                        </div>
                      </div>

                      {/* Middle Details Grid */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
                        
                        {/* School Key Card */}
                        <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1.5">
                          <span className="text-[11px] text-slate-400 flex items-center gap-1">
                            <KeyRound className="w-3.5 h-3.5 text-cyan-400" />
                            مفتاح الربط والتفعيل (schoolKey):
                          </span>
                          <div className="flex items-center justify-between">
                            <span className="font-mono font-bold text-white tracking-wider text-xs">
                              {order.schoolKey}
                            </span>
                            <button
                              onClick={() => handleCopy(order.schoolKey)}
                              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white cursor-pointer"
                              title="نسخ المفتاح"
                            >
                              {isKeyCopied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                            </button>
                          </div>
                        </div>

                        {/* Plan & Billing */}
                        <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                          <span className="text-[11px] text-slate-400">الباقة والاشتراك:</span>
                          <p className="font-bold text-white text-xs">{order.planName}</p>
                          <span className="text-[11px] text-cyan-400 block font-medium">
                            {order.billingCycle === 'yearly' ? 'فوترة سنوية (وفر شهرين)' : 'فوترة شهرية'} • حتى {order.studentCountEstimate} طالب
                          </span>
                        </div>

                        {/* Pricing & Payment */}
                        <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                          <span className="text-[11px] text-slate-400">المبلغ وطريقة الدفع:</span>
                          <p className="font-mono font-bold text-emerald-400 text-sm">
                            {order.priceDzd.toLocaleString()} دج
                          </p>
                          <span className="text-[11px] text-slate-400 block">
                            {order.priceCentimes.split('/')[0]} • <span className="uppercase text-slate-300 font-semibold">{order.paymentMethod}</span>
                          </span>
                        </div>

                        {/* Contact Info */}
                        <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                          <span className="text-[11px] text-slate-400">بيانات الاتصال:</span>
                          <a href={`tel:${order.phone}`} className="font-mono text-cyan-300 hover:underline block">
                            {order.phone}
                          </a>
                          <span className="text-slate-400 font-mono text-[11px] block truncate" title={order.email}>
                            {order.email}
                          </span>
                        </div>

                      </div>

                      {/* Bottom Action Buttons */}
                      <div className="pt-2 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-2 text-xs">
                        
                        {/* Status transition buttons */}
                        <div className="flex flex-wrap items-center gap-2">
                          {order.status !== 'active' && (
                            <button
                              onClick={() => handleStatusChange(order.id, 'active')}
                              className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold cursor-pointer transition-all flex items-center gap-1.5"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>تفعيل الاشتراك فوراً</span>
                            </button>
                          )}

                          {order.status !== 'paid' && order.status !== 'active' && (
                            <button
                              onClick={() => handleStatusChange(order.id, 'paid')}
                              className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold cursor-pointer transition-all"
                            >
                              تأكيد استلام الدفع
                            </button>
                          )}

                          {order.status !== 'pending_payment' && (
                            <button
                              onClick={() => handleStatusChange(order.id, 'pending_payment')}
                              className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 cursor-pointer"
                            >
                              إرجاع كمعلق
                            </button>
                          )}

                          {order.status !== 'cancelled' && (
                            <button
                              onClick={() => handleStatusChange(order.id, 'cancelled')}
                              className="px-2.5 py-1.5 rounded-lg bg-rose-950/40 hover:bg-rose-900/50 text-rose-300 cursor-pointer"
                            >
                              إلغاء الطلب
                            </button>
                          )}
                        </div>

                        {/* Secondary utilities */}
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleSendEmail(order)}
                            disabled={sendingEmailId === order.id}
                            className="px-3 py-1.5 rounded-lg bg-orange-600/30 hover:bg-orange-600/50 border border-orange-500/40 text-orange-300 flex items-center gap-1.5 cursor-pointer font-medium disabled:opacity-50"
                            title="إرسال إشعار تفعيل فوري إلى بريد العميل عبر Hostinger"
                          >
                            <Send className={`w-3.5 h-3.5 ${sendingEmailId === order.id ? 'animate-spin' : ''}`} />
                            <span>{sendingEmailId === order.id ? 'جارٍ الإرسال...' : 'إرسال للبريد'}</span>
                          </button>

                          <button
                            onClick={() => onViewEmail(order)}
                            className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-300 flex items-center gap-1.5 cursor-pointer font-medium"
                            title="معاينة إشعار التفعيل الرسمي للبريد"
                          >
                            <Mail className="w-3.5 h-3.5" />
                            <span>معاينة إشعار البريد</span>
                          </button>

                          <button
                            onClick={() => handleRegenerateKey(order.id, order.schoolName)}
                            className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white cursor-pointer"
                            title="إعادة توليد مفتاح المدرسة"
                          >
                            <RefreshCw className="w-3.5 h-3.5" />
                          </button>
                        </div>

                      </div>

                    </div>
                  );
                })}
              </div>
            )}

          </div>
        )}

        {/* TAB 2: DEMO REQUESTS */}
        {activeTab === 'demos' && (
          <div className="space-y-4">
            {demoRequests.length === 0 ? (
              <div className="p-12 text-center bg-slate-900/40 border border-slate-800/80 rounded-2xl space-y-3">
                <PlayCircle className="w-10 h-10 text-slate-600 mx-auto" />
                <h3 className="text-sm font-bold text-white">لا توجد طلبات عروض توضيحية حالياً</h3>
                <p className="text-xs text-slate-400">ستظهر هنا أي طلبات يجري تقديمها عبر نموذج الـ Demo.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {demoRequests.map((demo) => (
                  <div key={demo.id} className="p-5 rounded-2xl bg-slate-900 border border-slate-800 text-xs space-y-3">
                    <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                      <div>
                        <h4 className="font-bold text-white text-sm">{demo.schoolName}</h4>
                        <p className="text-slate-400 text-[11px]">المسؤول: {demo.contactName} • {demo.wilaya}</p>
                      </div>
                      <span className="font-mono text-slate-400 text-[11px]">{demo.createdAt}</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <span className="text-slate-400 block text-[11px]">رقم الهاتف:</span>
                        <a href={`tel:${demo.phone}`} className="font-mono font-bold text-cyan-300">
                          {demo.phone}
                        </a>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[11px]">البريد الإلكتروني:</span>
                        <span className="font-mono text-slate-300">{demo.email || 'غير مدخل'}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[11px]">تفاصيل الطلب:</span>
                        <span className="text-slate-300">{demo.notes}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

      </main>

    </div>
  );
};
