import React, { useState, useEffect } from 'react';
import { AnamnesisTemplate, AnamnesisField, AnamnesisResponse } from '../../types';
import { 
  FileText, Check, ChevronDown, ChevronUp, AlertCircle,
  Plus, Trash2, Save, RotateCcw, Copy, Settings
} from 'lucide-react';

// Templates padrão de anamnese
const DEFAULT_TEMPLATES: AnamnesisTemplate[] = [
  {
    id: 'dental-default',
    name: 'Anamnese Odontológica Completa',
    specialty: 'dental',
    isDefault: true,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    fields: [
      { id: '1', label: 'Queixa Principal', type: 'textarea', required: true, category: 'Motivo da Consulta' },
      { id: '2', label: 'Histórico da Queixa', type: 'textarea', required: false, category: 'Motivo da Consulta' },
      { id: '3', label: 'Você está em tratamento médico?', type: 'boolean', required: true, category: 'Saúde Geral' },
      { id: '4', label: 'Se sim, qual tratamento?', type: 'text', required: false, category: 'Saúde Geral' },
      { id: '5', label: 'Está tomando alguma medicação?', type: 'boolean', required: true, category: 'Saúde Geral' },
      { id: '6', label: 'Quais medicamentos?', type: 'textarea', required: false, category: 'Saúde Geral' },
      { id: '7', label: 'Possui alergia a medicamentos?', type: 'boolean', required: true, category: 'Alergias' },
      { id: '8', label: 'Quais medicamentos causam alergia?', type: 'text', required: false, category: 'Alergias' },
      { id: '9', label: 'Alergia a látex?', type: 'boolean', required: true, category: 'Alergias' },
      { id: '10', label: 'Outras alergias', type: 'text', required: false, category: 'Alergias' },
      { id: '11', label: 'Problemas cardíacos', type: 'boolean', required: true, category: 'Histórico de Doenças' },
      { id: '12', label: 'Pressão alta (hipertensão)', type: 'boolean', required: true, category: 'Histórico de Doenças' },
      { id: '13', label: 'Diabetes', type: 'boolean', required: true, category: 'Histórico de Doenças' },
      { id: '14', label: 'Problemas respiratórios', type: 'boolean', required: true, category: 'Histórico de Doenças' },
      { id: '15', label: 'Hepatite', type: 'boolean', required: true, category: 'Histórico de Doenças' },
      { id: '16', label: 'HIV/AIDS', type: 'boolean', required: true, category: 'Histórico de Doenças' },
      { id: '17', label: 'Problemas de coagulação', type: 'boolean', required: true, category: 'Histórico de Doenças' },
      { id: '18', label: 'Está grávida?', type: 'boolean', required: false, category: 'Para Mulheres' },
      { id: '19', label: 'Está amamentando?', type: 'boolean', required: false, category: 'Para Mulheres' },
      { id: '20', label: 'Fumante', type: 'boolean', required: true, category: 'Hábitos' },
      { id: '21', label: 'Consome bebidas alcoólicas', type: 'boolean', required: true, category: 'Hábitos' },
      { id: '22', label: 'Range ou aperta os dentes', type: 'boolean', required: true, category: 'Hábitos' },
      { id: '23', label: 'Já teve problemas com anestesia?', type: 'boolean', required: true, category: 'Histórico Odontológico' },
      { id: '24', label: 'Sangramento gengival', type: 'boolean', required: true, category: 'Histórico Odontológico' },
      { id: '25', label: 'Sensibilidade dental', type: 'boolean', required: true, category: 'Histórico Odontológico' },
      { id: '26', label: 'Observações adicionais', type: 'textarea', required: false, category: 'Observações' },
    ]
  },
  {
    id: 'medical-default',
    name: 'Anamnese Médica Geral',
    specialty: 'general',
    isDefault: true,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    fields: [
      { id: '1', label: 'Queixa Principal', type: 'textarea', required: true, category: 'Motivo da Consulta' },
      { id: '2', label: 'História da Doença Atual', type: 'textarea', required: true, category: 'Motivo da Consulta' },
      { id: '3', label: 'Antecedentes Pessoais', type: 'textarea', required: false, category: 'Histórico' },
      { id: '4', label: 'Antecedentes Familiares', type: 'textarea', required: false, category: 'Histórico' },
      { id: '5', label: 'Cirurgias anteriores', type: 'textarea', required: false, category: 'Histórico' },
      { id: '6', label: 'Medicamentos em uso', type: 'textarea', required: true, category: 'Medicações' },
      { id: '7', label: 'Alergias conhecidas', type: 'textarea', required: true, category: 'Alergias' },
      { id: '8', label: 'Pressão Arterial', type: 'text', required: false, category: 'Sinais Vitais' },
      { id: '9', label: 'Frequência Cardíaca', type: 'number', required: false, category: 'Sinais Vitais' },
      { id: '10', label: 'Temperatura', type: 'number', required: false, category: 'Sinais Vitais' },
      { id: '11', label: 'Peso (kg)', type: 'number', required: false, category: 'Sinais Vitais' },
      { id: '12', label: 'Altura (cm)', type: 'number', required: false, category: 'Sinais Vitais' },
    ]
  }
];

