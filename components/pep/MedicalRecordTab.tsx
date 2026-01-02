import React, { useState, useEffect } from 'react';
import { Patient, MedicalRecord, ToothData, ClinicalNote, MedicalAttachment, ConsultationRecord, AnamnesisResponse } from '../../types';
import Odontogram from './Odontogram';
import DigitalSignature from './DigitalSignature';
import AttachmentsManager from './AttachmentsManager';
import ClinicalNotes from './ClinicalNotes';
import AnamnesisForm from './AnamnesisForm';
import ConsultationHistory from './ConsultationHistory';
import { 
  Search, User, ChevronLeft, ChevronRight, X, 
  FileText, Activity, Calendar, Image, PenTool, 
  Stethoscope, Plus, Loader2, CheckCircle2, AlertCircle,
  ClipboardList, Phone, Mail, MapPin, Cake
} from 'lucide-react';
import { useToast } from '../../contexts/ToastContext';
import { useConfirmDialog } from '../ui/ConfirmDialog';
import { getMedicalRecord } from '../../services/backendService';

interface MedicalRecordTabProps {
  user: any;
  patients: Patient[];
}

// Mock data for demonstration
const createEmptyMedicalRecord = (patientId: string): MedicalRecord => ({
  id: `mr-${patientId}`,
  patientId,
  anamnesis: [],
  consultations: [],
  odontogram: {
    id: `od-${patientId}`,
    patientId,
    teeth: [],
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },
  attachments: [],
  notes: [],
  signatures: [],
  createdAt: Date.now(),
  updatedAt: Date.now(),
});

const TABS = [
  { id: 'overview', label: 'Visão Geral', icon: Activity },
  { id: 'anamnesis', label: 'Anamnese', icon: ClipboardList },
  { id: 'odontogram', label: 'Odontograma', icon: Stethoscope },
  { id: 'history', label: 'Histórico', icon: Calendar },
  { id: 'attachments', label: 'Exames', icon: Image },
  { id: 'notes', label: 'Anotações', icon: FileText },
  { id: 'signature', label: 'Assinatura', icon: PenTool },
];

