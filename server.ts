import dotenv from 'dotenv';
dotenv.config();
dotenv.config({ path: '.env.example' });

import express, { Request, Response } from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { 
  sendOrderNotificationEmail, 
  sendApprovalCredentialsEmail,
  verifySmtpConnection, 
  sendTestDiagnosticEmail 
} from './emailService';
import {
  initDatabase,
  isUsingMongo,
  getAllOrders,
  getOrderById,
  getOrderByKey,
  insertOrder,
  updateOrder,
  deleteOrder,
  getAllDemos,
  insertDemo,
  updateDemoStatus
} from './mongoService';

// Interfaces for backend models
export interface ServerSchoolOrder {
  id: string;
  schoolKey: string;
  schoolName: string;
  schoolType: string;
  wilaya: string;
  address?: string;
  directorName: string;
  phone: string;
  email: string;
  studentCountEstimate?: number;
  planId: string;
  planName: string;
  billingCycle: 'monthly' | 'yearly';
  priceCentimes: string;
  priceDzd: number;
  paymentMethod: string;
  status: 'pending_payment' | 'pending' | 'approved' | 'active' | 'paid' | 'cancelled';
  createdAt: string;
  activatedAt?: string;
  emailNotificationSent: boolean;
  notes?: string;
  adminUsername?: string;
  adminPassword?: string;
  provisionedAt?: string;
  provisionedServer?: string;
  remoteSchoolId?: string;
  remoteProvisionStatus?: 'success' | 'remote_error' | 'skipped';
}

export interface ServerDemoRequest {
  id: string;
  schoolName: string;
  contactName: string;
  phone: string;
  email?: string;
  wilaya: string;
  preferredTime?: string;
  notes?: string;
  createdAt: string;
  status: 'pending' | 'contacted' | 'completed';
}

