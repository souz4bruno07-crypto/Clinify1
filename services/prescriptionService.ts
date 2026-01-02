import { 
  Medicine, 
  MedicineCategory,
  AdministrationRoute,
  PrescriptionTemplate, 
  Prescription, 
  PrescriptionItem,
  DrugInteraction,
  ProfessionalSignature
} from '../types';
import jsPDF from 'jspdf';

// ============================================
// BANCO DE MEDICAMENTOS PRÉ-CADASTRADOS
// ============================================

const routeLabels: Record<AdministrationRoute, string> = {
  oral: 'Via Oral',
  sublingual: 'Sublingual',
  topical: 'Uso Tópico',
  intravenous: 'Via Intravenosa',
  intramuscular: 'Via Intramuscular',
  subcutaneous: 'Via Subcutânea',
  inhalation: 'Inalação',
  nasal: 'Via Nasal',
  ophthalmic: 'Uso Oftálmico',
  otic: 'Uso Otológico',
  rectal: 'Via Retal',
  vaginal: 'Via Vaginal'
};

const categoryLabels: Record<MedicineCategory, string> = {
  analgesic: 'Analgésico',
  antibiotic: 'Antibiótico',
  anti_inflammatory: 'Anti-inflamatório',
  antifungal: 'Antifúngico',
  antiviral: 'Antiviral',
  antihistamine: 'Anti-histamínico',
  antihypertensive: 'Anti-hipertensivo',
  antidiabetic: 'Antidiabético',
  anxiolytic: 'Ansiolítico',
  antidepressant: 'Antidepressivo',
  corticosteroid: 'Corticoide',
  vitamin: 'Vitamina',
  supplement: 'Suplemento',
  other: 'Outro'
};

