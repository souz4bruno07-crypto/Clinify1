
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
  installments?: number;
  cardFee?: number;
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

// ============================================
// PRONTUÁRIO ELETRÔNICO DO PACIENTE (PEP)
// ============================================

export type ToothCondition = 
  | 'healthy'           // Saudável
  | 'caries'           // Cárie
  | 'filling'          // Restauração
  | 'crown'            // Coroa
  | 'extraction'       // Extração indicada
  | 'missing'          // Ausente
  | 'implant'          // Implante
  | 'root_canal'       // Canal
  | 'prosthesis'       // Prótese
  | 'fracture';        // Fratura

export interface ToothData {
  id: number;
  condition: ToothCondition;
  notes?: string;
  surfaces?: {
    mesial?: ToothCondition;
    distal?: ToothCondition;
    vestibular?: ToothCondition;
    lingual?: ToothCondition;
    oclusal?: ToothCondition;
  };
  updatedAt: number;
}

export interface Odontogram {
  id: string;
  patientId: string;
  teeth: ToothData[];
  createdAt: number;
  updatedAt: number;
}

export interface ClinicalNote {
  id: string;
  patientId: string;
  professionalId: string;
  professionalName: string;
  content: string;
  type: 'consultation' | 'procedure' | 'observation' | 'prescription' | 'referral';
  createdAt: number;
  updatedAt: number;
  attachments?: string[];
}

export interface MedicalAttachment {
  id: string;
  patientId: string;
  name: string;
  type: 'xray' | 'photo' | 'exam' | 'document' | 'other';
  url: string;
  thumbnailUrl?: string;
  mimeType: string;
  size: number;
  description?: string;
  uploadedBy: string;
  createdAt: number;
}

export interface DigitalSignature {
  id: string;
  patientId: string;
  documentType: 'consent' | 'anamnesis' | 'treatment_plan' | 'contract';
  documentId: string;
  signatureData: string; // Base64 da assinatura
  signedAt: number;
  ipAddress?: string;
}

export interface AnamnesisField {
  id: string;
  label: string;
  type: 'text' | 'textarea' | 'boolean' | 'select' | 'date' | 'number';
  options?: string[];
  required: boolean;
  category: string;
}

export interface AnamnesisTemplate {
  id: string;
  name: string;
  specialty: 'general' | 'dental' | 'dermatology' | 'cardiology' | 'custom';
  fields: AnamnesisField[];
  createdAt: number;
  updatedAt: number;
  isDefault: boolean;
}

export interface AnamnesisResponse {
  id: string;
  patientId: string;
  templateId: string;
  responses: Record<string, string | boolean | number>;
  signatureId?: string;
  createdAt: number;
  updatedAt: number;
}

export interface ConsultationRecord {
  id: string;
  patientId: string;
  appointmentId?: string;
  professionalId: string;
  professionalName: string;
  chiefComplaint: string; // Queixa principal
  clinicalExam: string;   // Exame clínico
  diagnosis: string;      // Diagnóstico
  treatmentPlan: string;  // Plano de tratamento
  procedures: string[];   // Procedimentos realizados
  prescriptions: string[];
  notes: ClinicalNote[];
  attachments: MedicalAttachment[];
  odontogramSnapshot?: ToothData[];
  signatureId?: string;
  createdAt: number;
  updatedAt: number;
}

export interface MedicalRecord {
  id: string;
  patientId: string;
  anamnesis: AnamnesisResponse[];
  consultations: ConsultationRecord[];
  odontogram: Odontogram;
  attachments: MedicalAttachment[];
  notes: ClinicalNote[];
  signatures: DigitalSignature[];
  createdAt: number;
  updatedAt: number;
}

export interface AuthState {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string, rememberMe?: boolean) => Promise<{ error: any }>;
  signUp: (email: string, password: string, clinicName: string, name: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error: any }>;
  completeOnboarding: () => Promise<void>;
  updateUserRole: (role: UserRole) => void;
}

// ============================================
// CONTROLE DE ESTOQUE
// ============================================

