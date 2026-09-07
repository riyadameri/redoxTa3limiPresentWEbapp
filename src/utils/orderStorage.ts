import { SchoolOrder, DemoRequest, OrderStatus } from '../types';
import { INITIAL_ORDERS } from '../data/plans';

const ORDERS_KEY = 'redox_ta3limi_orders_v1';
const DEMOS_KEY = 'redox_ta3limi_demos_v1';

export function getStoredOrders(): SchoolOrder[] {
  try {
    const data = localStorage.getItem(ORDERS_KEY);
    if (!data) {
      localStorage.setItem(ORDERS_KEY, JSON.stringify(INITIAL_ORDERS));
      return INITIAL_ORDERS;
    }
    return JSON.parse(data);
  } catch {
    return INITIAL_ORDERS;
  }
}

/**
 * Synchronize orders from Node.js backend
 */
export async function syncOrdersWithBackend(): Promise<SchoolOrder[]> {
  try {
    const res = await fetch('/api/orders');
    if (!res.ok) return getStoredOrders();
    const data = await res.json();
    if (Array.isArray(data.orders) && data.orders.length > 0) {
      localStorage.setItem(ORDERS_KEY, JSON.stringify(data.orders));
      return data.orders;
    }
  } catch (e) {
    console.warn('[Sync] Could not reach backend orders API, using local storage cache', e);
  }
  return getStoredOrders();
}

/**
 * Synchronize demo requests from Node.js backend
 */
export async function syncDemosWithBackend(): Promise<DemoRequest[]> {
  try {
    const res = await fetch('/api/demos');
    if (!res.ok) return getStoredDemoRequests();
    const data = await res.json();
    if (Array.isArray(data.demos)) {
      localStorage.setItem(DEMOS_KEY, JSON.stringify(data.demos));
      return data.demos;
    }
  } catch (e) {
    console.warn('[Sync] Could not reach backend demos API, using local storage cache', e);
  }
  return getStoredDemoRequests();
}

export function saveNewOrder(orderData: Omit<SchoolOrder, 'id' | 'schoolKey' | 'createdAt' | 'status' | 'emailNotificationSent'>): SchoolOrder {
  const orders = getStoredOrders();
  const id = `ord-${Date.now().toString(36)}`;
  const schoolKey = generateSchoolKey(orderData.wilaya);
  
  const newOrder: SchoolOrder = {
    ...orderData,
    id,
    schoolKey,
    status: 'pending_payment',
    createdAt: new Date().toISOString().replace('T', ' ').slice(0, 16),
    emailNotificationSent: true
  };

  const updated = [newOrder, ...orders];
  try {
    localStorage.setItem(ORDERS_KEY, JSON.stringify(updated));
  } catch (e) {
    console.error('Failed to save to localStorage', e);
  }

  // Asynchronously push to Node.js backend
  fetch('/api/orders', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(orderData)
  }).then(async (res) => {
    if (res.ok) {
      const data = await res.json();
      if (data.order) {
        // Sync order from server
        const current = getStoredOrders().filter(o => o.id !== id);
        localStorage.setItem(ORDERS_KEY, JSON.stringify([data.order, ...current]));
      }
    }
  }).catch((err) => {
    console.warn('[Backend] Could not push new order to server:', err);
  });

  return newOrder;
}

export function saveNewOrderDirect(order: SchoolOrder): void {
  const orders = getStoredOrders().filter(o => o.id !== order.id && o.schoolKey !== order.schoolKey);
  const updated = [order, ...orders];
  try {
    localStorage.setItem(ORDERS_KEY, JSON.stringify(updated));
  } catch (e) {
    console.error('Failed to save to localStorage', e);
  }
}

export async function createOrderAsync(orderData: Omit<SchoolOrder, 'id' | 'schoolKey' | 'createdAt' | 'status' | 'emailNotificationSent'>): Promise<{
  order: SchoolOrder;
  emailSent: boolean;
  emailMessageId?: string;
  emailError?: string;
}> {
  try {
    const res = await fetch('/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(orderData)
    });

    if (res.ok) {
      const data = await res.json();
      if (data.order) {
        saveNewOrderDirect(data.order);
        return {
          order: data.order,
          emailSent: data.emailSent ?? true,
          emailMessageId: data.emailMessageId,
          emailError: data.emailError
        };
      }
    }
  } catch (err) {
    console.warn('[Sync] Server unreachable, falling back to local storage', err);
  }

  // Fallback
  const fallbackOrder = saveNewOrder(orderData);
  return {
    order: fallbackOrder,
    emailSent: false,
    emailError: 'تم حفظ الطلب محلياً، في انتظار المزامنة مع الخادم'
  };
}

