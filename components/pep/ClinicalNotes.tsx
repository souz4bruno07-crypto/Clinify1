import React, { useState } from 'react';
import { ClinicalNote } from '../../types';
import { 
  Plus, MessageSquare, Stethoscope, FileText, Pill, 
  Send, Clock, User, Edit2, Trash2, X, Check,
  Filter, Search, ChevronDown
} from 'lucide-react';

interface ClinicalNotesProps {
  notes: ClinicalNote[];
  onAddNote: (note: Omit<ClinicalNote, 'id' | 'createdAt' | 'updatedAt'>) => void;
  onUpdateNote: (id: string, content: string) => void;
  onDeleteNote: (id: string) => void;
  currentProfessional: { id: string; name: string };
  readOnly?: boolean;
}

const NOTE_TYPES: Record<ClinicalNote['type'], { label: string; icon: React.ReactNode; color: string; bgColor: string; dotColor: string }> = {
  consultation: { 
    label: 'Consulta', 
    icon: <Stethoscope className="w-4 h-4" />, 
    color: 'text-emerald-500 dark:text-emerald-400',
    bgColor: 'bg-emerald-50 dark:bg-emerald-500/20 border-emerald-200 dark:border-emerald-500/30',
    dotColor: 'bg-emerald-500 dark:bg-emerald-400'
  },
  procedure: { 
    label: 'Procedimento', 
    icon: <FileText className="w-4 h-4" />, 
    color: 'text-blue-500 dark:text-blue-400',
    bgColor: 'bg-blue-50 dark:bg-blue-500/20 border-blue-200 dark:border-blue-500/30',
    dotColor: 'bg-blue-500 dark:bg-blue-400'
  },
  observation: { 
    label: 'Observação', 
    icon: <MessageSquare className="w-4 h-4" />, 
    color: 'text-amber-500 dark:text-amber-400',
    bgColor: 'bg-amber-50 dark:bg-amber-500/20 border-amber-200 dark:border-amber-500/30',
    dotColor: 'bg-amber-500 dark:bg-amber-400'
  },
  prescription: { 
    label: 'Prescrição', 
    icon: <Pill className="w-4 h-4" />, 
    color: 'text-purple-500 dark:text-purple-400',
    bgColor: 'bg-purple-50 dark:bg-purple-500/20 border-purple-200 dark:border-purple-500/30',
    dotColor: 'bg-purple-500 dark:bg-purple-400'
  },
  referral: { 
    label: 'Encaminhamento', 
    icon: <Send className="w-4 h-4" />, 
    color: 'text-cyan-500 dark:text-cyan-400',
    bgColor: 'bg-cyan-50 dark:bg-cyan-500/20 border-cyan-200 dark:border-cyan-500/30',
    dotColor: 'bg-cyan-500 dark:bg-cyan-400'
  },
};

