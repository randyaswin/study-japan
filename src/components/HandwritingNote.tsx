"use client";

import React, { useRef, useState, useEffect } from 'react';

interface HandwritingNoteProps {
  noteData?: string; // serialized image data (base64)
  onChange?: (data: string) => void;
  label?: string;
  section?: string; // e.g. 'kanji', 'vocab', 'grammar'
  pageId?: string | number; // e.g. day number
}

const PEN_COLORS = [
  '#111', '#e11d48', '#2563eb', '#059669', '#f59e42', '#fbbf24', '#a21caf', '#64748b', '#fff'
];
const PEN_SIZES = [2, 4, 6, 10];

const CANVAS_HEIGHT = 220;
const CANVAS_WIDTH = 600;
const LINE_SPACING = 32;

const HandwritingNote: React.FC<HandwritingNoteProps> = ({ noteData, onChange, label, section = '', pageId = '' }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [drawing, setDrawing] = useState(false);
  const [penColor, setPenColor] = useState(PEN_COLORS[0]);
  const [penSize, setPenSize] = useState(PEN_SIZES[1]);
  const [history, setHistory] = useState<string[]>([]);
  const [redoStack, setRedoStack] = useState<string[]>([]);
  const [localNote, setLocalNote] = useState<string | undefined>(undefined);

  // Key for localStorage
  const storageKey = `handwriting_note_${pageId}_${section}`;

  // Load from localStorage on mount
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const saved = window.localStorage.getItem(storageKey);
    if (saved) setLocalNote(saved);
    else if (noteData) setLocalNote(noteData);
    else setLocalNote(undefined);
  }, [storageKey, noteData]);

  // Draw guide lines and image
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    // Draw lines
    ctx.save();
    ctx.strokeStyle = '#e5e7eb';
    ctx.lineWidth = 1;
    for (let y = LINE_SPACING; y < CANVAS_HEIGHT; y += LINE_SPACING) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(CANVAS_WIDTH, y);
      ctx.stroke();
    }
    ctx.restore();
    // Draw previous image if any
    if (localNote) {
      const img = new window.Image();
      img.onload = () => ctx.drawImage(img, 0, 0);
      img.src = localNote;
    }
  }, [localNote]);

  // Save to history for undo
  const saveToHistory = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    setHistory(h => [...h, canvas.toDataURL()]);
    setRedoStack([]);
  };

  // Helper: get pointer position relative to canvas, scaled
  const getPointerPos = (e: React.PointerEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;
    return { x, y };
  };

  // Mouse/touch events
  const handlePointerDown = (e: React.PointerEvent) => {
    setDrawing(true);
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = penColor;
    ctx.lineWidth = penSize;
    ctx.beginPath();
    const { x, y } = getPointerPos(e);
    ctx.moveTo(x, y);
    saveToHistory();
  };
  const handlePointerMove = (e: React.PointerEvent) => {
    if (!drawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const { x, y } = getPointerPos(e);
    ctx.lineTo(x, y);
    ctx.stroke();
  };
  const handlePointerUp = () => {
    setDrawing(false);
    const canvas = canvasRef.current;
    if (!canvas) return;
    const data = canvas.toDataURL();
    setLocalNote(data);
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(storageKey, data);
    }
    if (onChange) onChange(data);
  };

  // Undo
  const handleUndo = () => {
    if (history.length === 0) return;
    const prev = history[history.length - 1];
    setRedoStack(r => [canvasRef.current!.toDataURL(), ...r]);
    setHistory(h => h.slice(0, -1));
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const img = new window.Image();
    img.onload = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      // Redraw guide lines
      ctx.save();
      ctx.strokeStyle = '#e5e7eb';
      ctx.lineWidth = 1;
      for (let y = LINE_SPACING; y < CANVAS_HEIGHT; y += LINE_SPACING) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(CANVAS_WIDTH, y);
        ctx.stroke();
      }
      ctx.restore();
      ctx.drawImage(img, 0, 0);
    };
    img.src = prev;
    setLocalNote(prev);
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(storageKey, prev);
    }
    if (onChange) onChange(prev);
  };
  // Redo
  const handleRedo = () => {
    if (redoStack.length === 0) return;
    const next = redoStack[0];
    setRedoStack(r => r.slice(1));
    setHistory(h => [...h, next]);
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const img = new window.Image();
    img.onload = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      // Redraw guide lines
      ctx.save();
      ctx.strokeStyle = '#e5e7eb';
      ctx.lineWidth = 1;
      for (let y = LINE_SPACING; y < CANVAS_HEIGHT; y += LINE_SPACING) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(CANVAS_WIDTH, y);
        ctx.stroke();
      }
      ctx.restore();
      ctx.drawImage(img, 0, 0);
    };
    img.src = next;
    setLocalNote(next);
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(storageKey, next);
    }
    if (onChange) onChange(next);
  };
  // Clear
  const handleClear = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    // Redraw guide lines
    ctx.save();
    ctx.strokeStyle = '#e5e7eb';
    ctx.lineWidth = 1;
    for (let y = LINE_SPACING; y < CANVAS_HEIGHT; y += LINE_SPACING) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(CANVAS_WIDTH, y);
      ctx.stroke();
    }
    ctx.restore();
    setHistory([]);
    setRedoStack([]);
    setLocalNote(undefined);
    if (typeof window !== 'undefined') {
      window.localStorage.removeItem(storageKey);
    }
    if (onChange) onChange('');
  };

  return (
    <div className="my-4">
      {label && <div className="mb-2 font-semibold text-gray-700 dark:text-gray-200">{label}</div>}
      <div className="flex items-center gap-2 mb-2 flex-wrap">
        <span className="text-xs">Warna:</span>
        {PEN_COLORS.map(c => (
          <button
            key={c}
            className={`w-6 h-6 rounded-full border-2 ${penColor === c ? 'border-black' : 'border-gray-300'}`}
            style={{ background: c }}
            onClick={() => setPenColor(c)}
            aria-label={`Pilih warna ${c}`}
          />
        ))}
        <span className="ml-4 text-xs">Ukuran:</span>
        {PEN_SIZES.map(s => (
          <button
            key={s}
            className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${penSize === s ? 'border-black' : 'border-gray-300'}`}
            onClick={() => setPenSize(s)}
            aria-label={`Pilih ukuran ${s}`}
          >
            <div style={{ width: s, height: s, background: penColor, borderRadius: '50%' }} />
          </button>
        ))}
        <button className="ml-4 px-2 py-1 rounded bg-gray-200 text-xs" onClick={handleUndo}>Undo</button>
        <button className="px-2 py-1 rounded bg-gray-200 text-xs" onClick={handleRedo}>Redo</button>
        <button className="px-2 py-1 rounded bg-red-200 text-xs" onClick={handleClear}>Hapus</button>
      </div>
      <div className="border rounded-lg overflow-hidden bg-white dark:bg-gray-900 shadow">
        <canvas
          ref={canvasRef}
          width={CANVAS_WIDTH}
          height={CANVAS_HEIGHT}
          style={{ touchAction: 'none', width: '100%', height: CANVAS_HEIGHT, background: '#fff', display: 'block' }}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerLeave={handlePointerUp}
        />
      </div>
      <div className="text-xs text-gray-400 mt-1">Tulis catatan bebas di sini. Mendukung touchscreen & mouse. Catatan akan otomatis tersimpan di perangkat ini.</div>
    </div>
  );
};

export default HandwritingNote;