export function updateOrderStatus(orderId: string, status: OrderStatus, notes?: string): SchoolOrder | null {
  const orders = getStoredOrders();
  const index = orders.findIndex(o => o.id === orderId);
  if (index === -1) return null;

  const now = new Date().toISOString().replace('T', ' ').slice(0, 16);
  const updatedOrder: SchoolOrder = {
    ...orders[index],
    status,
    activatedAt: status === 'active' ? now : orders[index].activatedAt,
    notes: notes !== undefined ? notes : orders[index].notes
  };

  orders[index] = updatedOrder;
  try {
    localStorage.setItem(ORDERS_KEY, JSON.stringify(orders));
  } catch (e) {
    console.error('Failed to update localStorage', e);
  }

  // Push to Node.js backend
  fetch(`/api/orders/${encodeURIComponent(orderId)}/status`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status, notes })
  }).catch((err) => {
    console.warn('[Backend] Could not push status update to server:', err);
  });

  return updatedOrder;
}

export async function approveOrderAsync(
  orderId: string,
  options?: {
    adminUsername?: string;
    adminPassword?: string;
    targetServer?: string;
    sendCredentialsEmail?: boolean;
    planOverride?: string;
  }
): Promise<{
  success: boolean;
  message: string;
  order?: SchoolOrder;
  credentials?: {
    schoolKey: string;
    adminUsername: string;
    adminPassword: string;
    loginUrl: string;
    schoolName: string;
    directorName: string;
  };
  remote?: {
    success: boolean;
    message: string;
    endpoint: string;
    data?: any;
  };
  emailSent?: boolean;
}> {
  try {
    const res = await fetch(`/api/orders/${encodeURIComponent(orderId)}/approve`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(options || {})
    });
    const data = await res.json();
    if (res.ok && data.success && data.order) {
      saveNewOrderDirect(data.order);
      return data;
    }
    return data;
  } catch (err: any) {
    console.warn('[Sync] Failed to call approve API:', err);
    const updated = updateOrderStatus(orderId, 'approved');
    return {
      success: true,
      message: 'تم الاعتماد محلياً (تعذر الوصول للخادم)',
      order: updated || undefined
    };
  }
}

export function regenerateOrderKey(orderId: string): string | null {
  const orders = getStoredOrders();
  const index = orders.findIndex(o => o.id === orderId);
  if (index === -1) return null;

  const newKey = generateSchoolKey(orders[index].wilaya);
  orders[index].schoolKey = newKey;
  try {
    localStorage.setItem(ORDERS_KEY, JSON.stringify(orders));
  } catch (e) {
    console.error('Failed to save key', e);
  }

  // Push to Node.js backend
  fetch(`/api/orders/${encodeURIComponent(orderId)}/regenerate-key`, {
    method: 'POST'
  }).catch((err) => {
    console.warn('[Backend] Could not push regenerated key to server:', err);
  });

  return newKey;
}

export function generateSchoolKey(wilayaStr?: string): string {
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

export function getStoredDemoRequests(): DemoRequest[] {
  try {
    const data = localStorage.getItem(DEMOS_KEY);
    if (!data) return [];
    return JSON.parse(data);
  } catch {
    return [];
  }
}

export function saveDemoRequest(request: Omit<DemoRequest, 'id' | 'createdAt' | 'status'>): DemoRequest {
  const current = getStoredDemoRequests();
  const newReq: DemoRequest = {
    ...request,
    id: `demo-${Date.now().toString(36)}`,
    createdAt: new Date().toISOString().replace('T', ' ').slice(0, 16),
    status: 'pending'
  };
  const updated = [newReq, ...current];
  try {
    localStorage.setItem(DEMOS_KEY, JSON.stringify(updated));
  } catch (e) {
    console.error('Failed to save demo', e);
  }

  // Push to Node.js backend
  fetch('/api/demos', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request)
  }).catch((err) => {
    console.warn('[Backend] Could not push demo request to server:', err);
  });

  return newReq;
}
