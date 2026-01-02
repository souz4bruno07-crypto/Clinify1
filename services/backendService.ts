import api from './apiClient';
import { Transaction, Category, Appointment, ChatContact, ChatMessage, Patient, Staff, Quote, MonthlyTarget, User, UserRole } from '../types';

// --- TRANSACTIONS ---

export const getTransactions = async (
  _userId: string,
  limit?: number,
  offset?: number
): Promise<PaginatedResponse<Transaction>> => {
  const apiCallStart = Date.now();
  const params = new URLSearchParams();
  if (limit !== undefined) params.append('limit', limit.toString());
  if (offset !== undefined) params.append('offset', offset.toString());
  // Adicionar cache-busting para evitar cache do navegador
  params.append('_t', Date.now().toString());
  const query = params.toString() ? `?${params.toString()}` : '';
  
  console.log('[getTransactions] Buscando transações com cache-busting:', query);
  const result = await api.get<PaginatedResponse<Transaction>>(`/transactions${query}`);
  const apiCallElapsed = Date.now() - apiCallStart;
  // #region agent log
  fetch('http://127.0.0.1:7242/ingest/7018d877-4b16-4a68-9ee6-6d7d4c606105',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'backendService.ts:6',message:'getTransactions retornou',data:{transactionsCount:result?.data?.length||0,total:result?.total||0,limit,offset,apiCallElapsedMs:apiCallElapsed},timestamp:Date.now(),sessionId:'debug-session',runId:'post-fix',hypothesisId:'A'})}).catch(()=>{});
  // #endregion
  console.log('[getTransactions] Transações retornadas:', result?.data?.length || 0, 'total:', result?.total || 0);
  return result;
};

export const addTransaction = async (transaction: Partial<Transaction>): Promise<Transaction | null> => {
  return api.post<Transaction>('/transactions', transaction);
};

export const updateTransaction = async (id: string, transaction: Partial<Transaction>): Promise<Transaction | null> => {
  return api.put<Transaction>(`/transactions/${id}`, transaction);
};

export const deleteTransaction = async (id: string): Promise<boolean> => {
  await api.delete(`/transactions/${id}`);
  return true;
};

export const addTransactions = async (transactions: Partial<Transaction>[]): Promise<boolean> => {
  await api.post('/transactions/bulk', { transactions });
  return true;
};

export const deleteAllTransactions = async (_userId: string): Promise<boolean> => {
  await api.delete('/transactions');
  return true;
};

export interface DeleteAllClinicDataResponse {
  success: boolean;
  message: string;
  deleted?: {
    transactions: number;
    patients: number;
    staff: number;
    appointments: number;
    quotes: number;
    prescriptions: number;
    inventoryProducts: number;
    categories: number;
    monthlyTargets: number;
    chatMessages: number;
    chatThreads: number;
    stockAlerts: number;
  };
  remaining?: {
    transactions: number;
    patients: number;
    staff: number;
    appointments: number;
    quotes: number;
    prescriptions: number;
    inventoryProducts: number;
    categories: number;
    monthlyTargets: number;
    chatMessages: number;
    chatThreads: number;
    stockAlerts: number;
  };
}

export const deleteAllClinicData = async (_userId: string): Promise<DeleteAllClinicDataResponse> => {
  try {
    console.log('[deleteAllClinicData] Iniciando deleção de todos os dados...');
    const response = await api.delete<DeleteAllClinicDataResponse>('/transactions/reset-all');
    console.log('[deleteAllClinicData] Resposta recebida:', response);
    
    // Verificar se a resposta indica sucesso
    if (response && response.success === true) {
      console.log('[deleteAllClinicData] Deleção concluída com sucesso');
      console.log('[deleteAllClinicData] Dados deletados:', response.deleted);
      console.log('[deleteAllClinicData] Dados restantes:', response.remaining);
      return response;
    }
    
    // Se chegou aqui sem erro mas sem resposta válida, ainda considerar sucesso
    // (a API pode retornar objeto vazio mas status 200)
    console.log('[deleteAllClinicData] Resposta vazia ou sem success, mas sem erro - considerando sucesso');
    return {
      success: true,
      message: 'Dados deletados (resposta não detalhada)',
    };
  } catch (error: any) {
    console.error('[deleteAllClinicData] Erro ao deletar todos os dados:', error);
    console.error('[deleteAllClinicData] Status:', error?.status);
    console.error('[deleteAllClinicData] Response data:', error?.response?.data);
    
    // Extrair mensagem de erro mais detalhada
    const errorMessage = error?.response?.data?.error || error?.response?.data?.details || error?.message || 'Erro desconhecido ao deletar dados';
    const enhancedError = new Error(errorMessage);
    (enhancedError as any).status = error?.status;
    (enhancedError as any).response = error?.response;
    throw enhancedError;
  }
};

