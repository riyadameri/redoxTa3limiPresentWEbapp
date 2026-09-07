import dotenv from 'dotenv';
dotenv.config();
dotenv.config({ path: '.env.example' });

import nodemailer, { Transporter } from 'nodemailer';
import type { ServerSchoolOrder } from './server';

// Configuration
const SMTP_CONFIG = {
  host: process.env.SMTP_HOST || 'smtp.hostinger.com',
  port: Number(process.env.SMTP_PORT) || 465,
  user: process.env.SMTP_USER || 'contact@rudeox.cloud',
  pass: process.env.SMTP_PASS || 'riyadhack900-D',
  from: process.env.SMTP_FROM || '"Redox Ta3limi" <contact@rudeox.cloud>',
  fromName: 'Redox Ta3limi'
};

// Lazy initialized transporter for Hostinger SMTP
let transporter: Transporter | null = null;

function createTransporter(port: number, secure: boolean): Transporter {
  return nodemailer.createTransport({
    host: SMTP_CONFIG.host,
    port,
    secure, // true for 465 (SSL), false for 587 (STARTTLS)
    auth: {
      user: SMTP_CONFIG.user,
      pass: SMTP_CONFIG.pass
    },
    tls: {
      rejectUnauthorized: false
    },
    connectionTimeout: 10000,
    greetingTimeout: 10000,
    socketTimeout: 15000
  });
}

export function getMailTransporter(): Transporter {
  if (!transporter) {
    transporter = createTransporter(SMTP_CONFIG.port, SMTP_CONFIG.port === 465);
  }
  return transporter;
}

/**
 * Verifies live connection to Hostinger SMTP server
 */
export async function verifySmtpConnection(): Promise<{ 
  connected: boolean; 
  host: string; 
  port: number; 
  user: string; 
  error?: string;
  response?: string;
}> {
  try {
    const mailer = getMailTransporter();
    const verified = await mailer.verify();
    return {
      connected: true,
      host: SMTP_CONFIG.host,
      port: SMTP_CONFIG.port,
      user: SMTP_CONFIG.user,
      response: typeof verified === 'string' ? verified : 'SMTP connection verified successfully (250 OK)'
    };
  } catch (err: any) {
    console.warn('[SMTP Verify] Port 465 failed, testing port 587 STARTTLS fallback...', err?.message);
    try {
      const fallbackMailer = createTransporter(587, false);
      await fallbackMailer.verify();
      transporter = fallbackMailer; // switch to fallback
      return {
        connected: true,
        host: SMTP_CONFIG.host,
        port: 587,
        user: SMTP_CONFIG.user,
        response: 'Connected via port 587 (STARTTLS fallback)'
      };
    } catch (fallbackErr: any) {
      return {
        connected: false,
        host: SMTP_CONFIG.host,
        port: SMTP_CONFIG.port,
        user: SMTP_CONFIG.user,
        error: fallbackErr?.message || err?.message || 'SMTP Authentication or Connection error'
      };
    }
  }
}

/**
 * Sends a live test email to any recipient to verify deliverability
 */