// Banco de dados de medicamentos comuns
const medicinesDatabase: Medicine[] = [
  // ANALGÉSICOS
  {
    id: 'med_001',
    name: 'Dipirona Sódica',
    activeIngredient: 'Dipirona',
    concentration: '500mg',
    form: 'Comprimido',
    category: 'analgesic',
    route: 'oral',
    isControlled: false,
    requiresRetention: false,
    defaultDosage: '1 comprimido',
    defaultDuration: '5 dias',
    defaultQuantity: 20,
    instructions: 'Tomar com água',
    contraindications: ['Alergia à dipirona', 'Porfiria', 'Deficiência de G6PD'],
    interactions: ['med_002', 'med_008'],
    sideEffects: ['Reações alérgicas', 'Agranulocitose (raro)'],
    maxDailyDose: '4g',
    isActive: true,
    createdAt: Date.now(),
    updatedAt: Date.now()
  },
  {
    id: 'med_002',
    name: 'Paracetamol',
    activeIngredient: 'Paracetamol',
    concentration: '750mg',
    form: 'Comprimido',
    category: 'analgesic',
    route: 'oral',
    isControlled: false,
    requiresRetention: false,
    defaultDosage: '1 comprimido',
    defaultDuration: '5 dias',
    defaultQuantity: 20,
    instructions: 'Tomar com água. Não exceder dose máxima diária.',
    contraindications: ['Doença hepática grave', 'Hipersensibilidade'],
    interactions: ['med_008', 'med_016'],
    sideEffects: ['Hepatotoxicidade em doses elevadas'],
    maxDailyDose: '4g',
    isActive: true,
    createdAt: Date.now(),
    updatedAt: Date.now()
  },
  // ANTI-INFLAMATÓRIOS
  {
    id: 'med_003',
    name: 'Ibuprofeno',
    activeIngredient: 'Ibuprofeno',
    concentration: '600mg',
    form: 'Comprimido',
    category: 'anti_inflammatory',
    route: 'oral',
    isControlled: false,
    requiresRetention: false,
    defaultDosage: '1 comprimido',
    defaultDuration: '7 dias',
    defaultQuantity: 21,
    instructions: 'Tomar após as refeições',
    contraindications: ['Úlcera péptica', 'Insuficiência renal grave', 'Gestação 3º trimestre'],
    interactions: ['med_001', 'med_004', 'med_008', 'med_013'],
    sideEffects: ['Dor epigástrica', 'Náuseas', 'Cefaleia'],
    maxDailyDose: '2.4g',
    isActive: true,
    createdAt: Date.now(),
    updatedAt: Date.now()
  },
  {
    id: 'med_004',
    name: 'Nimesulida',
    activeIngredient: 'Nimesulida',
    concentration: '100mg',
    form: 'Comprimido',
    category: 'anti_inflammatory',
    route: 'oral',
    isControlled: false,
    requiresRetention: false,
    defaultDosage: '1 comprimido',
    defaultDuration: '5 dias',
    defaultQuantity: 10,
    instructions: 'Tomar após as refeições. Uso máximo: 15 dias',
    contraindications: ['Insuficiência hepática', 'Menores de 12 anos', 'Úlcera péptica'],
    interactions: ['med_003', 'med_008', 'med_013'],
    sideEffects: ['Hepatotoxicidade', 'Náuseas', 'Diarreia'],
    maxDailyDose: '200mg',
    isActive: true,
    createdAt: Date.now(),
    updatedAt: Date.now()
  },
  // ANTIBIÓTICOS
  {
    id: 'med_005',
    name: 'Amoxicilina',
    activeIngredient: 'Amoxicilina',
    concentration: '500mg',
    form: 'Cápsula',
    category: 'antibiotic',
    route: 'oral',
    isControlled: false,
    requiresRetention: true,
    defaultDosage: '1 cápsula',
    defaultDuration: '7 dias',
    defaultQuantity: 21,
    instructions: 'Tomar de 8 em 8 horas. Completar todo o tratamento.',
    contraindications: ['Alergia a penicilinas', 'Mononucleose'],
    interactions: ['med_006', 'med_016'],
    sideEffects: ['Diarreia', 'Náuseas', 'Rash cutâneo'],
    isActive: true,
    createdAt: Date.now(),
    updatedAt: Date.now()
  },
  {
    id: 'med_006',
    name: 'Azitromicina',
    activeIngredient: 'Azitromicina',
    concentration: '500mg',
    form: 'Comprimido',
    category: 'antibiotic',
    route: 'oral',
    isControlled: false,
    requiresRetention: true,
    defaultDosage: '1 comprimido',
    defaultDuration: '3 dias',
    defaultQuantity: 3,
    instructions: 'Tomar em jejum ou 2h após refeição',
    contraindications: ['Alergia a macrolídeos', 'Doença hepática grave'],
    interactions: ['med_005', 'med_016', 'med_013'],
    sideEffects: ['Diarreia', 'Náuseas', 'Dor abdominal'],
    isActive: true,
    createdAt: Date.now(),
    updatedAt: Date.now()
  },
  {
    id: 'med_007',
    name: 'Cefalexina',
    activeIngredient: 'Cefalexina',
    concentration: '500mg',
    form: 'Cápsula',
    category: 'antibiotic',
    route: 'oral',
    isControlled: false,
    requiresRetention: true,
    defaultDosage: '1 cápsula',
    defaultDuration: '7 dias',
    defaultQuantity: 28,
    instructions: 'Tomar de 6 em 6 horas. Completar todo o tratamento.',
    contraindications: ['Alergia a cefalosporinas'],
    interactions: ['med_016'],
    sideEffects: ['Diarreia', 'Náuseas', 'Rash cutâneo'],
    isActive: true,
    createdAt: Date.now(),
    updatedAt: Date.now()
  },
  // CORTICOIDES
  {
    id: 'med_008',
    name: 'Prednisona',
    activeIngredient: 'Prednisona',
    concentration: '20mg',
    form: 'Comprimido',
    category: 'corticosteroid',
    route: 'oral',
    isControlled: false,
    requiresRetention: false,
    defaultDosage: '1 comprimido',
    defaultDuration: '5 dias',
    defaultQuantity: 5,
    instructions: 'Tomar pela manhã, com alimento',
    contraindications: ['Infecções sistêmicas', 'Diabetes descompensado'],
    interactions: ['med_001', 'med_002', 'med_003', 'med_004', 'med_013'],
    sideEffects: ['Insônia', 'Aumento do apetite', 'Retenção hídrica'],
    isActive: true,
    createdAt: Date.now(),
    updatedAt: Date.now()
  },
  {
    id: 'med_009',
    name: 'Dexametasona',
    activeIngredient: 'Dexametasona',
    concentration: '4mg',
    form: 'Comprimido',
    category: 'corticosteroid',
    route: 'oral',
    isControlled: false,
    requiresRetention: false,
    defaultDosage: '1 comprimido',
    defaultDuration: '3 dias',
    defaultQuantity: 3,
    instructions: 'Tomar pela manhã, com alimento',
    contraindications: ['Infecções sistêmicas', 'Úlcera péptica'],
    interactions: ['med_003', 'med_004', 'med_013'],
    sideEffects: ['Insônia', 'Aumento de glicemia'],
    isActive: true,
    createdAt: Date.now(),
    updatedAt: Date.now()
  },
  // ANTI-HISTAMÍNICOS
  {
    id: 'med_010',
    name: 'Loratadina',
    activeIngredient: 'Loratadina',
    concentration: '10mg',
    form: 'Comprimido',
    category: 'antihistamine',
    route: 'oral',
    isControlled: false,
    requiresRetention: false,
    defaultDosage: '1 comprimido',
    defaultDuration: '10 dias',
    defaultQuantity: 10,
    instructions: 'Tomar 1 vez ao dia',
    contraindications: ['Hipersensibilidade'],
    interactions: [],
    sideEffects: ['Sonolência leve', 'Boca seca'],
    maxDailyDose: '10mg',
    isActive: true,
    createdAt: Date.now(),
    updatedAt: Date.now()
  },
  {
    id: 'med_011',
    name: 'Desloratadina',
    activeIngredient: 'Desloratadina',
    concentration: '5mg',
    form: 'Comprimido',
    category: 'antihistamine',
    route: 'oral',
    isControlled: false,
    requiresRetention: false,
    defaultDosage: '1 comprimido',
    defaultDuration: '10 dias',
    defaultQuantity: 10,
    instructions: 'Tomar 1 vez ao dia',
    contraindications: ['Hipersensibilidade'],
    interactions: [],
    sideEffects: ['Cefaleia', 'Fadiga'],
    maxDailyDose: '5mg',
    isActive: true,
    createdAt: Date.now(),
    updatedAt: Date.now()
  },
  // ANSIOLÍTICOS (CONTROLADOS)
  {
    id: 'med_012',
    name: 'Clonazepam',
    activeIngredient: 'Clonazepam',
    concentration: '2mg',
    form: 'Comprimido',
    category: 'anxiolytic',
    route: 'oral',
    isControlled: true,
    requiresRetention: true,
    defaultDosage: '1/2 comprimido',
    defaultDuration: '30 dias',
    defaultQuantity: 30,
    instructions: 'Tomar à noite. Não dirigir após uso.',
    contraindications: ['Miastenia gravis', 'Glaucoma de ângulo fechado'],
    interactions: ['med_015'],
    sideEffects: ['Sonolência', 'Tontura', 'Dependência'],
    maxDailyDose: '20mg',
    isActive: true,
    createdAt: Date.now(),
    updatedAt: Date.now()
  },
  // ANTI-HIPERTENSIVOS
  {
    id: 'med_013',
    name: 'Losartana',
    activeIngredient: 'Losartana Potássica',
    concentration: '50mg',
    form: 'Comprimido',
    category: 'antihypertensive',
    route: 'oral',
    isControlled: false,
    requiresRetention: false,
    defaultDosage: '1 comprimido',
    defaultDuration: '30 dias',
    defaultQuantity: 30,
    instructions: 'Tomar 1 vez ao dia, sempre no mesmo horário',
    contraindications: ['Gestação', 'Estenose bilateral da artéria renal'],
    interactions: ['med_003', 'med_004', 'med_006', 'med_008', 'med_009'],
    sideEffects: ['Tontura', 'Hipotensão'],
    isActive: true,
    createdAt: Date.now(),
    updatedAt: Date.now()
  },
  // ANTIDIABÉTICOS
  {
    id: 'med_014',
    name: 'Metformina',
    activeIngredient: 'Cloridrato de Metformina',
    concentration: '850mg',
    form: 'Comprimido',
    category: 'antidiabetic',
    route: 'oral',
    isControlled: false,
    requiresRetention: false,
    defaultDosage: '1 comprimido',
    defaultDuration: '30 dias',
    defaultQuantity: 60,
    instructions: 'Tomar após refeições principais',
    contraindications: ['Insuficiência renal', 'Cetoacidose diabética'],
    interactions: [],
    sideEffects: ['Náuseas', 'Diarreia', 'Dor abdominal'],
    maxDailyDose: '2550mg',
    isActive: true,
    createdAt: Date.now(),
    updatedAt: Date.now()
  },
  // ANTIDEPRESSIVOS
  {
    id: 'med_015',
    name: 'Sertralina',
    activeIngredient: 'Cloridrato de Sertralina',
    concentration: '50mg',
    form: 'Comprimido',
    category: 'antidepressant',
    route: 'oral',
    isControlled: true,
    requiresRetention: true,
    defaultDosage: '1 comprimido',
    defaultDuration: '30 dias',
    defaultQuantity: 30,
    instructions: 'Tomar pela manhã com alimento',
    contraindications: ['Uso de IMAO', 'Hipersensibilidade'],
    interactions: ['med_012'],
    sideEffects: ['Náuseas', 'Insônia', 'Disfunção sexual'],
    maxDailyDose: '200mg',
    isActive: true,
    createdAt: Date.now(),
    updatedAt: Date.now()
  },
  // ANTICOAGULANTES
  {
    id: 'med_016',
    name: 'Varfarina',
    activeIngredient: 'Varfarina Sódica',
    concentration: '5mg',
    form: 'Comprimido',
    category: 'other',
    route: 'oral',
    isControlled: false,
    requiresRetention: true,
    defaultDosage: '1 comprimido',
    defaultDuration: '30 dias',
    defaultQuantity: 30,
    instructions: 'Tomar sempre no mesmo horário. Monitorar INR regularmente.',
    contraindications: ['Hemorragia ativa', 'Gestação', 'Hipertensão grave'],
    interactions: ['med_002', 'med_005', 'med_006', 'med_007'],
    sideEffects: ['Sangramento', 'Hematomas'],
    isActive: true,
    createdAt: Date.now(),
    updatedAt: Date.now()
  },
  // VITAMINAS
  {
    id: 'med_017',
    name: 'Vitamina D3',
    activeIngredient: 'Colecalciferol',
    concentration: '7000UI',
    form: 'Cápsula',
    category: 'vitamin',
    route: 'oral',
    isControlled: false,
    requiresRetention: false,
    defaultDosage: '1 cápsula',
    defaultDuration: '30 dias',
    defaultQuantity: 4,
    instructions: 'Tomar 1 vez por semana, com refeição gordurosa',
    contraindications: ['Hipercalcemia', 'Hipervitaminose D'],
    interactions: [],
    sideEffects: ['Hipercalcemia (em doses elevadas)'],
    isActive: true,
    createdAt: Date.now(),
    updatedAt: Date.now()
  },
  {
    id: 'med_018',
    name: 'Complexo B',
    activeIngredient: 'Vitaminas B1, B6, B12',
    concentration: '-',
    form: 'Comprimido',
    category: 'vitamin',
    route: 'oral',
    isControlled: false,
    requiresRetention: false,
    defaultDosage: '1 comprimido',
    defaultDuration: '30 dias',
    defaultQuantity: 30,
    instructions: 'Tomar 1 vez ao dia',
    contraindications: ['Hipersensibilidade'],
    interactions: [],
    sideEffects: ['Urina amarelada (normal)'],
    isActive: true,
    createdAt: Date.now(),
    updatedAt: Date.now()
  },
  // USO TÓPICO
  {
    id: 'med_019',
    name: 'Clobetasol Creme',
    activeIngredient: 'Propionato de Clobetasol',
    concentration: '0,05%',
    form: 'Creme',
    category: 'corticosteroid',
    route: 'topical',
    isControlled: false,
    requiresRetention: false,
    defaultDosage: 'Aplicar fina camada',
    defaultDuration: '14 dias',
    defaultQuantity: 1,
    instructions: 'Aplicar 2x ao dia nas áreas afetadas. Não usar em face.',
    contraindications: ['Infecções cutâneas', 'Rosácea', 'Acne'],
    interactions: [],
    sideEffects: ['Atrofia cutânea', 'Estrias'],
    isActive: true,
    createdAt: Date.now(),
    updatedAt: Date.now()
  },
  {
    id: 'med_020',
    name: 'Cetoconazol Creme',
    activeIngredient: 'Cetoconazol',
    concentration: '2%',
    form: 'Creme',
    category: 'antifungal',
    route: 'topical',
    isControlled: false,
    requiresRetention: false,
    defaultDosage: 'Aplicar fina camada',
    defaultDuration: '21 dias',
    defaultQuantity: 1,
    instructions: 'Aplicar 2x ao dia nas áreas afetadas',
    contraindications: ['Hipersensibilidade'],
    interactions: [],
    sideEffects: ['Irritação local'],
    isActive: true,
    createdAt: Date.now(),
    updatedAt: Date.now()
  }
];