export interface SeedResult {
  success: boolean;
  created?: {
    staff: number;
    patients: number;
    appointments: number;
    transactions: number;
    quotes: number;
    products: number;
    movements: number;
    procedureLinks: number;
    alerts: number;
    chatThreads: number;
    chatMessages: number;
    categories: number;
    prescriptions: number;
  };
}

export const seedMockData = async (_userId: string): Promise<SeedResult> => {
  const result = await api.post<SeedResult>('/transactions/seed');
  return result || { success: false };
};

// --- CATEGORIES ---

export const getCategories = async (_userId: string): Promise<Category[]> => {
  return api.get<Category[]>('/categories');
};

export const addCategory = async (category: Partial<Category>): Promise<Category | null> => {
  return api.post<Category>('/categories', category);
};

export const updateCategory = async (id: string, name: string): Promise<Category | null> => {
  return api.put<Category>(`/categories/${id}`, { name });
};

export const deleteCategory = async (id: string): Promise<boolean> => {
  await api.delete(`/categories/${id}`);
  return true;
};

// --- PATIENTS ---

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  limit: number;
  offset: number;
}

export const getPatients = async (
  _userId: string,
  limit?: number,
  offset?: number
): Promise<PaginatedResponse<Patient>> => {
  const apiCallStart = Date.now();
  const params = new URLSearchParams();
  if (limit !== undefined) params.append('limit', limit.toString());
  if (offset !== undefined) params.append('offset', offset.toString());
  const query = params.toString() ? `?${params.toString()}` : '';
  const result = await api.get<PaginatedResponse<Patient>>(`/patients${query}`);
  const apiCallElapsed = Date.now() - apiCallStart;
  // #region agent log
  fetch('http://127.0.0.1:7242/ingest/7018d877-4b16-4a68-9ee6-6d7d4c606105',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'backendService.ts:167',message:'getPatients retornou',data:{patientsCount:result?.data?.length||0,total:result?.total||0,limit,offset,apiCallElapsedMs:apiCallElapsed},timestamp:Date.now(),sessionId:'debug-session',runId:'post-fix',hypothesisId:'A'})}).catch(()=>{});
  // #endregion
  return result;
};

export const addPatient = async (patient: Partial<Patient>): Promise<{ data: Patient | null, error: string | null }> => {
  try {
    const data = await api.post<Patient>('/patients', patient);
    return { data, error: null };
  } catch (e: any) {
    return { data: null, error: e.message };
  }
};

export const updatePatient = async (id: string, patient: Partial<Patient>): Promise<{ data: Patient | null, error: string | null }> => {
  try {
    const data = await api.put<Patient>(`/patients/${id}`, patient);
    return { data, error: null };
  } catch (e: any) {
    return { data: null, error: e.message };
  }
};

export const deletePatient = async (id: string): Promise<boolean> => {
  await api.delete(`/patients/${id}`);
  return true;
};

export interface BirthdayPatient extends Omit<Patient, 'birth_date'> {
  birth_date: string; // Obrigatório para aniversariantes
  daysUntil: number;
}

export const getUpcomingBirthdays = async (_userId: string): Promise<BirthdayPatient[]> => {
  return api.get<BirthdayPatient[]>('/patients/birthdays');
};

// --- STAFF ---

export const getStaff = async (_userId: string): Promise<Staff[]> => {
  return api.get<Staff[]>('/staff');
};

export const addStaff = async (staff: Partial<Staff>): Promise<Staff | null> => {
  return api.post<Staff>('/staff', staff);
};

export const updateStaff = async (id: string, staff: Partial<Staff>): Promise<Staff | null> => {
  return api.put<Staff>(`/staff/${id}`, staff);
};

