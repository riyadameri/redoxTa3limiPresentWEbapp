import nodemailer, { Transporter } from 'nodemailer';
import type { ServerSchoolOrder } from './server';

// Lazy initialized transporter for Hostinger SMTP
let transporter: Transporter | null = null;

function getMailTransporter(): Transporter {
  if (!transporter) {
    const host = process.env.SMTP_HOST || 'smtp.hostinger.com';
    const port = Number(process.env.SMTP_PORT) || 465;
    const user = process.env.SMTP_USER || 'contact@rudeox.cloud';
    const pass = process.env.SMTP_PASS || 'riyadhack900-D';

    transporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465, // true for port 465 (SSL)
      auth: {
        user,
        pass
      },
      tls: {
        rejectUnauthorized: false
      }
    });
  }
  return transporter;
}

/**
 * Builds clean, responsive HTML email template for new school registrations
 */
export function buildRegistrationEmailHtml(order: ServerSchoolOrder): string {
  const fromEmail = process.env.SMTP_USER || 'contact@rudeox.cloud';
  
  return `
<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>تأكيد استلام طلب اشتراك مؤسسة ${order.schoolName} - Redox Ta3limi</title>
  <style>
    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #0b1120; color: #f1f5f9; margin: 0; padding: 20px; direction: rtl; }
    .container { max-width: 620px; margin: 0 auto; background: #0f172a; border-radius: 16px; border: 1px solid #334155; overflow: hidden; box-shadow: 0 10px 25px rgba(0,0,0,0.5); }
    .header { background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%); padding: 28px 24px; text-align: center; border-bottom: 2px solid #f97316; }
    .badge { display: inline-block; background: #ea580c; color: #ffffff; padding: 4px 14px; border-radius: 999px; font-size: 12px; font-weight: bold; margin-bottom: 12px; }
    .content { padding: 28px 24px; font-size: 14px; line-height: 1.7; color: #cbd5e1; }
    .highlight-card { background: #1e293b; border: 1px solid #475569; border-radius: 12px; padding: 18px; margin: 20px 0; }
    .key-box { background: #020617; border: 1px dashed #f97316; border-radius: 8px; padding: 14px; text-align: center; font-family: monospace; font-size: 18px; font-weight: bold; color: #fb923c; letter-spacing: 1px; margin-top: 10px; }
    .details-table { width: 100%; border-collapse: collapse; margin-top: 12px; font-size: 13px; }
    .details-table td { padding: 8px 10px; border-bottom: 1px solid #334155; }
    .details-table td:first-child { color: #94a3b8; width: 40%; font-weight: bold; }
    .details-table td:last-child { color: #f8fafc; }
    .payment-box { background: #064e3b; border: 1px solid #059669; border-radius: 10px; padding: 16px; margin: 20px 0; color: #ecfdf5; font-size: 13px; }
    .footer { background: #020617; padding: 20px 24px; text-align: center; font-size: 12px; color: #64748b; border-top: 1px solid #1e293b; }
    .footer a { color: #38bdf8; text-decoration: none; margin: 0 8px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <span class="badge">Redox Ta3limi Cloud</span>
      <h1 style="color: #ffffff; margin: 0; font-size: 22px;">مرحباً بكم في منظومة REDOX التعليمية</h1>
      <p style="color: #94a3b8; margin: 6px 0 0 0; font-size: 13px;">نظام إدارة المدارس والمراكز التعليمية المتكامل</p>
    </div>

    <div class="content">
      <p>الأستاذ / المدير الفاضل: <strong>${order.directorName}</strong> المحترم،</p>
      <p>يسعدنا إعلامكم بأنه تم استلام وتسجيل طلب اشتراك مؤسستكم <strong>«${order.schoolName}»</strong> بنجاح في المنظومة السحابية.</p>

      <div class="highlight-card">
        <div style="font-weight: bold; color: #f8fafc; font-size: 14px;">مفتاح الترخيص السحابي المبدئي (School License Key):</div>
        <div class="key-box">${order.schoolKey}</div>
        <p style="font-size: 11px; color: #94a3b8; margin: 8px 0 0 0; text-align: center;">
          احفظ هذا المفتاح لتفعيل نسختكم على أجهزة الحواسيب وقارئات RFID
        </p>
      </div>

      <div class="highlight-card">
        <h3 style="margin-top: 0; color: #38bdf8; font-size: 15px;">بيانات الاشتراك المسجلة:</h3>
        <table class="details-table">
          <tr>
            <td>المؤسسة:</td>
            <td>${order.schoolName} (${order.schoolType})</td>
          </tr>
          <tr>
            <td>الولاية:</td>
            <td>${order.wilaya}</td>
          </tr>
          <tr>
            <td>الباقة المختارة:</td>
            <td>${order.planName} (${order.billingCycle === 'yearly' ? 'اشتراك سنوي' : 'اشتراك شهري'})</td>
          </tr>
          <tr>
            <td>قيمة الاشتراك:</td>
            <td style="color: #34d399; font-weight: bold; font-family: monospace;">${order.priceDzd.toLocaleString()} دج (${order.priceCentimes})</td>
          </tr>
          <tr>
            <td>رقم الهاتف:</td>
            <td style="font-family: monospace;" dir="ltr">${order.phone}</td>
          </tr>
          <tr>
            <td>البريد الإلكتروني:</td>
            <td style="font-family: monospace;">${order.email}</td>
          </tr>
        </table>
      </div>

      <div class="payment-box">
        <strong>طريقة إتمام التفعيل والدفع:</strong>
        <p style="margin: 6px 0 0 0; line-height: 1.6;">
          طريقة الدفع المختارة: <strong>${order.paymentMethod === 'baridimob' ? 'بريدي موب (BaridiMob)' : order.paymentMethod}</strong>.<br>
          سيتصل بكم مستشار الدعم الفني خلال ساعات لتأكيد عملية الدفع وإرسال رابط تحميل البرنامج وتفعيل الربط السحابي وقارئات البطاقات.
        </p>
      </div>

      <p style="margin-top: 24px;">إذا كان لديكم أي استفسار أو طلب مساعدة في التثبيت، يمكنكم التواصل معنا مباشرة:</p>
      <ul style="padding-right: 20px; line-height: 2;">
        <li>📞 هاتف الدعم المباشر: <strong dir="ltr">0698 12 86 74</strong></li>
        <li>💬 واتساب (WhatsApp): <strong dir="ltr">0559 58 19 57</strong></li>
        <li>✉️ البريد الإلكتروني: <strong>${fromEmail}</strong></li>
      </ul>
    </div>

    <div class="footer">
      <p>© ${new Date().getFullYear()} Redox Ta3limi. جميع الحقوق محفوظة.</p>
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
export async function sendOrderNotificationEmail(order: ServerSchoolOrder): Promise<{ success: boolean; messageId?: string; error?: string }> {
  if (!order.email || !order.email.includes('@')) {
    console.warn(`[SMTP] Skipping email send: order ${order.id} has no valid customer email.`);
    return { success: false, error: 'Customer email address is invalid or empty' };
  }

  const fromAddress = process.env.SMTP_FROM || 'Redox Ta3limi <contact@rudeox.cloud>';
  const subject = `تأكيد تسجيل طلب اشتراك مؤسسة ${order.schoolName} - Redox Ta3limi [${order.schoolKey}]`;
  const html = buildRegistrationEmailHtml(order);

  try {
    const mailer = getMailTransporter();
    
    console.log(`[SMTP] Attempting to send order email to customer: ${order.email} for order ${order.id}...`);
    
    const info = await mailer.sendMail({
      from: fromAddress,
      to: order.email,
      replyTo: process.env.SMTP_USER || 'contact@rudeox.cloud',
      subject,
      html,
      text: `مرحباً ${order.directorName}،\nتم استلام طلب اشتراك مؤسسة ${order.schoolName} في برنامج Redox Ta3limi بنجاح.\nمفتاح الترخيص: ${order.schoolKey}\nالباقة: ${order.planName}\nالمبلغ: ${order.priceDzd} دج\nللدعم والاتصال: 0698128674 | واتساب: 0559581957`
    });

    console.log(`[SMTP] Email sent successfully to ${order.email}! MessageId: ${info.messageId}`);
    return { success: true, messageId: info.messageId };
  } catch (error: any) {
    console.error(`[SMTP] Failed to send email to ${order.email} via Hostinger SMTP:`, error?.message || error);
    return { success: false, error: error?.message || 'SMTP transmission error' };
  }
}
