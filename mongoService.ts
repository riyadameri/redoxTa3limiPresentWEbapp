import { MongoClient, Db, Collection } from 'mongodb';
import fs from 'fs';
import path from 'path';
import type { ServerSchoolOrder, ServerDemoRequest } from './server';

// Default initial seed orders
export const DEFAULT_INITIAL_ORDERS: ServerSchoolOrder[] = [
  {
    id: 'ord-101',
    schoolKey: 'RDX-W16-2026-8492',
    schoolName: 'مؤسسة النخبة الخاصة',
    schoolType: 'مدرسة خاصة',
    wilaya: '16 - الجزائر العاصمة',
    directorName: 'الأستاذ كمال بوعلام',
    phone: '0698128674',
    email: 'contact@el-nokhba-school.dz',
    studentCountEstimate: 520,
    planId: 'plan-3',
    planName: 'الباقة الثالثة',
    billingCycle: 'yearly',
    priceCentimes: '5 ملايين و900 ألف سنتيم / عام',
    priceDzd: 59000,
    paymentMethod: 'baridimob',
    status: 'active',
    createdAt: '2026-09-05 10:14',
    activatedAt: '2026-09-05 11:30',
    emailNotificationSent: true,
    notes: 'تم الدفع وتفعيل قارئات RFID لمقر حيدرة'
  },
  {
    id: 'ord-102',
    schoolKey: 'RDX-W31-2026-9214',
    schoolName: 'مركز الامتياز لدروس الدعم',
    schoolType: 'مركز دروس دعم',
    wilaya: '31 - وهران',
    directorName: 'د. سامية منصوري',
    phone: '0559581957',
    email: 'direction@imtiaz-oran.com',
    studentCountEstimate: 340,
    planId: 'plan-2',
    planName: 'الباقة الثانية',
    billingCycle: 'monthly',
    priceCentimes: '435 ألف سنتيم / شهر',
    priceDzd: 4350,
    paymentMethod: 'ccp',
    status: 'paid',
    createdAt: '2026-09-06 15:40',
    emailNotificationSent: true,
    notes: 'بانتظار تأكيد توليد المفتاح الإضافي'
  },
  {
    id: 'ord-103',
    schoolKey: 'RDX-W25-2026-3189',
    schoolName: 'معهد اللغات الحديثة والترجمة',
    schoolType: 'معهد لغات',
    wilaya: '25 - قسنطينة',
    directorName: 'السيد فريد رحماني',
    phone: '0770334455',
    email: 'info@modern-languages-cst.dz',
    studentCountEstimate: 700,
    planId: 'plan-4',
    planName: 'الباقة الرابعة',
    billingCycle: 'yearly',
    priceCentimes: '7 ملايين و900 ألف سنتيم / عام',
    priceDzd: 79000,
    paymentMethod: 'bank_transfer',
    status: 'pending_payment',
    createdAt: '2026-09-07 08:20',
    emailNotificationSent: false,
    notes: 'تم إرسال إشعار أولي بالبريد مع بيانات الحساب البنكي'
  }
];

export interface DatabaseState {
  orders: ServerSchoolOrder[];
  demos: ServerDemoRequest[];
}

// Local JSON File Fallback paths
const DATA_DIR = path.join(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'db.json');

// MongoDB client instance caching
let mongoClient: MongoClient | null = null;
let mongoDb: Db | null = null;
let isMongoConnected = false;

// In-memory cache synced with database
let inMemoryData: DatabaseState = {
  orders: DEFAULT_INITIAL_ORDERS,
  demos: []
};

/**
 * Reads local JSON fallback file
 */
function readLocalFallback(): DatabaseState {
  try {
    if (fs.existsSync(DB_FILE)) {
      const content = fs.readFileSync(DB_FILE, 'utf-8');
      const data = JSON.parse(content);
      return {
        orders: Array.isArray(data.orders) && data.orders.length > 0 ? data.orders : DEFAULT_INITIAL_ORDERS,
        demos: Array.isArray(data.demos) ? data.demos : []
      };
    }
  } catch (err) {
    console.error('[DB] Error reading local fallback db file:', err);
  }
  return {
    orders: DEFAULT_INITIAL_ORDERS,
    demos: []
  };
}

/**
 * Writes local JSON fallback file
 */
function writeLocalFallback(state: DatabaseState) {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(DB_FILE, JSON.stringify(state, null, 2), 'utf-8');
  } catch (err) {
    console.error('[DB] Error writing local fallback db file:', err);
  }
}

