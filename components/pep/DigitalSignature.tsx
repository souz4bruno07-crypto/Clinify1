import React, { useRef, useState, useEffect } from 'react';
import { Eraser, Check, Undo2, Download, PenTool } from 'lucide-react';

interface DigitalSignatureProps {
  onSignatureComplete: (signatureData: string) => void;
  existingSignature?: string;
  readOnly?: boolean;
  patientName?: string;
}

const DigitalSignature: React.FC<DigitalSignatureProps> = ({
  onSignatureComplete,
  existingSignature,
  readOnly = false,
  patientName = 'Paciente'
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasSignature, setHasSignature] = useState(false);
  const [strokeColor, setStrokeColor] = useState('#10b981');
  const [strokeWidth, setStrokeWidth] = useState(2);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Setup canvas
    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);
    canvas.style.width = `${rect.width}px`;
    canvas.style.height = `${rect.height}px`;

    // Background
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, rect.width, rect.height);

    // Draw existing signature if available
    if (existingSignature) {
      const img = new Image();
      img.onload = () => {
        ctx.drawImage(img, 0, 0, rect.width, rect.height);
      };
      img.src = existingSignature;
      setHasSignature(true);
    }

    // Signature line
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 1;
    ctx.setLineDash([5, 5]);
    ctx.beginPath();
    ctx.moveTo(40, rect.height - 40);
    ctx.lineTo(rect.width - 40, rect.height - 40);
    ctx.stroke();
    ctx.setLineDash([]);

    // Label
    ctx.fillStyle = '#64748b';
    ctx.font = '10px "Plus Jakarta Sans", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Assinatura do Paciente', rect.width / 2, rect.height - 20);
  }, [existingSignature]);

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
    if (readOnly) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!ctx) return;

    setIsDrawing(true);
    setHasSignature(true);
    
    const { x, y } = getCoordinates(e);
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.strokeStyle = strokeColor;
    ctx.lineWidth = strokeWidth;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing || readOnly) return;
    
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

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    const rect = canvas.getBoundingClientRect();
    
    // Clear
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, rect.width, rect.height);

    // Redraw signature line
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 1;
    ctx.setLineDash([5, 5]);
    ctx.beginPath();
    ctx.moveTo(40, rect.height - 40);
    ctx.lineTo(rect.width - 40, rect.height - 40);
    ctx.stroke();
    ctx.setLineDash([]);

    // Label
    ctx.fillStyle = '#64748b';
    ctx.font = '10px "Plus Jakarta Sans", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Assinatura do Paciente', rect.width / 2, rect.height - 20);

    setHasSignature(false);
  };

  const saveSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas || !hasSignature) return;
    
    const signatureData = canvas.toDataURL('image/png');
    onSignatureComplete(signatureData);
  };

  const downloadSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const link = document.createElement('a');
    link.download = `assinatura_${patientName.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  };

  return (
    <div className="bg-slate-900 rounded-3xl p-6 border border-slate-800">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h3 className="text-lg font-black text-white uppercase tracking-wider flex items-center gap-2">
            <PenTool className="w-5 h-5 text-emerald-400" />
            Assinatura Digital
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            {readOnly ? 'Assinatura registrada' : 'Desenhe sua assinatura no campo abaixo'}
          </p>
        </div>

        {!readOnly && (
          <div className="flex gap-2">
            {/* Cores */}
            <div className="flex gap-1 bg-slate-800 rounded-xl p-1">
              {['#10b981', '#3b82f6', '#ffffff', '#000000'].map((color) => (
                <button
                  key={color}
                  onClick={() => setStrokeColor(color)}
                  className={`w-6 h-6 rounded-lg transition-all ${
                    strokeColor === color ? 'ring-2 ring-white scale-110' : ''
                  }`}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>

            {/* Espessura */}
            <div className="flex gap-1 bg-slate-800 rounded-xl p-1">
              {[1, 2, 3, 4].map((width) => (
                <button
                  key={width}
                  onClick={() => setStrokeWidth(width)}
                  className={`w-6 h-6 rounded-lg flex items-center justify-center transition-all ${
                    strokeWidth === width ? 'bg-slate-600' : 'hover:bg-slate-700'
                  }`}
                >
                  <div 
                    className="bg-white rounded-full" 
                    style={{ width: width * 2, height: width * 2 }}
                  />
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Canvas */}
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
        
        {!hasSignature && !readOnly && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <p className="text-slate-600 text-sm font-medium">
              Toque ou clique para assinar
            </p>
          </div>
        )}
      </div>

      {/* Timestamp e nome */}
      <div className="mt-4 flex justify-between items-center text-[10px] text-slate-500">
        <span className="font-bold uppercase tracking-wider">{patientName}</span>
        <span>{new Date().toLocaleString('pt-BR')}</span>
      </div>

      {/* Actions */}
      {!readOnly && (
        <div className="flex gap-3 mt-6">
          <button
            onClick={clearCanvas}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-slate-800 text-slate-300 rounded-xl font-bold text-xs uppercase tracking-wider hover:bg-slate-700 transition-all"
          >
            <Eraser className="w-4 h-4" />
            Limpar
          </button>
          
          <button
            onClick={saveSignature}
            disabled={!hasSignature}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-emerald-600 text-white rounded-xl font-bold text-xs uppercase tracking-wider hover:bg-emerald-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Check className="w-4 h-4" />
            Confirmar
          </button>

          <button
            onClick={downloadSignature}
            disabled={!hasSignature}
            className="p-3 bg-slate-800 text-slate-300 rounded-xl hover:bg-slate-700 transition-all disabled:opacity-50"
          >
            <Download className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Legal disclaimer */}
      <p className="mt-4 text-[9px] text-slate-600 text-center leading-relaxed">
        Ao assinar digitalmente, você concorda com os termos do documento e confirma a veracidade das informações prestadas.
        Esta assinatura tem validade legal conforme MP 2.200-2/2001.
      </p>
    </div>
  );
};

export default DigitalSignature;