// Interações medicamentosas conhecidas
const drugInteractions: DrugInteraction[] = [
  {
    id: 'int_001',
    drug1Id: 'med_003',
    drug1Name: 'Ibuprofeno',
    drug2Id: 'med_013',
    drug2Name: 'Losartana',
    severity: 'high',
    description: 'AINEs podem reduzir o efeito anti-hipertensivo da Losartana',
    recommendation: 'Monitorar pressão arterial. Considerar analgésico alternativo.',
    mechanism: 'AINEs inibem prostaglandinas renais, reduzindo efeito dos anti-hipertensivos',
    clinicalEffect: 'Redução do controle pressórico'
  },
  {
    id: 'int_002',
    drug1Id: 'med_012',
    drug1Name: 'Clonazepam',
    drug2Id: 'med_015',
    drug2Name: 'Sertralina',
    severity: 'moderate',
    description: 'Uso concomitante pode aumentar sedação',
    recommendation: 'Iniciar com doses baixas e monitorar efeitos sedativos',
    mechanism: 'Potencialização do efeito depressor do SNC',
    clinicalEffect: 'Aumento da sonolência e sedação'
  },
  {
    id: 'int_003',
    drug1Id: 'med_006',
    drug1Name: 'Azitromicina',
    drug2Id: 'med_016',
    drug2Name: 'Varfarina',
    severity: 'high',
    description: 'Azitromicina pode aumentar o efeito anticoagulante da Varfarina',
    recommendation: 'Monitorar INR com frequência durante o tratamento',
    mechanism: 'Inibição do metabolismo hepático da Varfarina',
    clinicalEffect: 'Risco aumentado de sangramento'
  },
  {
    id: 'int_004',
    drug1Id: 'med_003',
    drug1Name: 'Ibuprofeno',
    drug2Id: 'med_008',
    drug2Name: 'Prednisona',
    severity: 'high',
    description: 'Uso combinado aumenta risco de úlcera gástrica e sangramento',
    recommendation: 'Associar protetor gástrico. Evitar uso prolongado.',
    mechanism: 'Sinergismo no dano à mucosa gástrica',
    clinicalEffect: 'Risco aumentado de úlcera e sangramento GI'
  },
  {
    id: 'int_005',
    drug1Id: 'med_004',
    drug1Name: 'Nimesulida',
    drug2Id: 'med_008',
    drug2Name: 'Prednisona',
    severity: 'high',
    description: 'Uso combinado aumenta risco de hepatotoxicidade e úlcera',
    recommendation: 'Evitar associação. Se necessário, usar por período curto com protetor gástrico.',
    mechanism: 'Efeitos aditivos na mucosa gástrica e fígado',
    clinicalEffect: 'Risco de lesão hepática e úlcera GI'
  }
];