/**
 * Initializes Database Connection (MongoDB with automatic fallback to persistent JSON file)
 */
export async function initDatabase(): Promise<{ isMongo: boolean; message: string }> {
  inMemoryData = readLocalFallback();

  const uri = process.env.MONGODB_URI;
  const dbName = process.env.MONGODB_DB || 'redox_ta3limi';

  if (!uri || !uri.trim()) {
    console.log('[MongoDB] MONGODB_URI is not set in environment. Operating using local persistent storage with MongoDB schema compatibility.');
    return { isMongo: false, message: 'Local storage (MongoDB URI not configured)' };
  }

  try {
    console.log(`[MongoDB] Connecting to MongoDB instance...`);
    mongoClient = new MongoClient(uri, {
      connectTimeoutMS: 5000,
      serverSelectionTimeoutMS: 5000
    });

    await mongoClient.connect();
    mongoDb = mongoClient.db(dbName);
    isMongoConnected = true;
    console.log(`[MongoDB] Successfully connected to MongoDB database "${dbName}"!`);

    // Ensure collections and indexes
    const ordersCollection: Collection<ServerSchoolOrder> = mongoDb.collection('orders');
    const demosCollection: Collection<ServerDemoRequest> = mongoDb.collection('demos');

    await ordersCollection.createIndex({ id: 1 }, { unique: true });
    await ordersCollection.createIndex({ schoolKey: 1 });
    await ordersCollection.createIndex({ email: 1 });
    await demosCollection.createIndex({ id: 1 }, { unique: true });

    // If MongoDB collection is empty, seed it with initial orders
    const count = await ordersCollection.countDocuments();
    if (count === 0) {
      console.log(`[MongoDB] Seeding MongoDB with initial school orders...`);
      await ordersCollection.insertMany(inMemoryData.orders);
    } else {
      // Sync in-memory cache with MongoDB contents
      const mongoOrders = await ordersCollection.find({}).sort({ createdAt: -1 }).toArray();
      const mongoDemos = await demosCollection.find({}).sort({ createdAt: -1 }).toArray();
      
      inMemoryData = {
        orders: mongoOrders.map(o => {
          const { _id, ...rest } = o as any;
          return rest as ServerSchoolOrder;
        }),
        demos: mongoDemos.map(d => {
          const { _id, ...rest } = d as any;
          return rest as ServerDemoRequest;
        })
      };
      // Keep local file in sync as backup
      writeLocalFallback(inMemoryData);
    }

    return { isMongo: true, message: `Connected to MongoDB database "${dbName}"` };
  } catch (err: any) {
    isMongoConnected = false;
    console.warn(`[MongoDB] MongoDB connection failed (${err?.message}). Running in fallback mode with local persistence.`);
    return { isMongo: false, message: `Fallback to local JSON (${err?.message})` };
  }
}

export function isUsingMongo(): boolean {
  return isMongoConnected;
}

// =========================================================================
// ORDERS OPERATIONS (CRUD)
// =========================================================================

export async function getAllOrders(): Promise<ServerSchoolOrder[]> {
  if (isMongoConnected && mongoDb) {
    try {
      const orders = await mongoDb.collection<ServerSchoolOrder>('orders').find({}).sort({ createdAt: -1 }).toArray();
      inMemoryData.orders = orders.map(o => {
        const { _id, ...rest } = o as any;
        return rest as ServerSchoolOrder;
      });
      return inMemoryData.orders;
    } catch (err) {
      console.error('[MongoDB] Error querying orders from Mongo, using cache:', err);
    }
  }
  return inMemoryData.orders;
}

export async function getOrderById(id: string): Promise<ServerSchoolOrder | null> {
  if (isMongoConnected && mongoDb) {
    try {
      const order = await mongoDb.collection<ServerSchoolOrder>('orders').findOne({ id });
      if (order) {
        const { _id, ...rest } = order as any;
        return rest as ServerSchoolOrder;
      }
    } catch (err) {
      console.error('[MongoDB] Error finding order in Mongo, using cache:', err);
    }
  }
  return inMemoryData.orders.find(o => o.id === id) || null;
}

