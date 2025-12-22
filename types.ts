
export type UserRole = 'superadmin' | 'admin' | 'finance' | 'reception' | 'viewer';

export interface User {
  id: string;
  name: string;
  email: string;
  clinicName: string;
  clinicId: string; // ID da clínica (geralmente o ID do proprietário original)
  onboardingCompleted: boolean;
  role: UserRole;
  avatar_url?: string;
}

export interface Clinic {
  id: string;
  name: string;
  ownerId: string;
  plan: 'trial' | 'pro' | 'elite';
  active: boolean;
  createdAt: number;
}

export interface Transaction {
  id: string;
  userId: string;
  description: string;
  amount: number;
  type: 'revenue' | 'expense';
  category: string;
  date: number;
  patientName?: string;
  paymentMethod?: string;
  isPaid?: boolean;
  tags?: string;
}

export interface Category {
  id: string;
  name: string;
  type: 'revenue' | 'expense_variable' | 'expense_fixed';
  userId?: string;
}

export interface Appointment {
  id: string;
  userId: string;
  patientId: string;
  patientName: string;
  staffId?: string;
  startTime: number;
  endTime: number;
  serviceName: string;
  status: 'scheduled' | 'confirmed' | 'completed' | 'canceled';
  notes?: string;
}

export interface ChatContact {
  id: string;
  clinicId: string;
  name: string;
  phone: string;
  email?: string;
  avatarUrl?: string;
  lastMessage: string;
  lastMessageTime?: number;
  unreadCount: number;
  crmStatus?: 'new' | 'in_progress' | 'scheduled';
}

export interface ChatMessage {
  id: string;
  patientId: string;
  direction: 'inbound' | 'outbound';
  content: string;
  timestamp: number;
  status: 'sent' | 'delivered' | 'read';
}

export interface Patient {
  id: string;
  user_id: string;
  name: string;
  phone: string;
  email?: string;
  cpf?: string;
  birth_date?: string;
  profession?: string;
  marketing_source?: string;
  cep?: string;
  address_street?: string;
  address_number?: string;
  address_complement?: string;
  address_neighborhood?: string;
  address_city?: string;
  address_state?: string;
  height?: string;
  weight?: string;
  notes?: string;
  avatar_url?: string;
  clinicId?: string;
  avatarUrl?: string;
}

export interface Staff {
  id: string;
  userId: string;
  name: string;
  role: string;
  color: string;
  commissionRate: number;
  phone?: string;
}

export interface QuoteItem {
  id: string;
  procedure: string;
  region: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export interface QuoteMapPoint {
  x: number;
  y: number;
  type: 'point' | 'line';
  color: string;
}

export interface Quote {
  id: string;
  userId: string;
  patientId: string;
  patientName: string;
  items: QuoteItem[];
  mapPoints: QuoteMapPoint[];
  totalAmount: number;
  status: 'draft' | 'sent' | 'approved' | 'rejected';
  createdAt: number;
  validUntil: number;
}

export interface MonthlyTarget {
  id: string;
  userId: string;
  month_year: string;
  planned_revenue: number;
  planned_purchases: number;
}

export interface AIAnalysisResult {
  kpis: {
    marketingROI: string;
    costPerVisit: string;
    cardDependency: string;
    topProfessional: string;
  };
  alerts: {
    type: 'critical' | 'warning' | 'positive';
    title: string;
    message: string;
    action: string;
  }[];
  summary: string;
}

export type TaxRegime = 'MEI' | 'SIMPLES' | 'PRESUMIDO';

export interface TaxConfig {
  regime: TaxRegime;
  rate: number;
}

export interface AuthState {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signUp: (email: string, password: string, clinicName: string, name: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error: any }>;
  completeOnboarding: () => Promise<void>;
  updateUserRole: (role: UserRole) => void;
}
