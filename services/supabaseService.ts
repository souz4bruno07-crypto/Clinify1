
import { supabase } from '../supabaseClient';
import { Transaction, Category, Appointment, ChatContact, ChatMessage, Patient, Staff, Quote, MonthlyTarget, User, UserRole } from '../types';

// --- HELPERS PARA MAPEAMENTO ---
const mapFromDB = (t: any): Transaction => ({
    id: t.id,
    userId: t.user_id,
    description: t.description,
    amount: Number(t.amount),
    type: t.type,
    category: t.category || 'Geral',
    date: Number(t.date),
    patientName: t.patient_name,
    paymentMethod: t.payment_method,
    isPaid: t.is_paid,
    tags: t.tags
});

const mapToDB = (t: Partial<Transaction>) => ({
    user_id: t.userId,
    description: t.description,
    amount: t.amount,
    type: t.type,
    category: t.category,
    date: t.date,
    patient_name: t.patientName,
    payment_method: t.paymentMethod,
    is_paid: t.isPaid,
    tags: t.tags
});

// --- DATA MANAGEMENT ---

export const deleteAllTransactions = async (userId: string): Promise<boolean> => {
    const { error } = await supabase.from('transactions').delete().eq('user_id', userId);
    return !error;
};

export const seedMockData = async (userId: string): Promise<boolean> => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    const mockTxs = [
        { user_id: userId, description: 'Protocolo Glúteo Max', amount: 3500.00, type: 'revenue', category: 'Procedimentos', date: new Date(currentYear, currentMonth, 2).getTime(), payment_method: 'credit' },
        { user_id: userId, description: 'Botox 3 Áreas', amount: 1200.00, type: 'revenue', category: 'Procedimentos', date: new Date(currentYear, currentMonth, 5).getTime(), payment_method: 'pix' },
        { user_id: userId, description: 'Preenchimento Labial', amount: 1800.00, type: 'revenue', category: 'Procedimentos', date: new Date(currentYear, currentMonth, 10).getTime(), payment_method: 'credit' },
        { user_id: userId, description: 'Bioestimulador de Colágeno', amount: 2500.00, type: 'revenue', category: 'Procedimentos', date: new Date(currentYear, currentMonth, 12).getTime(), payment_method: 'pix' },
        { user_id: userId, description: 'Compra Toxina Botulínica', amount: 4500.00, type: 'expense', category: 'Insumos', date: new Date(currentYear, currentMonth, 3).getTime() },
        { user_id: userId, description: 'Aluguel Unidade', amount: 5000.00, type: 'expense', category: 'Aluguel', date: new Date(currentYear, currentMonth, 1).getTime() },
        { user_id: userId, description: 'Marketing Ads', amount: 2000.00, type: 'expense', category: 'Marketing', date: new Date(currentYear, currentMonth, 10).getTime() },
        { user_id: userId, description: 'Energia Elétrica', amount: 450.00, type: 'expense', category: 'Custos Fixos', date: new Date(currentYear, currentMonth, 15).getTime() },
    ];

    const { error } = await supabase.from('transactions').insert(mockTxs);
    if (error) {
        console.error("Erro Seed:", error.message);
        return false;
    }
    return true;
};

// --- TRANSACTIONS ---

export const getTransactions = async (userId: string): Promise<Transaction[]> => {
  const { data, error } = await supabase
    .from('transactions')
    .select('*')
    .eq('user_id', userId)
    .order('date', { ascending: false });
  
  if (error) return [];
  return data.map(mapFromDB);
};

export const addTransaction = async (transaction: Partial<Transaction>): Promise<Transaction | null> => {
  const { data, error } = await supabase
    .from('transactions')
    .insert([mapToDB(transaction)])
    .select()
    .single();
    
  if (error) throw new Error(error.message);
  return mapFromDB(data);
};

export const updateTransaction = async (id: string, transaction: Partial<Transaction>): Promise<Transaction | null> => {
  const { data, error } = await supabase
    .from('transactions')
    .update(mapToDB(transaction))
    .eq('id', id)
    .select()
    .single();
    
  if (error) throw new Error(error.message);
  return mapFromDB(data);
};

export const deleteTransaction = async (id: string): Promise<boolean> => {
  const { error } = await supabase.from('transactions').delete().eq('id', id);
  return !error;
};

export const addTransactions = async (transactions: Partial<Transaction>[]): Promise<boolean> => {
  const dbRows = transactions.map(mapToDB);
  const { error } = await supabase.from('transactions').insert(dbRows);
  return !error;
};

// --- RESTO DO SERVICE MANTIDO ---

