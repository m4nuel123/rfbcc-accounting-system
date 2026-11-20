import React, { useEffect, useRef, useState } from 'react';
import { Eraser, Save, X } from 'lucide-react';
import { Employee } from '../types/erp';

interface SignaturePadModalProps {
  employee: Employee;
  onClose: () => void;
  onSave: (employeeId: string, dataUrl: string) => void;
}

export const SignaturePadModal: React.FC<SignaturePadModalProps> = ({
  employee,
  onClose,
  onSave,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [drawing, setDrawing] = useState(false);
  const [hasStrokes, setHasStrokes] = useState(Boolean(employee.signatureDataUrl));

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    if (employee.signatureDataUrl) {
      const img = new Image();
      img.onload = () => {
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      };
      img.src = employee.signatureDataUrl;
    }
  }, [employee.signatureDataUrl]);

  const getCoords = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    return {
      x: ((e.clientX - rect.left) / rect.width) * canvas.width,
      y: ((e.clientY - rect.top) / rect.height) * canvas.height,
    };
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    canvas.setPointerCapture(e.pointerId);
    const { x, y } = getCoords(e);
    ctx.strokeStyle = '#0F172A';
    ctx.lineWidth = 2.6;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(x, y);
    setDrawing(true);
    setHasStrokes(true);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!drawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const { x, y } = getCoords(e);
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const handlePointerUp = () => {
    setDrawing(false);
  };

  const handleClear = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    setHasStrokes(false);
  };

  const handleSave = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dataUrl = hasStrokes ? canvas.toDataURL('image/png') : '';
    onSave(employee.id, dataUrl);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xl w-full max-w-lg overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">Capture E-Signature</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {employee.name} · {employee.position}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div className="text-xs text-slate-600 dark:text-slate-400">
            Draw signature below using mouse, stylus, or touch. Saved signatures automatically appear on approved Purchase Request printouts and Borrower Slips.
          </div>

          <div className="border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-xl overflow-hidden bg-white">
            <canvas
              ref={canvasRef}
              width={460}
              height={180}
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              onPointerLeave={handlePointerUp}
              className="w-full h-44 touch-none cursor-crosshair block"
            />
          </div>

          <div className="flex items-center justify-between pt-1">
            <button
              type="button"
              onClick={handleClear}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors cursor-pointer"
            >
              <Eraser className="w-3.5 h-3.5" />
              Clear Pad
            </button>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSave}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-[#2C6FE0] hover:bg-[#1E56B8] rounded-lg transition-colors cursor-pointer"
              >
                <Save className="w-3.5 h-3.5" />
                Save Signature
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