export async function sendTestDiagnosticEmail(toEmail: string): Promise<{
  success: boolean;
  messageId?: string;
  response?: string;
  error?: string;
}> {
  if (!toEmail || !toEmail.includes('@')) {
    return { success: false, error: 'البريد الإلكتروني المدخل غير صالح' };
  }

  const mailer = getMailTransporter();
  const subject = `اختبار فحص خادم البريد Hostinger - منظومة Redox Ta3limi [${new Date().toLocaleTimeString('ar-DZ')}]`;

  const html = `
  <div dir="rtl" style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; color: #0f172a; padding: 24px; border-radius: 12px; border: 1px solid #e2e8f0; max-width: 540px; margin: 0 auto;">
    <div style="text-align: center; margin-bottom: 20px;">
      <h2 style="color: #0284c7; margin: 0 0 8px 0;">✓ خادم البريد Hostinger متصل ويعمل بنجاح</h2>
      <p style="color: #64748b; font-size: 13px; margin: 0;">Redox Ta3limi Cloud Notification System</p>
    </div>
    
    <div style="background: #ffffff; padding: 16px; border-radius: 8px; border: 1px solid #cbd5e1; font-size: 13px; line-height: 1.8;">
      <p style="margin: 0 0 8px 0;"><strong>المرسل المعتمد:</strong> ${SMTP_CONFIG.user}</p>
      <p style="margin: 0 0 8px 0;"><strong>المستلم:</strong> ${toEmail}</p>
      <p style="margin: 0 0 8px 0;"><strong>الخادم:</strong> ${SMTP_CONFIG.host} (Port ${SMTP_CONFIG.port})</p>
      <p style="margin: 0;"><strong>وقت الإرسال:</strong> ${new Date().toLocaleString('ar-DZ')}</p>
    </div>

    <div style="background: #ecfdf5; border: 1px solid #10b981; border-radius: 8px; padding: 12px; margin-top: 16px; font-size: 12px; color: #065f46;">
      💡 ملاحظة: إذا وصل هذا البريد في مجلد الرسائل غير المرغوب فيها (Spam / Junk)، يرجى النقر على "ليس غير مرغوب فيه (Report Not Spam)" لتدريب بريدك على استقبال إشعارات المنظومة في صندوق الوارد مباشرة.
    </div>
  </div>
  `;

  try {
    const info = await mailer.sendMail({
      from: SMTP_CONFIG.from,
      to: toEmail,
      replyTo: SMTP_CONFIG.user,
      subject,
      html,
      text: `اختبار خادم البريد Hostinger لمنظومة Redox Ta3limi تم بنجاح إلى ${toEmail} عبر ${SMTP_CONFIG.user}.`
    });

    return {
      success: true,
      messageId: info.messageId,
      response: info.response
    };
  } catch (err: any) {
    return {
      success: false,
      error: err?.message || 'فشل إرسال البريد التجريبي'
    };
  }
}

/**
 * Builds clean, responsive HTML email template for new school registrations
 */
