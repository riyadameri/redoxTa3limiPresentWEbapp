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
  Database,
  ExternalLink,
  Globe,
  Share2,
  CheckCheck,
  MessageSquare,
  LockKeyhole
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { OrderStatus, SchoolOrder } from '../types';
import { 
  updateOrderStatus, 
  regenerateOrderKey, 
  getStoredOrders, 
  getStoredDemoRequests,
  syncOrdersWithBackend,
  syncDemosWithBackend,
  approveOrderAsync
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

  // SMTP Mailer Diagnostics State
  const [showSmtpModal, setShowSmtpModal] = useState(false);
  const [smtpStatus, setSmtpStatus] = useState<{ connected?: boolean; host?: string; port?: number; user?: string; error?: string; response?: string } | null>(null);
  const [isCheckingSmtp, setIsCheckingSmtp] = useState(false);
  const [testEmailAddress, setTestEmailAddress] = useState('riyadammmeri@gmail.com');
  const [testEmailResult, setTestEmailResult] = useState<{ success: boolean; messageId?: string; response?: string; error?: string } | null>(null);
  const [isSendingTestEmail, setIsSendingTestEmail] = useState(false);

  const checkSmtp = async () => {
    setIsCheckingSmtp(true);
    try {
      const res = await fetch('/api/email/status');
      if (res.ok) {
        const data = await res.json();
        setSmtpStatus(data);
      }
    } catch (e: any) {
      setSmtpStatus({ connected: false, error: 'تعذر الاتصال بمسار فحص البريد الإلكتروني' });
    } finally {
      setIsCheckingSmtp(false);
    }
  };

  const handleSendTestEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!testEmailAddress || !testEmailAddress.includes('@')) {
      alert('يرجى إدخال عنوان بريد إلكتروني صحيح');
      return;
    }
    setIsSendingTestEmail(true);
    setTestEmailResult(null);
    try {
      const res = await fetch('/api/email/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ toEmail: testEmailAddress })
      });
      const data = await res.json();
      setTestEmailResult(data);
    } catch (err: any) {
      setTestEmailResult({ success: false, error: err?.message || 'فشل الاتصال بالخادم' });
    } finally {
      setIsSendingTestEmail(false);
    }
  };

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

  // Approval & alrouad.com Provisioning Modal State
  const [approvingOrder, setApprovingOrder] = useState<SchoolOrder | null>(null);
  const [provisionUsername, setProvisionUsername] = useState('');
  const [provisionPassword, setProvisionPassword] = useState('');
  const [provisionTargetServer, setProvisionTargetServer] = useState('https://alrouad.com');
  const [provisionSendEmail, setProvisionSendEmail] = useState(true);
  const [isProvisioning, setIsProvisioning] = useState(false);
  const [showPasswordInModal, setShowPasswordInModal] = useState(false);
  const [provisionSuccessData, setProvisionSuccessData] = useState<any | null>(null);
  const [copiedAllCredentials, setCopiedAllCredentials] = useState(false);

  const openApprovalModal = (order: SchoolOrder) => {
    setApprovingOrder(order);
    const cleanKey = order.schoolKey ? order.schoolKey.replace(/[^a-zA-Z0-9]/g, '').slice(-5).toLowerCase() : 'sch';
    setProvisionUsername(order.adminUsername || `admin_${cleanKey}`);
    setProvisionPassword(order.adminPassword || `Rdx${Math.floor(1000 + Math.random() * 9000)}!#`);
    setProvisionTargetServer(order.provisionedServer || 'https://alrouad.com');
    setProvisionSendEmail(true);
    setIsProvisioning(false);
    setShowPasswordInModal(false);
    setProvisionSuccessData(null);
    setCopiedAllCredentials(false);
  };

  const handleGenerateRandomUsername = () => {
    if (!approvingOrder) return;
    const cleanKey = approvingOrder.schoolKey ? approvingOrder.schoolKey.replace(/[^a-zA-Z0-9]/g, '').slice(-5).toLowerCase() : 'sch';
    const randNum = Math.floor(100 + Math.random() * 900);
    setProvisionUsername(`admin_${cleanKey}_${randNum}`);
  };

  const handleGenerateRandomPassword = () => {
    const specialChars = ['!#', '@$', '&*', '%!'];
    const randSpecial = specialChars[Math.floor(Math.random() * specialChars.length)];
    const randNum = Math.floor(1000 + Math.random() * 9000);
    setProvisionPassword(`Rdx${randNum}${randSpecial}`);
  };

  const handleExecuteApproval = async () => {
    if (!approvingOrder) return;

    if (!provisionUsername.trim()) {
      alert('يرجى تحديد اسم مستخدم لمدير المدرسة');
      return;
    }
    if (!provisionPassword.trim()) {
      alert('يرجى تحديد كلمة مرور لحساب المدير');
      return;
    }

    setIsProvisioning(true);
    try {
      const res = await approveOrderAsync(approvingOrder.id, {
        adminUsername: provisionUsername.trim(),
        adminPassword: provisionPassword.trim(),
        targetServer: provisionTargetServer.trim() || 'https://alrouad.com',
        sendCredentialsEmail: provisionSendEmail
      });

      if (res.success) {
        setProvisionSuccessData(res);
        loadData();
        try {
          confetti({
            particleCount: 100,
            spread: 80,
            origin: { y: 0.6 }
          });
        } catch {}
      } else {
        alert(res.message || 'حدث خطأ أثناء اعتماد الطلب');
      }
    } catch (err: any) {
      alert(`خطأ: ${err?.message || 'تعذر استكمال عملية الاعتماد'}`);
    } finally {
      setIsProvisioning(false);
    }
  };

  const handleCopyAllCredentials = (creds: {
    schoolName: string;
    schoolKey: string;
    adminUsername: string;
    adminPassword: string;
    loginUrl: string;
  }) => {
    const text = `🎓 بيانات الدخول الرسمية لمنظومة Redox التعليمية:
━━━━━━━━━━━━━━━━━━━━
🏫 المؤسسة: ${creds.schoolName}
🔑 مفتاح المدرسة (School Key): ${creds.schoolKey}
👤 اسم مستخدم المدير: ${creds.adminUsername}
🔒 كلمة المرور: ${creds.adminPassword}
🌐 رابط تسجيل الدخول: ${creds.loginUrl}
━━━━━━━━━━━━━━━━━━━━
يرجى حفظ هذه البيانات في مكان آمن وعدم مشاركتها مع غير المخولين.`;

    navigator.clipboard.writeText(text);
    setCopiedAllCredentials(true);
    setTimeout(() => setCopiedAllCredentials(false), 2500);
  };

  const handleOpenWhatsApp = (phone: string, creds: {
    schoolName: string;
    schoolKey: string;
    adminUsername: string;
    adminPassword: string;
    loginUrl: string;
  }) => {
    let cleanPhone = phone.replace(/[^0-9]/g, '');
    if (cleanPhone.startsWith('0')) {
      cleanPhone = '213' + cleanPhone.slice(1);
    } else if (!cleanPhone.startsWith('213')) {
      cleanPhone = '213' + cleanPhone;
    }

    const message = `السلام عليكم ورحمة الله،\nمبروك! تم اعتماد وتفعيل مدرسة *${creds.schoolName}* على منظومة Redox التعليمية.\n\n*بيانات الدخول لحساب المدير:* \n• مفتاح المدرسة: *${creds.schoolKey}*\n• اسم المستخدم: *${creds.adminUsername}*\n• كلمة المرور: *${creds.adminPassword}*\n• رابط المنصة: ${creds.loginUrl}\n\nنتمنى لكم تجربة موفقة!`;
    const url = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
  };

  // Helper for visual badge styling
  const getStatusBadge = (status: OrderStatus) => {
    switch (status) {
      case 'active':
        return {
          label: 'مفعل ونشط',
          sub: 'Active',
          bg: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
          dot: 'bg-emerald-400',
          Icon: CheckCircle2
        };
      case 'approved':
        return {
          label: 'تمت الموافقة والإنشاء',
          sub: 'Approved',
          bg: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40',
          dot: 'bg-cyan-400',
          Icon: ShieldCheck
        };
      case 'paid':
        return {
          label: 'تم استلام الدفع',
          sub: 'Paid',
          bg: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40',
          dot: 'bg-indigo-400',
          Icon: Receipt
        };
      case 'cancelled':
        return {
          label: 'ملغى',
          sub: 'Cancelled',
          bg: 'bg-rose-500/20 text-rose-300 border-rose-500/40',
          dot: 'bg-rose-400',
          Icon: XCircle
        };
      case 'pending_payment':
      case 'pending':
      default:
        return {
          label: 'قيد المراجعة والانتظار',
          sub: 'Pending',
          bg: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
          dot: 'bg-amber-400',
          Icon: Clock
        };
    }
  };

  // Export orders to CSV
  const exportToCsv = () => {
    if (orders.length === 0) {
      alert('لا توجد طلبات لتصديرها حالياً');
      return;
    }

    const headers = ['رقم الطلب', 'المدرسة', 'المدير', 'الهاتف', 'البريد', 'الولاية', 'الباقة', 'نوع الدفع', 'المبلغ دج', 'طريقة الدفع', 'الحالة', 'اسم مستخدم المدير', 'مفتاح المدرسة', 'التاريخ'];
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
      `"${o.adminUsername || ''}"`,
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
      (order.adminUsername && order.adminUsername.toLowerCase().includes(q)) ||
      order.wilaya.toLowerCase().includes(q);

    if (!matchesSearch) return false;
    if (statusFilter === 'all') return true;
    if (statusFilter === 'pending_payment') {
      return order.status === 'pending_payment' || order.status === 'pending';
    }
    return order.status === statusFilter;
  });

  // Financial and Operational KPIs
  const totalOrdersCount = orders.length;
  const approvedCount = orders.filter(o => o.status === 'approved').length;
  const activeCount = orders.filter(o => o.status === 'active').length;
  const pendingCount = orders.filter(o => o.status === 'pending_payment' || o.status === 'pending').length;
  const paidCount = orders.filter(o => o.status === 'paid').length;
  const cancelledCount = orders.filter(o => o.status === 'cancelled').length;
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

            {/* Hostinger SMTP Diagnostic Tool */}
            <button
              onClick={() => {
                setShowSmtpModal(true);
                if (!smtpStatus) checkSmtp();
              }}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold cursor-pointer border border-slate-700 transition-colors"
              title="فحص وإرسال بريد تجريبي عبر خادم Hostinger SMTP"
            >
              <Mail className="w-4 h-4 text-cyan-400" />
              <span className="hidden md:inline">فحص خادم البريد (SMTP)</span>
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
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
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-3.5">
          
          <div className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col justify-between">
            <div className="flex items-center justify-between text-slate-400 text-xs">
              <span>إجمالي الطلبات</span>
              <Building2 className="w-4 h-4 text-cyan-400" />
            </div>
            <div className="mt-2.5">
              <span className="text-2xl font-black text-white font-mono">{totalOrdersCount}</span>
              <span className="text-[10px] text-slate-400 block mt-0.5">مؤسسة مسجلة</span>
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col justify-between">
            <div className="flex items-center justify-between text-slate-400 text-xs">
              <span>بانتظار الدفع</span>
              <Clock className="w-4 h-4 text-amber-400" />
            </div>
            <div className="mt-2.5">
              <span className="text-2xl font-black text-amber-300 font-mono">{pendingCount}</span>
              <span className="text-[10px] text-amber-400/80 block mt-0.5">قيد المراجعة</span>
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-900 border border-cyan-800/40 bg-gradient-to-br from-slate-900 to-cyan-950/20 flex flex-col justify-between">
            <div className="flex items-center justify-between text-slate-400 text-xs">
              <span>تمت الموافقة</span>
              <ShieldCheck className="w-4 h-4 text-cyan-400" />
            </div>
            <div className="mt-2.5">
              <span className="text-2xl font-black text-cyan-300 font-mono">{approvedCount}</span>
              <span className="text-[10px] text-cyan-300/80 block mt-0.5">معتمد في المنظومة</span>
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col justify-between">
            <div className="flex items-center justify-between text-slate-400 text-xs">
              <span>المفعلة والنشطة</span>
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="mt-2.5">
              <span className="text-2xl font-black text-emerald-400 font-mono">{activeCount}</span>
              <span className="text-[10px] text-emerald-300/80 block mt-0.5">مفتاح نشط حالياً</span>
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col justify-between">
            <div className="flex items-center justify-between text-slate-400 text-xs">
              <span>الدفعات المستلمة</span>
              <Receipt className="w-4 h-4 text-indigo-400" />
            </div>
            <div className="mt-2.5">
              <span className="text-2xl font-black text-indigo-300 font-mono">{paidCount}</span>
              <span className="text-[10px] text-slate-400 block mt-0.5">سند مؤكد</span>
            </div>
          </div>

          <div className="col-span-2 sm:col-span-1 p-3.5 rounded-2xl bg-gradient-to-br from-slate-900 to-indigo-950/40 border border-indigo-800/50 flex flex-col justify-between">
            <div className="flex items-center justify-between text-slate-400 text-xs">
              <span>إجمالي المقبوضات</span>
              <TrendingUp className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="mt-2.5">
              <span className="text-lg sm:text-xl font-black text-white font-mono">
                {totalRevenue.toLocaleString()} دج
              </span>
              <span className="text-[10px] text-emerald-400 block mt-0.5">قيمة الاشتراكات</span>
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
                  placeholder="ابحث باسم المدرسة، المدير، اسم المستخدم، الهاتف، الولاية، أو المفتاح..."
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
                  onClick={() => setStatusFilter('approved')}
                  className={`px-3 py-1.5 rounded-lg font-medium transition-colors cursor-pointer ${
                    statusFilter === 'approved' ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  تمت الموافقة ({approvedCount})
                </button>

                <button
                  onClick={() => setStatusFilter('active')}
                  className={`px-3 py-1.5 rounded-lg font-medium transition-colors cursor-pointer ${
                    statusFilter === 'active' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  مفعل ونشط ({activeCount})
                </button>

                <button
                  onClick={() => setStatusFilter('paid')}
                  className={`px-3 py-1.5 rounded-lg font-medium transition-colors cursor-pointer ${
                    statusFilter === 'paid' ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  تم الدفع ({paidCount})
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
                  const badge = getStatusBadge(order.status);
                  const isApproved = order.status === 'approved';
                  const hasManagerCredentials = Boolean(order.adminUsername);

                  return (
                    <div
                      key={order.id}
                      className={`p-5 rounded-2xl bg-slate-900 border transition-all space-y-4 ${
                        isApproved
                          ? 'border-cyan-500/50 shadow-lg shadow-cyan-950/20'
                          : order.status === 'active'
                          ? 'border-emerald-500/40'
                          : 'border-slate-800/90 hover:border-slate-700'
                      }`}
                    >
                      {/* Top Row: School & Status */}
                      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-800">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold shrink-0 ${
                            isApproved
                              ? 'bg-gradient-to-tr from-cyan-600 to-blue-600'
                              : 'bg-gradient-to-tr from-orange-500 to-indigo-600'
                          }`}>
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

                        {/* Status badge and Toggle Dropdown */}
                        <div className="flex items-center flex-wrap gap-2.5">
                          {/* Visual Badge with Icon & Dot */}
                          <div className={`px-3 py-1 rounded-full text-xs font-bold border flex items-center gap-1.5 shadow-sm ${badge.bg}`}>
                            <span className={`w-2 h-2 rounded-full animate-pulse ${badge.dot}`} />
                            <badge.Icon className="w-3.5 h-3.5" />
                            <span>{badge.label}</span>
                          </div>

                          {/* Quick Status Switcher Dropdown */}
                          <div className="flex items-center gap-1.5 bg-slate-950/90 border border-slate-800 hover:border-slate-700 rounded-xl px-2.5 py-1 text-xs transition-colors">
                            <span className="text-[11px] text-slate-400">الحالة:</span>
                            <select
                              value={order.status}
                              onChange={(e) => handleStatusChange(order.id, e.target.value as OrderStatus)}
                              className="bg-transparent text-xs font-bold text-slate-200 focus:outline-none cursor-pointer"
                            >
                              <option value="pending_payment" className="bg-slate-900 text-amber-300">قيد المراجعة والانتظار</option>
                              <option value="approved" className="bg-slate-900 text-cyan-300">تمت الموافقة والإنشاء</option>
                              <option value="active" className="bg-slate-900 text-emerald-300">مفعل ونشط</option>
                              <option value="paid" className="bg-slate-900 text-indigo-300">تم استلام الدفع</option>
                              <option value="cancelled" className="bg-slate-900 text-rose-300">ملغى</option>
                            </select>
                          </div>
                        </div>
                      </div>

                      {/* Manager Credentials Snippet (If exists or approved) */}
                      {(hasManagerCredentials || isApproved || order.remoteProvisionStatus) && (
                        <div className="p-3 rounded-xl bg-gradient-to-r from-cyan-950/40 via-slate-950 to-slate-950 border border-cyan-800/40 flex flex-wrap items-center justify-between gap-3 text-xs">
                          <div className="flex items-center gap-2 text-cyan-300 font-medium">
                            <ShieldCheck className="w-4 h-4 text-cyan-400 shrink-0" />
                            <span>حساب مدير المنظومة:</span>
                            <span className="font-mono font-bold text-white bg-slate-900 px-2 py-0.5 rounded border border-cyan-900/60">
                              {order.adminUsername || 'لم يتم تحديده'}
                            </span>
                            {order.adminPassword && (
                              <span className="text-[11px] text-slate-400 font-mono bg-slate-900/80 px-2 py-0.5 rounded border border-slate-800">
                                كلمة السر: ••••••••
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-2">
                            {order.remoteProvisionStatus === 'success' && (
                              <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-bold flex items-center gap-1 font-mono">
                                <CheckCheck className="w-3 h-3 text-emerald-400" />
                                مرتبط بسيرفر alrouad.com
                              </span>
                            )}
                            
                            {order.adminUsername && (
                              <button
                                onClick={() => handleCopyAllCredentials({
                                  schoolName: order.schoolName,
                                  schoolKey: order.schoolKey,
                                  adminUsername: order.adminUsername || '',
                                  adminPassword: order.adminPassword || 'راجع الإدارة',
                                  loginUrl: (order.provisionedServer || 'https://alrouad.com') + '/login'
                                })}
                                className="px-2.5 py-1 rounded-lg bg-cyan-900/40 hover:bg-cyan-800/60 text-cyan-200 border border-cyan-700/50 flex items-center gap-1 font-medium cursor-pointer"
                              >
                                <Copy className="w-3 h-3" />
                                <span>نسخ بيانات الدخول</span>
                              </button>
                            )}

                            {order.adminUsername && order.phone && (
                              <button
                                onClick={() => handleOpenWhatsApp(order.phone, {
                                  schoolName: order.schoolName,
                                  schoolKey: order.schoolKey,
                                  adminUsername: order.adminUsername || '',
                                  adminPassword: order.adminPassword || 'راجع الإدارة',
                                  loginUrl: (order.provisionedServer || 'https://alrouad.com') + '/login'
                                })}
                                className="px-2.5 py-1 rounded-lg bg-emerald-900/40 hover:bg-emerald-800/60 text-emerald-300 border border-emerald-700/50 flex items-center gap-1 font-medium cursor-pointer"
                                title="إرسال بيانات الدخول عبر WhatsApp"
                              >
                                <MessageSquare className="w-3 h-3" />
                                <span>واتساب</span>
                              </button>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Middle Details Grid */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
                        
                        {/* School Key Card */}
                        <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1.5">
                          <span className="text-[11px] text-slate-400 flex items-center gap-1">
                            <KeyRound className="w-3.5 h-3.5 text-cyan-400" />
                            مفتاح المدرسة (schoolKey):
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
                        
                        {/* Status transition & Provisioning buttons */}
                        <div className="flex flex-wrap items-center gap-2">
                          
                          {/* PRIMARY ACTION: Accept and Provision on alrouad.com */}
                          <button
                            onClick={() => openApprovalModal(order)}
                            className="px-3.5 py-1.5 rounded-lg bg-gradient-to-r from-cyan-600 via-blue-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white font-bold cursor-pointer transition-all shadow-md shadow-cyan-900/30 flex items-center gap-1.5"
                            title="قبول الطلب وإنشاء حساب المدير والربط مع سيرفر alrouad.com وإرسال البريد"
                          >
                            <Sparkles className="w-3.5 h-3.5 text-cyan-200" />
                            <span>{isApproved ? 'إعادة اعتماد وتحديث الحساب (alrouad.com)' : 'قبول واعتماد المدرسة (alrouad.com)'}</span>
                          </button>

                          {order.status !== 'active' && (
                            <button
                              onClick={() => handleStatusChange(order.id, 'active')}
                              className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold cursor-pointer transition-all flex items-center gap-1.5"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>تفعيل فوراً</span>
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

                          {order.status !== 'pending_payment' && order.status !== 'pending' && (
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

      {/* SMTP Diagnostic & Test Email Modal */}
      {showSmtpModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
          <div className="relative w-full max-w-xl my-6 bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden text-right">
            
            <div className="flex items-center justify-between p-5 border-b border-slate-800 bg-slate-950/70">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
                  <Mail className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-white">فحص واختبار خادم البريد (Hostinger SMTP)</h3>
                  <p className="text-xs text-slate-400 font-mono">contact@rudeox.cloud • smtp.hostinger.com:465</p>
                </div>
              </div>

              <button
                onClick={() => setShowSmtpModal(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="p-5 sm:p-6 space-y-5 text-xs sm:text-sm">
              
              {/* Server Connection Status Card */}
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-300">حالة الاتصال بخادم Hostinger:</span>
                  <button
                    onClick={checkSmtp}
                    disabled={isCheckingSmtp}
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-300 text-xs font-semibold cursor-pointer border border-slate-700 transition-colors disabled:opacity-50"
                  >
                    <RefreshCw className={`w-3 h-3 ${isCheckingSmtp ? 'animate-spin' : ''}`} />
                    <span>فحص الاتصال الآن</span>
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-2 text-slate-300 font-mono text-xs">
                  <div className="bg-slate-900/80 p-2 rounded-lg border border-slate-800">
                    <span className="text-slate-500 block text-[10px]">الخادم (HOST):</span>
                    <span>smtp.hostinger.com</span>
                  </div>
                  <div className="bg-slate-900/80 p-2 rounded-lg border border-slate-800">
                    <span className="text-slate-500 block text-[10px]">المنفذ (PORT):</span>
                    <span>465 (SSL Encrypted)</span>
                  </div>
                  <div className="bg-slate-900/80 p-2 rounded-lg border border-slate-800 col-span-2">
                    <span className="text-slate-500 block text-[10px]">حساب الإرسال المعتمد (USER / FROM):</span>
                    <span className="text-cyan-300 font-bold">contact@rudeox.cloud</span>
                  </div>
                </div>

                {smtpStatus && (
                  <div className={`p-2.5 rounded-lg border text-xs font-mono flex items-center gap-2 ${
                    smtpStatus.connected 
                      ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300' 
                      : 'bg-rose-950/40 border-rose-500/40 text-rose-300'
                  }`}>
                    {smtpStatus.connected ? <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" /> : <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />}
                    <span className="truncate">{smtpStatus.response || smtpStatus.error || 'تم التحقق بنجاح'}</span>
                  </div>
                )}
              </div>

              {/* Instant Test Sender Form */}
              <form onSubmit={handleSendTestEmail} className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
                <span className="font-bold text-white block text-xs">إرسال بريد إلكتروني تجريبي فوري (Live SMTP Test):</span>
                
                <div className="flex gap-2">
                  <input
                    type="email"
                    value={testEmailAddress}
                    onChange={(e) => setTestEmailAddress(e.target.value)}
                    placeholder="riyadammmeri@gmail.com"
                    required
                    dir="ltr"
                    className="flex-1 px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white font-mono text-xs focus:outline-none focus:border-cyan-500"
                  />
                  <button
                    type="submit"
                    disabled={isSendingTestEmail}
                    className="px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-md transition-all disabled:opacity-50 shrink-0"
                  >
                    <Send className={`w-3.5 h-3.5 ${isSendingTestEmail ? 'animate-spin' : ''}`} />
                    <span>{isSendingTestEmail ? 'جاري الإرسال...' : 'إرسال اختبار'}</span>
                  </button>
                </div>

                {/* Test Result Feedback */}
                {testEmailResult && (
                  <div className={`p-3 rounded-xl border space-y-1.5 text-xs ${
                    testEmailResult.success 
                      ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-200' 
                      : 'bg-rose-950/40 border-rose-500/40 text-rose-200'
                  }`}>
                    <div className="flex items-center gap-2 font-bold">
                      {testEmailResult.success ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <AlertCircle className="w-4 h-4 text-rose-400" />}
                      <span>{testEmailResult.success ? 'تم إرسال البريد وقبوله من خادم Hostinger بنجاح!' : 'فشل الإرسال'}</span>
                    </div>

                    {testEmailResult.messageId && (
                      <div className="font-mono text-[11px] text-slate-300 break-all">
                        Message-ID: <span className="text-cyan-300">{testEmailResult.messageId}</span>
                      </div>
                    )}

                    {testEmailResult.response && (
                      <div className="font-mono text-[11px] text-slate-400">
                        Hostinger Response: <span className="text-emerald-300">{testEmailResult.response}</span>
                      </div>
                    )}

                    {testEmailResult.error && (
                      <div className="font-mono text-[11px] text-rose-300">
                        Error: {testEmailResult.error}
                      </div>
                    )}
                  </div>
                )}
              </form>

              {/* Spam/Junk Advice Box */}
              <div className="p-3.5 rounded-xl bg-amber-950/30 border border-amber-500/40 text-amber-200 text-xs space-y-1.5 leading-relaxed">
                <strong className="text-amber-300 flex items-center gap-1.5 font-bold">
                  ⚠️ تنبيه هام حول وصول الرسائل إلى بريد Gmail أو Outlook:
                </strong>
                <p>
                  عند استخدام نطاق جديد (<span className="font-mono text-cyan-300">rudeox.cloud</span>)، تقوم خدمات البريد الكبرى مثل Google Gmail غالباً بتوجيه الرسائل الأولى إلى <strong>مجلد الرسائل غير المرغوب فيها (Spam / Junk)</strong> أو علامة تبويب <strong>الترويجات (Promotions)</strong>.
                </p>
                <p className="text-amber-300/90 font-medium">
                  لحل هذا: افتح الرسالة في بريدك وانقر على <strong>«ليس بريداً غير مرغوب فيه (Report Not Spam)»</strong> لتدريب خوادم Gmail على إيصال كافة الإشعارات اللاحقة مباشرة إلى صندوق الوارد (Inbox).
                </p>
              </div>

            </div>

            <div className="p-4 border-t border-slate-800 bg-slate-950/50 flex justify-end">
              <button
                onClick={() => setShowSmtpModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs cursor-pointer"
              >
                إغلاق النافذة
              </button>
            </div>

          </div>
        </div>
      )}

      {/* APPROVAL & ALROUAD.COM PROVISIONING MODAL */}
      {approvingOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-md overflow-y-auto">
          <div className="w-full max-w-2xl bg-slate-900 border border-cyan-500/40 rounded-3xl shadow-2xl overflow-hidden my-6">
            
            {/* Modal Header */}
            <div className="p-5 bg-gradient-to-r from-slate-950 via-cyan-950/40 to-slate-950 border-b border-cyan-900/50 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-cyan-600 to-blue-600 flex items-center justify-center text-white shadow-lg shadow-cyan-900/40 shrink-0">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-black text-white flex items-center gap-2">
                    <span>اعتماد طلب المدرسة وإنشاء الحساب في المنظومة</span>
                  </h3>
                  <p className="text-xs text-slate-400">
                    ربط مع سيرفر alrouad.com وإنشاء حساب المدير وإرسال بيانات الدخول عبر البريد
                  </p>
                </div>
              </div>

              <button
                onClick={() => setApprovingOrder(null)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer transition-colors"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-5 sm:p-6 space-y-5 max-h-[75vh] overflow-y-auto">

              {/* VIEW 1: SUCCESS STATE AFTER APPROVAL & PROVISIONING */}
              {provisionSuccessData ? (
                <div className="space-y-5">
                  
                  {/* Success Banner */}
                  <div className="p-4 rounded-2xl bg-emerald-500/15 border border-emerald-500/40 text-emerald-200 flex items-start gap-3">
                    <CheckCircle2 className="w-6 h-6 text-emerald-400 shrink-0 mt-0.5" />
                    <div className="space-y-1">
                      <h4 className="font-bold text-white text-sm sm:text-base">
                        تم تأكيد واعتماد المدرسة وإنشاء الحساب بنجاح! ✓
                      </h4>
                      <p className="text-xs text-emerald-300/90 leading-relaxed">
                        تم تحديث حالة الطلب إلى <strong className="text-white">«معتمد (Approved)»</strong>، وتم ربط المنظومة مع سيرفر alrouad.com وإرسال البريد الإلكتروني الرسمي للمدير.
                      </p>
                    </div>
                  </div>

                  {/* Integration Status Badges */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                      <span className="text-slate-400 flex items-center gap-1 text-[11px]">
                        <Globe className="w-3.5 h-3.5 text-cyan-400" />
                        حالة الربط مع alrouad.com:
                      </span>
                      <p className="font-semibold text-emerald-300 flex items-center gap-1.5">
                        <CheckCheck className="w-4 h-4 text-emerald-400" />
                        {provisionSuccessData.provisionDetails?.remoteServerMessage || 'تم الإنشاء والربط بالسيرفر بنجاح'}
                      </p>
                    </div>

                    <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                      <span className="text-slate-400 flex items-center gap-1 text-[11px]">
                        <Mail className="w-3.5 h-3.5 text-orange-400" />
                        إشعار البريد الإلكتروني:
                      </span>
                      <p className="font-semibold text-emerald-300 flex items-center gap-1.5">
                        <CheckCheck className="w-4 h-4 text-emerald-400" />
                        {provisionSuccessData.provisionDetails?.emailSent 
                          ? `تم إرسال بيانات الدخول إلى ${approvingOrder.email}`
                          : 'تم تجهيز البيانات (لم يتم إرسال بريد)'}
                      </p>
                    </div>
                  </div>

                  {/* Official Credentials Display Box */}
                  <div className="p-5 rounded-2xl bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 border-2 border-cyan-500/50 shadow-xl space-y-4">
                    <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                      <span className="text-xs font-bold text-cyan-300 flex items-center gap-1.5">
                        <KeyRound className="w-4 h-4 text-cyan-400" />
                        بطاقة بيانات الدخول الرسمية للمدير
                      </span>
                      <span className="text-[11px] font-mono text-slate-400 bg-slate-800/80 px-2 py-0.5 rounded">
                        Redox Platform Login
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                      
                      <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800/90 space-y-1">
                        <span className="text-[11px] text-slate-400">اسم المؤسسة:</span>
                        <p className="font-bold text-white text-sm">{provisionSuccessData.order?.schoolName || approvingOrder.schoolName}</p>
                      </div>

                      <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800/90 space-y-1">
                        <span className="text-[11px] text-slate-400">مفتاح المدرسة (School Key):</span>
                        <p className="font-mono font-black text-cyan-300 text-sm tracking-wide">
                          {provisionSuccessData.order?.schoolKey || approvingOrder.schoolKey}
                        </p>
                      </div>

                      <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800/90 space-y-1">
                        <span className="text-[11px] text-slate-400">اسم مستخدم المدير (Username):</span>
                        <p className="font-mono font-bold text-white text-sm">
                          {provisionSuccessData.credentials?.username || provisionUsername}
                        </p>
                      </div>

                      <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800/90 space-y-1">
                        <span className="text-[11px] text-slate-400">كلمة المرور (Password):</span>
                        <p className="font-mono font-bold text-amber-300 text-sm">
                          {provisionSuccessData.credentials?.password || provisionPassword}
                        </p>
                      </div>

                      <div className="sm:col-span-2 p-3 rounded-xl bg-slate-950/80 border border-slate-800/90 space-y-1">
                        <span className="text-[11px] text-slate-400">رابط تسجيل الدخول للمنظومة:</span>
                        <a 
                          href={provisionSuccessData.credentials?.loginUrl || `${provisionTargetServer}/login`}
                          target="_blank"
                          rel="noreferrer"
                          className="font-mono text-cyan-400 hover:underline flex items-center gap-1 text-xs"
                        >
                          <span>{provisionSuccessData.credentials?.loginUrl || `${provisionTargetServer}/login`}</span>
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      </div>

                    </div>

                    {/* Quick Sharing Buttons */}
                    <div className="pt-2 flex flex-wrap items-center gap-2.5">
                      <button
                        onClick={() => handleCopyAllCredentials({
                          schoolName: approvingOrder.schoolName,
                          schoolKey: approvingOrder.schoolKey,
                          adminUsername: provisionSuccessData.credentials?.username || provisionUsername,
                          adminPassword: provisionSuccessData.credentials?.password || provisionPassword,
                          loginUrl: provisionSuccessData.credentials?.loginUrl || `${provisionTargetServer}/login`
                        })}
                        className="flex-1 py-2.5 px-4 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs flex items-center justify-center gap-2 cursor-pointer shadow-md shadow-cyan-900/30 transition-all"
                      >
                        {copiedAllCredentials ? <Check className="w-4 h-4 text-emerald-300" /> : <Copy className="w-4 h-4" />}
                        <span>{copiedAllCredentials ? 'تم نسخ جميع البيانات بنجاح! ✓' : 'نسخ جميع بيانات الدخول'}</span>
                      </button>

                      {approvingOrder.phone && (
                        <button
                          onClick={() => handleOpenWhatsApp(approvingOrder.phone, {
                            schoolName: approvingOrder.schoolName,
                            schoolKey: approvingOrder.schoolKey,
                            adminUsername: provisionSuccessData.credentials?.username || provisionUsername,
                            adminPassword: provisionSuccessData.credentials?.password || provisionPassword,
                            loginUrl: provisionSuccessData.credentials?.loginUrl || `${provisionTargetServer}/login`
                          })}
                          className="py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-2 cursor-pointer shadow-md shadow-emerald-900/30 transition-all"
                          title="إرسال البيانات إلى هاتف المدير عبر واتساب"
                        >
                          <MessageSquare className="w-4 h-4" />
                          <span>إرسال واتساب</span>
                        </button>
                      )}

                      <button
                        onClick={() => {
                          const updated = orders.find(o => o.id === approvingOrder.id) || approvingOrder;
                          onViewEmail(updated);
                        }}
                        className="py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-300 font-bold text-xs flex items-center gap-1.5 cursor-pointer transition-colors"
                      >
                        <Mail className="w-4 h-4" />
                        <span>معاينة إشعار البريد</span>
                      </button>
                    </div>

                  </div>

                </div>
              ) : (

                /* VIEW 2: FORM TO CONFIGURE & EXECUTE APPROVAL */
                <div className="space-y-5">
                  
                  {/* School Overview Card */}
                  <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
                    <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                      <div>
                        <span className="text-[11px] text-slate-400">المؤسسة التعليمية:</span>
                        <h4 className="text-base font-bold text-white">{approvingOrder.schoolName}</h4>
                      </div>
                      <div className="text-left">
                        <span className="text-[11px] text-slate-400">المبلغ والمشترك:</span>
                        <p className="font-mono font-bold text-emerald-400 text-sm">{approvingOrder.priceDzd.toLocaleString()} دج ({approvingOrder.planName})</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-slate-800/80 text-[11px]">
                      <div>
                        <span className="text-slate-500 block">المدير المسؤول:</span>
                        <span className="text-slate-200 font-semibold">{approvingOrder.directorName}</span>
                      </div>
                      <div>
                        <span className="text-slate-500 block">الولاية:</span>
                        <span className="text-slate-200 font-semibold">{approvingOrder.wilaya}</span>
                      </div>
                      <div>
                        <span className="text-slate-500 block">رقم الهاتف:</span>
                        <span className="text-cyan-300 font-mono">{approvingOrder.phone}</span>
                      </div>
                      <div>
                        <span className="text-slate-500 block">البريد الإلكتروني:</span>
                        <span className="text-slate-200 font-mono truncate block" title={approvingOrder.email}>{approvingOrder.email}</span>
                      </div>
                    </div>

                    <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between">
                      <span className="text-[11px] text-slate-400 flex items-center gap-1">
                        <KeyRound className="w-3.5 h-3.5 text-cyan-400" />
                        مفتاح المدرسة المعتمد:
                      </span>
                      <span className="font-mono font-bold text-cyan-300 text-xs tracking-wider">
                        {approvingOrder.schoolKey}
                      </span>
                    </div>
                  </div>

                  {/* Credentials Fields Form */}
                  <div className="space-y-4">
                    
                    {/* Admin Username Field */}
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                          <Users className="w-3.5 h-3.5 text-cyan-400" />
                          <span>اسم مستخدم المدير (Admin Username)</span>
                          <span className="text-rose-400">*</span>
                        </label>
                        <button
                          type="button"
                          onClick={handleGenerateRandomUsername}
                          className="text-[11px] text-cyan-400 hover:text-cyan-300 flex items-center gap-1 cursor-pointer font-medium"
                        >
                          <RefreshCw className="w-3 h-3" />
                          <span>توليد عشوائي</span>
                        </button>
                      </div>
                      <input
                        type="text"
                        value={provisionUsername}
                        onChange={(e) => setProvisionUsername(e.target.value)}
                        placeholder="مثال: admin_school_01"
                        dir="ltr"
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white font-mono placeholder:text-slate-600 focus:outline-none focus:border-cyan-500 transition-colors"
                      />
                      <p className="text-[10px] text-slate-500">
                        اسم الحساب الذي سيستخدمه مدير المدرسة للدخول وإدارة النظام.
                      </p>
                    </div>

                    {/* Admin Password Field */}
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                          <LockKeyhole className="w-3.5 h-3.5 text-amber-400" />
                          <span>كلمة المرور الشخصية للمدير (Password)</span>
                          <span className="text-rose-400">*</span>
                        </label>
                        <button
                          type="button"
                          onClick={handleGenerateRandomPassword}
                          className="text-[11px] text-amber-400 hover:text-amber-300 flex items-center gap-1 cursor-pointer font-medium"
                        >
                          <Sparkles className="w-3 h-3" />
                          <span>توليد كلمة سر قوية</span>
                        </button>
                      </div>
                      <div className="relative">
                        <input
                          type={showPasswordInModal ? 'text' : 'password'}
                          value={provisionPassword}
                          onChange={(e) => setProvisionPassword(e.target.value)}
                          placeholder="أدخل كلمة مرور قوية"
                          dir="ltr"
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl pr-4 pl-12 py-2.5 text-xs text-white font-mono placeholder:text-slate-600 focus:outline-none focus:border-amber-500 transition-colors"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPasswordInModal(!showPasswordInModal)}
                          className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white cursor-pointer p-1"
                        >
                          {showPasswordInModal ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                      <p className="text-[10px] text-slate-500">
                        الكلمة التي حددها المدير أو التي تعينها له المنظومة الآن (ستصل للمدير في بريده الإلكتروني).
                      </p>
                    </div>

                    {/* Target Server Endpoint */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                        <Globe className="w-3.5 h-3.5 text-indigo-400" />
                        <span>سيرفر المنظومة المستهدف للربط والتسجيل (Server Endpoint)</span>
                      </label>
                      <input
                        type="text"
                        value={provisionTargetServer}
                        onChange={(e) => setProvisionTargetServer(e.target.value)}
                        placeholder="https://alrouad.com"
                        dir="ltr"
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-cyan-300 font-mono placeholder:text-slate-600 focus:outline-none focus:border-indigo-500 transition-colors"
                      />
                      <p className="text-[10px] text-slate-500">
                        سيقوم النظام بإرسال ريكويست آلي إلى السيرفر (<code className="font-mono text-cyan-400">{provisionTargetServer}/api/redox-admin/school</code>) لإنشاء حساب المدير والمدرسة.
                      </p>
                    </div>

                    {/* Email Option Checkbox */}
                    <div className="p-3.5 rounded-2xl bg-cyan-950/20 border border-cyan-800/40">
                      <label className="flex items-start gap-3 cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={provisionSendEmail}
                          onChange={(e) => setProvisionSendEmail(e.target.checked)}
                          className="mt-0.5 w-4 h-4 text-cyan-600 rounded bg-slate-900 border-slate-700 focus:ring-0 cursor-pointer"
                        />
                        <div className="space-y-0.5 text-xs">
                          <span className="font-bold text-white block">
                            إرسال رسالة بريد إلكتروني رسمية بالبيانات فوراً عبر Hostinger SMTP
                          </span>
                          <span className="text-slate-400 block text-[11px]">
                            تتضمن الرسالة اسم المستخدم، كلمة السر، مفتاح المدرسة، ورابط الدخول إلى بريد: <strong className="text-cyan-300">{approvingOrder.email}</strong>
                          </span>
                        </div>
                      </label>
                    </div>

                  </div>

                </div>
              )}

            </div>

            {/* Modal Footer */}
            <div className="p-4 sm:p-5 border-t border-slate-800 bg-slate-950/70 flex flex-wrap items-center justify-between gap-3">
              <button
                onClick={() => setApprovingOrder(null)}
                className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs cursor-pointer transition-colors"
              >
                {provisionSuccessData ? 'إغلاق والعودة للطلبات' : 'إلغاء'}
              </button>

              {!provisionSuccessData && (
                <button
                  onClick={handleExecuteApproval}
                  disabled={isProvisioning}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-600 via-blue-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white font-bold text-xs flex items-center gap-2 cursor-pointer shadow-lg shadow-cyan-900/30 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  {isProvisioning ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin text-cyan-200" />
                      <span>جارٍ الربط بسيرفر alrouad.com والاعتماد...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 text-cyan-200" />
                      <span>تأكيد القبول وإنشاء المدرسة في alrouad.com فوراً</span>
                    </>
                  )}
                </button>
              )}
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
