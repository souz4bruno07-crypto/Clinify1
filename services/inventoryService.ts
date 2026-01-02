import api from './apiClient';
import { 
  InventoryProduct, 
  StockMovement, 
  ProductProcedure, 
  StockAlert,
  InventoryReport 
} from '../types';

// =====================================================
// PRODUTOS
// =====================================================

export interface ProductFilters {
  category?: string;
  lowStock?: boolean;
  expiring?: boolean;
}

export const getProducts = async (filters?: ProductFilters): Promise<InventoryProduct[]> => {
  const params = new URLSearchParams();
  if (filters?.category && filters.category !== 'all') params.append('category', filters.category);
  if (filters?.lowStock) params.append('lowStock', 'true');
  if (filters?.expiring) params.append('expiring', 'true');
  
  const query = params.toString() ? `?${params.toString()}` : '';
  return api.get<InventoryProduct[]>(`/inventory/products${query}`);
};

export const getProduct = async (id: string): Promise<InventoryProduct | null> => {
  return api.get<InventoryProduct>(`/inventory/products/${id}`);
};

export const getProductByBarcode = async (barcode: string): Promise<Partial<InventoryProduct> | null> => {
  try {
    return await api.get<Partial<InventoryProduct>>(`/inventory/products/barcode/${barcode}`);
  } catch {
    return null;
  }
};

export const createProduct = async (product: Partial<InventoryProduct>): Promise<InventoryProduct | null> => {
  return api.post<InventoryProduct>('/inventory/products', product);
};

export const updateProduct = async (id: string, product: Partial<InventoryProduct>): Promise<InventoryProduct | null> => {
  return api.put<InventoryProduct>(`/inventory/products/${id}`, product);
};

export const deleteProduct = async (id: string): Promise<boolean> => {
  await api.delete(`/inventory/products/${id}`);
  return true;
};

// =====================================================
// MOVIMENTAÇÕES
// =====================================================

export interface MovementFilters {
  productId?: string;
  type?: string;
  startDate?: number;
  endDate?: number;
  staffId?: string;
  limit?: number;
  offset?: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  limit: number;
  offset: number;
}

export const getMovements = async (filters?: MovementFilters): Promise<PaginatedResponse<StockMovement>> => {
  const params = new URLSearchParams();
  if (filters?.productId) params.append('productId', filters.productId);
  if (filters?.type) params.append('type', filters.type);
  if (filters?.startDate) params.append('startDate', filters.startDate.toString());
  if (filters?.endDate) params.append('endDate', filters.endDate.toString());
  if (filters?.staffId) params.append('staffId', filters.staffId);
  if (filters?.limit) params.append('limit', filters.limit.toString());
  if (filters?.offset !== undefined) params.append('offset', filters.offset.toString());
  
  const query = params.toString() ? `?${params.toString()}` : '';
  return api.get<PaginatedResponse<StockMovement>>(`/inventory/movements${query}`);
};

export interface CreateMovementData {
  productId: string;
  type: 'entrada' | 'saida' | 'ajuste' | 'perda' | 'vencido';
  quantity: number;
  reason?: string;
  staffId?: string;
  appointmentId?: string;
  patientName?: string;
  batchNumber?: string;
  expirationDate?: number;
  invoiceNumber?: string;
  unitCost?: number;
}

export const createMovement = async (data: CreateMovementData): Promise<StockMovement | null> => {
  return api.post<StockMovement>('/inventory/movements', data);
};

export interface BulkMovementItem {
  productId: string;
  quantity: number;
}

export interface BulkMovementData {
  items: BulkMovementItem[];
  staffId?: string;
  appointmentId?: string;
  patientName?: string;
  reason?: string;
}

export const createBulkMovement = async (data: BulkMovementData): Promise<{ success: boolean; processed: number }> => {
  return api.post('/inventory/movements/bulk', data);
};

// =====================================================
// VINCULAÇÃO PRODUTO-PROCEDIMENTO
// =====================================================

export const getProductProcedures = async (): Promise<ProductProcedure[]> => {
  return api.get<ProductProcedure[]>('/inventory/procedures');
};