export function buildRegistrationEmailHtml(order: ServerSchoolOrder): string {
  const fromEmail = SMTP_CONFIG.user;
  
  return `
<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>تم بنجاح استلام طلبك - Redox Ta3limi [${order.schoolName}]</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f1f5f9; color: #1e293b; margin: 0; padding: 20px; direction: rtl; }
    .container { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 16px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.06); }
    .header { background: #0f172a; padding: 26px 20px; text-align: center; border-bottom: 3px solid #0284c7; }
    .badge { display: inline-block; background: #10b981; color: #ffffff; padding: 4px 14px; border-radius: 999px; font-size: 12px; font-weight: bold; margin-bottom: 10px; }
    .content { padding: 28px 24px; font-size: 14px; line-height: 1.7; color: #334155; }
    .review-banner { background: #eff6ff; border: 1px solid #93c5fd; border-radius: 10px; padding: 14px 18px; margin: 16px 0; color: #1e40af; font-size: 13px; line-height: 1.6; }
    .key-box { background: #f8fafc; border: 2px dashed #0284c7; border-radius: 8px; padding: 14px; text-align: center; font-family: monospace; font-size: 19px; font-weight: bold; color: #0369a1; letter-spacing: 1px; margin: 12px 0 6px 0; }
    .details-table { width: 100%; border-collapse: collapse; margin-top: 10px; font-size: 13px; }
    .details-table td { padding: 8px 10px; border-bottom: 1px solid #e2e8f0; }
    .details-table td:first-child { color: #64748b; width: 40%; font-weight: bold; }
    .details-table td:last-child { color: #0f172a; }
    .payment-box { background: #ecfdf5; border: 1px solid #a7f3d0; border-radius: 8px; padding: 14px; margin: 18px 0; color: #065f46; font-size: 13px; }
    .spam-notice { background: #fffbeb; border: 1px dashed #f59e0b; border-radius: 8px; padding: 12px; margin-top: 18px; font-size: 12px; color: #92400e; line-height: 1.6; }
    .footer { background: #f8fafc; padding: 20px; text-align: center; font-size: 12px; color: #64748b; border-top: 1px solid #e2e8f0; }
    .footer a { color: #0284c7; text-decoration: none; margin: 0 8px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <span class="badge">✓ تم استلام وتسجيل طلبك بنجاح</span>
      <h1 style="color: #ffffff; margin: 0; font-size: 20px;">منظومة Redox التعليمية الذكية</h1>
      <p style="color: #94a3b8; margin: 6px 0 0 0; font-size: 12px;">طلب اشتراك مؤسسة «${order.schoolName}»</p>
    </div>

    <div class="content">
      <p>
        حضرة المدير الفاضل / <strong>${order.directorName}</strong> المحترم،<br>
        نشكركم على ثقتكم باختيار منظومة Redox. نود إعلامكم وتأكيد أنه <strong>تم استلام طلب اشتراك مؤسستكم بنجاح</strong>.
      </p>

      <div class="review-banner">
        <strong style="color: #1e3a8a; display: block; font-size: 13px; margin-bottom: 3px;">🔍 الخطوة القادمة - مراجعة وتفعيل:</strong>
        فريقنا الإداري والتقني يقوم حالياً بمراجعة بيانات مؤسستكم والتحقق من تفاصيل الباقة، وسيتصل بكم مستشارنا الفني هاتفياً أو عبر الواتساب لتأكيد التفعيل وتشغيل المنظومة وربط قارئات البطاقات RFID.
      </div>

      <div style="background: #ffffff; border: 1px solid #cbd5e1; border-radius: 10px; padding: 16px; margin: 18px 0;">
        <div style="font-weight: bold; color: #0f172a; font-size: 13px;">مفتاح الترخيص السحابي المبدئي (School Key):</div>
        <div class="key-box">${order.schoolKey}</div>
        <p style="font-size: 11px; color: #64748b; margin: 4px 0 0 0; text-align: center;">
          احفظ هذا المفتاح الخاص بمؤسستكم للربط البرمجي والأجهزة.
        </p>
      </div>

      <div style="background: #ffffff; border: 1px solid #cbd5e1; border-radius: 10px; padding: 16px; margin: 18px 0;">
        <h3 style="margin-top: 0; color: #0284c7; font-size: 14px;">ملخص بيانات الطلب:</h3>
        <table class="details-table">
          <tr>
            <td>المؤسسة:</td>
            <td><strong>${order.schoolName}</strong> (${order.schoolType})</td>
          </tr>
          <tr>
            <td>الولاية:</td>
            <td>${order.wilaya}</td>
          </tr>
          <tr>
            <td>الباقة المختارة:</td>
            <td><strong style="color: #0284c7;">${order.planName}</strong> (${order.billingCycle === 'yearly' ? 'اشتراك سنوي' : 'اشتراك شهري'})</td>
          </tr>
          <tr>
            <td>المبلغ المستحق:</td>
            <td><strong style="color: #10b981;">${order.priceCentimes}</strong> (${order.priceDzd.toLocaleString()} دج)</td>
          </tr>
          <tr>
            <td>رقم هاتف الاتصال:</td>
            <td dir="ltr" style="text-align: right;">${order.phone}</td>
          </tr>
          <tr>
            <td>البريد الإلكتروني:</td>
            <td dir="ltr" style="text-align: right;">${order.email}</td>
          </tr>
        </table>
      </div>

      <div class="payment-box">
        <strong>طريقة الدفع والتفعيل:</strong>
        <p style="margin: 4px 0 0 0; line-height: 1.6;">
          طريقة الدفع المختارة: <strong>${order.paymentMethod === 'baridimob' ? 'بريدي موب (BaridiMob)' : order.paymentMethod}</strong>.<br>
          سيتواصل معكم فريق المتابعة لإتمام خطوة السداد وتفعيل الترخيص بشكل نهائي.
        </p>
      </div>

      <div class="spam-notice">
        📌 <strong>تنبيه هام للبريد:</strong> إذا وصلتكم هذه الرسالة في مجلد الرسائل غير المرغوب فيها (Spam أو Junk)، يرجى تحديدها والنقر على «ليس بريداً غير مرغوب فيه (Report Not Spam)» لضمان وصول كافة إشعارات المنظومة إلى صندوق الوارد مباشرة.
      </div>

      <p style="margin-top: 20px;">لأي استفسار أو دعم عاجل:</p>
      <ul style="padding-right: 20px; line-height: 1.9; font-size: 13px;">
        <li>📞 هاتف الدعم المباشر: <strong dir="ltr">0698 12 86 74</strong></li>
        <li>💬 واتساب (WhatsApp): <strong dir="ltr">0559 58 19 57</strong></li>
        <li>📧 البريد الإلكتروني: <strong dir="ltr">${fromEmail}</strong></li>
      </ul>
    </div>

    <div class="footer">
      <p>© ${new Date().getFullYear()} Redox Ta3limi Cloud. جميع الحقوق محفوظة.</p>
      <p>
        <a href="tel:0698128674">الاتصال بنا</a> |
        <a href="https://wa.me/213559581957">واتساب</a> |
        <a href="mailto:${fromEmail}">${fromEmail}</a>
      </p>
    </div>
  </div>
</body>
</html>
  `;
}

/**
 * Sends notification email to registered school via Hostinger SMTP
 */