export const getCategories = async (userId: string): Promise<Category[]> => {
  const { data, error } = await supabase.from('categories').select('*').or(`userId.eq.${userId},userId.is.null`);
  return error ? [] : data as Category[];
};

export const addCategory = async (category: Partial<Category>): Promise<Category | null> => {
  const { data, error } = await supabase.from('categories').insert([category]).select().single();
  return error ? null : data as Category;
};

export const updateCategory = async (id: string, name: string): Promise<Category | null> => {
  const { data, error } = await supabase.from('categories').update({ name }).eq('id', id).select().single();
  return error ? null : data as Category;
};

export const deleteCategory = async (id: string): Promise<boolean> => {
  const { error } = await supabase.from('categories').delete().eq('id', id);
  return !error;
};

export const getStaff = async (userId: string): Promise<Staff[]> => {
    const { data, error } = await supabase.from('staff').select('*').eq('userId', userId);
    return error ? [] : data as Staff[];
};

export const addStaff = async (staff: Partial<Staff>): Promise<Staff | null> => {
    const { data, error } = await supabase.from('staff').insert([staff]).select().single();
    return error ? null : data as Staff;
};

export const updateStaff = async (id: string, staff: Partial<Staff>): Promise<Staff | null> => {
    const { data, error } = await supabase.from('staff').update(staff).eq('id', id).select().single();
    return error ? null : data as Staff;
};

export const deleteStaff = async (id: string): Promise<boolean> => {
    const { error } = await supabase.from('staff').delete().eq('id', id);
    return !error;
};

export const getAppointments = async (userId: string, start: number, end: number): Promise<Appointment[]> => {
    const { data, error } = await supabase.from('appointments').select('*').eq('userId', userId).gte('startTime', start).lte('startTime', end);
    return error ? [] : data as Appointment[];
};

export const addAppointment = async (appt: Partial<Appointment>): Promise<Appointment | null> => {
    const { data, error } = await supabase.from('appointments').insert([appt]).select().single();
    return error ? null : data as Appointment;
};

export const updateAppointment = async (id: string, appt: Partial<Appointment>): Promise<Appointment | null> => {
    const { data, error } = await supabase.from('appointments').update(appt).eq('id', id).select().single();
    return error ? null : data as Appointment;
};

export const deleteAppointment = async (id: string): Promise<boolean> => {
    const { error } = await supabase.from('appointments').delete().eq('id', id);
    return !error;
};

export const getTodayAppointments = async (userId: string): Promise<Appointment[]> => {
  const start = new Date(); start.setHours(0,0,0,0);
  const end = new Date(); end.setHours(23,59,59,999);
  return getAppointments(userId, start.getTime(), end.getTime());
};

export const getQuotes = async (userId: string): Promise<Quote[]> => {
    const { data, error } = await supabase.from('quotes').select('*').eq('userId', userId).order('createdAt', { ascending: false });
    return error ? [] : data as Quote[];
};

export const addQuote = async (quote: Partial<Quote>): Promise<Quote | null> => {
    const { data, error } = await supabase.from('quotes').insert([quote]).select().single();
    return error ? null : data as Quote;
};

export const updateQuote = async (id: string, quote: Partial<Quote>): Promise<Quote | null> => {
    const { data, error } = await supabase.from('quotes').update(quote).eq('id', id).select().single();
    return error ? null : data as Quote;
};

export const deleteQuote = async (id: string): Promise<boolean> => {
    const { error } = await supabase.from('quotes').delete().eq('id', id);
    return !error;
};

export const getChatContacts = async (userId: string): Promise<ChatContact[]> => {
  const { data: patients, error } = await supabase.from('patients').select('*').eq('user_id', userId);
  if (error || !patients) return [];
  return patients.map(p => ({
      id: p.id, clinicId: userId, name: p.name, phone: p.phone, email: p.email, avatarUrl: p.avatar_url,
      lastMessage: 'Abrir conversa',
      unreadCount: 0 
  }));
};

export const sendMessage = async (patientId: string, content: string, direction: 'inbound' | 'outbound'): Promise<boolean> => {
    const { error } = await supabase
        .from('chat_messages')
        .insert([{
            patient_id: patientId,
            content,
            direction,
            status: 'sent'
        }]);
    return !error;
};

export const getMonthlyTarget = async (userId: string, monthYear: string): Promise<MonthlyTarget | null> => {
    const { data, error } = await supabase.from('monthly_targets').select('*').eq('user_id', userId).eq('month_year', monthYear).maybeSingle();
    return error ? null : data ? { id: data.id, userId: data.user_id, month_year: data.month_year, planned_revenue: data.planned_revenue, planned_purchases: data.planned_purchases } : null;
};