// Key generation helper
function generateSchoolKey(wilayaStr?: string): string {
  const prefix = 'RDX';
  let wilayaCode = 'ALG';
  if (wilayaStr) {
    const match = wilayaStr.match(/^(\d{2})/);
    if (match) {
      wilayaCode = `W${match[1]}`;
    }
  }
  const year = new Date().getFullYear();
  const randomHex = Math.floor(1000 + Math.random() * 9000);
  return `${prefix}-${wilayaCode}-${year}-${randomHex}`;
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Initialize MongoDB connection (with automatic fallback to JSON store)
  const dbStatus = await initDatabase();
  console.log(`[Redox Ta3limi Server] Database status: ${dbStatus.message} (MongoDB active: ${dbStatus.isMongo})`);

  // Middleware
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // ==========================================
  // REST API ENDPOINTS
  // ==========================================

  // 1. Health check & DB engine check
  app.get('/api/health', async (req: Request, res: Response) => {
    const orders = await getAllOrders();
    res.json({
      status: 'ok',
      service: 'Redox Ta3limi Backend API',
      database: isUsingMongo() ? 'MongoDB' : 'Local JSON Fallback',
      isMongoConnected: isUsingMongo(),
      mongoDbName: process.env.MONGODB_DB || 'redox_ta3limi',
      version: '1.0.0',
      timestamp: new Date().toISOString(),
      activeOrdersCount: orders.length
    });
  });

  // 2. Summary stats for admin dashboard
  app.get('/api/stats', async (req: Request, res: Response) => {
    const orders = await getAllOrders();
    const demos = await getAllDemos();

    const totalOrders = orders.length;
    const activeSchools = orders.filter(o => o.status === 'active').length;
    const pendingOrders = orders.filter(o => o.status === 'pending_payment').length;
    const totalRevenueDzd = orders
      .filter(o => o.status === 'active' || o.status === 'paid')
      .reduce((sum, o) => sum + (o.priceDzd || 0), 0);
    const demoRequestsCount = demos.length;

    res.json({
      success: true,
      data: {
        totalOrders,
        activeSchools,
        pendingOrders,
        totalRevenueDzd,
        demoRequestsCount,
        databaseType: isUsingMongo() ? 'MongoDB' : 'Local JSON File'
      }
    });
  });

  // 3. Admin PIN verification (Secure check)
  app.post('/api/admin/login', (req: Request, res: Response) => {
    const { pin } = req.body;
    const expectedPin = process.env.ADMIN_PIN || 'riyad911';

    if (pin === expectedPin) {
      res.json({
        success: true,
        message: 'تم تسجيل الدخول بنجاح',
        token: `rdx-auth-${Date.now().toString(36)}`
      });
    } else {
      res.status(401).json({
        success: false,
        message: 'رمز الدخول غير صحيح'
      });
    }
  });

  // 4. Orders CRUD API
  // GET all orders
  app.get('/api/orders', async (req: Request, res: Response) => {
    const orders = await getAllOrders();
    res.json({
      success: true,
      orders,
      databaseType: isUsingMongo() ? 'mongodb' : 'local'
    });
  });

  // GET single order
  app.get('/api/orders/:id', async (req: Request, res: Response) => {
    const order = await getOrderById(req.params.id);
    if (!order) {
      return res.status(404).json({ success: false, message: 'الطلب غير موجود' });
    }
    res.json({ success: true, order });
  });

  // POST create new order
  app.post('/api/orders', async (req: Request, res: Response) => {
    const {
      schoolName,
      schoolType,
      wilaya,
      address,
      directorName,
      phone,
      email,
      studentCountEstimate,
      planId,
      planName,
      billingCycle,
      priceCentimes,
      priceDzd,
      paymentMethod,
      adminUsername,
      adminPassword,
      notes
    } = req.body;

    if (!schoolName || !directorName || !phone || !wilaya) {
      return res.status(400).json({
        success: false,
        message: 'يرجى ملء جميع الحقول الإلزامية'
      });
    }

    const id = `ord-${Date.now().toString(36)}`;
    const schoolKey = generateSchoolKey(wilaya);
    const now = new Date().toISOString().replace('T', ' ').slice(0, 16);

    const newOrder: ServerSchoolOrder = {
      id,
      schoolKey,
      schoolName,
      schoolType: schoolType || 'مدرسة خاصة',
      wilaya,
      address: address || '',
      directorName,
      phone,
      email: email || '',
      studentCountEstimate: studentCountEstimate ? Number(studentCountEstimate) : undefined,
      planId: planId || 'plan-3',
      planName: planName || 'الباقة الثالثة',
      billingCycle: billingCycle || 'monthly',
      priceCentimes: priceCentimes || '',
      priceDzd: priceDzd ? Number(priceDzd) : 0,
      paymentMethod: paymentMethod || 'baridimob',
      status: 'pending_payment',
      createdAt: now,
      emailNotificationSent: true,
      notes: notes || '',
      adminUsername: adminUsername || '',
      adminPassword: adminPassword || ''
    };

    // Save to database (MongoDB / fallback)
    await insertOrder(newOrder);

    // Send confirmation email via Hostinger SMTP
    let emailStatus: { success: boolean; messageId?: string; response?: string; error?: string } = {
      success: false
    };

    if (newOrder.email) {
      try {
        emailStatus = await sendOrderNotificationEmail(newOrder);
        if (emailStatus.success) {
          console.log(`[Email] Customer order notification email delivered to ${newOrder.email} (MessageId: ${emailStatus.messageId})`);
        } else {
          console.warn(`[Email] Could not send email to ${newOrder.email}:`, emailStatus.error);
        }
      } catch (err: any) {
        console.error('[Email] Unexpected error in email dispatcher:', err);
        emailStatus = { success: false, error: err?.message };
      }
    }

    res.status(201).json({
      success: true,
      message: emailStatus.success
        ? 'تم تسجيل طلب الاشتراك وتوليد المفتاح وإرسال رسالة التأكيد عبر البريد الإلكتروني بنجاح'
        : 'تم تسجيل طلب الاشتراك وتوليد المفتاح بنجاح وحفظه في قاعدة البيانات',
      order: newOrder,
      emailSent: emailStatus.success,
      emailMessageId: emailStatus.messageId,
      emailResponse: emailStatus.response,
      emailError: emailStatus.error
    });
  });

  // SMTP Email Health & Diagnostic endpoints
  app.get('/api/email/status', async (req: Request, res: Response) => {
    const status = await verifySmtpConnection();
    res.json(status);
  });

  app.post('/api/email/test', async (req: Request, res: Response) => {
    const { toEmail } = req.body;
    const target = toEmail || 'contact@rudeox.cloud';
    const result = await sendTestDiagnosticEmail(target);
    res.json(result);
  });

  // POST send / resend email notification for an order
  app.post('/api/orders/:id/send-email', async (req: Request, res: Response) => {
    const order = await getOrderById(req.params.id);
    if (!order) {
      return res.status(404).json({ success: false, message: 'الطلب غير موجود' });
    }

    if (!order.email) {
      return res.status(400).json({ success: false, message: 'الطلب لا يحتوي على بريد إلكتروني صالح' });
    }

    const emailResult = await sendOrderNotificationEmail(order);
    if (emailResult.success) {
      res.json({
        success: true,
        message: `تم إرسال البريد الإلكتروني بنجاح إلى ${order.email}`,
        messageId: emailResult.messageId,
        response: emailResult.response
      });
    } else {
      res.status(500).json({
        success: false,
        message: `فشل إرسال البريد الإلكتروني: ${emailResult.error}`
      });
    }
  });

  // 4. APPROVE ORDER & PROVISION SCHOOL AT ALROUAD.COM
  app.post('/api/orders/:id/approve', async (req: Request, res: Response) => {
    const current = await getOrderById(req.params.id);

    if (!current) {
      return res.status(404).json({ success: false, message: 'الطلب غير موجود' });
    }

    const {
      adminUsername: customUsername,
      adminPassword: customPassword,
      targetServer = process.env.ALROUAD_API_URL || 'https://alrouad.com',
      sendCredentialsEmail = true,
      planOverride,
      subscriptionDurationOverride
    } = req.body;

    // Generate credentials if not provided
    const cleanKeyPart = current.schoolKey ? current.schoolKey.replace(/[^a-zA-Z0-9]/g, '').slice(-5).toLowerCase() : 'sch';
    const adminUsername = customUsername || current.adminUsername || `admin_${cleanKeyPart}`;
    const adminPassword = customPassword || current.adminPassword || `Rdx${Math.floor(1000 + Math.random() * 9000)}!#`;

    // Map plan to alrouad enum ['basic', 'standard', 'premium', 'enterprise', 'trial']
    let plan = planOverride || 'standard';
    if (!planOverride) {
      const planStr = ((current.planId || '') + ' ' + (current.planName || '')).toLowerCase();
      if (planStr.includes('1') || planStr.includes('basic') || planStr.includes('أول') || planStr.includes('اول')) {
        plan = 'basic';
      } else if (planStr.includes('2') || planStr.includes('standard') || planStr.includes('ثاني')) {
        plan = 'standard';
      } else if (planStr.includes('3') || planStr.includes('premium') || planStr.includes('ثالث')) {
        plan = 'premium';
      } else if (planStr.includes('4') || planStr.includes('enterprise') || planStr.includes('رابع')) {
        plan = 'enterprise';
      }
    }

    const subscriptionDuration = subscriptionDurationOverride 
      ? Number(subscriptionDurationOverride) 
      : (current.billingCycle === 'yearly' ? 12 : 1);

    const alrouadServerUrl = (targetServer || 'https://alrouad.com').replace(/\/+$/, '');
    const alrouadEndpoint = `${alrouadServerUrl}/api/redox-admin/school`;

    const alrouadPayload = {
      name: current.schoolName,
      email: current.email || `${adminUsername}@alrouad.com`,
      phone: current.phone,
      address: current.address || current.wilaya,
      key: current.schoolKey,
      adminUsername,
      adminPassword,
      adminFullName: current.directorName,
      adminEmail: current.email || `${adminUsername}@alrouad.com`,
      adminPhone: current.phone,
      plan,
      subscriptionDuration,
      subscriptionAmount: current.priceDzd || 0
    };

    console.log(`[Provisioning] Connecting to alrouad.com at ${alrouadEndpoint} for school: ${current.schoolName}...`);

    let remoteResult: {
      success: boolean;
      message: string;
      endpoint: string;
      data?: any;
    } = {
      success: false,
      message: 'لم يتم الاتصال',
      endpoint: alrouadEndpoint
    };

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 7000);

      const remoteRes = await fetch(alrouadEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(alrouadPayload),
        signal: controller.signal
      });
      clearTimeout(timeoutId);

      const resText = await remoteRes.text();
      let resJson: any = null;
      try {
        resJson = JSON.parse(resText);
      } catch {
        resJson = { rawResponse: resText.slice(0, 300) };
      }

      if (remoteRes.ok) {
        remoteResult = {
          success: true,
          message: resJson.message || 'تم ربط المدرسة وإنشاء حساب المدير على سيرفر alrouad.com بنجاح ✓',
          endpoint: alrouadEndpoint,
          data: resJson
        };
        console.log(`[Provisioning] Successfully provisioned on alrouad.com:`, resJson);
      } else {
        remoteResult = {
          success: false,
          message: resJson?.message || `رد خادم alrouad.com برمز (${remoteRes.status})`,
          endpoint: alrouadEndpoint,
          data: resJson
        };
        console.warn(`[Provisioning] alrouad.com responded with non-200:`, remoteRes.status, resJson);
      }
    } catch (remoteErr: any) {
      const isTimeout = remoteErr.name === 'AbortError';
      remoteResult = {
        success: false,
        message: isTimeout 
          ? 'انتهت مهلة استجابة سيرفر alrouad.com (تجاوز 7 ثوانٍ)' 
          : (remoteErr.message || 'تعذر الوصول إلى سيرفر alrouad.com'),
        endpoint: alrouadEndpoint
      };
      console.warn(`[Provisioning] Error calling alrouad.com:`, remoteResult.message);
    }

    const now = new Date().toISOString().replace('T', ' ').slice(0, 16);
    const updatedOrder = await updateOrder(current.id, {
      status: 'approved',
      activatedAt: current.activatedAt || now,
      adminUsername,
      adminPassword,
      provisionedAt: now,
      provisionedServer: alrouadServerUrl,
      remoteSchoolId: remoteResult.data?.school?._id || remoteResult.data?.school?.id || remoteResult.data?._id,
      remoteProvisionStatus: remoteResult.success ? 'success' : 'remote_error'
    });

    // Send credentials email via Hostinger SMTP
    let emailStatus: { success: boolean; messageId?: string; response?: string; error?: string } = {
      success: false
    };

    if (sendCredentialsEmail && current.email) {
      try {
        emailStatus = await sendApprovalCredentialsEmail(updatedOrder || current, {
          username: adminUsername,
          password: adminPassword,
          loginUrl: `${alrouadServerUrl}/login`,
          remoteServerUrl: alrouadServerUrl
        });
      } catch (err: any) {
        console.error('[Email] Approval email sending error:', err);
        emailStatus = { success: false, error: err?.message };
      }
    }

    res.json({
      success: true,
      message: 'تمت الموافقة على طلب المدرسة واعتماد الحساب بنجاح',
      order: updatedOrder,
      credentials: {
        schoolKey: current.schoolKey,
        adminUsername,
        adminPassword,
        loginUrl: `${alrouadServerUrl}/login`,
        schoolName: current.schoolName,
        directorName: current.directorName
      },
      remote: remoteResult,
      emailSent: emailStatus.success,
      emailStatus
    });
  });

  // PUT / PATCH update order status
  app.put('/api/orders/:id/status', async (req: Request, res: Response) => {
    const { status, notes } = req.body;
    const current = await getOrderById(req.params.id);

    if (!current) {
      return res.status(404).json({ success: false, message: 'الطلب غير موجود' });
    }

    const now = new Date().toISOString().replace('T', ' ').slice(0, 16);
    const updated = await updateOrder(req.params.id, {
      status: status || current.status,
      activatedAt: (status === 'active' || status === 'approved') ? (current.activatedAt || now) : current.activatedAt,
      notes: notes !== undefined ? notes : current.notes
    });

    res.json({
      success: true,
      message: 'تم تحديث حالة الطلب بنجاح',
      order: updated
    });
  });

  // POST regenerate school key
  app.post('/api/orders/:id/regenerate-key', async (req: Request, res: Response) => {
    const current = await getOrderById(req.params.id);

    if (!current) {
      return res.status(404).json({ success: false, message: 'الطلب غير موجود' });
    }

    const newKey = generateSchoolKey(current.wilaya);
    const updated = await updateOrder(req.params.id, { schoolKey: newKey });

    res.json({
      success: true,
      message: 'تم توليد مفتاح جديد بنجاح وحفظه في قاعدة البيانات',
      schoolKey: newKey,
      order: updated
    });
  });

  // DELETE order
  app.delete('/api/orders/:id', async (req: Request, res: Response) => {
    const deleted = await deleteOrder(req.params.id);
    if (!deleted) {
      return res.status(404).json({ success: false, message: 'الطلب غير موجود' });
    }

    res.json({ success: true, message: 'تم حذف الطلب بنجاح من قاعدة البيانات' });
  });

  // 5. Demo Requests API
  // GET all demo requests
  app.get('/api/demos', async (req: Request, res: Response) => {
    const demos = await getAllDemos();
    res.json({
      success: true,
      demos
    });
  });

  // POST create demo request
  app.post('/api/demos', async (req: Request, res: Response) => {
    const { schoolName, contactName, phone, email, wilaya, preferredTime, notes } = req.body;

    if (!schoolName || !contactName || !phone) {
      return res.status(400).json({
        success: false,
        message: 'يرجى تزويدنا باسم المؤسسة، المسؤول، ورقم الهاتف'
      });
    }

    const id = `demo-${Date.now().toString(36)}`;
    const now = new Date().toISOString().replace('T', ' ').slice(0, 16);

    const newDemo: ServerDemoRequest = {
      id,
      schoolName,
      contactName,
      phone,
      email: email || '',
      wilaya: wilaya || '',
      preferredTime: preferredTime || '',
      notes: notes || '',
      createdAt: now,
      status: 'pending'
    };

    await insertDemo(newDemo);

    res.status(201).json({
      success: true,
      message: 'تم استلام طلب تجربة النظام وسيتصل بكم مستشارنا قريباً',
      demo: newDemo
    });
  });

  // PUT update demo status
  app.put('/api/demos/:id/status', async (req: Request, res: Response) => {
    const { status } = req.body;
    const updated = await updateDemoStatus(req.params.id, status);

    if (!updated) {
      return res.status(404).json({ success: false, message: 'طلب التجربة غير موجود' });
    }

    res.json({
      success: true,
      message: 'تم تحديث حالة طلب التجربة',
      demo: updated
    });
  });

  // 6. License Verification Endpoint (For Desktop software / School instances)
  app.get('/api/license/verify/:key', async (req: Request, res: Response) => {
    const key = req.params.key;
    const order = await getOrderByKey(key);

    if (!order) {
      return res.status(404).json({
        valid: false,
        message: 'مفتاح الترخيص غير مسجل في منظومة Redox التعليمية'
      });
    }

    const isActive = order.status === 'active';
    res.json({
      valid: isActive,
      status: order.status,
      schoolName: order.schoolName,
      schoolType: order.schoolType,
      wilaya: order.wilaya,
      planId: order.planId,
      planName: order.planName,
      billingCycle: order.billingCycle,
      activatedAt: order.activatedAt,
      database: isUsingMongo() ? 'MongoDB' : 'Local Storage',
      message: isActive ? 'الترخيص نشط ومعتمد سحابياً' : 'الترخيص غير نشط، يرجى استكمال إجراءات الدفع'
    });
  });

  // ==========================================
  // VITE / STATIC SERVING MIDDLEWARE
  // ==========================================
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Redox Ta3limi Server] Backend API running at http://0.0.0.0:${PORT}`);
  });
}

startServer();