export async function sendOrderNotificationEmail(order: ServerSchoolOrder): Promise<{ 
  success: boolean; 
  messageId?: string; 
  response?: string; 
  error?: string 
}> {
  if (!order.email || !order.email.includes('@')) {
    console.warn(`[SMTP] Skipping email send: order ${order.id} has no valid customer email.`);
    return { success: false, error: 'Customer email address is invalid or empty' };
  }

  const subject = `تأكيد استلام طلب الاشتراك في منظومة Redox - [${order.schoolName}]`;
  const html = buildRegistrationEmailHtml(order);

  try {
    const mailer = getMailTransporter();
    
    console.log(`[SMTP] Attempting to send order email to customer: ${order.email} for order ${order.id}...`);
    
    const info = await mailer.sendMail({
      from: SMTP_CONFIG.from,
      to: order.email,
      replyTo: SMTP_CONFIG.user,
      subject,
      html,
      text: `مرحباً ${order.directorName}،\nتم بنجاح استلام طلبك للاشتراك في منظومة Redox Ta3limi لمؤسسة ${order.schoolName}.\nسنقوم بإلقاء نظرة على طلبكم ومراجعته والتواصل معكم هاتفياً أو عبر الواتساب لتأكيد التفعيل.\nمفتاح الترخيص المبدئي: ${order.schoolKey}\nالباقة: ${order.planName}\nالمبلغ: ${order.priceDzd.toLocaleString()} دج\nللدعم والاتصال: 0698128674 | واتساب: 0559581957\nالبريد: ${SMTP_CONFIG.user}`
    });

    console.log(`[SMTP] Email sent successfully to ${order.email}! MessageId: ${info.messageId} Response: ${info.response}`);
    return { 
      success: true, 
      messageId: info.messageId, 
      response: info.response 
    };
  } catch (error: any) {
    console.error(`[SMTP] Failed to send email to ${order.email} via Hostinger SMTP:`, error?.message || error);
    return { 
      success: false, 
      error: error?.message || 'SMTP transmission error' 
    };
  }
}

/**
 * Builds clean, responsive HTML email template for approved school with login credentials
 */
