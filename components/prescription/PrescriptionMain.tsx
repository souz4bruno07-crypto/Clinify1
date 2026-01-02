import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Pill,
  Search,
  Plus,
  Trash2,
  FileText,
  Send,
  Download,
  History,
  AlertTriangle,
  Check,
  X,
  ChevronDown,
  ChevronUp,
  Copy,
  Mail,
  MessageCircle,
  PenTool,
  Eraser,
  Star,
  Clock,
  AlertCircle,
  BookTemplate,
  Sparkles,
  User,
  Calendar,
  MapPin,
  CreditCard,
  Save,
  Phone,
  Eye,
  Filter,
  RefreshCw,
  Loader2,
  Info,
  ShieldAlert,
  Bookmark,
  Stethoscope
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContextAPI';
import { useToast } from '../../contexts/ToastContext';
import { 
  Medicine, 
  Prescription, 
  PrescriptionItem, 
  PrescriptionTemplate,
  DrugInteraction,
  Patient
} from '../../types';
import { 
  searchPatients, 
  getPatientPrescriptions,
  addPrescription,
  updatePrescription 
} from '../../services/backendService';
import {
  searchMedicines,
  getMedicineById,
  checkDrugInteractions,
  getDefaultTemplates,
  getRouteLabel,
  getCategoryLabel,
  getAllMedicines,
  downloadPrescriptionPDF,
  getPrescriptionPDFBase64,
  sendViaWhatsApp,
  sendViaEmail
} from '../../services/prescriptionService';
import Modal, { ModalHeader, ModalTitle, ModalDescription, ModalBody, ModalFooter } from '../ui/Modal';
import Button from '../ui/Button';

// ============================================
// TIPOS LOCAIS
// ============================================

interface PrescriptionMainProps {
  patient?: Patient;
  onClose?: () => void;
  onSave?: (prescription: Prescription) => void;
}

// ============================================
// COMPONENTE PRINCIPAL
// ============================================