// Templates de prescrições frequentes
const defaultTemplates: Omit<PrescriptionTemplate, 'id' | 'userId' | 'createdAt' | 'updatedAt'>[] = [
  {
    name: 'Infecção Dentária Simples',
    description: 'Tratamento padrão para infecções dentárias sem complicações',
    specialty: 'Odontologia',
    diagnosis: 'Infecção dentária / Abscesso periapical',
    items: [
      {
        id: 'item_001',
        medicineId: 'med_005',
        medicineName: 'Amoxicilina',
        activeIngredient: 'Amoxicilina',
        concentration: '500mg',
        form: 'Cápsula',
        route: 'oral',
        dosage: '1 cápsula',
        frequency: '8 em 8 horas',
        duration: '7 dias',
        quantity: 21,
        instructions: 'Tomar de 8 em 8 horas. Completar todo o tratamento.',
        isControlled: false,
        continuous: false
      },
      {
        id: 'item_002',
        medicineId: 'med_001',
        medicineName: 'Dipirona Sódica',
        activeIngredient: 'Dipirona',
        concentration: '500mg',
        form: 'Comprimido',
        route: 'oral',
        dosage: '1 comprimido',
        frequency: '6 em 6 horas se dor',
        duration: '5 dias',
        quantity: 20,
        instructions: 'Tomar em caso de dor',
        isControlled: false,
        continuous: false
      },
      {
        id: 'item_003',
        medicineId: 'med_003',
        medicineName: 'Ibuprofeno',
        activeIngredient: 'Ibuprofeno',
        concentration: '600mg',
        form: 'Comprimido',
        route: 'oral',
        dosage: '1 comprimido',
        frequency: '8 em 8 horas',
        duration: '5 dias',
        quantity: 15,
        instructions: 'Tomar após as refeições',
        isControlled: false,
        continuous: false
      }
    ],
    additionalNotes: 'Manter boa higiene bucal. Retornar em caso de piora dos sintomas.',
    isDefault: true,
    useCount: 0
  },
  {
    name: 'Pós-Operatório Odontológico',
    description: 'Medicação pós-cirúrgica para procedimentos odontológicos',
    specialty: 'Odontologia',
    diagnosis: 'Pós-operatório cirúrgico',
    items: [
      {
        id: 'item_004',
        medicineId: 'med_005',
        medicineName: 'Amoxicilina',
        activeIngredient: 'Amoxicilina',
        concentration: '500mg',
        form: 'Cápsula',
        route: 'oral',
        dosage: '1 cápsula',
        frequency: '8 em 8 horas',
        duration: '7 dias',
        quantity: 21,
        instructions: 'Iniciar imediatamente após o procedimento',
        isControlled: false,
        continuous: false
      },
      {
        id: 'item_005',
        medicineId: 'med_004',
        medicineName: 'Nimesulida',
        activeIngredient: 'Nimesulida',
        concentration: '100mg',
        form: 'Comprimido',
        route: 'oral',
        dosage: '1 comprimido',
        frequency: '12 em 12 horas',
        duration: '5 dias',
        quantity: 10,
        instructions: 'Tomar após as refeições',
        isControlled: false,
        continuous: false
      },
      {
        id: 'item_006',
        medicineId: 'med_009',
        medicineName: 'Dexametasona',
        activeIngredient: 'Dexametasona',
        concentration: '4mg',
        form: 'Comprimido',
        route: 'oral',
        dosage: '1 comprimido',
        frequency: '1 vez ao dia',
        duration: '3 dias',
        quantity: 3,
        instructions: 'Tomar pela manhã',
        isControlled: false,
        continuous: false
      }
    ],
    additionalNotes: 'Aplicar gelo nas primeiras 24h. Dieta líquida/pastosa. Não fazer bochechos nas primeiras 24h.',
    isDefault: true,
    useCount: 0
  },
  {
    name: 'Rinite / Sinusite',
    description: 'Tratamento para rinite alérgica ou sinusite',
    specialty: 'Clínica Geral',
    diagnosis: 'Rinite alérgica / Sinusite',
    items: [
      {
        id: 'item_007',
        medicineId: 'med_011',
        medicineName: 'Desloratadina',
        activeIngredient: 'Desloratadina',
        concentration: '5mg',
        form: 'Comprimido',
        route: 'oral',
        dosage: '1 comprimido',
        frequency: '1 vez ao dia',
        duration: '10 dias',
        quantity: 10,
        isControlled: false,
        continuous: false
      },
      {
        id: 'item_008',
        medicineId: 'med_008',
        medicineName: 'Prednisona',
        activeIngredient: 'Prednisona',
        concentration: '20mg',
        form: 'Comprimido',
        route: 'oral',
        dosage: '1 comprimido',
        frequency: '1 vez ao dia pela manhã',
        duration: '5 dias',
        quantity: 5,
        instructions: 'Tomar pela manhã com alimento',
        isControlled: false,
        continuous: false
      }
    ],
    additionalNotes: 'Manter ambiente limpo e arejado. Evitar alérgenos conhecidos.',
    isDefault: true,
    useCount: 0
  },
  {
    name: 'Dor Crônica',
    description: 'Controle de dor crônica',
    specialty: 'Clínica Geral',
    diagnosis: 'Síndrome dolorosa crônica',
    items: [
      {
        id: 'item_009',
        medicineId: 'med_002',
        medicineName: 'Paracetamol',
        activeIngredient: 'Paracetamol',
        concentration: '750mg',
        form: 'Comprimido',
        route: 'oral',
        dosage: '1 comprimido',
        frequency: '6 em 6 horas se dor',
        duration: '30 dias',
        quantity: 60,
        instructions: 'Tomar em caso de dor. Máximo 4g/dia.',
        isControlled: false,
        continuous: true
      }
    ],
    additionalNotes: 'Não associar com bebidas alcoólicas. Retornar para reavaliação em 30 dias.',
    isDefault: true,
    useCount: 0
  },
  {
    name: 'Suplementação Vitamínica',
    description: 'Suplementação de vitaminas comum',
    specialty: 'Clínica Geral',
    diagnosis: 'Hipovitaminose / Suplementação',
    items: [
      {
        id: 'item_010',
        medicineId: 'med_017',
        medicineName: 'Vitamina D3',
        activeIngredient: 'Colecalciferol',
        concentration: '7000UI',
        form: 'Cápsula',
        route: 'oral',
        dosage: '1 cápsula',
        frequency: '1 vez por semana',
        duration: '12 semanas',
        quantity: 12,
        instructions: 'Tomar com refeição gordurosa',
        isControlled: false,
        continuous: true
      },
      {
        id: 'item_011',
        medicineId: 'med_018',
        medicineName: 'Complexo B',
        activeIngredient: 'Vitaminas B1, B6, B12',
        concentration: '-',
        form: 'Comprimido',
        route: 'oral',
        dosage: '1 comprimido',
        frequency: '1 vez ao dia',
        duration: '30 dias',
        quantity: 30,
        isControlled: false,
        continuous: true
      }
    ],
    additionalNotes: 'Reavaliar níveis séricos em 3 meses.',
    isDefault: true,
    useCount: 0
  }
];