export function buildApprovalCredentialsEmailHtml(
  order: ServerSchoolOrder,
  credentials: {
    username: string;
    password: string;
    loginUrl?: string;
    remoteServerUrl?: string;
  }
): string {
  const fromEmail = SMTP_CONFIG.user;
  const loginUrl = credentials.loginUrl || 'https://alrouad.com/login';
  
  return `
<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>تهانينا! تم تفعيل حساب مدرستكم - منظومة Redox [${order.schoolName}]</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f1f5f9; color: #1e293b; margin: 0; padding: 20px; direction: rtl; }
    .container { max-width: 620px; margin: 0 auto; background: #ffffff; border-radius: 16px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 14px rgba(0,0,0,0.08); }
    .header { background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%); padding: 28px 24px; text-align: center; border-bottom: 3px solid #10b981; }
    .badge { display: inline-block; background: #10b981; color: #ffffff; padding: 4px 14px; border-radius: 999px; font-size: 12px; font-weight: bold; margin-bottom: 10px; }
    .content { padding: 28px 24px; font-size: 14px; line-height: 1.7; color: #334155; }
    .cred-card { background: #f8fafc; border: 2px solid #0284c7; border-radius: 12px; padding: 20px; margin: 20px 0; }
    .cred-title { font-size: 14px; font-weight: bold; color: #0369a1; margin-bottom: 12px; border-bottom: 1px solid #e2e8f0; padding-bottom: 8px; }
    .cred-row { display: flex; justify-content: space-between; align-items: center; padding: 8px 0; border-bottom: 1px dashed #cbd5e1; }
    .cred-row:last-child { border-bottom: none; }
    .cred-label { color: #64748b; font-weight: 600; font-size: 13px; }
    .cred-val { font-family: monospace; font-size: 15px; font-weight: bold; color: #0f172a; background: #e0f2fe; padding: 3px 10px; border-radius: 6px; letter-spacing: 0.5px; }
    .login-btn-box { text-align: center; margin: 24px 0; }
    .login-btn { display: inline-block; background: linear-gradient(135deg, #0284c7 0%, #0369a1 100%); color: #ffffff !important; text-decoration: none; padding: 12px 32px; border-radius: 10px; font-size: 15px; font-weight: bold; box-shadow: 0 4px 12px rgba(2,132,199,0.3); }
    .details-table { width: 100%; border-collapse: collapse; margin-top: 10px; font-size: 13px; }
    .details-table td { padding: 8px 10px; border-bottom: 1px solid #e2e8f0; }
    .details-table td:first-child { color: #64748b; width: 40%; font-weight: bold; }
    .details-table td:last-child { color: #0f172a; }
    .steps-box { background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 10px; padding: 16px; margin: 20px 0; color: #166534; font-size: 13px; }
    .warning-box { background: #fffbeb; border: 1px solid #fef3c7; border-radius: 8px; padding: 12px; margin-top: 18px; font-size: 12px; color: #92400e; line-height: 1.6; }
    .footer { background: #f8fafc; padding: 20px; text-align: center; font-size: 12px; color: #64748b; border-top: 1px solid #e2e8f0; }
    .footer a { color: #0284c7; text-decoration: none; margin: 0 8px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <span class="badge">✓ تم تفعيل الحساب بنجاح</span>
      <h1 style="color: #ffffff; margin: 0; font-size: 21px;">منظومة Redox التعليمية المتكاملة</h1>
      <p style="color: #94a3b8; margin: 6px 0 0 0; font-size: 13px;">بيانات الدخول الرسمية لمؤسسة «${order.schoolName}»</p>
    </div>

    <div class="content">
      <p>
        حضرة المدير الفاضل / <strong>${order.directorName}</strong> المحترم،<br>
        يسرنا إعلامكم أنه <strong>تم بنجاح قبول طلبكم واعتماد مدرستكم</strong> في منظومة Redox. تم إنشاء وتفعيل حساب مدرستكم وحساب المدير التنفيذي، ويمكنكم الآن البدء الفوري في إدارة شؤون المدرسة والطلاب.
      </p>

      <!-- Credentials Card -->
      <div class="cred-card">
        <div class="cred-title">🔐 بيانات الدخول الشخصية للمدير والمدرسة:</div>
        
        <div class="cred-row">
          <span class="cred-label">رابط منصة تسجيل الدخول:</span>
          <span class="cred-val"><a href="${loginUrl}" target="_blank" style="color: #0284c7; text-decoration: none;">${loginUrl}</a></span>
        </div>

        <div class="cred-row">
          <span class="cred-label">مفتاح المدرسة (School Key):</span>
          <span class="cred-val" style="color: #0369a1; background: #e0f2fe;">${order.schoolKey}</span>
        </div>

        <div class="cred-row">
          <span class="cred-label">اسم مستخدم المدير (Username):</span>
          <span class="cred-val" style="color: #4338ca; background: #ede9fe;">${credentials.username}</span>
        </div>

        <div class="cred-row">
          <span class="cred-label">كلمة المرور (Password):</span>
          <span class="cred-val" style="color: #047857; background: #d1fae5;">${credentials.password}</span>
        </div>
      </div>

      <!-- Login CTA Button -->
      <div class="login-btn-box">
        <a href="${loginUrl}" target="_blank" class="login-btn">
          تسجيل الدخول إلى لوحة إدارة مدرستك ←
        </a>
      </div>

      <!-- Plan Info Card -->
      <div style="background: #ffffff; border: 1px solid #cbd5e1; border-radius: 10px; padding: 16px; margin: 18px 0;">
        <h3 style="margin-top: 0; color: #0284c7; font-size: 14px;">تفاصيل الاشتراك والترخيص:</h3>
        <table class="details-table">
          <tr>
            <td>المؤسسة:</td>
            <td><strong>${order.schoolName}</strong> (${order.schoolType || 'مدرسة خاصة'})</td>
          </tr>
          <tr>
            <td>الولاية:</td>
            <td>${order.wilaya}</td>
          </tr>
          <tr>
            <td>الباقة المعتمدة:</td>
            <td><strong style="color: #0284c7;">${order.planName}</strong> (${order.billingCycle === 'yearly' ? 'اشتراك سنوي كامل' : 'اشتراك شهري'})</td>
          </tr>
          <tr>
            <td>مبلغ الاشتراك:</td>
            <td><strong style="color: #10b981;">${order.priceDzd.toLocaleString()} دج</strong></td>
          </tr>
          <tr>
            <td>حالة الحساب:</td>
            <td><strong style="color: #16a34a;">مفعل ونشط (Active) ✓</strong></td>
          </tr>
        </table>
      </div>

      <!-- Quick Setup Steps -->
      <div class="steps-box">
        <strong style="display: block; margin-bottom: 6px; font-size: 14px;">🚀 خطوات سريعة للبدء:</strong>
        <ol style="margin: 0; padding-right: 20px; line-height: 1.8;">
          <li>افتح رابط المنصة: <a href="${loginUrl}" target="_blank" style="color: #15803d; font-weight: bold;">${loginUrl}</a></li>
          <li>أدخل <strong>مفتاح المدرسة</strong>، ثم <strong>اسم المستخدم</strong> و<strong>كلمة المرور</strong> الموضحة أعلاه.</li>
          <li>ابدأ في إضافة الفصول الدراسية وقوائم الأساتذة والطلاب.</li>
          <li>تواصل مع فريقنا التقني لربط أجهزة قراءة البطاقات RFID ونقاط الحضور.</li>
        </ol>
      </div>

      <div class="warning-box">
        🛡️ <strong>إرشادات الأمان:</strong> يرجى الحفاظ على سرية هذه البيانات وعدم مشاركتها إلا مع الأشخاص المخولين في الإدارة. يمكنكم تغيير كلمة المرور في أي وقت بعد الدخول من إعدادات الملف الشخصي.
      </div>

      <p style="margin-top: 22px;">فريق الدعم الفني جاهز دائماً لمرافقتكم:</p>
      <ul style="padding-right: 20px; line-height: 1.9; font-size: 13px;">
        <li>📞 هاتف الدعم الفني: <strong dir="ltr">0698 12 86 74</strong></li>
        <li>💬 واتساب (WhatsApp): <strong dir="ltr">0559 58 19 57</strong></li>
        <li>📧 البريد الرسمي: <strong dir="ltr">${fromEmail}</strong></li>
      </ul>
    </div>

    <div class="footer">
      <p>© ${new Date().getFullYear()} Redox Ta3limi Cloud System. جميع الحقوق محفوظة.</p>
      <p>
        <a href="tel:0698128674">الاتصال بالدعم</a> |
        <a href="https://wa.me/213559581957">المحادثة عبر واتساب</a> |
        <a href="${loginUrl}">رابط المنصة</a>
      </p>
    </div>
  </div>
</body>
</html>
  `;
}

