import { DemoRequest, OrderStatus, SchoolOrder } from '../types';

export interface BackendStats {
  totalOrders: number;
  activeSchools: number;
  pendingOrders: number;
  totalRevenueDzd: number;
  demoRequestsCount: number;
}

export interface LicenseVerificationResult {
  valid: boolean;
  status?: string;
  schoolName?: string;
  schoolType?: string;
  wilaya?: string;
  planId?: string;
  planName?: string;
  billingCycle?: string;
  activatedAt?: string;
  message: string;
}

const BASE_URL = '/api';

/**
 * Health check
 */
export async function checkServerHealth(): Promise<boolean> {
  try {
    const res = await fetch(`${BASE_URL}/health`);
    if (!res.ok) return false;
    const data = await res.json();
    return data.status === 'ok';
  } catch {
    return false;
  }
}

export interface ServerHealthInfo {
  status: string;
  database: string;
  isMongoConnected: boolean;
  mongoDbName?: string;
  activeOrdersCount: number;
}

export async function fetchServerHealthInfo(): Promise<ServerHealthInfo | null> {
  try {
    const res = await fetch(`${BASE_URL}/health`);
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

/**
 * Fetch stats
 */
export async function fetchServerStats(): Promise<BackendStats | null> {
  try {
    const res = await fetch(`${BASE_URL}/stats`);
    if (!res.ok) return null;
    const data = await res.json();
    return data.data;
  } catch (err) {
    console.warn('[API] Failed to fetch stats:', err);
    return null;
  }
}

/**
 * Verify Admin PIN
 */
export async function verifyAdminPin(pin: string): Promise<{ success: boolean; message: string }> {
  try {
    const res = await fetch(`${BASE_URL}/admin/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pin })
    });
    const data = await res.json();
    return {
      success: !!data.success,
      message: data.message || (data.success ? 'تم الدخول بنجاح' : 'رمز الدخول غير صحيح')
    };
  } catch {
    // Fallback if network issue
    return {
      success: pin === 'riyad911',
      message: pin === 'riyad911' ? 'تم الدخول (محلياً)' : 'رمز الدخول غير صحيح'
    };
  }
}

/**
 * Fetch all orders from backend
 */
export async function fetchOrders(): Promise<SchoolOrder[]> {
  try {
    const res = await fetch(`${BASE_URL}/orders`);
    if (!res.ok) throw new Error('Failed to fetch orders');
    const data = await res.json();
    return data.orders || [];
  } catch (err) {
    console.warn('[API] Could not fetch orders from backend, using local data', err);
    throw err;
  }
}

/**
 * Create a new order on backend
 */
export async function createOrder(
  orderData: Omit<SchoolOrder, 'id' | 'schoolKey' | 'createdAt' | 'status' | 'emailNotificationSent'>
): Promise<SchoolOrder> {
  const res = await fetch(`${BASE_URL}/orders`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(orderData)
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || 'فشل في حفظ الطلب');
  }
  const data = await res.json();
  return data.order;
}

/**
 * Update order status on backend
 */
export async function updateOrderStatusApi(
  orderId: string, 
  status: OrderStatus, 
  notes?: string
): Promise<SchoolOrder> {
  const res = await fetch(`${BASE_URL}/orders/${encodeURIComponent(orderId)}/status`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status, notes })
  });
  if (!res.ok) {
    throw new Error('Failed to update status on server');
  }
  const data = await res.json();
  return data.order;
}

/**
 * Regenerate school key on backend
 */
export async function regenerateSchoolKeyApi(orderId: string): Promise<string> {
  const res = await fetch(`${BASE_URL}/orders/${encodeURIComponent(orderId)}/regenerate-key`, {
    method: 'POST'
  });
  if (!res.ok) {
    throw new Error('Failed to regenerate key on server');
  }
  const data = await res.json();
  return data.schoolKey;
}

/**
 * Delete order on backend
 */
export async function deleteOrderApi(orderId: string): Promise<boolean> {
  const res = await fetch(`${BASE_URL}/orders/${encodeURIComponent(orderId)}`, {
    method: 'DELETE'
  });
  return res.ok;
}

/**
 * Fetch demo requests from backend
 */
export async function fetchDemos(): Promise<DemoRequest[]> {
  try {
    const res = await fetch(`${BASE_URL}/demos`);
    if (!res.ok) throw new Error('Failed to fetch demos');
    const data = await res.json();
    return data.demos || [];
  } catch (err) {
    console.warn('[API] Could not fetch demos from backend', err);
    throw err;
  }
}

/**
 * Create a demo request on backend
 */
export async function createDemo(
  demoData: Omit<DemoRequest, 'id' | 'createdAt' | 'status'>
): Promise<DemoRequest> {
  const res = await fetch(`${BASE_URL}/demos`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(demoData)
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || 'فشل في إرسال طلب التجربة');
  }
  const data = await res.json();
  return data.demo;
}

/**
 * Update demo status on backend
 */
export async function updateDemoStatusApi(demoId: string, status: string): Promise<DemoRequest> {
  const res = await fetch(`${BASE_URL}/demos/${encodeURIComponent(demoId)}/status`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status })
  });
  if (!res.ok) {
    throw new Error('Failed to update demo status');
  }
  const data = await res.json();
  return data.demo;
}

/**
 * Verify license key via backend
 */
export async function verifyLicenseKey(key: string): Promise<LicenseVerificationResult> {
  try {
    const res = await fetch(`${BASE_URL}/license/verify/${encodeURIComponent(key)}`);
    const data = await res.json();
    return data;
  } catch (err) {
    return {
      valid: false,
      message: 'تعذر الاتصال بخادم التراخيص السحابي'
    };
  }
}