export type ProductUnit = 'un' | 'ml' | 'mg' | 'g' | 'kg' | 'cx' | 'pct' | 'fr' | 'amp';
export type MovementType = 'entrada' | 'saida' | 'ajuste' | 'perda' | 'vencido';

export interface InventoryProduct {
  id: string;
  userId: string;
  name: string;
  description?: string;
  barcode?: string;
  sku?: string;
  category: string;
  unit: ProductUnit;
  currentStock: number;
  minStock: number;
  maxStock?: number;
  costPrice: number;
  salePrice?: number;
  supplier?: string;
  location?: string;
  expirationDate?: number;
  batchNumber?: string;
  isActive: boolean;
  createdAt: number;
  updatedAt: number;
}

export interface StockMovement {
  id: string;
  productId: string;
  productName?: string;
  userId: string;
  staffId?: string;
  staffName?: string;
  type: MovementType;
  quantity: number;
  previousStock: number;
  newStock: number;
  unitCost?: number;
  totalCost?: number;
  reason?: string;
  appointmentId?: string;
  patientName?: string;
  batchNumber?: string;
  expirationDate?: number;
  invoiceNumber?: string;
  createdAt: number;
}

export interface ProductProcedure {
  id: string;
  productId: string;
  productName?: string;
  procedureName: string;
  quantityPerUse: number;
  isRequired: boolean;
  notes?: string;
}

export interface StockAlert {
  id: string;
  productId: string;
  productName: string;
  alertType: 'low_stock' | 'expiring' | 'expired' | 'out_of_stock';
  currentStock: number;
  minStock: number;
  expirationDate?: number;
  daysUntilExpiry?: number;
  isRead: boolean;
  createdAt: number;
}

export interface InventoryReport {
  period: { start: number; end: number };
  totalProducts: number;
  totalValue: number;
  movements: {
    entries: number;
    exits: number;
    adjustments: number;
    losses: number;
  };
  topConsumed: Array<{
    productId: string;
    productName: string;
    quantity: number;
    totalCost: number;
  }>;
  byProfessional: Array<{
    staffId: string;
    staffName: string;
    totalConsumed: number;
    totalCost: number;
    products: Array<{
      productName: string;
      quantity: number;
    }>;
  }>;
  expiringProducts: Array<{
    productId: string;
    productName: string;
    expirationDate: number;
    daysUntilExpiry: number;
    stock: number;
  }>;
}

// ============================================
// SISTEMA DE FIDELIDADE E GAMIFICAÇÃO
// ============================================

export type LoyaltyTier = 'bronze' | 'silver' | 'gold' | 'diamond';

export interface LoyaltyLevel {
  tier: LoyaltyTier;
  name: string;
  minPoints: number;
  maxPoints: number;
  icon: string;
  color: string;
  benefits: string[];
  discountPercent: number;
}

export interface LoyaltyPoints {
  id: string;
  patientId: string;
  points: number;
  source: 'consultation' | 'procedure' | 'referral' | 'birthday' | 'review' | 'bonus';
  description: string;
  appointmentId?: string;
  referralId?: string;
  createdAt: number;
  expiresAt?: number;
}

export interface LoyaltyReward {
  id: string;
  name: string;
  description: string;
  pointsCost: number;
  type: 'discount' | 'product' | 'procedure' | 'voucher';
  value: number; // Valor do desconto em % ou valor do produto/procedimento
  imageUrl?: string;
  stock?: number;
  isActive: boolean;
  tier?: LoyaltyTier; // Nível mínimo para resgatar
  validDays: number; // Dias de validade após resgate
  category: 'beauty' | 'health' | 'wellness' | 'special';
}

export interface LoyaltyRedemption {
  id: string;
  patientId: string;
  rewardId: string;
  rewardName: string;
  pointsSpent: number;
  status: 'pending' | 'used' | 'expired' | 'cancelled';
  code: string; // Código único para resgate
  createdAt: number;
  expiresAt: number;
  usedAt?: number;
}

