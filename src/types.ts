export type BillingCycle = 'monthly' | 'yearly';

export interface Plan {
  id: string;
  name: string;
  studentLimit: number;
  studentLimitLabel: string;
  monthlyCentimes: string;
  monthlyDzd: number;
  yearlyCentimes: string;
  yearlyDzd: number;
  popular?: boolean;
  tag?: string;
  description: string;
}

export type OrderStatus = 'pending_payment' | 'paid' | 'active' | 'cancelled';
export type PaymentMethod = 'baridimob' | 'ccp' | 'bank_transfer' | 'cash';
export type SchoolType = 'مدرسة خاصة' | 'مركز دروس دعم' | 'معهد لغات' | 'مدرسة قرآنية' | 'مؤسسة تكوينية' | 'أخرى';

export interface SchoolOrder {
  id: string;
  schoolKey: string;
  schoolName: string;
  schoolType: SchoolType;
  wilaya: string;
  address?: string;
  directorName: string;
  phone: string;
  email: string;
  studentCountEstimate: number;
  planId: string;
  planName: string;
  billingCycle: BillingCycle;
  priceCentimes: string;
  priceDzd: number;
  paymentMethod: PaymentMethod;
  status: OrderStatus;
  createdAt: string;
  activatedAt?: string;
  notes?: string;
  emailNotificationSent: boolean;
}

export interface DemoRequest {
  id: string;
  schoolName: string;
  contactName: string;
  phone: string;
  email: string;
  wilaya: string;
  preferredDate?: string;
  notes?: string;
  createdAt: string;
  status: 'pending' | 'contacted' | 'completed';
}

export interface FeatureItem {
  id: number;
  title: string;
  subtitle: string;
  description: string;
  iconName: string;
  category: 'core' | 'academic' | 'finance' | 'tech';
  badge: string;
  highlights: string[];
}