const MedicalRecordTab: React.FC<MedicalRecordTabProps> = ({ user, patients }) => {
  const toast = useToast();
  const { confirm } = useConfirmDialog();
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [medicalRecord, setMedicalRecord] = useState<MedicalRecord | null>(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPatientList, setShowPatientList] = useState(true);
  const [newConsultationOpen, setNewConsultationOpen] = useState(false);

  // Filter patients
  const filteredPatients = patients.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.phone?.includes(searchTerm) ||
    p.cpf?.includes(searchTerm)
  );

  // Load medical record when patient is selected
  useEffect(() => {
    if (selectedPatient) {
      setIsLoading(true);
      // Buscar prontuário do backend
      getMedicalRecord(selectedPatient.id)
        .then((record) => {
          if (record) {
            setMedicalRecord(record);
          } else {
            // Se não existe, criar um vazio localmente (será criado no backend quando necessário)
            setMedicalRecord(createEmptyMedicalRecord(selectedPatient.id));
          }
          setIsLoading(false);
        })
        .catch((error) => {
          console.error('Erro ao buscar prontuário:', error);
          toast.error('Erro ao carregar prontuário');
          // Em caso de erro, criar um vazio localmente
          setMedicalRecord(createEmptyMedicalRecord(selectedPatient.id));
          setIsLoading(false);
        });
    }
  }, [selectedPatient, toast]);

  const handleSelectPatient = (patient: Patient) => {
    setSelectedPatient(patient);
    setShowPatientList(false);
    setActiveTab('overview');
  };

  const handleBackToList = () => {
    setSelectedPatient(null);
    setMedicalRecord(null);
    setShowPatientList(true);
  };

  // Handlers for medical record updates
  const handleToothUpdate = (tooth: ToothData) => {
    if (!medicalRecord) return;
    const existingIndex = medicalRecord.odontogram.teeth.findIndex(t => t.id === tooth.id);
    const newTeeth = [...medicalRecord.odontogram.teeth];
    
    if (existingIndex >= 0) {
      newTeeth[existingIndex] = tooth;
    } else {
      newTeeth.push(tooth);
    }

    setMedicalRecord({
      ...medicalRecord,
      odontogram: {
        ...medicalRecord.odontogram,
        teeth: newTeeth,
        updatedAt: Date.now(),
      },
      updatedAt: Date.now(),
    });
  };

  const handleAddNote = (note: Omit<ClinicalNote, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (!medicalRecord) return;
    const newNote: ClinicalNote = {
      ...note,
      id: `note-${Date.now()}`,
      patientId: selectedPatient!.id,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    setMedicalRecord({
      ...medicalRecord,
      notes: [newNote, ...medicalRecord.notes],
      updatedAt: Date.now(),
    });
  };

  const handleUpdateNote = (id: string, content: string) => {
    if (!medicalRecord) return;
    setMedicalRecord({
      ...medicalRecord,
      notes: medicalRecord.notes.map(n => 
        n.id === id ? { ...n, content, updatedAt: Date.now() } : n
      ),
      updatedAt: Date.now(),
    });
  };

  const handleDeleteNote = async (id: string) => {
    if (!medicalRecord) return;
    const confirmed = await confirm({
      title: 'Excluir Anotação',
      message: 'Deseja excluir esta anotação?',
      confirmText: 'Excluir',
      cancelText: 'Cancelar',
      variant: 'danger'
    });
    if (!confirmed) return;
    
    setMedicalRecord({
      ...medicalRecord,
      notes: medicalRecord.notes.filter(n => n.id !== id),
      updatedAt: Date.now(),
    });
    toast.success('Anotação excluída!');
  };

  const handleUploadAttachment = (file: File, type: MedicalAttachment['type'], description: string) => {
    if (!medicalRecord) return;
    
    // Create a mock URL - in production, upload to storage
    const url = URL.createObjectURL(file);
    
    const newAttachment: MedicalAttachment = {
      id: `att-${Date.now()}`,
      patientId: selectedPatient!.id,
      name: file.name,
      type,
      url,
      mimeType: file.type,
      size: file.size,
      description,
      uploadedBy: user.name,
      createdAt: Date.now(),
    };

    setMedicalRecord({
      ...medicalRecord,
      attachments: [newAttachment, ...medicalRecord.attachments],
      updatedAt: Date.now(),
    });
  };

  const handleDeleteAttachment = async (id: string) => {
    if (!medicalRecord) return;
    const confirmed = await confirm({
      title: 'Excluir Anexo',
      message: 'Deseja excluir este anexo?',
      confirmText: 'Excluir',
      cancelText: 'Cancelar',
      variant: 'danger'
    });
    if (!confirmed) return;
    
    setMedicalRecord({
      ...medicalRecord,
      attachments: medicalRecord.attachments.filter(a => a.id !== id),
      updatedAt: Date.now(),
    });
    toast.success('Anexo excluído!');
  };

  const handleSignatureComplete = (signatureData: string) => {
    if (!medicalRecord) return;
    
    const newSignature = {
      id: `sig-${Date.now()}`,
      patientId: selectedPatient!.id,
      documentType: 'consent' as const,
      documentId: `doc-${Date.now()}`,
      signatureData,
      signedAt: Date.now(),
    };

    setMedicalRecord({
      ...medicalRecord,
      signatures: [...medicalRecord.signatures, newSignature],
      updatedAt: Date.now(),
    });
  };

  const handleSaveAnamnesis = (response: Omit<AnamnesisResponse, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (!medicalRecord) return;
    
    const newResponse: AnamnesisResponse = {
      ...response,
      id: `ana-${Date.now()}`,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    setMedicalRecord({
      ...medicalRecord,
      anamnesis: [newResponse, ...medicalRecord.anamnesis],
      updatedAt: Date.now(),
    });

    toast.success('Anamnese salva com sucesso!');
  };

  const renderPatientCard = (patient: Patient) => (
    <button
      key={patient.id}
      onClick={() => handleSelectPatient(patient)}
      className="w-full p-4 bg-white dark:bg-slate-800/50 hover:bg-slate-50 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-cyan-500/50 dark:hover:border-cyan-500/50 rounded-2xl text-left transition-all group"
    >
      <div className="flex items-center gap-4">
        <img
          src={patient.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(patient.name)}&background=0f172a&color=22d3ee&bold=true`}
          alt={patient.name}
          className="w-14 h-14 rounded-xl object-cover border-2 border-slate-200 dark:border-slate-700 group-hover:border-cyan-500/50 transition-colors"
        />
        <div className="flex-1 min-w-0">
          <h4 className="font-bold text-slate-900 dark:text-white truncate group-hover:text-cyan-600 dark:group-hover:text-cyan-400 transition-colors">
            {patient.name}
          </h4>
          <div className="flex flex-wrap gap-2 mt-1">
            {patient.phone && (
              <span className="text-[10px] text-slate-500 dark:text-slate-400 flex items-center gap-1">
                <Phone className="w-3 h-3" /> {patient.phone}
              </span>
            )}
            {patient.birth_date && (
              <span className="text-[10px] text-slate-500 dark:text-slate-400 flex items-center gap-1">
                <Cake className="w-3 h-3" /> {new Date(patient.birth_date).toLocaleDateString('pt-BR')}
              </span>
            )}
          </div>
        </div>
        <ChevronRight className="w-5 h-5 text-slate-400 dark:text-slate-600 group-hover:text-cyan-600 dark:group-hover:text-cyan-400 transition-colors" />
      </div>
    </button>
  );

  const renderOverview = () => {
    if (!medicalRecord || !selectedPatient) return null;

    const stats = [
      { label: 'Consultas', value: medicalRecord.consultations.length, icon: Calendar, color: 'text-blue-500 dark:text-blue-400' },
      { label: 'Anotações', value: medicalRecord.notes.length, icon: FileText, color: 'text-amber-500 dark:text-amber-400' },
      { label: 'Exames', value: medicalRecord.attachments.length, icon: Image, color: 'text-purple-500 dark:text-purple-400' },
      { label: 'Assinaturas', value: medicalRecord.signatures.length, icon: PenTool, color: 'text-emerald-500 dark:text-emerald-400' },
    ];

    const hasAnamnesis = medicalRecord.anamnesis.length > 0;
    const hasOdontogram = medicalRecord.odontogram.teeth.length > 0;

    return (
      <div className="space-y-6">
        {/* Patient Info Card */}
        <div className="bg-gradient-to-br from-cyan-50 dark:from-cyan-500/20 via-white dark:via-slate-800 to-purple-50 dark:to-purple-500/20 rounded-3xl p-6 border border-slate-200 dark:border-slate-700">
          <div className="flex flex-col md:flex-row gap-6">
            <img
              src={selectedPatient.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(selectedPatient.name)}&background=0f172a&color=22d3ee&bold=true&size=200`}
              alt={selectedPatient.name}
              className="w-32 h-32 rounded-2xl object-cover border-4 border-slate-200 dark:border-slate-700"
            />
            <div className="flex-1">
              <h2 className="text-2xl font-black text-slate-900 dark:text-white mb-2">{selectedPatient.name}</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                {selectedPatient.phone && (
                  <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                    <Phone className="w-4 h-4 text-cyan-500 dark:text-cyan-400" />
                    {selectedPatient.phone}
                  </div>
                )}
                {selectedPatient.email && (
                  <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                    <Mail className="w-4 h-4 text-cyan-500 dark:text-cyan-400" />
                    {selectedPatient.email}
                  </div>
                )}
                {selectedPatient.birth_date && (
                  <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                    <Cake className="w-4 h-4 text-cyan-500 dark:text-cyan-400" />
                    {new Date(selectedPatient.birth_date).toLocaleDateString('pt-BR')}
                  </div>
                )}
                {selectedPatient.address_city && (
                  <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                    <MapPin className="w-4 h-4 text-cyan-500 dark:text-cyan-400" />
                    {selectedPatient.address_city}, {selectedPatient.address_state}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {stats.map((stat) => (
            <div key={stat.label} className="bg-white dark:bg-slate-800/50 rounded-2xl p-4 border border-slate-200 dark:border-slate-700">
              <div className="flex items-center gap-3 mb-2">
                <stat.icon className={`w-5 h-5 ${stat.color}`} />
                <span className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">
                  {stat.label}
                </span>
              </div>
              <span className="text-3xl font-black text-slate-900 dark:text-white">{stat.value}</span>
            </div>
          ))}
        </div>

        {/* Quick Status */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className={`p-4 rounded-2xl border flex items-center gap-4 ${
            hasAnamnesis 
              ? 'bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/30' 
              : 'bg-amber-50 dark:bg-amber-500/10 border-amber-200 dark:border-amber-500/30'
          }`}>
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
              hasAnamnesis ? 'bg-emerald-100 dark:bg-emerald-500/20' : 'bg-amber-100 dark:bg-amber-500/20'
            }`}>
              {hasAnamnesis 
                ? <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                : <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400" />
              }
            </div>
            <div>
              <h4 className={`font-bold ${hasAnamnesis ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'}`}>
                Anamnese
              </h4>
              <p className="text-xs text-slate-600 dark:text-slate-400">
                {hasAnamnesis 
                  ? `Última atualização: ${new Date(medicalRecord.anamnesis[0].updatedAt).toLocaleDateString('pt-BR')}`
                  : 'Pendente de preenchimento'
                }
              </p>
            </div>
            <button
              onClick={() => setActiveTab('anamnesis')}
              className="ml-auto text-xs font-bold text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
            >
              {hasAnamnesis ? 'Ver' : 'Preencher'} →
            </button>
          </div>

          <div className={`p-4 rounded-2xl border flex items-center gap-4 ${
            hasOdontogram 
              ? 'bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/30' 
              : 'bg-amber-50 dark:bg-amber-500/10 border-amber-200 dark:border-amber-500/30'
          }`}>
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
              hasOdontogram ? 'bg-emerald-100 dark:bg-emerald-500/20' : 'bg-amber-100 dark:bg-amber-500/20'
            }`}>
              {hasOdontogram 
                ? <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                : <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400" />
              }
            </div>
            <div>
              <h4 className={`font-bold ${hasOdontogram ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'}`}>
                Odontograma
              </h4>
              <p className="text-xs text-slate-600 dark:text-slate-400">
                {hasOdontogram 
                  ? `${medicalRecord.odontogram.teeth.length} dentes mapeados`
                  : 'Nenhum dente mapeado'
                }
              </p>
            </div>
            <button
              onClick={() => setActiveTab('odontogram')}
              className="ml-auto text-xs font-bold text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
            >
              {hasOdontogram ? 'Ver' : 'Mapear'} →
            </button>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white dark:bg-slate-800/50 rounded-2xl p-6 border border-slate-200 dark:border-slate-700">
          <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider mb-4 flex items-center gap-2">
            <Activity className="w-4 h-4 text-cyan-500 dark:text-cyan-400" />
            Atividade Recente
          </h3>
          
          {medicalRecord.notes.length > 0 ? (
            <div className="space-y-3">
              {medicalRecord.notes.slice(0, 3).map((note) => (
                <div key={note.id} className="flex items-start gap-3 p-3 bg-slate-50 dark:bg-slate-900/50 rounded-xl">
                  <div className="w-2 h-2 mt-2 rounded-full bg-cyan-500 dark:bg-cyan-400" />
                  <div className="flex-1">
                    <p className="text-sm text-slate-700 dark:text-slate-200 line-clamp-2">{note.content}</p>
                    <p className="text-[10px] text-slate-500 dark:text-slate-500 mt-1">
                      {note.professionalName} • {new Date(note.createdAt).toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-slate-500 dark:text-slate-500 text-sm text-center py-8">
              Nenhuma atividade registrada ainda
            </p>
          )}
        </div>
      </div>
    );
  };

  const renderContent = () => {
    if (!medicalRecord || !selectedPatient) return null;

    switch (activeTab) {
      case 'overview':
        return renderOverview();
      
      case 'anamnesis':
        return (
          <AnamnesisForm
            existingResponse={medicalRecord.anamnesis[0]}
            onSave={handleSaveAnamnesis}
            patientId={selectedPatient.id}
          />
        );
      
      case 'odontogram':
        return (
          <Odontogram
            teeth={medicalRecord.odontogram.teeth}
            onToothUpdate={handleToothUpdate}
          />
        );
      
      case 'history':
        return (
          <ConsultationHistory
            consultations={medicalRecord.consultations}
            onViewDetails={(c) => {}}
          />
        );
      
      case 'attachments':
        return (
          <AttachmentsManager
            attachments={medicalRecord.attachments}
            onUpload={handleUploadAttachment}
            onDelete={handleDeleteAttachment}
          />
        );
      
      case 'notes':
        return (
          <ClinicalNotes
            notes={medicalRecord.notes}
            onAddNote={handleAddNote}
            onUpdateNote={handleUpdateNote}
            onDeleteNote={handleDeleteNote}
            currentProfessional={{ id: user.id, name: user.name }}
          />
        );
      
      case 'signature':
        return (
          <DigitalSignature
            onSignatureComplete={handleSignatureComplete}
            patientName={selectedPatient.name}
            existingSignature={medicalRecord.signatures[0]?.signatureData}
          />
        );
      
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-white/90 dark:bg-slate-950/90 backdrop-blur-xl border-b border-slate-200 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex items-center justify-between">
            {selectedPatient ? (
              <button
                onClick={handleBackToList}
                className="flex items-center gap-2 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
              >
                <ChevronLeft className="w-5 h-5" />
                <span className="font-bold text-sm">Voltar</span>
              </button>
            ) : (
              <div>
                <h1 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-3">
                  <Stethoscope className="w-7 h-7 text-cyan-500 dark:text-cyan-400" />
                  Prontuário Eletrônico
                </h1>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Sistema de Prontuário Eletrônico do Paciente (PEP)
                </p>
              </div>
            )}

            {selectedPatient && (
              <div className="flex items-center gap-4">
                <div className="text-right hidden sm:block">
                  <p className="font-bold text-slate-900 dark:text-white">{selectedPatient.name}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">{selectedPatient.phone}</p>
                </div>
                <img
                  src={selectedPatient.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(selectedPatient.name)}&background=0f172a&color=22d3ee&bold=true`}
                  alt={selectedPatient.name}
                  className="w-12 h-12 rounded-xl border-2 border-cyan-500/30 dark:border-cyan-500/30"
                />
              </div>
            )}
          </div>

          {/* Tabs */}
          {selectedPatient && (
            <div className="flex gap-1 mt-4 overflow-x-auto pb-2 -mx-4 px-4 sm:mx-0 sm:px-0">
              {TABS.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider whitespace-nowrap transition-all ${
                    activeTab === tab.id
                      ? 'bg-cyan-500/20 dark:bg-cyan-500/20 text-cyan-600 dark:text-cyan-400 border border-cyan-500/30 dark:border-cyan-500/30'
                      : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  <tab.icon className="w-4 h-4" />
                  {tab.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        {showPatientList ? (
          <div className="space-y-6 animate-in fade-in duration-500">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 dark:text-slate-500" />
              <input
                type="text"
                placeholder="Buscar paciente por nome, telefone ou CPF..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-4 bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-2xl text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
              />
            </div>

            {/* Patient List */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredPatients.length > 0 ? (
                filteredPatients.map(renderPatientCard)
              ) : (
                <div className="col-span-full flex flex-col items-center justify-center py-16 text-center">
                  <div className="w-20 h-20 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-4">
                    <User className="w-10 h-10 text-slate-400 dark:text-slate-600" />
                  </div>
                  <h4 className="text-slate-600 dark:text-slate-400 font-bold text-sm mb-2">
                    {searchTerm ? 'Nenhum paciente encontrado' : 'Nenhum paciente cadastrado'}
                  </h4>
                  <p className="text-slate-500 dark:text-slate-600 text-xs max-w-xs">
                    {searchTerm 
                      ? 'Tente buscar por outro termo'
                      : 'Cadastre pacientes na aba de Pacientes para acessar seus prontuários'
                    }
                  </p>
                </div>
              )}
            </div>
          </div>
        ) : isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-10 h-10 text-cyan-500 dark:text-cyan-400 animate-spin" />
          </div>
        ) : (
          <div className="animate-in fade-in duration-500">
            {renderContent()}
          </div>
        )}
      </div>
    </div>
  );
};

export default MedicalRecordTab;