// ============================================
// FUNÇÕES DO SERVIÇO
// ============================================

// Buscar medicamentos
export const searchMedicines = (query: string): Medicine[] => {
  const lowerQuery = query.toLowerCase().trim();
  if (!lowerQuery) return medicinesDatabase.filter(m => m.isActive);
  
  return medicinesDatabase.filter(m => 
    m.isActive && (
      m.name.toLowerCase().includes(lowerQuery) ||
      m.activeIngredient.toLowerCase().includes(lowerQuery) ||
      m.category.toLowerCase().includes(lowerQuery)
    )
  );
};

// Buscar medicamento por ID
export const getMedicineById = (id: string): Medicine | undefined => {
  return medicinesDatabase.find(m => m.id === id);
};

// Buscar medicamentos por categoria
export const getMedicinesByCategory = (category: MedicineCategory): Medicine[] => {
  return medicinesDatabase.filter(m => m.isActive && m.category === category);
};

// Verificar interações medicamentosas
export const checkDrugInteractions = (medicineIds: string[]): DrugInteraction[] => {
  const interactions: DrugInteraction[] = [];
  
  for (let i = 0; i < medicineIds.length; i++) {
    for (let j = i + 1; j < medicineIds.length; j++) {
      const id1 = medicineIds[i];
      const id2 = medicineIds[j];
      
      const interaction = drugInteractions.find(int =>
        (int.drug1Id === id1 && int.drug2Id === id2) ||
        (int.drug1Id === id2 && int.drug2Id === id1)
      );
      
      if (interaction) {
        interactions.push(interaction);
      }
    }
  }
  
  return interactions;
};