export const deleteStaff = async (id: string): Promise<boolean> => {
  await api.delete(`/staff/${id}`);
  return true;
};

// --- APPOINTMENTS ---

export const getAppointments = async (_userId: string, start: number, end: number): Promise<Appointment[]> => {
  const apiCallStart = Date.now();
  // #region agent log
  fetch('http://127.0.0.1:7242/ingest/7018d877-4b16-4a68-9ee6-6d7d4c606105',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'backendService.ts:231',message:'getAppointments chamado',data:{userId:_userId,start,end,dateRangeDays:Math.round((end-start)/(1000*60*60*24))},timestamp:Date.now(),sessionId:'debug-session',runId:'post-fix',hypothesisId:'B'})}).catch(()=>{});
  // #endregion
  const result = await api.get<any>(`/appointments?start=${start}&end=${end}`);
  const apiCallElapsed = Date.now() - apiCallStart;
  // #region agent log
  fetch('http://127.0.0.1:7242/ingest/7018d877-4b16-4a68-9ee6-6d7d4c606105',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'backendService.ts:233',message:'getAppointments retornou - antes de extrair data',data:{resultType:typeof result,resultIsArray:Array.isArray(result),hasData:result && 'data' in result,resultKeys:result ? Object.keys(result) : [],apiCallElapsedMs:apiCallElapsed},timestamp:Date.now(),sessionId:'debug-session',runId:'post-fix',hypothesisId:'B'})}).catch(()=>{});
  // #endregion
  // Extrair array do objeto { data: [...] } se necessário
  const appointments = Array.isArray(result) ? result : (result?.data || []);
  // #region agent log
  fetch('http://127.0.0.1:7242/ingest/7018d877-4b16-4a68-9ee6-6d7d4c606105',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'backendService.ts:238',message:'getAppointments retornou - depois de extrair data',data:{appointmentsType:typeof appointments,appointmentsIsArray:Array.isArray(appointments),appointmentsLength:appointments?.length,apiCallElapsedMs:apiCallElapsed},timestamp:Date.now(),sessionId:'debug-session',runId:'post-fix',hypothesisId:'B'})}).catch(()=>{});
  // #endregion
  return appointments;
};

export const addAppointment = async (appt: Partial<Appointment>): Promise<Appointment | null> => {
  return api.post<Appointment>('/appointments', appt);
};

export const updateAppointment = async (id: string, appt: Partial<Appointment>): Promise<Appointment | null> => {
  return api.put<Appointment>(`/appointments/${id}`, appt);
};

export const deleteAppointment = async (id: string): Promise<boolean> => {
  await api.delete(`/appointments/${id}`);
  return true;
};

export const getTodayAppointments = async (_userId: string): Promise<Appointment[]> => {
  return api.get<Appointment[]>('/appointments/today');
};

// --- QUOTES ---

export const getQuotes = async (_userId: string): Promise<Quote[]> => {
  return api.get<Quote[]>('/quotes');
};

export const addQuote = async (quote: Partial<Quote>): Promise<Quote | null> => {
  return api.post<Quote>('/quotes', quote);
};

export const updateQuote = async (id: string, quote: Partial<Quote>): Promise<Quote | null> => {
  return api.put<Quote>(`/quotes/${id}`, quote);
};

export const deleteQuote = async (id: string): Promise<boolean> => {
  await api.delete(`/quotes/${id}`);
  return true;
};

// --- MONTHLY TARGETS ---

export const getMonthlyTarget = async (_userId: string, monthYear: string): Promise<MonthlyTarget | null> => {
  return api.get<MonthlyTarget | null>(`/targets/${monthYear}`);
};

export const upsertMonthlyTarget = async (target: MonthlyTarget): Promise<boolean> => {
  await api.put('/targets', target);
  return true;
};

// --- CHAT ---

export const getChatContacts = async (_userId: string): Promise<ChatContact[]> => {
  return api.get<ChatContact[]>('/chat/contacts');
};

export const getChatThreads = async (_userId: string): Promise<any[]> => {
  return api.get<any[]>('/chat/threads');
};

export const getStoredMessages = async (patientId: string): Promise<ChatMessage[]> => {
  return api.get<ChatMessage[]>(`/chat/messages/${patientId}`);
};