const ClinicalNotes: React.FC<ClinicalNotesProps> = ({
  notes,
  onAddNote,
  onUpdateNote,
  onDeleteNote,
  currentProfessional,
  readOnly = false
}) => {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [newNoteType, setNewNoteType] = useState<ClinicalNote['type']>('observation');
  const [newNoteContent, setNewNoteContent] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');
  const [filterType, setFilterType] = useState<ClinicalNote['type'] | 'all'>('all');
  const [searchTerm, setSearchTerm] = useState('');

  const filteredNotes = notes
    .filter(note => {
      const matchesType = filterType === 'all' || note.type === filterType;
      const matchesSearch = note.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           note.professionalName.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesType && matchesSearch;
    })
    .sort((a, b) => b.createdAt - a.createdAt);

  const handleAddNote = () => {
    if (!newNoteContent.trim()) return;
    
    onAddNote({
      patientId: '', // Will be set by parent
      professionalId: currentProfessional.id,
      professionalName: currentProfessional.name,
      content: newNoteContent,
      type: newNoteType,
    });
    
    setNewNoteContent('');
    setIsFormOpen(false);
  };

  const handleEditNote = (id: string) => {
    onUpdateNote(id, editContent);
    setEditingId(null);
    setEditContent('');
  };

  const startEditing = (note: ClinicalNote) => {
    setEditingId(note.id);
    setEditContent(note.content);
  };

  const formatDateTime = (timestamp: number) => {
    const date = new Date(timestamp);
    return {
      date: date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' }),
      time: date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
    };
  };

  const groupNotesByDate = (notes: ClinicalNote[]) => {
    const groups: Record<string, ClinicalNote[]> = {};
    notes.forEach(note => {
      const dateKey = new Date(note.createdAt).toLocaleDateString('pt-BR');
      if (!groups[dateKey]) groups[dateKey] = [];
      groups[dateKey].push(note);
    });
    return groups;
  };

  const groupedNotes = groupNotesByDate(filteredNotes);

  return (
    <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h3 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-amber-500 dark:text-amber-400" />
            Anotações Clínicas
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-500 mt-1">
            {notes.length} registro{notes.length !== 1 ? 's' : ''} no prontuário
          </p>
        </div>

        {!readOnly && (
          <button
            onClick={() => setIsFormOpen(!isFormOpen)}
            className="flex items-center gap-2 px-6 py-3 bg-amber-500 text-white rounded-xl font-bold text-xs uppercase tracking-wider hover:bg-amber-600 transition-all"
          >
            <Plus className="w-4 h-4" />
            Nova Anotação
          </button>
        )}
      </div>

      {/* New Note Form */}
      {isFormOpen && !readOnly && (
        <div className="mb-6 p-6 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 animate-in slide-in-from-top-4 duration-300">
          <div className="flex flex-wrap gap-2 mb-4">
            {Object.entries(NOTE_TYPES).map(([key, value]) => (
              <button
                key={key}
                onClick={() => setNewNoteType(key as ClinicalNote['type'])}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${
                  newNoteType === key
                    ? `${value.bgColor} ${value.color} border`
                    : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-300 dark:hover:bg-slate-600'
                }`}
              >
                {value.icon}
                {value.label}
              </button>
            ))}
          </div>

          <textarea
            value={newNoteContent}
            onChange={(e) => setNewNoteContent(e.target.value)}
            placeholder="Digite a anotação clínica..."
            className="w-full h-32 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-4 text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500 resize-none"
          />

          <div className="flex justify-between items-center mt-4">
            <span className="text-[10px] text-slate-500 dark:text-slate-500 flex items-center gap-1">
              <User className="w-3 h-3" />
              {currentProfessional.name}
            </span>
            
            <div className="flex gap-2">
              <button
                onClick={() => setIsFormOpen(false)}
                className="px-4 py-2 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl font-bold text-xs uppercase tracking-wider hover:bg-slate-300 dark:hover:bg-slate-600 transition-all"
              >
                Cancelar
              </button>
              <button
                onClick={handleAddNote}
                disabled={!newNoteContent.trim()}
                className="flex items-center gap-2 px-4 py-2 bg-amber-500 text-white rounded-xl font-bold text-xs uppercase tracking-wider hover:bg-amber-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Check className="w-4 h-4" />
                Salvar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-slate-500" />
          <input
            type="text"
            placeholder="Buscar anotações..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500"
          />
        </div>

        <div className="flex gap-2 overflow-x-auto pb-2 sm:pb-0">
          <button
            onClick={() => setFilterType('all')}
            className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider whitespace-nowrap transition-all ${
              filterType === 'all' ? 'bg-amber-500 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            Todos
          </button>
          {Object.entries(NOTE_TYPES).map(([key, value]) => (
            <button
              key={key}
              onClick={() => setFilterType(key as ClinicalNote['type'])}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold uppercase tracking-wider whitespace-nowrap transition-all ${
                filterType === key 
                  ? `${value.bgColor} ${value.color} border` 
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              {value.icon}
              {value.label}
            </button>
          ))}
        </div>
      </div>

      {/* Timeline */}
      {Object.keys(groupedNotes).length > 0 ? (
        <div className="space-y-8">
          {Object.entries(groupedNotes).map(([dateKey, dateNotes]) => (
            <div key={dateKey}>
              {/* Date Header */}
              <div className="flex items-center gap-4 mb-4">
                <div className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 rounded-lg">
                  <span className="text-[11px] font-black text-slate-600 dark:text-slate-400 uppercase tracking-widest">
                    {dateKey}
                  </span>
                </div>
                <div className="flex-1 h-px bg-slate-200 dark:bg-slate-800" />
              </div>

              {/* Notes for this date */}
              <div className="space-y-3 pl-4 border-l-2 border-slate-200 dark:border-slate-800">
                {dateNotes.map((note) => {
                  const typeInfo = NOTE_TYPES[note.type];
                  const dateTime = formatDateTime(note.createdAt);
                  const isEditing = editingId === note.id;

                  return (
                    <div
                      key={note.id}
                      className={`relative p-4 rounded-2xl border transition-all ${typeInfo.bgColor} ${
                        isEditing ? 'ring-2 ring-amber-500' : ''
                      }`}
                    >
                      {/* Timeline dot */}
                      <div className={`absolute -left-[1.4rem] top-5 w-3 h-3 rounded-full ${typeInfo.dotColor} ring-4 ring-white dark:ring-slate-900`} />

                      {/* Header */}
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className={typeInfo.color}>{typeInfo.icon}</span>
                          <span className={`text-xs font-bold uppercase tracking-wider ${typeInfo.color}`}>
                            {typeInfo.label}
                          </span>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] text-slate-500 dark:text-slate-500 flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {dateTime.time}
                          </span>
                          
                          {!readOnly && note.professionalId === currentProfessional.id && (
                            <div className="flex gap-1">
                              {isEditing ? (
                                <>
                                  <button
                                    onClick={() => setEditingId(null)}
                                    className="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-700/50 rounded-lg transition-colors"
                                  >
                                    <X className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
                                  </button>
                                  <button
                                    onClick={() => handleEditNote(note.id)}
                                    className="p-1.5 hover:bg-emerald-100 dark:hover:bg-emerald-500/20 rounded-lg transition-colors"
                                  >
                                    <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                                  </button>
                                </>
                              ) : (
                                <>
                                  <button
                                    onClick={() => startEditing(note)}
                                    className="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-700/50 rounded-lg transition-colors"
                                  >
                                    <Edit2 className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
                                  </button>
                                  <button
                                    onClick={() => onDeleteNote(note.id)}
                                    className="p-1.5 hover:bg-red-100 dark:hover:bg-red-500/20 rounded-lg transition-colors"
                                  >
                                    <Trash2 className="w-3.5 h-3.5 text-red-600 dark:text-red-400" />
                                  </button>
                                </>
                              )}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Content */}
                      {isEditing ? (
                        <textarea
                          value={editContent}
                          onChange={(e) => setEditContent(e.target.value)}
                          className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500 resize-none"
                          rows={3}
                          autoFocus
                        />
                      ) : (
                        <p className="text-sm text-slate-700 dark:text-slate-200 whitespace-pre-wrap leading-relaxed">
                          {note.content}
                        </p>
                      )}

                      {/* Footer */}
                      <div className="flex items-center gap-2 mt-3 pt-3 border-t border-slate-200 dark:border-slate-700/50">
                        <div className="w-6 h-6 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center">
                          <User className="w-3 h-3 text-slate-500 dark:text-slate-400" />
                        </div>
                        <span className="text-[10px] font-bold text-slate-600 dark:text-slate-400">
                          {note.professionalName}
                        </span>
                        {note.updatedAt !== note.createdAt && (
                          <span className="text-[9px] text-slate-500 dark:text-slate-600 italic">
                            (editado)
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="w-20 h-20 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-4">
            <MessageSquare className="w-10 h-10 text-slate-400 dark:text-slate-600" />
          </div>
          <h4 className="text-slate-600 dark:text-slate-400 font-bold text-sm mb-2">
            {searchTerm || filterType !== 'all' ? 'Nenhuma anotação encontrada' : 'Nenhuma anotação registrada'}
          </h4>
          <p className="text-slate-500 dark:text-slate-600 text-xs max-w-xs">
            {searchTerm || filterType !== 'all'
              ? 'Tente ajustar seus filtros de busca'
              : 'Registre consultas, procedimentos, observações e prescrições do paciente'
            }
          </p>
        </div>
      )}
    </div>
  );
};

export default ClinicalNotes;