export interface LoyaltyReferral {
  id: string;
  referrerId: string; // Paciente que indicou
  referrerName: string;
  referredId: string; // Paciente indicado
  referredName: string;
  status: 'pending' | 'completed' | 'expired';
  bonusPoints: number;
  code: string;
  createdAt: number;
  completedAt?: number;
}

export interface PatientLoyalty {
  id: string;
  patientId: string;
  patientName: string;
  totalPoints: number;
  availablePoints: number;
  tier: LoyaltyTier;
  totalConsultations: number;
  totalProcedures: number;
  totalReferrals: number;
  referralCode: string;
  joinedAt: number;
  lastActivityAt: number;
  pointsHistory: LoyaltyPoints[];
  redemptions: LoyaltyRedemption[];
  referrals: LoyaltyReferral[];
}

// ============================================
// METAS E COMISSÕES DE PROFISSIONAIS
// ============================================

export interface StaffTarget {
  id: string;
  staffId: string;
  staffName: string;
  monthYear: string;
  targetRevenue: number;
  achievedRevenue: number;
  proceduresCount: number;
  commissionRate: number;
  commissionValue: number;
  bonusThreshold?: number; // % da meta para bônus
  bonusRate?: number; // % adicional ao atingir threshold
  createdAt: number;
  updatedAt: number;
}

export interface ProcedureCommission {
  id: string;
  procedureName: string;
  basePrice: number;
  commissionType: 'percentage' | 'fixed';
  commissionValue: number;
  staffId?: string; // Se específico para um profissional
  isActive: boolean;
}

export interface CommissionRecord {
  id: string;
  staffId: string;
  staffName: string;
  transactionId: string;
  procedureName: string;
  procedureValue: number;
  commissionRate: number;
  commissionValue: number;
  bonusApplied: boolean;
  date: number;
  status: 'pending' | 'approved' | 'paid';
  paidAt?: number;
}

export interface StaffPerformance {
  staffId: string;
  staffName: string;
  staffColor: string;
  monthYear: string;
  targetRevenue: number;
  achievedRevenue: number;
  progressPercent: number;
  proceduresCount: number;
  avgTicket: number;
  commissionRate: number;
  totalCommission: number;
  bonusEarned: number;
  projectedRevenue: number;
  projectedCommission: number;
  ranking: number;
  streak: number; // Meses consecutivos batendo meta
  badges: StaffBadge[];
}

export interface StaffBadge {
  id: string;
  name: string;
  icon: string;
  description: string;
  earnedAt: number;
  type: 'achievement' | 'milestone' | 'special';
}

export interface CommissionPaymentReport {
  id: string;
  monthYear: string;
  staffId: string;
  staffName: string;
  totalProcedures: number;
  totalRevenue: number;
  baseCommission: number;
  bonusCommission: number;
  totalCommission: number;
  deductions: number;
  netPayable: number;
  status: 'draft' | 'approved' | 'paid';
  approvedBy?: string;
  approvedAt?: number;
  paidAt?: number;
  paymentMethod?: string;
  notes?: string;
}

// ============================================
// SISTEMA DE PRESCRIÇÃO DIGITAL
// ============================================

export type AdministrationRoute = 
  | 'oral'           // Via oral
  | 'sublingual'     // Sublingual
  | 'topical'        // Tópico
  | 'intravenous'    // Intravenoso
  | 'intramuscular'  // Intramuscular
  | 'subcutaneous'   // Subcutâneo
  | 'inhalation'     // Inalação
  | 'nasal'          // Nasal
  | 'ophthalmic'     // Oftálmico
  | 'otic'           // Otológico
  | 'rectal'         // Retal
  | 'vaginal';       // Vaginal

export type MedicineCategory = 
  | 'analgesic'          // Analgésico
  | 'antibiotic'         // Antibiótico
  | 'anti_inflammatory'  // Anti-inflamatório
  | 'antifungal'         // Antifúngico
  | 'antiviral'          // Antiviral
  | 'antihistamine'      // Anti-histamínico
  | 'antihypertensive'   // Anti-hipertensivo
  | 'antidiabetic'       // Antidiabético
  | 'anxiolytic'         // Ansiolítico
  | 'antidepressant'     // Antidepressivo
  | 'corticosteroid'     // Corticoide
  | 'vitamin'            // Vitamina
  | 'supplement'         // Suplemento
  | 'other';             // Outro