export const sendMessage = async (patientId: string, content: string, direction: 'inbound' | 'outbound'): Promise<boolean> => {
  await api.post('/chat/messages', { patientId, content, direction, timestamp: Date.now() });
  return true;
};

export const saveMessageToHistory = async (msg: Partial<ChatMessage>, _userId: string, contact: ChatContact) => {
  try {
    await api.post('/chat/messages', {
      patientId: msg.patientId,
      content: msg.content,
      direction: msg.direction,
      timestamp: msg.timestamp,
      contactName: contact.name,
      contactPhone: contact.phone
    });

    await api.put(`/chat/threads/${msg.patientId}`, {
      contactName: contact.name,
      lastMessage: msg.content,
      lastTimestamp: msg.timestamp,
      avatarUrl: contact.avatarUrl
    });
  } catch (e) {
    console.error("Erro ao persistir histórico de chat:", e);
  }
};

export const updateThreadStage = async (jid: string, stage: string): Promise<boolean> => {
  await api.put(`/chat/threads/${jid}/stage`, { stage });
  return true;
};

// --- USERS ---

export const getClinicMembers = async (_clinicId: string): Promise<User[]> => {
  const response = await api.get<{ data: User[]; pagination: any }>('/users/clinic-members');
  return response.data || [];
};

export interface CreateUserData {
  email: string;
  password: string;
  name: string;
  role: UserRole;
}

export const createUser = async (userData: CreateUserData): Promise<User> => {
  return api.post<User>('/users', userData);
};

export interface UpdateUserData {
  name?: string;
  email?: string;
  role?: UserRole;
}

export const updateUser = async (userId: string, userData: UpdateUserData): Promise<User> => {
  console.log('[updateUser] Chamando API:', `/users/${userId}`, userData);
  try {
    const result = await api.put<User>(`/users/${userId}`, userData);
    console.log('[updateUser] Sucesso:', result);
    return result;
  } catch (error) {
    console.error('[updateUser] Erro:', error);
    throw error;
  }
};

export const deleteUser = async (userId: string): Promise<boolean> => {
  await api.delete(`/users/${userId}`);
  return true;
};

// --- STAFF TARGETS & COMMISSIONS ---

import { StaffTarget, CommissionRecord, CommissionPaymentReport } from '../types';

export const getStaffTargets = async (monthYear: string): Promise<StaffTarget[]> => {
  try {
    return await api.get<StaffTarget[]>(`/staff/targets/${monthYear}`);
  } catch {
    return [];
  }
};

export const upsertStaffTarget = async (target: Partial<StaffTarget>): Promise<StaffTarget | null> => {
  return api.put<StaffTarget>('/staff/targets', target);
};

export const getCommissionRecords = async (staffId: string, monthYear: string): Promise<CommissionRecord[]> => {
  try {
    return await api.get<CommissionRecord[]>(`/staff/${staffId}/commissions/${monthYear}`);
  } catch {
    return [];
  }
};

export const updateCommissionStatus = async (
  recordId: string, 
  status: 'pending' | 'approved' | 'paid'
): Promise<boolean> => {
  await api.put(`/staff/commissions/${recordId}/status`, { status });
  return true;
};

export const getPaymentReports = async (monthYear: string): Promise<CommissionPaymentReport[]> => {
  try {
    return await api.get<CommissionPaymentReport[]>(`/staff/payment-reports/${monthYear}`);
  } catch {
    return [];
  }
};

export const approvePaymentReport = async (reportId: string, approvedBy: string): Promise<boolean> => {
  await api.put(`/staff/payment-reports/${reportId}/approve`, { approvedBy, approvedAt: Date.now() });
  return true;
};

export const markPaymentAsPaid = async (reportId: string, paymentMethod: string): Promise<boolean> => {
  await api.put(`/staff/payment-reports/${reportId}/paid`, { paymentMethod, paidAt: Date.now() });
  return true;
};

// --- PRESCRIPTIONS ---

import { Prescription } from '../types';

