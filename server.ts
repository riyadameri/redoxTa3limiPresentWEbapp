import express, { Request, Response } from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { sendOrderNotificationEmail } from './emailService';
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
  directorName: string;
  phone: string;
  email: string;
  studentCountEstimate?: number;
  planId: string;
  planName: string;
  billingCycle: 'monthly' | 'yearly';
  priceCentimes: string;
  priceDzd: number;
  paymentMethod: 'baridimob' | 'ccp' | 'bank_transfer' | 'cash_office';
  status: 'pending_payment' | 'paid' | 'active' | 'cancelled';
  createdAt: string;
  activatedAt?: string;
  emailNotificationSent: boolean;
  notes?: string;
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
      notes: notes || ''
    };

    // Save to database (MongoDB / fallback)
    await insertOrder(newOrder);

    // Asynchronously send confirmation email via Hostinger SMTP
    if (newOrder.email) {
      sendOrderNotificationEmail(newOrder).then((result) => {
        if (result.success) {
          console.log(`[Email] Customer order notification email delivered to ${newOrder.email} (MessageId: ${result.messageId})`);
        } else {
          console.warn(`[Email] Could not send email to ${newOrder.email}:`, result.error);
        }
      }).catch((err) => {
        console.error('[Email] Unexpected error in async email dispatcher:', err);
      });
    }

    res.status(201).json({
      success: true,
      message: 'تم تسجيل طلب الاشتراك وتوليد المفتاح بنجاح وحفظه في قاعدة البيانات وإرسال رسالة التأكيد عبر البريد الإلكتروني',
      order: newOrder
    });
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
        messageId: emailResult.messageId
      });
    } else {
      res.status(500).json({
        success: false,
        message: `فشل إرسال البريد الإلكتروني: ${emailResult.error}`
      });
    }
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
      activatedAt: status === 'active' ? (current.activatedAt || now) : current.activatedAt,
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