export const upsertMonthlyTarget = async (target: MonthlyTarget): Promise<boolean> => {
    const { error } = await supabase.from('monthly_targets').upsert({ user_id: target.userId, month_year: target.month_year, planned_revenue: target.planned_revenue, planned_purchases: target.planned_purchases }, { onConflict: 'user_id, month_year' });
    return !error;
};

export const getClinicMembers = async (clinicId: string): Promise<User[]> => {
    const { data, error } = await supabase.from('users').select('*').eq('clinicId', clinicId).order('name');
    return error ? [] : data as User[];
};

export const getPatients = async (userId: string): Promise<Patient[]> => {
    const { data, error } = await supabase
        .from('patients')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
    
    if (error) return [];
    return data.map(p => ({ 
        ...p, 
        clinicId: userId, 
        avatarUrl: p.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(p.name)}&background=random` 
    })) as Patient[];
};

export const addPatient = async (patient: Partial<Patient>): Promise<{ data: Patient | null, error: string | null }> => {
    if (!patient.user_id) return { data: null, error: "Usuário não autenticado." };
    const payload = {
        user_id: patient.user_id,
        name: patient.name || '',
        phone: patient.phone || '',
        email: patient.email || null,
        cpf: patient.cpf || null,
        birth_date: patient.birth_date || null,
        profession: patient.profession || null,
        marketing_source: patient.marketing_source || null,
        cep: patient.cep || null,
        address_street: patient.address_street || null,
        address_number: patient.address_number || null,
        address_neighborhood: patient.address_neighborhood || null,
        address_city: patient.address_city || null,
        address_state: patient.address_state || null,
        height: patient.height || null,
        weight: patient.weight || null,
        notes: patient.notes || null,
        avatar_url: patient.avatar_url || null
    };
    const { data, error } = await supabase.from('patients').insert([payload]).select().single();
    if (error) return { data: null, error: error.message };
    return { data: data as Patient, error: null };
};

export const updatePatient = async (id: string, patient: Partial<Patient>): Promise<{ data: Patient | null, error: string | null }> => {
    const { id: _, created_at, user_id, clinicId, avatarUrl, ...updatableData } = patient as any;
    const { data, error } = await supabase.from('patients').update(updatableData).eq('id', id).select().single();
    if (error) return { data: null, error: error.message };
    return { data: data as Patient, error: null };
};

export const deletePatient = async (id: string): Promise<boolean> => {
    const { error } = await supabase.from('patients').delete().eq('id', id);
    return !error;
};

export const saveMessageToHistory = async (msg: Partial<ChatMessage>, userId: string, contact: ChatContact) => {
    try {
        const { data: existing } = await supabase
            .from('chat_messages')
            .select('id')
            .eq('id', msg.id)
            .maybeSingle();

        if (!existing) {
            await supabase.from('chat_messages').insert([{
                id: msg.id?.startsWith('opt-') ? undefined : msg.id,
                user_id: userId,
                patient_id: msg.patientId,
                content: msg.content,
                direction: msg.direction,
                timestamp: msg.timestamp,
                contact_name: contact.name,
                contact_phone: contact.phone,
                status: msg.status || 'sent'
            }]);
        }

        await supabase.from('chat_threads').upsert({
            id: msg.patientId,
            user_id: userId,
            contact_name: contact.name,
            last_message: msg.content,
            last_timestamp: msg.timestamp,
            avatar_url: contact.avatarUrl || null
        }, { onConflict: 'id' });
    } catch (e) {
        console.error("Erro ao persistir histórico de chat:", e);
    }
};

export const updateThreadStage = async (jid: string, stage: string) => {
    const { error } = await supabase
        .from('chat_threads')
        .update({ crm_stage: stage })
        .eq('id', jid);
    return !error;
};

export const getChatThreads = async (userId: string): Promise<any[]> => {
    const { data, error } = await supabase
        .from('chat_threads')
        .select('*')
        .eq('user_id', userId)
        .order('last_timestamp', { ascending: false });
    
    if (error) return [];
    return data;
};

export const getStoredMessages = async (patientId: string): Promise<ChatMessage[]> => {
    const { data, error } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('patient_id', patientId)
        .order('timestamp', { ascending: true });
    
    if (error) return [];
    return data.map(m => ({
        id: m.id,
        patientId: m.patient_id,
        content: m.content,
        direction: m.direction,
        timestamp: m.timestamp,
        status: m.status
    })) as ChatMessage[];
};