export const getPrescriptions = async (
  userId: string,
  limit?: number,
  offset?: number,
  patientId?: string,
  status?: string
): Promise<PaginatedResponse<Prescription>> => {
  const params = new URLSearchParams();
  if (limit !== undefined) params.append('limit', limit.toString());
  if (offset !== undefined) params.append('offset', offset.toString());
  if (patientId) params.append('patientId', patientId);
  if (status) params.append('status', status);
  const query = params.toString() ? `?${params.toString()}` : '';
  return api.get<PaginatedResponse<Prescription>>(`/prescriptions${query}`);
};

export const getPrescription = async (id: string): Promise<Prescription | null> => {
  return api.get<Prescription>(`/prescriptions/${id}`);
};

export const addPrescription = async (prescription: Partial<Prescription>): Promise<Prescription | null> => {
  return api.post<Prescription>('/prescriptions', prescription);
};

export const updatePrescription = async (id: string, prescription: Partial<Prescription>): Promise<Prescription | null> => {
  return api.put<Prescription>(`/prescriptions/${id}`, prescription);
};

export const deletePrescription = async (id: string): Promise<boolean> => {
  await api.delete(`/prescriptions/${id}`);
  return true;
};

export const getPatientPrescriptions = async (patientId: string): Promise<Prescription[]> => {
  const response = await api.get<{ data: Prescription[] }>(`/prescriptions/patient/${patientId}`);
  return response.data || [];
};

// Buscar pacientes com busca
export const searchPatients = async (
  userId: string,
  query: string,
  limit: number = 20
): Promise<Patient[]> => {
  const params = new URLSearchParams();
  params.append('limit', limit.toString());
  params.append('offset', '0');
  const response = await getPatients(userId, limit, 0);
  
  // Filtrar client-side por nome, CPF ou telefone
  const lowerQuery = query.toLowerCase().trim();
  if (!lowerQuery) return response.data;
  
  return response.data.filter(p => 
    p.name.toLowerCase().includes(lowerQuery) ||
    p.cpf?.toLowerCase().includes(lowerQuery) ||
    p.phone?.replace(/\D/g, '').includes(lowerQuery.replace(/\D/g, ''))
  );
};

// --- BILLING / SUBSCRIPTIONS ---

export interface Subscription {
  id: string;
  plan: 'free' | 'basic' | 'professional' | 'enterprise';
  status: 'active' | 'canceled' | 'past_due' | 'trialing' | 'incomplete';
  startDate: string;
  endDate: string | null;
  cancelAtPeriodEnd: boolean;
  canceledAt: string | null;
  createdAt: string;
  updatedAt: string;
  hasStripeIntegration?: boolean;
  hasMercadoPagoIntegration?: boolean;
}

export interface Plan {
  id: string;
  name: string;
  price: number;
  features: string[];
  limits: {
    patients: number;
    users: number;
    storage: string;
  };
  availableInStripe?: boolean;
}

export const getSubscription = async (): Promise<Subscription | null> => {
  // #region agent log
  fetch('http://127.0.0.1:7242/ingest/7018d877-4b16-4a68-9ee6-6d7d4c606105',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'backendService.ts:536',message:'getSubscription chamado',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'run2',hypothesisId:'H1'})}).catch(()=>{});
  // #endregion agent log
  try {
    const result = await api.get<Subscription | null>('/billing/subscription');
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/7018d877-4b16-4a68-9ee6-6d7d4c606105',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'backendService.ts:540',message:'getSubscription retornou',data:{resultType:typeof result,isNull:result===null,hasId:!!(result as any)?.id},timestamp:Date.now(),sessionId:'debug-session',runId:'run2',hypothesisId:'H1'})}).catch(()=>{});
    // #endregion agent log
    return result;
  } catch (error: any) {
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/7018d877-4b16-4a68-9ee6-6d7d4c606105',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'backendService.ts:545',message:'getSubscription erro',data:{errorMessage:error?.message,errorStatus:(error as any)?.status},timestamp:Date.now(),sessionId:'debug-session',runId:'run2',hypothesisId:'H2'})}).catch(()=>{});
    // #endregion agent log
    throw error;
  }
};

export const createOrUpdateSubscription = async (subscription: {
  plan: string;
  status?: string;
  startDate?: string;
  endDate?: string;
  stripeCustomerId?: string;
  mercadoPagoCustomerId?: string;
}): Promise<Subscription | null> => {
  return api.post<Subscription>('/billing/subscription', subscription);
};

