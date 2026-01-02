import React, { useState, useRef } from 'react';
import { MedicalAttachment } from '../../types';
import { 
  Upload, X, Image as ImageIcon, FileText, Download, 
  Trash2, Eye, ZoomIn, ChevronLeft, ChevronRight,
  Camera, File, Search, Filter
} from 'lucide-react';

interface AttachmentsManagerProps {
  attachments: MedicalAttachment[];
  onUpload: (file: File, type: MedicalAttachment['type'], description: string) => void;
  onDelete: (id: string) => void;
  readOnly?: boolean;
}

const ATTACHMENT_TYPES: Record<MedicalAttachment['type'], { label: string; icon: React.ReactNode; color: string }> = {
  xray: { label: 'Raio-X', icon: <FileText className="w-4 h-4" />, color: 'bg-blue-500' },
  photo: { label: 'Foto', icon: <Camera className="w-4 h-4" />, color: 'bg-emerald-500' },
  exam: { label: 'Exame', icon: <FileText className="w-4 h-4" />, color: 'bg-purple-500' },
  document: { label: 'Documento', icon: <File className="w-4 h-4" />, color: 'bg-amber-500' },
  other: { label: 'Outro', icon: <File className="w-4 h-4" />, color: 'bg-slate-500' },
};

const AttachmentsManager: React.FC<AttachmentsManagerProps> = ({
  attachments,
  onUpload,
  onDelete,
  readOnly = false
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileType, setFileType] = useState<MedicalAttachment['type']>('photo');
  const [description, setDescription] = useState('');
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [viewerOpen, setViewerOpen] = useState(false);
  const [viewerIndex, setViewerIndex] = useState(0);
  const [filterType, setFilterType] = useState<MedicalAttachment['type'] | 'all'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const filteredAttachments = attachments.filter(att => {
    const matchesType = filterType === 'all' || att.type === filterType;
    const matchesSearch = att.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         att.description?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesType && matchesSearch;
  });

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      
      // Generate preview for images
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (e) => setPreviewUrl(e.target?.result as string);
        reader.readAsDataURL(file);
      } else {
        setPreviewUrl(null);
      }
      
      setIsModalOpen(true);
    }
  };

  const handleUpload = () => {
    if (selectedFile) {
      onUpload(selectedFile, fileType, description);
      resetForm();
    }
  };

  const resetForm = () => {
    setSelectedFile(null);
    setFileType('photo');
    setDescription('');
    setPreviewUrl(null);
    setIsModalOpen(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const openViewer = (index: number) => {
    setViewerIndex(index);
    setViewerOpen(true);
  };

  const imageAttachments = filteredAttachments.filter(att => 
    att.mimeType.startsWith('image/')
  );

  return (
    <div className="bg-slate-900 rounded-3xl p-6 border border-slate-800">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h3 className="text-lg font-black text-white uppercase tracking-wider flex items-center gap-2">
            <ImageIcon className="w-5 h-5 text-purple-400" />
            Exames & Imagens
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            {attachments.length} arquivo{attachments.length !== 1 ? 's' : ''} anexado{attachments.length !== 1 ? 's' : ''}
          </p>
        </div>

        {!readOnly && (
          <label className="flex items-center gap-2 px-6 py-3 bg-purple-600 text-white rounded-xl font-bold text-xs uppercase tracking-wider hover:bg-purple-700 transition-all cursor-pointer">
            <Upload className="w-4 h-4" />
            Anexar Arquivo
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,.pdf,.doc,.docx"
              onChange={handleFileSelect}
              className="hidden"
            />
          </label>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            type="text"
            placeholder="Buscar arquivos..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => setFilterType('all')}
            className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${
              filterType === 'all' ? 'bg-purple-600 text-white' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
            }`}
          >
            Todos
          </button>
          {Object.entries(ATTACHMENT_TYPES).map(([key, value]) => (
            <button
              key={key}
              onClick={() => setFilterType(key as MedicalAttachment['type'])}
              className={`px-3 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${
                filterType === key ? `${value.color} text-white` : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
              }`}
            >
              {value.label}
            </button>
          ))}
        </div>
      </div>

      {/* Gallery Grid */}
      {filteredAttachments.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {filteredAttachments.map((attachment, index) => (
            <div
              key={attachment.id}
              className="group relative bg-slate-800 rounded-2xl overflow-hidden border border-slate-700 hover:border-purple-500 transition-all"
            >
              {/* Thumbnail */}
              <div className="aspect-square relative">
                {attachment.mimeType.startsWith('image/') ? (
                  <img
                    src={attachment.url}
                    alt={attachment.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-slate-800">
                    <FileText className="w-12 h-12 text-slate-600" />
                  </div>
                )}

                {/* Type Badge */}
                <div className={`absolute top-2 left-2 px-2 py-1 ${ATTACHMENT_TYPES[attachment.type].color} rounded-lg`}>
                  <span className="text-[9px] font-bold uppercase text-white">
                    {ATTACHMENT_TYPES[attachment.type].label}
                  </span>
                </div>

                {/* Overlay */}
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                  {attachment.mimeType.startsWith('image/') && (
                    <button
                      onClick={() => openViewer(imageAttachments.findIndex(a => a.id === attachment.id))}
                      className="p-2 bg-white/20 rounded-lg hover:bg-white/30 transition-colors"
                    >
                      <ZoomIn className="w-5 h-5 text-white" />
                    </button>
                  )}
                  <a
                    href={attachment.url}
                    download={attachment.name}
                    className="p-2 bg-white/20 rounded-lg hover:bg-white/30 transition-colors"
                  >
                    <Download className="w-5 h-5 text-white" />
                  </a>
                  {!readOnly && (
                    <button
                      onClick={() => onDelete(attachment.id)}
                      className="p-2 bg-red-500/80 rounded-lg hover:bg-red-500 transition-colors"
                    >
                      <Trash2 className="w-5 h-5 text-white" />
                    </button>
                  )}
                </div>
              </div>

              {/* Info */}
              <div className="p-3">
                <p className="text-xs font-bold text-white truncate" title={attachment.name}>
                  {attachment.name}
                </p>
                <div className="flex justify-between items-center mt-1">
                  <span className="text-[10px] text-slate-500">
                    {formatFileSize(attachment.size)}
                  </span>
                  <span className="text-[10px] text-slate-500">
                    {new Date(attachment.createdAt).toLocaleDateString('pt-BR')}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="w-20 h-20 bg-slate-800 rounded-full flex items-center justify-center mb-4">
            <ImageIcon className="w-10 h-10 text-slate-600" />
          </div>
          <h4 className="text-slate-400 font-bold text-sm mb-2">
            {searchTerm || filterType !== 'all' ? 'Nenhum arquivo encontrado' : 'Nenhum arquivo anexado'}
          </h4>
          <p className="text-slate-600 text-xs max-w-xs">
            {searchTerm || filterType !== 'all' 
              ? 'Tente ajustar seus filtros de busca'
              : 'Anexe radiografias, fotos clínicas, exames e outros documentos do paciente'
            }
          </p>
        </div>
      )}

      {/* Upload Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center bg-black/80 backdrop-blur-lg p-4">
          <div className="bg-slate-900 w-full max-w-lg rounded-3xl border border-slate-800 overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="p-6 border-b border-slate-800 flex justify-between items-center">
              <h4 className="text-lg font-black text-white uppercase tracking-wider">
                Novo Anexo
              </h4>
              <button
                onClick={resetForm}
                className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Preview */}
              {previewUrl ? (
                <div className="relative aspect-video bg-slate-800 rounded-2xl overflow-hidden">
                  <img
                    src={previewUrl}
                    alt="Preview"
                    className="w-full h-full object-contain"
                  />
                </div>
              ) : (
                <div className="flex items-center gap-4 p-4 bg-slate-800 rounded-2xl">
                  <div className="w-12 h-12 bg-slate-700 rounded-xl flex items-center justify-center">
                    <FileText className="w-6 h-6 text-slate-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-white truncate">
                      {selectedFile?.name}
                    </p>
                    <p className="text-xs text-slate-500">
                      {selectedFile && formatFileSize(selectedFile.size)}
                    </p>
                  </div>
                </div>
              )}

              {/* Type Selection */}
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                  Tipo do Arquivo
                </label>
                <div className="grid grid-cols-5 gap-2">
                  {Object.entries(ATTACHMENT_TYPES).map(([key, value]) => (
                    <button
                      key={key}
                      onClick={() => setFileType(key as MedicalAttachment['type'])}
                      className={`p-3 rounded-xl flex flex-col items-center gap-1 transition-all ${
                        fileType === key
                          ? `${value.color} text-white`
                          : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                      }`}
                    >
                      {value.icon}
                      <span className="text-[9px] font-bold uppercase">{value.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Description */}
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                  Descrição (opcional)
                </label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Ex: Radiografia panorâmica inicial"
                  className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              {/* Actions */}
              <div className="flex gap-3">
                <button
                  onClick={resetForm}
                  className="flex-1 px-4 py-3 bg-slate-800 text-slate-300 rounded-xl font-bold text-xs uppercase tracking-wider hover:bg-slate-700 transition-all"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleUpload}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-purple-600 text-white rounded-xl font-bold text-xs uppercase tracking-wider hover:bg-purple-700 transition-all"
                >
                  <Upload className="w-4 h-4" />
                  Enviar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Image Viewer */}
      {viewerOpen && imageAttachments.length > 0 && (
        <div className="fixed inset-0 z-[400] bg-black flex items-center justify-center">
          <button
            onClick={() => setViewerOpen(false)}
            className="absolute top-4 right-4 p-3 bg-white/10 rounded-full hover:bg-white/20 transition-colors z-10"
          >
            <X className="w-6 h-6 text-white" />
          </button>

          {imageAttachments.length > 1 && (
            <>
              <button
                onClick={() => setViewerIndex((viewerIndex - 1 + imageAttachments.length) % imageAttachments.length)}
                className="absolute left-4 p-3 bg-white/10 rounded-full hover:bg-white/20 transition-colors"
              >
                <ChevronLeft className="w-6 h-6 text-white" />
              </button>
              <button
                onClick={() => setViewerIndex((viewerIndex + 1) % imageAttachments.length)}
                className="absolute right-4 p-3 bg-white/10 rounded-full hover:bg-white/20 transition-colors"
              >
                <ChevronRight className="w-6 h-6 text-white" />
              </button>
            </>
          )}

          <img
            src={imageAttachments[viewerIndex]?.url}
            alt={imageAttachments[viewerIndex]?.name}
            className="max-w-[90vw] max-h-[90vh] object-contain"
          />

          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/60 backdrop-blur-sm rounded-xl px-4 py-2">
            <p className="text-sm font-bold text-white">
              {imageAttachments[viewerIndex]?.name}
            </p>
            <p className="text-xs text-slate-400 text-center">
              {viewerIndex + 1} / {imageAttachments.length}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default AttachmentsManager;