export const getProcedureItems = async (procedureName: string): Promise<ProductProcedure[]> => {
  return api.get<ProductProcedure[]>(`/inventory/procedures/${encodeURIComponent(procedureName)}`);
};

export interface CreateProcedureLinkData {
  productId: string;
  procedureName: string;
  quantityPerUse: number;
  isRequired?: boolean;
  notes?: string;
}

export const createProcedureLink = async (data: CreateProcedureLinkData): Promise<ProductProcedure | null> => {
  return api.post<ProductProcedure>('/inventory/procedures', data);
};

export const deleteProcedureLink = async (id: string): Promise<boolean> => {
  await api.delete(`/inventory/procedures/${id}`);
  return true;
};

// =====================================================
// ALERTAS
// =====================================================

export const getAlerts = async (unreadOnly?: boolean): Promise<StockAlert[]> => {
  const query = unreadOnly ? '?unreadOnly=true' : '';
  return api.get<StockAlert[]>(`/inventory/alerts${query}`);
};

export const markAlertAsRead = async (id: string): Promise<boolean> => {
  await api.put(`/inventory/alerts/${id}/read`, {});
  return true;
};

export const markAllAlertsAsRead = async (): Promise<boolean> => {
  await api.put('/inventory/alerts/read-all', {});
  return true;
};

// =====================================================
// RELATÓRIOS
// =====================================================

export interface ConsumptionReportFilters {
  startDate?: number;
  endDate?: number;
  staffId?: string;
}

export interface ConsumptionReport {
  period: { start: number; end: number };
  totalMovements: number;
  totalQuantity: number;
  totalCost: number;
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
}

export const getConsumptionReport = async (filters?: ConsumptionReportFilters): Promise<ConsumptionReport> => {
  const params = new URLSearchParams();
  if (filters?.startDate) params.append('startDate', filters.startDate.toString());
  if (filters?.endDate) params.append('endDate', filters.endDate.toString());
  if (filters?.staffId) params.append('staffId', filters.staffId);
  
  const query = params.toString() ? `?${params.toString()}` : '';
  return api.get<ConsumptionReport>(`/inventory/reports/consumption${query}`);
};

export interface ValuationReport {
  totalProducts: number;
  totalValue: number;
  lowStockCount: number;
  expiringCount: number;
  expiringProducts: Array<{
    productId: string;
    productName: string;
    expirationDate: number;
    daysUntilExpiry: number;
    stock: number;
    value: number;
  }>;
  byCategory: Array<{
    category: string;
    count: number;
    value: number;
  }>;
}

export const getValuationReport = async (): Promise<ValuationReport> => {
  return api.get<ValuationReport>('/inventory/reports/valuation');
};

// =====================================================
// CATEGORIAS
// =====================================================

export const getInventoryCategories = async (): Promise<string[]> => {
  return api.get<string[]>('/inventory/categories');
};

// =====================================================
// UNIDADES
// =====================================================

export const PRODUCT_UNITS = [
  { value: 'un', label: 'Unidade' },
  { value: 'ml', label: 'Mililitro (mL)' },
  { value: 'mg', label: 'Miligrama (mg)' },
  { value: 'g', label: 'Grama (g)' },
  { value: 'kg', label: 'Quilograma (kg)' },
  { value: 'cx', label: 'Caixa' },
  { value: 'pct', label: 'Pacote' },
  { value: 'fr', label: 'Frasco' },
  { value: 'amp', label: 'Ampola' },
] as const;

export const getUnitLabel = (unit: string): string => {
  return PRODUCT_UNITS.find(u => u.value === unit)?.label || unit;
};

// =====================================================
// CATEGORIAS PADRÃO
// =====================================================

export const DEFAULT_INVENTORY_CATEGORIES = [
  'Injetáveis',
  'Descartáveis',
  'Medicamentos',
  'Cosméticos',
  'Equipamentos',
  'Material de Escritório',
  'Limpeza',
  'EPIs',
  'Geral'
];