export const updateSubscriptionPlan = async (plan: string): Promise<Subscription | null> => {
  return api.put<Subscription>('/billing/subscription/plan', { plan });
};

export const cancelSubscription = async (cancelAtPeriodEnd: boolean = true): Promise<Subscription | null> => {
  return api.put<Subscription>('/billing/subscription/cancel', { cancelAtPeriodEnd });
};

export const reactivateSubscription = async (): Promise<Subscription | null> => {
  return api.post<Subscription>('/billing/subscription/reactivate', {});
};

export const getAvailablePlans = async (): Promise<Plan[]> => {
  return api.get<Plan[]>('/billing/plans');
};

export const createStripeCheckout = async (planId: string): Promise<{ sessionId: string; url: string | null }> => {
  // #region agent log
  fetch('http://127.0.0.1:7242/ingest/7018d877-4b16-4a68-9ee6-6d7d4c606105',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'backendService.ts:582',message:'createStripeCheckout chamado',data:{planId},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'H1'})}).catch(()=>{});
  // #endregion agent log
  try {
    const result = await api.post<{ sessionId: string; url: string | null }>('/billing/checkout/stripe', { planId });
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/7018d877-4b16-4a68-9ee6-6d7d4c606105',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'backendService.ts:585',message:'createStripeCheckout sucesso',data:{planId,hasUrl:!!result?.url,sessionId:result?.sessionId},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'H1'})}).catch(()=>{});
    // #endregion agent log
    return result;
  } catch (error: any) {
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/7018d877-4b16-4a68-9ee6-6d7d4c606105',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'backendService.ts:589',message:'createStripeCheckout erro',data:{planId,errorMessage:error?.message,errorStatus:error?.status,errorResponse:error?.response?.data},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'H2'})}).catch(()=>{});
    // #endregion agent log
    throw error;
  }
};

export const createMercadoPagoCheckout = async (planId: string): Promise<{ initPoint: string; preApprovalId: string }> => {
  return api.post<{ initPoint: string; preApprovalId: string }>('/billing/checkout/mercado-pago', { planId });
};

// --- LOYALTY / FIDELIDADE ---

import { PatientLoyalty, LoyaltyReward } from '../types';

export const getLoyaltyMembers = async (userId: string): Promise<PatientLoyalty[]> => {
  const response = await api.get<{ data: PatientLoyalty[] }>('/loyalty/members');
  return response.data || [];
};

export const getLoyaltyRewards = async (userId: string): Promise<LoyaltyReward[]> => {
  const response = await api.get<{ data: LoyaltyReward[] }>('/loyalty/rewards');
  return response.data || [];
};

export const createLoyaltyReward = async (reward: Partial<LoyaltyReward>): Promise<LoyaltyReward | null> => {
  return api.post<LoyaltyReward>('/loyalty/rewards', reward);
};

export const updateLoyaltyReward = async (id: string, reward: Partial<LoyaltyReward>): Promise<LoyaltyReward | null> => {
  return api.put<LoyaltyReward>(`/loyalty/rewards/${id}`, reward);
};

export const deleteLoyaltyReward = async (id: string): Promise<boolean> => {
  await api.delete(`/loyalty/rewards/${id}`);
  return true;
};

export const addLoyaltyPoints = async (memberId: string, points: number, source: string, description?: string): Promise<boolean> => {
  await api.post(`/loyalty/members/${memberId}/points`, { points, source, description });
  return true;
};

// --- MEDICAL RECORDS / PRONTUÁRIOS ---

import { MedicalRecord } from '../types';

export const getMedicalRecord = async (patientId: string): Promise<MedicalRecord | null> => {
  return api.get<MedicalRecord>(`/medical-records/${patientId}`);
};

export const createConsultation = async (
  patientId: string,
  consultation: {
    appointmentId?: string;
    professionalId?: string;
    professionalName?: string;
    chiefComplaint?: string;
    clinicalExam?: string;
    diagnosis?: string;
    treatmentPlan?: string;
    procedures?: string[];
    prescriptions?: string[];
  }
): Promise<any> => {
  return api.post(`/medical-records/${patientId}/consultations`, consultation);
};