export interface Medicine {
  id: string;
  name: string;                      // Nome comercial
  activeIngredient: string;          // Princípio ativo
  concentration: string;             // Ex: "500mg", "10mg/ml"
  form: string;                      // Ex: "comprimido", "cápsula", "solução"
  category: MedicineCategory;
  route: AdministrationRoute;
  manufacturer?: string;
  isControlled: boolean;             // Medicamento controlado
  requiresRetention: boolean;        // Requer retenção de receita
  defaultDosage?: string;            // Posologia padrão
  defaultDuration?: string;          // Duração padrão
  defaultQuantity?: number;          // Quantidade padrão
  instructions?: string;             // Instruções especiais
  contraindications?: string[];      // Contraindicações
  interactions: string[];            // IDs de medicamentos que interagem
  interactionSeverity?: Record<string, 'low' | 'moderate' | 'high' | 'critical'>;
  sideEffects?: string[];            // Efeitos colaterais comuns
  maxDailyDose?: string;             // Dose máxima diária
  isActive: boolean;
  createdAt: number;
  updatedAt: number;
}

export interface DrugInteraction {
  id: string;
  drug1Id: string;
  drug1Name: string;
  drug2Id: string;
  drug2Name: string;
  severity: 'low' | 'moderate' | 'high' | 'critical';
  description: string;
  recommendation: string;
  mechanism?: string;
  clinicalEffect?: string;
}

export interface PrescriptionItem {
  id: string;
  medicineId: string;
  medicineName: string;
  activeIngredient: string;
  concentration: string;
  form: string;
  route: AdministrationRoute;
  dosage: string;                    // Ex: "1 comprimido"
  frequency: string;                 // Ex: "8 em 8 horas"
  duration: string;                  // Ex: "7 dias"
  quantity: number;                  // Quantidade total
  instructions?: string;             // Instruções especiais
  isControlled: boolean;
  continuous: boolean;               // Uso contínuo
}

export interface PrescriptionTemplate {
  id: string;
  userId: string;
  name: string;
  description?: string;
  specialty?: string;
  diagnosis?: string;
  items: PrescriptionItem[];
  additionalNotes?: string;
  isDefault: boolean;
  useCount: number;
  createdAt: number;
  updatedAt: number;
}

export interface Prescription {
  id: string;
  clinicId: string;
  patientId: string;
  patientName: string;
  patientCpf?: string;
  patientBirthDate?: string;
  patientAddress?: string;
  professionalId: string;
  professionalName: string;
  professionalCrm?: string;           // CRM/CRO/etc
  professionalSpecialty?: string;
  items: PrescriptionItem[];
  diagnosis?: string;
  additionalNotes?: string;
  templateId?: string;
  signatureData?: string;             // Base64 da assinatura digital
  signedAt?: number;
  status: 'draft' | 'signed' | 'sent' | 'cancelled';
  sentVia?: ('email' | 'whatsapp')[];
  sentAt?: number;
  pdfUrl?: string;
  validUntil?: number;                // Validade da receita
  isControlled: boolean;              // Se contém medicamento controlado
  createdAt: number;
  updatedAt: number;
}

export interface PrescriptionHistory {
  id: string;
  prescriptionId: string;
  action: 'created' | 'signed' | 'sent_email' | 'sent_whatsapp' | 'cancelled' | 'viewed';
  performedBy: string;
  performedByName: string;
  details?: string;
  timestamp: number;
}

export interface ProfessionalSignature {
  id: string;
  professionalId: string;
  signatureData: string;              // Base64 da assinatura
  registrationNumber: string;         // CRM/CRO/etc
  registrationState: string;          // UF do registro
  specialties: string[];
  isActive: boolean;
  createdAt: number;
  updatedAt: number;
}