interface AnamnesisFormProps {
  templates?: AnamnesisTemplate[];
  existingResponse?: AnamnesisResponse;
  onSave: (response: Omit<AnamnesisResponse, 'id' | 'createdAt' | 'updatedAt'>) => void;
  onTemplateCreate?: (template: Omit<AnamnesisTemplate, 'id' | 'createdAt' | 'updatedAt'>) => void;
  patientId: string;
  readOnly?: boolean;
}

const AnamnesisForm: React.FC<AnamnesisFormProps> = ({
  templates = DEFAULT_TEMPLATES,
  existingResponse,
  onSave,
  onTemplateCreate,
  patientId,
  readOnly = false
}) => {
  const [selectedTemplateId, setSelectedTemplateId] = useState(existingResponse?.templateId || templates[0]?.id);
  const [responses, setResponses] = useState<Record<string, string | boolean | number>>(
    existingResponse?.responses || {}
  );
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [showTemplateEditor, setShowTemplateEditor] = useState(false);
  const [validationErrors, setValidationErrors] = useState<Set<string>>(new Set());

  const selectedTemplate = templates.find(t => t.id === selectedTemplateId) || templates[0];

  // Group fields by category
  const fieldsByCategory = selectedTemplate?.fields.reduce((acc, field) => {
    if (!acc[field.category]) acc[field.category] = [];
    acc[field.category].push(field);
    return acc;
  }, {} as Record<string, AnamnesisField[]>) || {};

  const categories = Object.keys(fieldsByCategory);

  useEffect(() => {
    // Expand first category by default
    if (categories.length > 0 && expandedCategories.size === 0) {
      setExpandedCategories(new Set([categories[0]]));
    }
  }, [selectedTemplateId]);

  const toggleCategory = (category: string) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(category)) {
      newExpanded.delete(category);
    } else {
      newExpanded.add(category);
    }
    setExpandedCategories(newExpanded);
  };

  const handleResponseChange = (fieldId: string, value: string | boolean | number) => {
    setResponses(prev => ({ ...prev, [fieldId]: value }));
    // Clear validation error when field is filled
    if (validationErrors.has(fieldId)) {
      const newErrors = new Set(validationErrors);
      newErrors.delete(fieldId);
      setValidationErrors(newErrors);
    }
  };

  const validateForm = (): boolean => {
    const errors = new Set<string>();
    selectedTemplate?.fields.forEach(field => {
      if (field.required && !responses[field.id]) {
        errors.add(field.id);
      }
    });
    setValidationErrors(errors);
    return errors.size === 0;
  };

  const handleSave = () => {
    if (!validateForm()) {
      // Expand categories with errors
      const categoriesWithErrors = new Set<string>();
      selectedTemplate?.fields.forEach(field => {
        if (validationErrors.has(field.id)) {
          categoriesWithErrors.add(field.category);
        }
      });
      setExpandedCategories(new Set([...expandedCategories, ...categoriesWithErrors]));
      return;
    }

    onSave({
      patientId,
      templateId: selectedTemplateId,
      responses,
    });
  };

  const resetForm = () => {
    setResponses({});
    setValidationErrors(new Set());
  };

  const getCompletionPercentage = () => {
    if (!selectedTemplate) return 0;
    const requiredFields = selectedTemplate.fields.filter(f => f.required);
    const filledRequired = requiredFields.filter(f => responses[f.id] !== undefined && responses[f.id] !== '');
    return Math.round((filledRequired.length / requiredFields.length) * 100);
  };

  const renderField = (field: AnamnesisField) => {
    const hasError = validationErrors.has(field.id);
    const value = responses[field.id];

    const baseInputClass = `w-full bg-slate-800 border ${
      hasError ? 'border-red-500 ring-2 ring-red-500/30' : 'border-slate-700'
    } rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 transition-all`;

    switch (field.type) {
      case 'boolean':
        return (
          <div className="flex gap-4">
            <button
              type="button"
              disabled={readOnly}
              onClick={() => handleResponseChange(field.id, true)}
              className={`flex-1 py-3 px-4 rounded-xl font-bold text-xs uppercase tracking-wider transition-all ${
                value === true
                  ? 'bg-emerald-500/20 border border-emerald-500 text-emerald-400'
                  : 'bg-slate-800 border border-slate-700 text-slate-400 hover:bg-slate-700'
              } ${readOnly ? 'cursor-default' : ''}`}
            >
              Sim
            </button>
            <button
              type="button"
              disabled={readOnly}
              onClick={() => handleResponseChange(field.id, false)}
              className={`flex-1 py-3 px-4 rounded-xl font-bold text-xs uppercase tracking-wider transition-all ${
                value === false
                  ? 'bg-red-500/20 border border-red-500 text-red-400'
                  : 'bg-slate-800 border border-slate-700 text-slate-400 hover:bg-slate-700'
              } ${readOnly ? 'cursor-default' : ''}`}
            >
              Não
            </button>
          </div>
        );

      case 'textarea':
        return (
          <textarea
            value={(value as string) || ''}
            onChange={(e) => handleResponseChange(field.id, e.target.value)}
            placeholder={`Informe ${field.label.toLowerCase()}...`}
            className={`${baseInputClass} p-4 min-h-[100px] resize-none`}
            disabled={readOnly}
          />
        );

      case 'number':
        return (
          <input
            type="number"
            value={(value as number) || ''}
            onChange={(e) => handleResponseChange(field.id, Number(e.target.value))}
            placeholder="0"
            className={`${baseInputClass} py-3 px-4`}
            disabled={readOnly}
          />
        );

      case 'select':
        return (
          <select
            value={(value as string) || ''}
            onChange={(e) => handleResponseChange(field.id, e.target.value)}
            className={`${baseInputClass} py-3 px-4`}
            disabled={readOnly}
          >
            <option value="">Selecione...</option>
            {field.options?.map((opt) => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </select>
        );

      case 'date':
        return (
          <input
            type="date"
            value={(value as string) || ''}
            onChange={(e) => handleResponseChange(field.id, e.target.value)}
            className={`${baseInputClass} py-3 px-4`}
            disabled={readOnly}
          />
        );

      default: // text
        return (
          <input
            type="text"
            value={(value as string) || ''}
            onChange={(e) => handleResponseChange(field.id, e.target.value)}
            placeholder={`Informe ${field.label.toLowerCase()}...`}
            className={`${baseInputClass} py-3 px-4`}
            disabled={readOnly}
          />
        );
    }
  };

  return (
    <div className="bg-slate-900 rounded-3xl p-6 border border-slate-800">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h3 className="text-lg font-black text-white uppercase tracking-wider flex items-center gap-2">
            <FileText className="w-5 h-5 text-cyan-400" />
            Anamnese
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            Formulário de avaliação clínica do paciente
          </p>
        </div>

        {/* Progress */}
        <div className="flex items-center gap-4">
          <div className="text-right">
            <span className="text-2xl font-black text-cyan-400">
              {getCompletionPercentage()}%
            </span>
            <p className="text-[10px] text-slate-500 uppercase tracking-wider">Completo</p>
          </div>
          <div className="w-16 h-16 relative">
            <svg className="w-16 h-16 transform -rotate-90">
              <circle
                cx="32"
                cy="32"
                r="28"
                fill="none"
                stroke="#1e293b"
                strokeWidth="6"
              />
              <circle
                cx="32"
                cy="32"
                r="28"
                fill="none"
                stroke="#22d3ee"
                strokeWidth="6"
                strokeDasharray={`${(getCompletionPercentage() / 100) * 176} 176`}
                strokeLinecap="round"
              />
            </svg>
          </div>
        </div>
      </div>

      {/* Template Selector */}
      {!readOnly && (
        <div className="flex gap-3 mb-6 overflow-x-auto pb-2">
          {templates.map((template) => (
            <button
              key={template.id}
              onClick={() => setSelectedTemplateId(template.id)}
              className={`flex-shrink-0 px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${
                selectedTemplateId === template.id
                  ? 'bg-cyan-500/20 border border-cyan-500 text-cyan-400'
                  : 'bg-slate-800 border border-slate-700 text-slate-400 hover:bg-slate-700'
              }`}
            >
              {template.name}
            </button>
          ))}
        </div>
      )}

      {/* Categories Accordion */}
      <div className="space-y-4">
        {categories.map((category, catIndex) => {
          const fields = fieldsByCategory[category];
          const isExpanded = expandedCategories.has(category);
          const categoryHasErrors = fields.some(f => validationErrors.has(f.id));
          const categoryProgress = fields.filter(f => responses[f.id] !== undefined && responses[f.id] !== '').length;

          return (
            <div 
              key={category} 
              className={`bg-slate-800/50 rounded-2xl border overflow-hidden transition-all ${
                categoryHasErrors ? 'border-red-500/50' : 'border-slate-700'
              }`}
            >
              {/* Category Header */}
              <button
                onClick={() => toggleCategory(category)}
                className="w-full flex items-center justify-between p-4 hover:bg-slate-800/80 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <span className="w-8 h-8 rounded-lg bg-slate-700 flex items-center justify-center text-xs font-black text-slate-300">
                    {catIndex + 1}
                  </span>
                  <div className="text-left">
                    <h4 className="text-sm font-bold text-white">{category}</h4>
                    <p className="text-[10px] text-slate-500">
                      {categoryProgress}/{fields.length} campos preenchidos
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  {categoryHasErrors && (
                    <AlertCircle className="w-5 h-5 text-red-400" />
                  )}
                  {categoryProgress === fields.length && (
                    <Check className="w-5 h-5 text-emerald-400" />
                  )}
                  {isExpanded ? (
                    <ChevronUp className="w-5 h-5 text-slate-400" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-slate-400" />
                  )}
                </div>
              </button>

              {/* Fields */}
              {isExpanded && (
                <div className="p-4 pt-0 space-y-4 animate-in slide-in-from-top-2 duration-200">
                  {fields.map((field) => (
                    <div key={field.id} className="space-y-2">
                      <label className="flex items-center gap-2">
                        <span className="text-sm font-medium text-slate-300">
                          {field.label}
                        </span>
                        {field.required && (
                          <span className="text-[9px] font-bold text-red-400 uppercase">
                            Obrigatório
                          </span>
                        )}
                      </label>
                      {renderField(field)}
                      {validationErrors.has(field.id) && (
                        <p className="text-[10px] text-red-400 flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" />
                          Este campo é obrigatório
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Actions */}
      {!readOnly && (
        <div className="flex gap-3 mt-6">
          <button
            onClick={resetForm}
            className="flex items-center gap-2 px-4 py-3 bg-slate-800 text-slate-300 rounded-xl font-bold text-xs uppercase tracking-wider hover:bg-slate-700 transition-all"
          >
            <RotateCcw className="w-4 h-4" />
            Limpar
          </button>
          
          <button
            onClick={handleSave}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-cyan-600 text-white rounded-xl font-bold text-xs uppercase tracking-wider hover:bg-cyan-700 transition-all"
          >
            <Save className="w-4 h-4" />
            Salvar Anamnese
          </button>
        </div>
      )}

      {/* Validation Summary */}
      {validationErrors.size > 0 && (
        <div className="mt-4 p-4 bg-red-500/10 border border-red-500/30 rounded-xl">
          <p className="text-sm text-red-400 font-medium flex items-center gap-2">
            <AlertCircle className="w-4 h-4" />
            {validationErrors.size} campo{validationErrors.size > 1 ? 's' : ''} obrigatório{validationErrors.size > 1 ? 's' : ''} não preenchido{validationErrors.size > 1 ? 's' : ''}
          </p>
        </div>
      )}
    </div>
  );
};

export default AnamnesisForm;