/**
 * Sends official approval and credentials email to school director via Hostinger SMTP
 */
export async function sendApprovalCredentialsEmail(
  order: ServerSchoolOrder,
  credentials: {
    username: string;
    password: string;
    loginUrl?: string;
    remoteServerUrl?: string;
  }
): Promise<{ 
  success: boolean; 
  messageId?: string; 
  response?: string; 
  error?: string 
}> {
  if (!order.email || !order.email.includes('@')) {
    console.warn(`[SMTP] Skipping approval email: order ${order.id} has no valid email.`);
    return { success: false, error: 'Customer email address is invalid or empty' };
  }

  const subject = `✓ تم تفعيل حساب مدرستكم - بيانات الدخول لمنظومة Redox [${order.schoolName}]`;
  const html = buildApprovalCredentialsEmailHtml(order, credentials);
  const loginUrl = credentials.loginUrl || 'https://alrouad.com/login';

  try {
    const mailer = getMailTransporter();
    
    console.log(`[SMTP] Sending approval and login credentials email to: ${order.email} for school ${order.schoolName}...`);
    
    const info = await mailer.sendMail({
      from: SMTP_CONFIG.from,
      to: order.email,
      replyTo: SMTP_CONFIG.user,
      subject,
      html,
      text: `مرحباً ${order.directorName}،\nتهانينا! تم قبول وتفعيل حساب مدرستكم «${order.schoolName}» في منظومة Redox التعليمية.\n\nبيانات الدخول الشخصية للمدير:\nرابط المنصة: ${loginUrl}\nمفتاح المدرسة: ${order.schoolKey}\nاسم المستخدم: ${credentials.username}\nكلمة المرور: ${credentials.password}\n\nالباقة: ${order.planName} (${order.priceDzd.toLocaleString()} دج)\nللدعم والمساعدة: 0698128674 | واتساب: 0559581957`
    });

    console.log(`[SMTP] Credentials email sent successfully to ${order.email}! MessageId: ${info.messageId}`);
    return { 
      success: true, 
      messageId: info.messageId, 
      response: info.response 
    };
  } catch (error: any) {
    console.error(`[SMTP] Failed to send credentials email to ${order.email}:`, error?.message || error);
    return { 
      success: false, 
      error: error?.message || 'SMTP transmission error' 
    };
  }
}