const PrescriptionMain: React.FC<PrescriptionMainProps> = ({ 
  patient,
  onClose,
  onSave 
}) => {
  const { user } = useAuth();
  const toast = useToast();
  
  // Estados principais
  const [prescriptionItems, setPrescriptionItems] = useState<PrescriptionItem[]>([]);
  const [diagnosis, setDiagnosis] = useState('');
  const [additionalNotes, setAdditionalNotes] = useState('');
  const [signatureData, setSignatureData] = useState<string | null>(null);
  
  // Estados do paciente
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(patient || null);
  const [patientSearch, setPatientSearch] = useState('');
  const [patientSearchResults, setPatientSearchResults] = useState<Patient[]>([]);
  const [showPatientDropdown, setShowPatientDropdown] = useState(false);
  const [isSearchingPatients, setIsSearchingPatients] = useState(false);
  
  // Estados de busca de medicamentos
  const [medicineSearch, setMedicineSearch] = useState('');
  const [searchResults, setSearchResults] = useState<Medicine[]>([]);
  const [showMedicineDropdown, setShowMedicineDropdown] = useState(false);
  const [selectedMedicine, setSelectedMedicine] = useState<Medicine | null>(null);
  
  // Estados de modal
  const [showMedicineModal, setShowMedicineModal] = useState(false);
  const [showTemplatesModal, setShowTemplatesModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [showInteractionsModal, setShowInteractionsModal] = useState(false);
  const [showSendModal, setShowSendModal] = useState(false);
  const [showSignatureModal, setShowSignatureModal] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  
  // Estados de interações
  const [interactions, setInteractions] = useState<DrugInteraction[]>([]);
  
  // Estados de templates
  const [templates, setTemplates] = useState<PrescriptionTemplate[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<PrescriptionTemplate | null>(null);
  
  // Estados de histórico
  const [prescriptionHistory, setPrescriptionHistory] = useState<Prescription[]>([]);
  
  // Estados de dosagem do medicamento selecionado
  const [dosage, setDosage] = useState('');
  const [frequency, setFrequency] = useState('');
  const [duration, setDuration] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [instructions, setInstructions] = useState('');
  const [continuous, setContinuous] = useState(false);
  
  // Estados de envio
  const [sendMethod, setSendMethod] = useState<'email' | 'whatsapp' | null>(null);
  const [isSending, setIsSending] = useState(false);
  const [sendSuccess, setSendSuccess] = useState(false);
  
  // Estados de assinatura
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasSignature, setHasSignature] = useState(false);
  
  // Estados de loading
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // ============================================
  // EFEITOS
  // ============================================

  // Buscar medicamentos
  useEffect(() => {
    if (medicineSearch.trim().length >= 2) {
      const results = searchMedicines(medicineSearch);
      setSearchResults(results);
      setShowMedicineDropdown(true);
    } else {
      setSearchResults([]);
      setShowMedicineDropdown(false);
    }
  }, [medicineSearch]);

  // Verificar interações quando os itens mudam
  useEffect(() => {
    if (prescriptionItems.length >= 2) {
      const medicineIds = prescriptionItems.map(item => item.medicineId);
      const foundInteractions = checkDrugInteractions(medicineIds);
      setInteractions(foundInteractions);
    } else {
      setInteractions([]);
    }
  }, [prescriptionItems]);

  // Carregar templates
  useEffect(() => {
    const defaultTemplates = getDefaultTemplates();
    const formattedTemplates: PrescriptionTemplate[] = defaultTemplates.map((t, index) => ({
      ...t,
      id: `template_${index}`,
      userId: user?.id || '',
      createdAt: Date.now(),
      updatedAt: Date.now()
    }));
    setTemplates(formattedTemplates);
  }, [user]);

  // Buscar pacientes quando o termo de busca mudar
  useEffect(() => {
    if (!user || !patientSearch.trim() || patientSearch.trim().length < 2) {
      setPatientSearchResults([]);
      setShowPatientDropdown(false);
      return;
    }

    const searchTimeout = setTimeout(async () => {
      setIsSearchingPatients(true);
      try {
        const results = await searchPatients(user.id, patientSearch, 10);
        setPatientSearchResults(results);
        setShowPatientDropdown(true);
      } catch (error) {
        console.error('Erro ao buscar pacientes:', error);
        toast.error('Erro ao buscar pacientes');
      } finally {
        setIsSearchingPatients(false);
      }
    }, 300);

    return () => clearTimeout(searchTimeout);
  }, [patientSearch, user, toast]);

  // Carregar histórico de prescrições do backend
  useEffect(() => {
    const loadHistory = async () => {
      if (!user || !selectedPatient?.id) {
        setPrescriptionHistory([]);
        return;
      }

      try {
        const history = await getPatientPrescriptions(selectedPatient.id);
        setPrescriptionHistory(history);
      } catch (error) {
        console.error('Erro ao carregar histórico:', error);
        setPrescriptionHistory([]);
      }
    };

    loadHistory();
  }, [user, selectedPatient]);

  // ============================================
  // HANDLERS
  // ============================================

  // Selecionar medicamento da busca
  const handleSelectMedicine = (medicine: Medicine) => {
    setSelectedMedicine(medicine);
    setMedicineSearch('');
    setShowMedicineDropdown(false);
    
    // Preencher valores padrão
    setDosage(medicine.defaultDosage || '1 unidade');
    setFrequency('8 em 8 horas');
    setDuration(medicine.defaultDuration || '7 dias');
    setQuantity(medicine.defaultQuantity || 1);
    setInstructions(medicine.instructions || '');
    setContinuous(false);
    
    setShowMedicineModal(true);
  };

  // Adicionar medicamento à prescrição
  const handleAddMedicine = () => {
    if (!selectedMedicine) return;

    const newItem: PrescriptionItem = {
      id: `item_${Date.now()}`,
      medicineId: selectedMedicine.id,
      medicineName: selectedMedicine.name,
      activeIngredient: selectedMedicine.activeIngredient,
      concentration: selectedMedicine.concentration,
      form: selectedMedicine.form,
      route: selectedMedicine.route,
      dosage,
      frequency,
      duration,
      quantity,
      instructions,
      isControlled: selectedMedicine.isControlled,
      continuous
    };

    setPrescriptionItems([...prescriptionItems, newItem]);
    setShowMedicineModal(false);
    setSelectedMedicine(null);
    resetMedicineForm();
  };

  // Resetar formulário de medicamento
  const resetMedicineForm = () => {
    setDosage('');
    setFrequency('');
    setDuration('');
    setQuantity(1);
    setInstructions('');
    setContinuous(false);
  };

  // Remover medicamento
  const handleRemoveMedicine = (itemId: string) => {
    setPrescriptionItems(prescriptionItems.filter(item => item.id !== itemId));
  };

  // Aplicar template
  const handleApplyTemplate = (template: PrescriptionTemplate) => {
    setPrescriptionItems(template.items);
    setDiagnosis(template.diagnosis || '');
    setAdditionalNotes(template.additionalNotes || '');
    setShowTemplatesModal(false);
  };

  // Repetir prescrição do histórico
  const handleRepeatPrescription = (prescription: Prescription) => {
    setPrescriptionItems(prescription.items);
    setDiagnosis(prescription.diagnosis || '');
    setAdditionalNotes(prescription.additionalNotes || '');
    setShowHistoryModal(false);
  };

  // ============================================
  // ASSINATURA DIGITAL
  // ============================================

  useEffect(() => {
    if (showSignatureModal && canvasRef.current) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const rect = canvas.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      ctx.scale(dpr, dpr);

      ctx.fillStyle = '#0f172a';
      ctx.fillRect(0, 0, rect.width, rect.height);

      // Linha de assinatura
      ctx.strokeStyle = '#334155';
      ctx.lineWidth = 1;
      ctx.setLineDash([5, 5]);
      ctx.beginPath();
      ctx.moveTo(40, rect.height - 40);
      ctx.lineTo(rect.width - 40, rect.height - 40);
      ctx.stroke();
      ctx.setLineDash([]);

      ctx.fillStyle = '#64748b';
      ctx.font = '10px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Assinatura do Profissional', rect.width / 2, rect.height - 20);
    }
  }, [showSignatureModal]);

  const getCoordinates = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };

    const rect = canvas.getBoundingClientRect();
    
    if ('touches' in e) {
      return {
        x: e.touches[0].clientX - rect.left,
        y: e.touches[0].clientY - rect.top
      };
    }
    
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    };
  };

  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!ctx) return;

    setIsDrawing(true);
    setHasSignature(true);
    
    const { x, y } = getCoordinates(e);
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.strokeStyle = '#10b981';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!ctx) return;

    const { x, y } = getCoordinates(e);
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearSignature = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    const rect = canvas.getBoundingClientRect();
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, rect.width, rect.height);

    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 1;
    ctx.setLineDash([5, 5]);
    ctx.beginPath();
    ctx.moveTo(40, rect.height - 40);
    ctx.lineTo(rect.width - 40, rect.height - 40);
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.fillStyle = '#64748b';
    ctx.font = '10px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Assinatura do Profissional', rect.width / 2, rect.height - 20);

    setHasSignature(false);
  };

  const saveSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas || !hasSignature) return;
    
    const data = canvas.toDataURL('image/png');
    setSignatureData(data);
    setShowSignatureModal(false);
  };

  // ============================================
  // GERAR E ENVIAR PRESCRIÇÃO
  // ============================================

  const buildPrescription = (): Prescription => {
    return {
      id: `presc_${Date.now()}`,
      clinicId: user?.clinicId || '',
      patientId: selectedPatient?.id || '',
      patientName: selectedPatient?.name || 'Paciente',
      patientCpf: selectedPatient?.cpf,
      patientBirthDate: selectedPatient?.birth_date,
      patientAddress: selectedPatient?.address_street 
        ? `${selectedPatient.address_street}, ${selectedPatient.address_number || ''} - ${selectedPatient.address_neighborhood || ''}, ${selectedPatient.address_city || ''}`
        : undefined,
      professionalId: user?.id || '',
      professionalName: user?.name || 'Profissional',
      professionalCrm: 'CRM 12345/SP',
      professionalSpecialty: 'Clínico Geral',
      items: prescriptionItems,
      diagnosis,
      additionalNotes,
      signatureData: signatureData || undefined,
      signedAt: signatureData ? Date.now() : undefined,
      status: signatureData ? 'signed' : 'draft',
      isControlled: prescriptionItems.some(item => item.isControlled),
      createdAt: Date.now(),
      updatedAt: Date.now()
    };
  };

  const handleDownloadPDF = () => {
    const prescription = buildPrescription();
    downloadPrescriptionPDF(prescription, {
      name: user?.clinicName || 'Clínica',
      address: 'Rua Example, 123 - Centro',
      phone: '(11) 99999-9999',
      email: user?.email || 'contato@clinica.com'
    });
  };

  const handlePreview = () => {
    setShowPreviewModal(true);
  };

  const handleSend = async () => {
    if (!sendMethod || !user) return;
    
    setIsSending(true);
    try {
      let prescription = buildPrescription();
      
      // Salvar prescrição no backend primeiro (se ainda não foi salva)
      if (!prescription.id || prescription.id.startsWith('presc_')) {
        const saved = await addPrescription(prescription);
        if (saved) {
          prescription = saved;
        }
      }

      const pdfBase64 = getPrescriptionPDFBase64(prescription, {
        name: user.clinicName || 'Clínica',
        address: 'Rua Example, 123 - Centro',
        phone: '(11) 99999-9999',
        email: user.email || 'contato@clinica.com'
      });

      if (sendMethod === 'whatsapp' && selectedPatient?.phone) {
        await sendViaWhatsApp(prescription, selectedPatient.phone);
        
        // Atualizar status no backend
        if (prescription.id && !prescription.id.startsWith('presc_')) {
          await updatePrescription(prescription.id, {
            status: 'sent',
            sentVia: [...(prescription.sentVia || []), 'whatsapp'],
            sentAt: Date.now()
          });
        }
        
        toast.success('Receita enviada via WhatsApp!');
      } else if (sendMethod === 'email' && selectedPatient?.email) {
        await sendViaEmail(prescription, selectedPatient.email, pdfBase64);
        
        // Atualizar status no backend
        if (prescription.id && !prescription.id.startsWith('presc_')) {
          await updatePrescription(prescription.id, {
            status: 'sent',
            sentVia: [...(prescription.sentVia || []), 'email'],
            sentAt: Date.now()
          });
        }
        
        toast.success('Receita enviada por email!');
      } else {
        toast.error('Email ou telefone do paciente não cadastrado');
        setIsSending(false);
        return;
      }
      
      setSendSuccess(true);
      setTimeout(() => {
        setShowSendModal(false);
        setSendSuccess(false);
        setSendMethod(null);
      }, 2000);
    } catch (error) {
      console.error('Erro ao enviar prescrição:', error);
      toast.error('Erro ao enviar prescrição');
    } finally {
      setIsSending(false);
    }
  };

  const handleSavePrescription = async () => {
    if (!user) {
      toast.error('Usuário não autenticado');
      return;
    }

    setIsSaving(true);
    try {
      const prescription = buildPrescription();
      
      // Salvar no backend
      const saved = await addPrescription(prescription);
      
      if (saved) {
        toast.success('Prescrição salva com sucesso!');
        onSave?.(saved);
      } else {
        toast.error('Erro ao salvar prescrição');
      }
    } catch (error) {
      console.error('Erro ao salvar prescrição:', error);
      toast.error('Erro ao salvar prescrição');
    } finally {
      setIsSaving(false);
    }
  };

  // ============================================
  // CÁLCULOS
  // ============================================

  const hasControlledMedicine = useMemo(() => {
    return prescriptionItems.some(item => item.isControlled);
  }, [prescriptionItems]);

  const canSign = useMemo(() => {
    return prescriptionItems.length > 0 && selectedPatient;
  }, [prescriptionItems, selectedPatient]);

  const canSend = useMemo(() => {
    return prescriptionItems.length > 0 && signatureData && selectedPatient;
  }, [prescriptionItems, signatureData, selectedPatient]);

  // ============================================
  // RENDER
  // ============================================

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-4 md:p-8">
      {/* Header */}
      <div className="max-w-7xl mx-auto mb-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-black text-white tracking-tighter uppercase italic flex items-center gap-3">
              <div className="p-3 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl shadow-xl shadow-emerald-500/20">
                <Pill className="w-8 h-8 text-white" />
              </div>
              Prescrição Digital
            </h1>
            <p className="text-slate-400 mt-2 text-sm">
              Crie prescrições seguras com verificação de interações medicamentosas
            </p>
          </div>
          
          <div className="flex gap-3">
            <button
              onClick={() => setShowTemplatesModal(true)}
              className="flex items-center gap-2 px-4 py-3 bg-slate-800 text-slate-300 rounded-xl font-bold text-xs uppercase tracking-wider hover:bg-slate-700 transition-all"
            >
              <BookTemplate className="w-4 h-4" />
              Templates
            </button>
            <button
              onClick={() => setShowHistoryModal(true)}
              className="flex items-center gap-2 px-4 py-3 bg-slate-800 text-slate-300 rounded-xl font-bold text-xs uppercase tracking-wider hover:bg-slate-700 transition-all"
            >
              <History className="w-4 h-4" />
              Histórico
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Coluna Principal */}
        <div className="lg:col-span-2 space-y-6">
          {/* Dados do Paciente */}
          <div className="bg-slate-900/50 backdrop-blur-sm rounded-3xl border border-slate-800/50 p-6">
            <h2 className="text-lg font-black text-white uppercase tracking-wider mb-4 flex items-center gap-2">
              <User className="w-5 h-5 text-emerald-400" />
              Dados do Paciente
            </h2>
            
            {selectedPatient ? (
              <div className="bg-slate-800/50 rounded-2xl p-4 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center text-white font-bold text-lg">
                    {selectedPatient.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-white font-bold">{selectedPatient.name}</p>
                    <div className="flex items-center gap-4 text-xs text-slate-400 mt-1">
                      {selectedPatient.cpf && (
                        <span className="flex items-center gap-1">
                          <CreditCard className="w-3 h-3" />
                          {selectedPatient.cpf}
                        </span>
                      )}
                      {selectedPatient.birth_date && (
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {selectedPatient.birth_date}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedPatient(null)}
                  className="p-2 text-slate-400 hover:text-white transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            ) : (
              <div className="relative">
                <input
                  type="text"
                  value={patientSearch}
                  onChange={(e) => setPatientSearch(e.target.value)}
                  onFocus={() => patientSearchResults.length > 0 && setShowPatientDropdown(true)}
                  placeholder="Buscar paciente por nome, CPF ou telefone..."
                  className="w-full bg-slate-800 text-white placeholder-slate-500 rounded-2xl px-5 py-4 pr-12 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 border border-slate-700"
                />
                {isSearchingPatients ? (
                  <Loader2 className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 animate-spin" />
                ) : (
                  <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                )}
                
                {/* Dropdown de resultados de busca */}
                {showPatientDropdown && patientSearchResults.length > 0 && (
                  <div className="absolute z-50 w-full mt-2 bg-slate-800 rounded-2xl border border-slate-700 shadow-2xl max-h-80 overflow-y-auto">
                    {patientSearchResults.map((p) => (
                      <button
                        key={p.id}
                        onClick={() => {
                          setSelectedPatient(p);
                          setPatientSearch('');
                          setShowPatientDropdown(false);
                          setPatientSearchResults([]);
                        }}
                        className="w-full px-5 py-4 text-left hover:bg-slate-700/50 transition-colors flex items-center justify-between group first:rounded-t-2xl last:rounded-b-2xl"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center text-white font-bold">
                            {p.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="text-white font-medium">{p.name}</p>
                            <div className="flex items-center gap-3 text-xs text-slate-400 mt-0.5">
                              {p.cpf && (
                                <span className="flex items-center gap-1">
                                  <CreditCard className="w-3 h-3" />
                                  {p.cpf}
                                </span>
                              )}
                              {p.phone && (
                                <span className="flex items-center gap-1">
                                  <Phone className="w-3 h-3" />
                                  {p.phone}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        <Plus className="w-5 h-5 text-emerald-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Busca de Medicamentos */}
          <div className="bg-slate-900/50 backdrop-blur-sm rounded-3xl border border-slate-800/50 p-6">
            <h2 className="text-lg font-black text-white uppercase tracking-wider mb-4 flex items-center gap-2">
              <Pill className="w-5 h-5 text-emerald-400" />
              Adicionar Medicamento
            </h2>
            
            <div className="relative">
              <input
                type="text"
                value={medicineSearch}
                onChange={(e) => setMedicineSearch(e.target.value)}
                placeholder="Buscar medicamento pelo nome ou princípio ativo..."
                className="w-full bg-slate-800 text-white placeholder-slate-500 rounded-2xl px-5 py-4 pr-12 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 border border-slate-700"
              />
              <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              
              {/* Dropdown de resultados */}
              {showMedicineDropdown && searchResults.length > 0 && (
                <div className="absolute z-50 w-full mt-2 bg-slate-800 rounded-2xl border border-slate-700 shadow-2xl max-h-80 overflow-y-auto">
                  {searchResults.map((medicine) => (
                    <button
                      key={medicine.id}
                      onClick={() => handleSelectMedicine(medicine)}
                      className="w-full px-5 py-4 text-left hover:bg-slate-700/50 transition-colors flex items-center justify-between group first:rounded-t-2xl last:rounded-b-2xl"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-white font-medium">{medicine.name}</span>
                          <span className="text-slate-400 text-sm">{medicine.concentration}</span>
                          {medicine.isControlled && (
                            <span className="px-2 py-0.5 bg-rose-500/20 text-rose-400 text-[10px] font-bold uppercase rounded-full">
                              Controlado
                            </span>
                          )}
                        </div>
                        <p className="text-slate-500 text-sm mt-0.5">
                          {medicine.activeIngredient} • {medicine.form} • {getCategoryLabel(medicine.category)}
                        </p>
                      </div>
                      <Plus className="w-5 h-5 text-emerald-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Lista de medicamentos rápidos */}
            <div className="mt-4 flex flex-wrap gap-2">
              {getAllMedicines().slice(0, 6).map((medicine) => (
                <button
                  key={medicine.id}
                  onClick={() => handleSelectMedicine(medicine)}
                  className="px-3 py-2 bg-slate-800 text-slate-300 rounded-xl text-xs font-medium hover:bg-slate-700 hover:text-white transition-all flex items-center gap-1"
                >
                  <Plus className="w-3 h-3" />
                  {medicine.name}
                </button>
              ))}
            </div>
          </div>

          {/* Lista de Medicamentos Prescritos */}
          <div className="bg-slate-900/50 backdrop-blur-sm rounded-3xl border border-slate-800/50 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-black text-white uppercase tracking-wider flex items-center gap-2">
                <FileText className="w-5 h-5 text-emerald-400" />
                Medicamentos Prescritos
                {prescriptionItems.length > 0 && (
                  <span className="ml-2 px-3 py-1 bg-emerald-500/20 text-emerald-400 text-xs font-bold rounded-full">
                    {prescriptionItems.length}
                  </span>
                )}
              </h2>
              
              {interactions.length > 0 && (
                <button
                  onClick={() => setShowInteractionsModal(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-rose-500/20 text-rose-400 rounded-xl text-xs font-bold uppercase tracking-wider hover:bg-rose-500/30 transition-all animate-pulse"
                >
                  <AlertTriangle className="w-4 h-4" />
                  {interactions.length} Interação(ões)
                </button>
              )}
            </div>
            
            {prescriptionItems.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-slate-800 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Pill className="w-8 h-8 text-slate-600" />
                </div>
                <p className="text-slate-400 text-sm mb-2">Nenhum medicamento adicionado</p>
                <p className="text-slate-500 text-xs">
                  Use a busca acima ou aplique um template para começar
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {prescriptionItems.map((item, index) => (
                  <div
                    key={item.id}
                    className={`bg-slate-800/50 rounded-2xl p-4 border transition-all ${
                      item.isControlled ? 'border-rose-500/30' : 'border-slate-700/50'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 bg-emerald-500/20 text-emerald-400 rounded-lg flex items-center justify-center font-bold text-sm">
                          {index + 1}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-white font-bold">{item.medicineName}</span>
                            <span className="text-slate-400 text-sm">{item.concentration}</span>
                            {item.isControlled && (
                              <span className="px-2 py-0.5 bg-rose-500/20 text-rose-400 text-[10px] font-bold uppercase rounded-full flex items-center gap-1">
                                <ShieldAlert className="w-3 h-3" />
                                Controlado
                              </span>
                            )}
                            {item.continuous && (
                              <span className="px-2 py-0.5 bg-amber-500/20 text-amber-400 text-[10px] font-bold uppercase rounded-full">
                                Uso Contínuo
                              </span>
                            )}
                          </div>
                          <p className="text-slate-400 text-sm mt-1">
                            {item.form} • {getRouteLabel(item.route)}
                          </p>
                          <p className="text-emerald-400 text-sm mt-2 font-medium">
                            {item.dosage} de {item.frequency} por {item.duration}
                          </p>
                          <p className="text-slate-500 text-xs mt-1">
                            Quantidade: {item.quantity} {item.quantity > 1 ? 'unidades' : 'unidade'}
                          </p>
                          {item.instructions && (
                            <p className="text-slate-500 text-xs mt-2 italic">
                              → {item.instructions}
                            </p>
                          )}
                        </div>
                      </div>
                      <button
                        onClick={() => handleRemoveMedicine(item.id)}
                        className="p-2 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-all"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Diagnóstico e Observações */}
          <div className="bg-slate-900/50 backdrop-blur-sm rounded-3xl border border-slate-800/50 p-6">
            <h2 className="text-lg font-black text-white uppercase tracking-wider mb-4 flex items-center gap-2">
              <Stethoscope className="w-5 h-5 text-emerald-400" />
              Diagnóstico e Observações
            </h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-2">
                  Diagnóstico / Hipótese Diagnóstica
                </label>
                <input
                  type="text"
                  value={diagnosis}
                  onChange={(e) => setDiagnosis(e.target.value)}
                  placeholder="Ex: Infecção dentária, Sinusite aguda..."
                  className="w-full bg-slate-800 text-white placeholder-slate-500 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 border border-slate-700"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-2">
                  Observações Adicionais
                </label>
                <textarea
                  value={additionalNotes}
                  onChange={(e) => setAdditionalNotes(e.target.value)}
                  placeholder="Orientações adicionais ao paciente..."
                  rows={3}
                  className="w-full bg-slate-800 text-white placeholder-slate-500 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 border border-slate-700 resize-none"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Coluna Lateral */}
        <div className="space-y-6">
          {/* Status da Prescrição */}
          <div className="bg-slate-900/50 backdrop-blur-sm rounded-3xl border border-slate-800/50 p-6">
            <h2 className="text-lg font-black text-white uppercase tracking-wider mb-4">
              Status
            </h2>
            
            <div className="space-y-3">
              <div className={`flex items-center gap-3 p-3 rounded-xl ${
                selectedPatient ? 'bg-emerald-500/10 text-emerald-400' : 'bg-slate-800 text-slate-400'
              }`}>
                <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                  selectedPatient ? 'bg-emerald-500' : 'bg-slate-700'
                }`}>
                  {selectedPatient ? (
                    <Check className="w-4 h-4 text-white" />
                  ) : (
                    <span className="text-xs">1</span>
                  )}
                </div>
                <span className="text-sm font-medium">Paciente selecionado</span>
              </div>
              
              <div className={`flex items-center gap-3 p-3 rounded-xl ${
                prescriptionItems.length > 0 ? 'bg-emerald-500/10 text-emerald-400' : 'bg-slate-800 text-slate-400'
              }`}>
                <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                  prescriptionItems.length > 0 ? 'bg-emerald-500' : 'bg-slate-700'
                }`}>
                  {prescriptionItems.length > 0 ? (
                    <Check className="w-4 h-4 text-white" />
                  ) : (
                    <span className="text-xs">2</span>
                  )}
                </div>
                <span className="text-sm font-medium">Medicamentos adicionados</span>
              </div>
              
              <div className={`flex items-center gap-3 p-3 rounded-xl ${
                signatureData ? 'bg-emerald-500/10 text-emerald-400' : 'bg-slate-800 text-slate-400'
              }`}>
                <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                  signatureData ? 'bg-emerald-500' : 'bg-slate-700'
                }`}>
                  {signatureData ? (
                    <Check className="w-4 h-4 text-white" />
                  ) : (
                    <span className="text-xs">3</span>
                  )}
                </div>
                <span className="text-sm font-medium">Assinatura digital</span>
              </div>
            </div>

            {hasControlledMedicine && (
              <div className="mt-4 p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl">
                <div className="flex items-start gap-2">
                  <ShieldAlert className="w-5 h-5 text-rose-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-rose-400 font-bold text-sm">Medicamento Controlado</p>
                    <p className="text-rose-300/70 text-xs mt-1">
                      Esta receita contém medicamento de controle especial e requer retenção.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Assinatura */}
          <div className="bg-slate-900/50 backdrop-blur-sm rounded-3xl border border-slate-800/50 p-6">
            <h2 className="text-lg font-black text-white uppercase tracking-wider mb-4 flex items-center gap-2">
              <PenTool className="w-5 h-5 text-emerald-400" />
              Assinatura Digital
            </h2>
            
            {signatureData ? (
              <div className="space-y-4">
                <div className="bg-slate-800 rounded-xl p-4 flex items-center justify-center">
                  <img 
                    src={signatureData} 
                    alt="Assinatura" 
                    className="max-h-20 object-contain"
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setShowSignatureModal(true)}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-slate-800 text-slate-300 rounded-xl text-xs font-bold uppercase tracking-wider hover:bg-slate-700 transition-all"
                  >
                    <RefreshCw className="w-4 h-4" />
                    Refazer
                  </button>
                  <button
                    onClick={() => setSignatureData(null)}
                    className="p-2 bg-rose-500/20 text-rose-400 rounded-xl hover:bg-rose-500/30 transition-all"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setShowSignatureModal(true)}
                disabled={!canSign}
                className="w-full flex items-center justify-center gap-2 px-4 py-4 bg-slate-800 text-slate-300 rounded-xl font-bold text-xs uppercase tracking-wider hover:bg-slate-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed border-2 border-dashed border-slate-700"
              >
                <PenTool className="w-4 h-4" />
                Adicionar Assinatura
              </button>
            )}
          </div>

          {/* Ações */}
          <div className="bg-slate-900/50 backdrop-blur-sm rounded-3xl border border-slate-800/50 p-6">
            <h2 className="text-lg font-black text-white uppercase tracking-wider mb-4">
              Ações
            </h2>
            
            <div className="space-y-3">
              <button
                onClick={handlePreview}
                disabled={prescriptionItems.length === 0}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-slate-800 text-slate-300 rounded-xl font-bold text-xs uppercase tracking-wider hover:bg-slate-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Eye className="w-4 h-4" />
                Visualizar Receita
              </button>
              
              <button
                onClick={handleDownloadPDF}
                disabled={prescriptionItems.length === 0}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-slate-800 text-slate-300 rounded-xl font-bold text-xs uppercase tracking-wider hover:bg-slate-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Download className="w-4 h-4" />
                Baixar PDF
              </button>
              
              <button
                onClick={() => setShowSendModal(true)}
                disabled={!canSend}
                className="w-full flex items-center justify-center gap-2 px-4 py-4 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-xl font-bold text-xs uppercase tracking-wider hover:from-emerald-700 hover:to-teal-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-xl shadow-emerald-500/20"
              >
                <Send className="w-4 h-4" />
                Enviar para Paciente
              </button>
              
              <button
                onClick={handleSavePrescription}
                disabled={prescriptionItems.length === 0 || isSaving}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-slate-800 text-slate-300 rounded-xl font-bold text-xs uppercase tracking-wider hover:bg-slate-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    Salvar Rascunho
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ============================================ */}
      {/* MODAIS */}
      {/* ============================================ */}

      {/* Modal de Adicionar Medicamento */}
      <Modal
        isOpen={showMedicineModal}
        onClose={() => {
          setShowMedicineModal(false);
          setSelectedMedicine(null);
          resetMedicineForm();
        }}
        size="lg"
      >
        <ModalHeader icon={<Pill className="w-6 h-6" />}>
          <ModalTitle>Adicionar Medicamento</ModalTitle>
          <ModalDescription>Configure a posologia do medicamento</ModalDescription>
        </ModalHeader>
        
        <ModalBody>
          {selectedMedicine && (
            <div className="space-y-6">
              {/* Info do medicamento */}
              <div className="bg-slate-800 rounded-2xl p-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-emerald-500/20 rounded-xl flex items-center justify-center">
                    <Pill className="w-6 h-6 text-emerald-400" />
                  </div>
                  <div>
                    <h3 className="text-white font-bold text-lg">
                      {selectedMedicine.name} {selectedMedicine.concentration}
                    </h3>
                    <p className="text-slate-400 text-sm">
                      {selectedMedicine.activeIngredient} • {selectedMedicine.form}
                    </p>
                  </div>
                </div>
                
                {selectedMedicine.isControlled && (
                  <div className="mt-3 p-3 bg-rose-500/10 rounded-xl flex items-center gap-2">
                    <ShieldAlert className="w-5 h-5 text-rose-400" />
                    <span className="text-rose-400 text-sm font-medium">
                      Medicamento de controle especial - Requer receita especial
                    </span>
                  </div>
                )}
                
                {selectedMedicine.maxDailyDose && (
                  <div className="mt-3 p-3 bg-amber-500/10 rounded-xl flex items-center gap-2">
                    <Info className="w-5 h-5 text-amber-400" />
                    <span className="text-amber-400 text-sm">
                      Dose máxima diária: {selectedMedicine.maxDailyDose}
                    </span>
                  </div>
                )}
              </div>

              {/* Campos de posologia */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-2">
                    Dosagem
                  </label>
                  <input
                    type="text"
                    value={dosage}
                    onChange={(e) => setDosage(e.target.value)}
                    placeholder="Ex: 1 comprimido"
                    className="w-full bg-slate-800 text-white placeholder-slate-500 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 border border-slate-700"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-2">
                    Frequência
                  </label>
                  <select
                    value={frequency}
                    onChange={(e) => setFrequency(e.target.value)}
                    className="w-full bg-slate-800 text-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 border border-slate-700"
                  >
                    <option value="1 vez ao dia">1 vez ao dia</option>
                    <option value="12 em 12 horas">12 em 12 horas</option>
                    <option value="8 em 8 horas">8 em 8 horas</option>
                    <option value="6 em 6 horas">6 em 6 horas</option>
                    <option value="4 em 4 horas">4 em 4 horas</option>
                    <option value="1 vez por semana">1 vez por semana</option>
                    <option value="conforme necessidade">Conforme necessidade</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-2">
                    Duração
                  </label>
                  <select
                    value={duration}
                    onChange={(e) => setDuration(e.target.value)}
                    className="w-full bg-slate-800 text-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 border border-slate-700"
                  >
                    <option value="3 dias">3 dias</option>
                    <option value="5 dias">5 dias</option>
                    <option value="7 dias">7 dias</option>
                    <option value="10 dias">10 dias</option>
                    <option value="14 dias">14 dias</option>
                    <option value="21 dias">21 dias</option>
                    <option value="30 dias">30 dias</option>
                    <option value="60 dias">60 dias</option>
                    <option value="90 dias">90 dias</option>
                    <option value="uso contínuo">Uso contínuo</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-2">
                    Quantidade
                  </label>
                  <input
                    type="number"
                    value={quantity}
                    onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                    min={1}
                    className="w-full bg-slate-800 text-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 border border-slate-700"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-2">
                  Instruções Especiais
                </label>
                <textarea
                  value={instructions}
                  onChange={(e) => setInstructions(e.target.value)}
                  placeholder="Ex: Tomar após as refeições, evitar exposição ao sol..."
                  rows={2}
                  className="w-full bg-slate-800 text-white placeholder-slate-500 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 border border-slate-700 resize-none"
                />
              </div>
              
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={continuous}
                  onChange={(e) => setContinuous(e.target.checked)}
                  className="w-5 h-5 rounded-md border-slate-600 bg-slate-800 text-emerald-500 focus:ring-emerald-500"
                />
                <span className="text-slate-300 text-sm">Uso contínuo</span>
              </label>

              {/* Contraindicações e efeitos colaterais */}
              {(selectedMedicine.contraindications?.length || selectedMedicine.sideEffects?.length) && (
                <div className="grid grid-cols-2 gap-4">
                  {selectedMedicine.contraindications && selectedMedicine.contraindications.length > 0 && (
                    <div className="bg-rose-500/10 rounded-xl p-4">
                      <h4 className="text-rose-400 font-bold text-sm mb-2 flex items-center gap-2">
                        <AlertCircle className="w-4 h-4" />
                        Contraindicações
                      </h4>
                      <ul className="text-rose-300/70 text-xs space-y-1">
                        {selectedMedicine.contraindications.map((c, i) => (
                          <li key={i}>• {c}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  
                  {selectedMedicine.sideEffects && selectedMedicine.sideEffects.length > 0 && (
                    <div className="bg-amber-500/10 rounded-xl p-4">
                      <h4 className="text-amber-400 font-bold text-sm mb-2 flex items-center gap-2">
                        <Info className="w-4 h-4" />
                        Efeitos Colaterais
                      </h4>
                      <ul className="text-amber-300/70 text-xs space-y-1">
                        {selectedMedicine.sideEffects.map((e, i) => (
                          <li key={i}>• {e}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </ModalBody>
        
        <ModalFooter>
          <Button
            variant="ghost"
            onClick={() => {
              setShowMedicineModal(false);
              setSelectedMedicine(null);
              resetMedicineForm();
            }}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleAddMedicine}
            leftIcon={<Plus className="w-4 h-4" />}
          >
            Adicionar
          </Button>
        </ModalFooter>
      </Modal>

      {/* Modal de Templates */}
      <Modal
        isOpen={showTemplatesModal}
        onClose={() => setShowTemplatesModal(false)}
        size="lg"
      >
        <ModalHeader icon={<BookTemplate className="w-6 h-6" />}>
          <ModalTitle>Templates de Prescrição</ModalTitle>
          <ModalDescription>Selecione um template para preencher rapidamente</ModalDescription>
        </ModalHeader>
        
        <ModalBody>
          <div className="space-y-3">
            {templates.map((template) => (
              <button
                key={template.id}
                onClick={() => handleApplyTemplate(template)}
                className="w-full bg-slate-800 hover:bg-slate-700 rounded-2xl p-4 text-left transition-all group"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-white font-bold">{template.name}</h3>
                      {template.isDefault && (
                        <Star className="w-4 h-4 text-amber-400" />
                      )}
                    </div>
                    {template.description && (
                      <p className="text-slate-400 text-sm mt-1">{template.description}</p>
                    )}
                    <p className="text-emerald-400 text-xs mt-2">
                      {template.items.length} medicamento(s) • {template.specialty}
                    </p>
                  </div>
                  <ChevronDown className="w-5 h-5 text-slate-500 group-hover:text-emerald-400 transition-colors" />
                </div>
                
                <div className="mt-3 pt-3 border-t border-slate-700">
                  <div className="flex flex-wrap gap-2">
                    {template.items.map((item, i) => (
                      <span
                        key={i}
                        className="px-2 py-1 bg-slate-700 text-slate-300 rounded-lg text-xs"
                      >
                        {item.medicineName}
                      </span>
                    ))}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </ModalBody>
      </Modal>

      {/* Modal de Histórico */}
      <Modal
        isOpen={showHistoryModal}
        onClose={() => setShowHistoryModal(false)}
        size="lg"
      >
        <ModalHeader icon={<History className="w-6 h-6" />}>
          <ModalTitle>Histórico de Prescrições</ModalTitle>
          <ModalDescription>Visualize e repita prescrições anteriores</ModalDescription>
        </ModalHeader>
        
        <ModalBody>
          {prescriptionHistory.length === 0 ? (
            <div className="text-center py-8">
              <Clock className="w-12 h-12 text-slate-600 mx-auto mb-3" />
              <p className="text-slate-400">Nenhuma prescrição no histórico</p>
            </div>
          ) : (
            <div className="space-y-3">
              {prescriptionHistory.map((prescription) => (
                <div
                  key={prescription.id}
                  className="bg-slate-800 rounded-2xl p-4"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-white font-bold">{prescription.patientName}</h3>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                          prescription.status === 'signed' 
                            ? 'bg-emerald-500/20 text-emerald-400'
                            : prescription.status === 'sent'
                            ? 'bg-blue-500/20 text-blue-400'
                            : 'bg-slate-700 text-slate-400'
                        }`}>
                          {prescription.status === 'signed' ? 'Assinada' : 
                           prescription.status === 'sent' ? 'Enviada' : 'Rascunho'}
                        </span>
                      </div>
                      <p className="text-slate-400 text-sm mt-1">{prescription.diagnosis}</p>
                      <p className="text-slate-500 text-xs mt-2">
                        {new Date(prescription.createdAt).toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                    
                    <button
                      onClick={() => handleRepeatPrescription(prescription)}
                      className="flex items-center gap-2 px-3 py-2 bg-emerald-500/20 text-emerald-400 rounded-xl text-xs font-bold hover:bg-emerald-500/30 transition-all"
                    >
                      <Copy className="w-4 h-4" />
                      Repetir
                    </button>
                  </div>
                  
                  <div className="mt-3 pt-3 border-t border-slate-700">
                    <div className="flex flex-wrap gap-2">
                      {prescription.items.map((item, i) => (
                        <span
                          key={i}
                          className="px-2 py-1 bg-slate-700 text-slate-300 rounded-lg text-xs"
                        >
                          {item.medicineName} {item.concentration}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ModalBody>
      </Modal>

      {/* Modal de Interações */}
      <Modal
        isOpen={showInteractionsModal}
        onClose={() => setShowInteractionsModal(false)}
        size="lg"
      >
        <ModalHeader icon={<AlertTriangle className="w-6 h-6 text-rose-400" />}>
          <ModalTitle className="!text-rose-400">Interações Medicamentosas</ModalTitle>
          <ModalDescription>Verifique as interações encontradas</ModalDescription>
        </ModalHeader>
        
        <ModalBody>
          <div className="space-y-4">
            {interactions.map((interaction) => (
              <div
                key={interaction.id}
                className={`rounded-2xl p-4 border ${
                  interaction.severity === 'critical' 
                    ? 'bg-rose-500/10 border-rose-500/30'
                    : interaction.severity === 'high'
                    ? 'bg-orange-500/10 border-orange-500/30'
                    : interaction.severity === 'moderate'
                    ? 'bg-amber-500/10 border-amber-500/30'
                    : 'bg-yellow-500/10 border-yellow-500/30'
                }`}
              >
                <div className="flex items-start gap-3">
                  <AlertTriangle className={`w-5 h-5 flex-shrink-0 mt-0.5 ${
                    interaction.severity === 'critical' ? 'text-rose-400' :
                    interaction.severity === 'high' ? 'text-orange-400' :
                    interaction.severity === 'moderate' ? 'text-amber-400' :
                    'text-yellow-400'
                  }`} />
                  
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-white font-bold">{interaction.drug1Name}</span>
                      <span className="text-slate-400">×</span>
                      <span className="text-white font-bold">{interaction.drug2Name}</span>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                        interaction.severity === 'critical' ? 'bg-rose-500/20 text-rose-400' :
                        interaction.severity === 'high' ? 'bg-orange-500/20 text-orange-400' :
                        interaction.severity === 'moderate' ? 'bg-amber-500/20 text-amber-400' :
                        'bg-yellow-500/20 text-yellow-400'
                      }`}>
                        {interaction.severity === 'critical' ? 'Crítica' :
                         interaction.severity === 'high' ? 'Alta' :
                         interaction.severity === 'moderate' ? 'Moderada' : 'Baixa'}
                      </span>
                    </div>
                    
                    <p className="text-slate-300 text-sm mt-2">
                      {interaction.description}
                    </p>
                    
                    {interaction.mechanism && (
                      <p className="text-slate-400 text-xs mt-2">
                        <span className="font-bold">Mecanismo:</span> {interaction.mechanism}
                      </p>
                    )}
                    
                    <div className="mt-3 p-3 bg-slate-800/50 rounded-xl">
                      <p className="text-emerald-400 text-sm font-medium flex items-center gap-2">
                        <Sparkles className="w-4 h-4" />
                        Recomendação:
                      </p>
                      <p className="text-slate-300 text-sm mt-1">
                        {interaction.recommendation}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </ModalBody>
        
        <ModalFooter>
          <Button
            variant="ghost"
            onClick={() => setShowInteractionsModal(false)}
          >
            Fechar
          </Button>
          <Button
            variant="danger"
            onClick={() => setShowInteractionsModal(false)}
          >
            Entendi, continuar
          </Button>
        </ModalFooter>
      </Modal>

      {/* Modal de Assinatura */}
      <Modal
        isOpen={showSignatureModal}
        onClose={() => setShowSignatureModal(false)}
        size="lg"
      >
        <ModalHeader icon={<PenTool className="w-6 h-6" />}>
          <ModalTitle>Assinatura Digital</ModalTitle>
          <ModalDescription>Desenhe sua assinatura no campo abaixo</ModalDescription>
        </ModalHeader>
        
        <ModalBody>
          <div className="space-y-4">
            <div className="relative">
              <canvas
                ref={canvasRef}
                className="w-full h-48 bg-slate-950 rounded-2xl border-2 border-dashed border-slate-700 cursor-crosshair touch-none"
                onMouseDown={startDrawing}
                onMouseMove={draw}
                onMouseUp={stopDrawing}
                onMouseLeave={stopDrawing}
                onTouchStart={startDrawing}
                onTouchMove={draw}
                onTouchEnd={stopDrawing}
              />
              
              {!hasSignature && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <p className="text-slate-600 text-sm font-medium">
                    Toque ou clique para assinar
                  </p>
                </div>
              )}
            </div>
            
            <div className="flex justify-between items-center text-[10px] text-slate-500">
              <span className="font-bold uppercase tracking-wider">{user?.name || 'Profissional'}</span>
              <span>{new Date().toLocaleString('pt-BR')}</span>
            </div>
          </div>
        </ModalBody>
        
        <ModalFooter>
          <button
            onClick={clearSignature}
            className="flex items-center gap-2 px-4 py-3 bg-slate-800 text-slate-300 rounded-xl font-bold text-xs uppercase tracking-wider hover:bg-slate-700 transition-all"
          >
            <Eraser className="w-4 h-4" />
            Limpar
          </button>
          <Button
            onClick={saveSignature}
            disabled={!hasSignature}
            leftIcon={<Check className="w-4 h-4" />}
          >
            Confirmar Assinatura
          </Button>
        </ModalFooter>
      </Modal>

      {/* Modal de Envio */}
      <Modal
        isOpen={showSendModal}
        onClose={() => {
          setShowSendModal(false);
          setSendMethod(null);
          setSendSuccess(false);
        }}
        size="md"
      >
        <ModalHeader icon={<Send className="w-6 h-6" />}>
          <ModalTitle>Enviar Prescrição</ModalTitle>
          <ModalDescription>Escolha como enviar a receita ao paciente</ModalDescription>
        </ModalHeader>
        
        <ModalBody>
          {sendSuccess ? (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <Check className="w-8 h-8 text-emerald-400" />
              </div>
              <p className="text-white font-bold text-lg">Receita enviada com sucesso!</p>
              <p className="text-slate-400 text-sm mt-2">
                {sendMethod === 'whatsapp' ? 'WhatsApp aberto em nova aba' : 'Email enviado ao paciente'}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <button
                onClick={() => setSendMethod('whatsapp')}
                className={`w-full p-4 rounded-2xl border-2 transition-all flex items-center gap-4 ${
                  sendMethod === 'whatsapp'
                    ? 'border-emerald-500 bg-emerald-500/10'
                    : 'border-slate-700 bg-slate-800 hover:border-slate-600'
                }`}
              >
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                  sendMethod === 'whatsapp' ? 'bg-emerald-500' : 'bg-slate-700'
                }`}>
                  <MessageCircle className="w-6 h-6 text-white" />
                </div>
                <div className="text-left">
                  <p className={`font-bold ${sendMethod === 'whatsapp' ? 'text-emerald-400' : 'text-white'}`}>
                    WhatsApp
                  </p>
                  <p className="text-slate-400 text-sm">
                    {selectedPatient?.phone || 'Telefone não cadastrado'}
                  </p>
                </div>
              </button>
              
              <button
                onClick={() => setSendMethod('email')}
                className={`w-full p-4 rounded-2xl border-2 transition-all flex items-center gap-4 ${
                  sendMethod === 'email'
                    ? 'border-emerald-500 bg-emerald-500/10'
                    : 'border-slate-700 bg-slate-800 hover:border-slate-600'
                }`}
              >
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                  sendMethod === 'email' ? 'bg-emerald-500' : 'bg-slate-700'
                }`}>
                  <Mail className="w-6 h-6 text-white" />
                </div>
                <div className="text-left">
                  <p className={`font-bold ${sendMethod === 'email' ? 'text-emerald-400' : 'text-white'}`}>
                    E-mail
                  </p>
                  <p className="text-slate-400 text-sm">
                    {selectedPatient?.email || 'E-mail não cadastrado'}
                  </p>
                </div>
              </button>
            </div>
          )}
        </ModalBody>
        
        {!sendSuccess && (
          <ModalFooter>
            <Button
              variant="ghost"
              onClick={() => {
                setShowSendModal(false);
                setSendMethod(null);
              }}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleSend}
              disabled={!sendMethod || isSending}
              isLoading={isSending}
              leftIcon={<Send className="w-4 h-4" />}
            >
              Enviar
            </Button>
          </ModalFooter>
        )}
      </Modal>

      {/* Modal de Preview */}
      <Modal
        isOpen={showPreviewModal}
        onClose={() => setShowPreviewModal(false)}
        size="xl"
      >
        <ModalHeader icon={<Eye className="w-6 h-6" />}>
          <ModalTitle>Visualização da Receita</ModalTitle>
          <ModalDescription>Prévia do documento que será gerado</ModalDescription>
        </ModalHeader>
        
        <ModalBody>
          <div className="bg-white text-slate-900 rounded-2xl p-8 max-h-[60vh] overflow-y-auto">
            {/* Cabeçalho */}
            <div className="text-center border-b border-slate-200 pb-6 mb-6">
              <h1 className="text-2xl font-black text-emerald-600 uppercase tracking-wider">
                {user?.clinicName || 'Clínica'}
              </h1>
              <p className="text-slate-500 text-sm mt-1">
                Rua Example, 123 - Centro | (11) 99999-9999
              </p>
            </div>
            
            {/* Título */}
            <h2 className="text-xl font-bold text-center mb-6">
              {hasControlledMedicine ? 'RECEITA DE CONTROLE ESPECIAL' : 'RECEITUÁRIO'}
            </h2>
            
            {/* Dados do paciente */}
            <div className="bg-slate-50 rounded-xl p-4 mb-6">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-slate-500">Paciente:</span>{' '}
                  <span className="font-medium">{selectedPatient?.name || 'Não selecionado'}</span>
                </div>
                {selectedPatient?.cpf && (
                  <div>
                    <span className="text-slate-500">CPF:</span>{' '}
                    <span className="font-medium">{selectedPatient.cpf}</span>
                  </div>
                )}
              </div>
            </div>
            
            {/* Medicamentos */}
            <div className="mb-6">
              <h3 className="text-emerald-600 font-bold mb-4 uppercase text-sm tracking-wider">
                Medicamentos Prescritos
              </h3>
              <div className="space-y-4">
                {prescriptionItems.map((item, index) => (
                  <div key={item.id} className="border-l-4 border-emerald-500 pl-4">
                    <p className="font-bold">
                      {index + 1}. {item.medicineName} {item.concentration}
                    </p>
                    <p className="text-slate-600 text-sm">
                      {item.form} - {item.quantity} unidade(s)
                    </p>
                    <p className="text-emerald-600 text-sm font-medium mt-1">
                      Tomar {item.dosage} de {item.frequency} por {item.duration}
                    </p>
                    {item.instructions && (
                      <p className="text-slate-500 text-sm italic mt-1">
                        → {item.instructions}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
            
            {/* Diagnóstico e observações */}
            {(diagnosis || additionalNotes) && (
              <div className="border-t border-slate-200 pt-4 mb-6">
                {diagnosis && (
                  <p className="text-sm">
                    <span className="text-slate-500">Diagnóstico:</span>{' '}
                    <span className="font-medium">{diagnosis}</span>
                  </p>
                )}
                {additionalNotes && (
                  <p className="text-sm mt-2">
                    <span className="text-slate-500">Observações:</span>{' '}
                    {additionalNotes}
                  </p>
                )}
              </div>
            )}
            
            {/* Assinatura */}
            <div className="text-center mt-12 pt-6 border-t border-slate-200">
              {signatureData ? (
                <img 
                  src={signatureData} 
                  alt="Assinatura" 
                  className="max-h-16 mx-auto mb-2"
                />
              ) : (
                <div className="h-16 border-b border-slate-300 w-48 mx-auto mb-2" />
              )}
              <p className="font-bold">{user?.name || 'Profissional'}</p>
              <p className="text-slate-500 text-sm">CRM 12345/SP - Clínico Geral</p>
            </div>
            
            {/* Rodapé */}
            <div className="text-center mt-6 pt-4 border-t border-slate-200 text-slate-400 text-xs">
              <p>Emitido em {new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}</p>
            </div>
          </div>
        </ModalBody>
        
        <ModalFooter>
          <Button
            variant="ghost"
            onClick={() => setShowPreviewModal(false)}
          >
            Fechar
          </Button>
          <Button
            onClick={handleDownloadPDF}
            leftIcon={<Download className="w-4 h-4" />}
          >
            Baixar PDF
          </Button>
        </ModalFooter>
      </Modal>
    </div>
  );
};

export default PrescriptionMain;