// Obter todos os templates
export const getDefaultTemplates = (): Omit<PrescriptionTemplate, 'id' | 'userId' | 'createdAt' | 'updatedAt'>[] => {
  return defaultTemplates;
};

// Obter labels de rotas de administração
export const getRouteLabel = (route: AdministrationRoute): string => {
  return routeLabels[route] || route;
};

// Obter labels de categorias
export const getCategoryLabel = (category: MedicineCategory): string => {
  return categoryLabels[category] || category;
};

// Obter todos os medicamentos
export const getAllMedicines = (): Medicine[] => {
  return medicinesDatabase.filter(m => m.isActive);
};

// ============================================
// GERAÇÃO DE PDF
// ============================================

export const generatePrescriptionPDF = (
  prescription: Prescription,
  clinicInfo: {
    name: string;
    address?: string;
    phone?: string;
    email?: string;
    logo?: string;
  }
): jsPDF => {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const marginLeft = 20;
  const marginRight = 20;
  const contentWidth = pageWidth - marginLeft - marginRight;
  
  let yPos = 20;
  
  // Cor principal
  const primaryColor: [number, number, number] = [16, 185, 129]; // Emerald

  // ====== CABEÇALHO ======
  doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.rect(0, 0, pageWidth, 45, 'F');
  
  // Nome da clínica
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(22);
  doc.setFont('helvetica', 'bold');
  doc.text(clinicInfo.name.toUpperCase(), marginLeft, yPos + 8);
  
  // Informações da clínica
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  yPos += 16;
  if (clinicInfo.address) {
    doc.text(clinicInfo.address, marginLeft, yPos);
    yPos += 5;
  }
  const contactInfo = [clinicInfo.phone, clinicInfo.email].filter(Boolean).join(' | ');
  if (contactInfo) {
    doc.text(contactInfo, marginLeft, yPos);
  }

  // ====== TÍTULO DA PRESCRIÇÃO ======
  yPos = 55;
  doc.setTextColor(30, 41, 59);
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  
  const isControlled = prescription.items.some(item => item.isControlled);
  const title = isControlled ? 'RECEITA DE CONTROLE ESPECIAL' : 'RECEITUÁRIO';
  doc.text(title, pageWidth / 2, yPos, { align: 'center' });

  // ====== DADOS DO PACIENTE ======
  yPos = 68;
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(marginLeft, yPos, contentWidth, 28, 3, 3, 'F');
  
  yPos += 8;
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(71, 85, 105);
  doc.text('PACIENTE:', marginLeft + 5, yPos);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(30, 41, 59);
  doc.text(prescription.patientName, marginLeft + 30, yPos);
  
  if (prescription.patientCpf) {
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(71, 85, 105);
    doc.text('CPF:', marginLeft + 100, yPos);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(30, 41, 59);
    doc.text(prescription.patientCpf, marginLeft + 112, yPos);
  }
  
  yPos += 8;
  if (prescription.patientBirthDate) {
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(71, 85, 105);
    doc.text('NASCIMENTO:', marginLeft + 5, yPos);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(30, 41, 59);
    doc.text(prescription.patientBirthDate, marginLeft + 38, yPos);
  }
  
  if (prescription.patientAddress) {
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(71, 85, 105);
    doc.text('ENDEREÇO:', marginLeft + 70, yPos);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(30, 41, 59);
    const maxAddressWidth = contentWidth - 85;
    const addressLines = doc.splitTextToSize(prescription.patientAddress, maxAddressWidth);
    doc.text(addressLines[0], marginLeft + 98, yPos);
  }

  // ====== MEDICAMENTOS ======
  yPos += 18;
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.text('MEDICAMENTOS PRESCRITOS', marginLeft, yPos);
  
  yPos += 2;
  doc.setDrawColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.setLineWidth(0.5);
  doc.line(marginLeft, yPos, marginLeft + 75, yPos);
  
  yPos += 8;
  
  prescription.items.forEach((item, index) => {
    // Verificar se precisa nova página
    if (yPos > 240) {
      doc.addPage();
      yPos = 20;
    }
    
    // Número do item
    doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.circle(marginLeft + 4, yPos - 1, 4, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.text(`${index + 1}`, marginLeft + 4, yPos, { align: 'center' });
    
    // Nome do medicamento
    doc.setTextColor(30, 41, 59);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    const medName = `${item.medicineName} ${item.concentration}`;
    doc.text(medName, marginLeft + 12, yPos);
    
    // Forma farmacêutica e quantidade
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(100, 116, 139);
    doc.text(`${item.form} - ${item.quantity} ${item.quantity > 1 ? 'unidades' : 'unidade'}`, marginLeft + 12, yPos + 5);
    
    // Posologia
    yPos += 12;
    doc.setTextColor(30, 41, 59);
    doc.setFontSize(10);
    const posology = `Tomar ${item.dosage} de ${item.frequency} por ${item.duration}`;
    doc.text(posology, marginLeft + 12, yPos);
    
    // Via de administração
    doc.setTextColor(100, 116, 139);
    doc.setFontSize(9);
    doc.text(`(${getRouteLabel(item.route)})`, marginLeft + 12 + doc.getTextWidth(posology) + 3, yPos);
    
    // Instruções especiais
    if (item.instructions) {
      yPos += 5;
      doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
      doc.setFontSize(9);
      doc.setFont('helvetica', 'italic');
      const instructions = doc.splitTextToSize(`→ ${item.instructions}`, contentWidth - 12);
      doc.text(instructions, marginLeft + 12, yPos);
      yPos += instructions.length * 4;
    }
    
    // Uso contínuo
    if (item.continuous) {
      yPos += 3;
      doc.setTextColor(234, 88, 12);
      doc.setFontSize(8);
      doc.setFont('helvetica', 'bold');
      doc.text('⚠ USO CONTÍNUO', marginLeft + 12, yPos);
    }
    
    // Controlado
    if (item.isControlled) {
      yPos += 3;
      doc.setTextColor(220, 38, 38);
      doc.setFontSize(8);
      doc.setFont('helvetica', 'bold');
      doc.text('⚠ MEDICAMENTO CONTROLADO - RETENÇÃO DE RECEITA', marginLeft + 12, yPos);
    }
    
    yPos += 12;
  });

  // ====== DIAGNÓSTICO E OBSERVAÇÕES ======
  if (prescription.diagnosis || prescription.additionalNotes) {
    if (yPos > 220) {
      doc.addPage();
      yPos = 20;
    }
    
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.3);
    doc.line(marginLeft, yPos, marginLeft + contentWidth, yPos);
    
    yPos += 8;
    
    if (prescription.diagnosis) {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.setTextColor(71, 85, 105);
      doc.text('DIAGNÓSTICO:', marginLeft, yPos);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(30, 41, 59);
      doc.text(prescription.diagnosis, marginLeft + 32, yPos);
      yPos += 8;
    }
    
    if (prescription.additionalNotes) {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.setTextColor(71, 85, 105);
      doc.text('OBSERVAÇÕES:', marginLeft, yPos);
      yPos += 5;
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(30, 41, 59);
      const notes = doc.splitTextToSize(prescription.additionalNotes, contentWidth);
      doc.text(notes, marginLeft, yPos);
      yPos += notes.length * 5;
    }
  }

  // ====== ASSINATURA ======
  yPos = Math.max(yPos + 20, 230);
  
  // Linha de assinatura
  doc.setDrawColor(30, 41, 59);
  doc.setLineWidth(0.5);
  const signatureWidth = 70;
  const signatureX = (pageWidth - signatureWidth) / 2;
  doc.line(signatureX, yPos, signatureX + signatureWidth, yPos);
  
  // Assinatura digital se existir
  if (prescription.signatureData) {
    try {
      doc.addImage(prescription.signatureData, 'PNG', signatureX, yPos - 25, signatureWidth, 25);
    } catch (e) {
      console.error('Erro ao adicionar assinatura:', e);
    }
  }
  
  yPos += 5;
  doc.setTextColor(30, 41, 59);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text(prescription.professionalName, pageWidth / 2, yPos, { align: 'center' });
  
  yPos += 5;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(100, 116, 139);
  const registration = `${prescription.professionalCrm || 'CRM/CRO'}${prescription.professionalSpecialty ? ` - ${prescription.professionalSpecialty}` : ''}`;
  doc.text(registration, pageWidth / 2, yPos, { align: 'center' });

  // ====== RODAPÉ ======
  const footerY = 285;
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.3);
  doc.line(marginLeft, footerY - 5, marginLeft + contentWidth, footerY - 5);
  
  doc.setFontSize(8);
  doc.setTextColor(148, 163, 184);
  
  const date = new Date(prescription.createdAt).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric'
  });
  doc.text(`Emitido em ${date}`, marginLeft, footerY);
  
  if (prescription.validUntil) {
    const validDate = new Date(prescription.validUntil).toLocaleDateString('pt-BR');
    doc.text(`Válido até: ${validDate}`, pageWidth - marginRight, footerY, { align: 'right' });
  }
  
  doc.text(`ID: ${prescription.id}`, pageWidth / 2, footerY, { align: 'center' });

  return doc;
};