export async function getOrderByKey(key: string): Promise<ServerSchoolOrder | null> {
  const cleanKey = key.trim().toUpperCase();
  if (isMongoConnected && mongoDb) {
    try {
      const order = await mongoDb.collection<ServerSchoolOrder>('orders').findOne({ 
        schoolKey: { $regex: new RegExp(`^${cleanKey}$`, 'i') } 
      });
      if (order) {
        const { _id, ...rest } = order as any;
        return rest as ServerSchoolOrder;
      }
    } catch (err) {
      console.error('[MongoDB] Error finding order by key in Mongo, using cache:', err);
    }
  }
  return inMemoryData.orders.find(o => o.schoolKey.toUpperCase() === cleanKey) || null;
}

export async function insertOrder(order: ServerSchoolOrder): Promise<ServerSchoolOrder> {
  inMemoryData.orders = [order, ...inMemoryData.orders.filter(o => o.id !== order.id)];
  writeLocalFallback(inMemoryData);

  if (isMongoConnected && mongoDb) {
    try {
      await mongoDb.collection('orders').insertOne({ ...order });
      console.log(`[MongoDB] Order ${order.id} inserted into MongoDB.`);
    } catch (err) {
      console.error(`[MongoDB] Failed to insert order ${order.id} into Mongo:`, err);
    }
  }
  return order;
}

export async function updateOrder(id: string, updates: Partial<ServerSchoolOrder>): Promise<ServerSchoolOrder | null> {
  const index = inMemoryData.orders.findIndex(o => o.id === id);
  if (index === -1) return null;

  inMemoryData.orders[index] = {
    ...inMemoryData.orders[index],
    ...updates
  };
  writeLocalFallback(inMemoryData);

  if (isMongoConnected && mongoDb) {
    try {
      await mongoDb.collection('orders').updateOne(
        { id },
        { $set: updates }
      );
      console.log(`[MongoDB] Order ${id} updated in MongoDB.`);
    } catch (err) {
      console.error(`[MongoDB] Failed to update order ${id} in Mongo:`, err);
    }
  }

  return inMemoryData.orders[index];
}

export async function deleteOrder(id: string): Promise<boolean> {
  const initialLen = inMemoryData.orders.length;
  inMemoryData.orders = inMemoryData.orders.filter(o => o.id !== id);
  const removed = inMemoryData.orders.length < initialLen;
  if (removed) {
    writeLocalFallback(inMemoryData);
  }

  if (isMongoConnected && mongoDb) {
    try {
      await mongoDb.collection('orders').deleteOne({ id });
      console.log(`[MongoDB] Order ${id} deleted from MongoDB.`);
    } catch (err) {
      console.error(`[MongoDB] Failed to delete order ${id} in Mongo:`, err);
    }
  }

  return removed;
}

// =========================================================================
// DEMOS OPERATIONS
// =========================================================================

export async function getAllDemos(): Promise<ServerDemoRequest[]> {
  if (isMongoConnected && mongoDb) {
    try {
      const demos = await mongoDb.collection<ServerDemoRequest>('demos').find({}).sort({ createdAt: -1 }).toArray();
      inMemoryData.demos = demos.map(d => {
        const { _id, ...rest } = d as any;
        return rest as ServerDemoRequest;
      });
      return inMemoryData.demos;
    } catch (err) {
      console.error('[MongoDB] Error querying demos from Mongo, using cache:', err);
    }
  }
  return inMemoryData.demos;
}

export async function insertDemo(demo: ServerDemoRequest): Promise<ServerDemoRequest> {
  inMemoryData.demos = [demo, ...inMemoryData.demos.filter(d => d.id !== demo.id)];
  writeLocalFallback(inMemoryData);

  if (isMongoConnected && mongoDb) {
    try {
      await mongoDb.collection('demos').insertOne({ ...demo });
      console.log(`[MongoDB] Demo ${demo.id} inserted into MongoDB.`);
    } catch (err) {
      console.error(`[MongoDB] Failed to insert demo ${demo.id} into Mongo:`, err);
    }
  }

  return demo;
}

export async function updateDemoStatus(id: string, status: ServerDemoRequest['status']): Promise<ServerDemoRequest | null> {
  const index = inMemoryData.demos.findIndex(d => d.id === id);
  if (index === -1) return null;

  inMemoryData.demos[index].status = status;
  writeLocalFallback(inMemoryData);

  if (isMongoConnected && mongoDb) {
    try {
      await mongoDb.collection('demos').updateOne(
        { id },
        { $set: { status } }
      );
      console.log(`[MongoDB] Demo ${id} updated in MongoDB.`);
    } catch (err) {
      console.error(`[MongoDB] Failed to update demo ${id} in Mongo:`, err);
    }
  }

  return inMemoryData.demos[index];
}
