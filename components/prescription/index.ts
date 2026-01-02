// Componentes de Prescrição Digital
export { default as PrescriptionMain } from './PrescriptionMain';

// Re-exportar tipos relacionados do types.ts
export type {
  Medicine,
  MedicineCategory,
  AdministrationRoute,
  Prescription,
  PrescriptionItem,
  PrescriptionTemplate,
  DrugInteraction,
  PrescriptionHistory,
  ProfessionalSignature
} from '../../types';

// Re-exportar funções do serviço de prescrição
export {
  searchMedicines,
  getMedicineById,
  getMedicinesByCategory,
  checkDrugInteractions,
  getDefaultTemplates,
  getRouteLabel,
  getCategoryLabel,
  getAllMedicines,
  generatePrescriptionPDF,
  downloadPrescriptionPDF,
  getPrescriptionPDFBase64,
  sendViaWhatsApp,
  sendViaEmail
} from '../../services/prescriptionService';