// Baixar PDF
export const downloadPrescriptionPDF = (
  prescription: Prescription,
  clinicInfo: {
    name: string;
    address?: string;
    phone?: string;
    email?: string;
    logo?: string;
  }
): void => {
  const doc = generatePrescriptionPDF(prescription, clinicInfo);
  const filename = `receita_${prescription.patientName.replace(/\s+/g, '_')}_${new Date(prescription.createdAt).toISOString().split('T')[0]}.pdf`;
  doc.save(filename);
};

// Obter PDF como base64
export const getPrescriptionPDFBase64 = (
  prescription: Prescription,
  clinicInfo: {
    name: string;
    address?: string;
    phone?: string;
    email?: string;
    logo?: string;
  }
): string => {
  const doc = generatePrescriptionPDF(prescription, clinicInfo);
  return doc.output('datauristring');
};

// Enviar por WhatsApp
export const sendViaWhatsApp = async (
  prescription: Prescription,
  patientPhone: string
): Promise<{ success: boolean; error?: string }> => {
  try {
    // Formatar número de telefone
    const cleanPhone = patientPhone.replace(/\D/g, '');
    const formattedPhone = cleanPhone.startsWith('55') ? cleanPhone : `55${cleanPhone}`;
    
    // Criar mensagem detalhada
    const itemsList = prescription.items.map((item, i) => 
      `${i + 1}. *${item.medicineName}* ${item.concentration}\n   ${item.dosage} de ${item.frequency} por ${item.duration}`
    ).join('\n\n');
    
    const message = `📋 *Receita Médica*\n\n` +
      `Olá ${prescription.patientName}!\n\n` +
      `Sua receita foi emitida por *${prescription.professionalName}*.\n\n` +
      `*Medicamentos Prescritos:*\n${itemsList}\n\n` +
      (prescription.diagnosis ? `*Diagnóstico:* ${prescription.diagnosis}\n\n` : '') +
      (prescription.additionalNotes ? `*Observações:* ${prescription.additionalNotes}\n\n` : '') +
      `_Receita válida até ${prescription.validUntil ? new Date(prescription.validUntil).toLocaleDateString('pt-BR') : '30 dias'}_\n\n` +
      `📄 O PDF da receita será enviado em seguida.`;
    
    // Tentar usar Evolution API se disponível
    try {
      const { sendEvolutionMessage } = await import('./evolutionService');
      const result = await sendEvolutionMessage(formattedPhone, message);
      
      if (result) {
        // Enviar PDF se possível (requer implementação de envio de arquivo)
        return { success: true };
      }
    } catch (e) {
      // Fallback para WhatsApp Web
    }
    
    // Fallback: Abrir WhatsApp Web
    const whatsappUrl = `https://wa.me/${formattedPhone}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
    
    return { success: true };
  } catch (error) {
    console.error('Erro ao enviar via WhatsApp:', error);
    return { success: false, error: 'Erro ao enviar via WhatsApp' };
  }
};

// Enviar por email
export const sendViaEmail = async (
  prescription: Prescription,
  patientEmail: string,
  pdfBase64: string
): Promise<{ success: boolean; error?: string }> => {
  try {
    // Converter base64 para blob
    const base64Data = pdfBase64.split(',')[1] || pdfBase64;
    const byteCharacters = atob(base64Data);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    const blob = new Blob([byteArray], { type: 'application/pdf' });
    
    // Criar URL do blob
    const pdfUrl = URL.createObjectURL(blob);
    
    // Criar assunto e corpo do email
    const subject = encodeURIComponent(`Receita Médica - ${prescription.patientName}`);
    const itemsList = prescription.items.map((item, i) => 
      `${i + 1}. ${item.medicineName} ${item.concentration} - ${item.dosage} de ${item.frequency} por ${item.duration}`
    ).join('\n');
    
    const body = encodeURIComponent(
      `Olá ${prescription.patientName},\n\n` +
      `Sua receita médica foi emitida por ${prescription.professionalName}.\n\n` +
      `Medicamentos Prescritos:\n${itemsList}\n\n` +
      (prescription.diagnosis ? `Diagnóstico: ${prescription.diagnosis}\n\n` : '') +
      (prescription.additionalNotes ? `Observações: ${prescription.additionalNotes}\n\n` : '') +
      `A receita em PDF está anexada a este email.\n\n` +
      `Atenciosamente,\n${prescription.professionalName}\n${prescription.professionalCrm || ''}`
    );
    
    // Tentar enviar via backend se disponível (endpoint pode ser implementado futuramente)
    // Por enquanto, usamos fallback para mailto
    try {
      // const api = (await import('./apiClient')).default;
      // const response = await api.post('/prescriptions/send-email', {
      //   to: patientEmail,
      //   subject: decodeURIComponent(subject),
      //   body: decodeURIComponent(body),
      //   pdfBase64: pdfBase64
      // });
      // if (response) return { success: true };
    } catch (e) {
      // Fallback para mailto
    }
    
    // Fallback: Abrir cliente de email com mailto
    // Nota: mailto não suporta anexos, então apenas abrimos o cliente
    const mailtoUrl = `mailto:${patientEmail}?subject=${subject}&body=${body}`;
    window.location.href = mailtoUrl;
    
    // Mostrar instrução para anexar o PDF manualmente
    setTimeout(() => {
      alert('Por favor, anexe o PDF da receita manualmente ao email que foi aberto.\n\nOu baixe o PDF e envie separadamente.');
    }, 500);
    
    return { success: true };
  } catch (error) {
    console.error('Erro ao enviar email:', error);
    return { success: false, error: 'Erro ao enviar email' };
  }
};

export default {
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
};








