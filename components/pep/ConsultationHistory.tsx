import React, { useState } from 'react';
import { ConsultationRecord, ToothData } from '../../types';
import { 
  Calendar, ChevronDown, ChevronUp, User, FileText,
  Pill, Stethoscope, ClipboardList, Eye, Download,
  Clock, MapPin, Activity, Trash2, PenTool
} from 'lucide-react';

interface ConsultationHistoryProps {
  consultations: ConsultationRecord[];
  onViewDetails: (consultation: ConsultationRecord) => void;
  onDelete?: (id: string) => void;
  readOnly?: boolean;
}

const ConsultationHistory: React.FC<ConsultationHistoryProps> = ({
  consultations,
  onViewDetails,
  onDelete,
  readOnly = false
}) => {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [filterYear, setFilterYear] = useState<number | 'all'>('all');

  // Get unique years from consultations
  const years = [...new Set(consultations.map(c => new Date(c.createdAt).getFullYear()))].sort((a, b) => b - a);

  const filteredConsultations = consultations
    .filter(c => filterYear === 'all' || new Date(c.createdAt).getFullYear() === filterYear)
    .sort((a, b) => b.createdAt - a.createdAt);

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('pt-BR', {
      weekday: 'short',
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusBadge = (consultation: ConsultationRecord) => {
    const hasAttachments = consultation.attachments.length > 0;
    const hasNotes = consultation.notes.length > 0;
    const hasSignature = !!consultation.signatureId;
    
    return (
      <div className="flex gap-1">
        {hasAttachments && (
          <span className="px-2 py-0.5 bg-purple-500/20 text-purple-400 text-[9px] font-bold rounded-full uppercase">
            {consultation.attachments.length} anexo{consultation.attachments.length > 1 ? 's' : ''}
          </span>
        )}
        {hasNotes && (
          <span className="px-2 py-0.5 bg-amber-500/20 text-amber-400 text-[9px] font-bold rounded-full uppercase">
            {consultation.notes.length} nota{consultation.notes.length > 1 ? 's' : ''}
          </span>
        )}
        {hasSignature && (
          <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-400 text-[9px] font-bold rounded-full uppercase flex items-center gap-1">
            <PenTool className="w-3 h-3" />
            Assinado
          </span>
        )}
      </div>
    );
  };

  return (
    <div className="bg-slate-900 rounded-3xl p-6 border border-slate-800">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h3 className="text-lg font-black text-white uppercase tracking-wider flex items-center gap-2">
            <Calendar className="w-5 h-5 text-blue-400" />
            Histórico de Consultas
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            {consultations.length} consulta{consultations.length !== 1 ? 's' : ''} registrada{consultations.length !== 1 ? 's' : ''}
          </p>
        </div>

        {/* Year Filter */}
        {years.length > 0 && (
          <div className="flex gap-2">
            <button
              onClick={() => setFilterYear('all')}
              className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${
                filterYear === 'all' ? 'bg-blue-500 text-white' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
              }`}
            >
              Todos
            </button>
            {years.map(year => (
              <button
                key={year}
                onClick={() => setFilterYear(year)}
                className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${
                  filterYear === year ? 'bg-blue-500 text-white' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                }`}
              >
                {year}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Timeline */}
      {filteredConsultations.length > 0 ? (
        <div className="space-y-4">
          {filteredConsultations.map((consultation, index) => {
            const isExpanded = expandedId === consultation.id;
            
            return (
              <div
                key={consultation.id}
                className="bg-slate-800/50 rounded-2xl border border-slate-700 overflow-hidden hover:border-blue-500/50 transition-all"
              >
                {/* Consultation Header */}
                <button
                  onClick={() => setExpandedId(isExpanded ? null : consultation.id)}
                  className="w-full p-5 flex items-start gap-4 text-left hover:bg-slate-800/80 transition-colors"
                >
                  {/* Date Badge */}
                  <div className="flex-shrink-0 w-16 h-16 bg-slate-700 rounded-xl flex flex-col items-center justify-center">
                    <span className="text-2xl font-black text-white">
                      {new Date(consultation.createdAt).getDate()}
                    </span>
                    <span className="text-[10px] font-bold text-slate-400 uppercase">
                      {new Date(consultation.createdAt).toLocaleDateString('pt-BR', { month: 'short' })}
                    </span>
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h4 className="text-sm font-bold text-white mb-1 line-clamp-1">
                          {consultation.chiefComplaint || 'Consulta de rotina'}
                        </h4>
                        <div className="flex items-center gap-2 text-[10px] text-slate-500">
                          <User className="w-3 h-3" />
                          <span className="font-medium">{consultation.professionalName}</span>
                          <span className="text-slate-600">•</span>
                          <Clock className="w-3 h-3" />
                          <span>{new Date(consultation.createdAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        {getStatusBadge(consultation)}
                        {isExpanded ? (
                          <ChevronUp className="w-5 h-5 text-slate-400" />
                        ) : (
                          <ChevronDown className="w-5 h-5 text-slate-400" />
                        )}
                      </div>
                    </div>

                    {/* Procedures Pills */}
                    {consultation.procedures.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mt-3">
                        {consultation.procedures.slice(0, 3).map((proc, i) => (
                          <span
                            key={i}
                            className="px-2 py-1 bg-blue-500/20 text-blue-400 text-[10px] font-bold rounded-lg"
                          >
                            {proc}
                          </span>
                        ))}
                        {consultation.procedures.length > 3 && (
                          <span className="px-2 py-1 bg-slate-700 text-slate-400 text-[10px] font-bold rounded-lg">
                            +{consultation.procedures.length - 3}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </button>

                {/* Expanded Details */}
                {isExpanded && (
                  <div className="px-5 pb-5 pt-0 space-y-4 animate-in slide-in-from-top-2 duration-200">
                    <div className="h-px bg-slate-700" />
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Diagnóstico */}
                      {consultation.diagnosis && (
                        <div className="p-4 bg-slate-800 rounded-xl">
                          <div className="flex items-center gap-2 mb-2">
                            <Stethoscope className="w-4 h-4 text-emerald-400" />
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                              Diagnóstico
                            </span>
                          </div>
                          <p className="text-sm text-slate-200">{consultation.diagnosis}</p>
                        </div>
                      )}

                      {/* Plano de Tratamento */}
                      {consultation.treatmentPlan && (
                        <div className="p-4 bg-slate-800 rounded-xl">
                          <div className="flex items-center gap-2 mb-2">
                            <ClipboardList className="w-4 h-4 text-cyan-400" />
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                              Plano de Tratamento
                            </span>
                          </div>
                          <p className="text-sm text-slate-200">{consultation.treatmentPlan}</p>
                        </div>
                      )}

                      {/* Exame Clínico */}
                      {consultation.clinicalExam && (
                        <div className="p-4 bg-slate-800 rounded-xl">
                          <div className="flex items-center gap-2 mb-2">
                            <Activity className="w-4 h-4 text-amber-400" />
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                              Exame Clínico
                            </span>
                          </div>
                          <p className="text-sm text-slate-200">{consultation.clinicalExam}</p>
                        </div>
                      )}

                      {/* Prescrições */}
                      {consultation.prescriptions.length > 0 && (
                        <div className="p-4 bg-slate-800 rounded-xl">
                          <div className="flex items-center gap-2 mb-2">
                            <Pill className="w-4 h-4 text-purple-400" />
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                              Prescrições
                            </span>
                          </div>
                          <ul className="space-y-1">
                            {consultation.prescriptions.map((presc, i) => (
                              <li key={i} className="text-sm text-slate-200 flex items-start gap-2">
                                <span className="text-purple-400">•</span>
                                {presc}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2 pt-2">
                      <button
                        onClick={() => onViewDetails(consultation)}
                        className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-xl font-bold text-xs uppercase tracking-wider hover:bg-blue-700 transition-all"
                      >
                        <Eye className="w-4 h-4" />
                        Ver Detalhes Completos
                      </button>
                      
                      {!readOnly && onDelete && (
                        <button
                          onClick={() => onDelete(consultation.id)}
                          className="p-3 bg-red-500/20 text-red-400 rounded-xl hover:bg-red-500/30 transition-all"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="w-20 h-20 bg-slate-800 rounded-full flex items-center justify-center mb-4">
            <Calendar className="w-10 h-10 text-slate-600" />
          </div>
          <h4 className="text-slate-400 font-bold text-sm mb-2">
            Nenhuma consulta registrada
          </h4>
          <p className="text-slate-600 text-xs max-w-xs">
            O histórico de consultas do paciente aparecerá aqui conforme os atendimentos forem realizados.
          </p>
        </div>
      )}

      {/* Statistics */}
      {consultations.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6 pt-6 border-t border-slate-800">
          <div className="text-center">
            <span className="text-2xl font-black text-white">{consultations.length}</span>
            <p className="text-[10px] text-slate-500 uppercase tracking-wider">Consultas</p>
          </div>
          <div className="text-center">
            <span className="text-2xl font-black text-blue-400">
              {consultations.reduce((acc, c) => acc + c.procedures.length, 0)}
            </span>
            <p className="text-[10px] text-slate-500 uppercase tracking-wider">Procedimentos</p>
          </div>
          <div className="text-center">
            <span className="text-2xl font-black text-purple-400">
              {consultations.reduce((acc, c) => acc + c.attachments.length, 0)}
            </span>
            <p className="text-[10px] text-slate-500 uppercase tracking-wider">Anexos</p>
          </div>
          <div className="text-center">
            <span className="text-2xl font-black text-emerald-400">
              {consultations.filter(c => c.signatureId).length}
            </span>
            <p className="text-[10px] text-slate-500 uppercase tracking-wider">Assinaturas</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default ConsultationHistory;












