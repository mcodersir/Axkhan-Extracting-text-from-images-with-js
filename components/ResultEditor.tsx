import React, { useState, useEffect, useRef } from 'react';
import { AlignRight, AlignLeft, Copy, FileDown, Check, Type, AlertTriangle, Eye, EyeOff, Image as ImageIcon, ZoomIn, ZoomOut, RotateCcw } from 'lucide-react';
import { TextDirection } from '../types';
import { exportToWord } from '../utils/exportUtils';
import { translations, Language } from '../utils/translations';

interface ResultEditorProps {
  initialText: string;
  imageSrc?: string | null;
  fontSize?: number;
  language: Language;
}

export const ResultEditor: React.FC<ResultEditorProps> = ({ initialText, imageSrc, fontSize = 18, language }) => {
  const [text, setText] = useState(initialText);
  const [direction, setDirection] = useState<TextDirection>(TextDirection.RTL);
  const [copied, setCopied] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [exportStatus, setExportStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [showImage, setShowImage] = useState(true);
  const t = translations[language];
  
  // Zoom & Pan State
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const imageContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setText(initialText);
    if (initialText && /^[A-Za-z]/.test(initialText.trim())) {
      setDirection(TextDirection.LTR);
    }
  }, [initialText]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy text', err);
    }
  };

  const handleExport = async () => {
    setIsExporting(true);
    setExportStatus('idle');
    try {
      await exportToWord(text, direction);
      setExportStatus('success');
      setTimeout(() => setExportStatus('idle'), 3000);
    } catch (error) {
      console.error("Export failed", error);
      setExportStatus('error');
      setTimeout(() => setExportStatus('idle'), 3000);
    } finally {
      setIsExporting(false);
    }
  };

  // Zoom Handlers
  const handleZoomIn = () => setScale(prev => Math.min(prev + 0.5, 4));
  const handleZoomOut = () => {
    setScale(prev => {
        const newScale = Math.max(prev - 0.5, 1);
        if (newScale === 1) setPosition({ x: 0, y: 0 }); // Reset position on full zoom out
        return newScale;
    });
  };
  const handleResetZoom = () => {
    setScale(1);
    setPosition({ x: 0, y: 0 });
  };

  // Pan Handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    if (scale > 1) {
      setIsDragging(true);
      setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging && scale > 1) {
      setPosition({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y
      });
    }
  };

  const handleMouseUp = () => setIsDragging(false);

  return (
    <div className="flex flex-col gap-4 animate-fade-in-up">
      {/* Control Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-4 bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400 rounded-xl">
            <Type size={20} />
          </div>
          <div>
            <h3 className="font-bold text-slate-800 dark:text-white text-base md:text-lg">{t.editor}</h3>
            <p className="hidden xs:block text-xs text-slate-500 dark:text-slate-400">{text.length} {t.chars}</p>
          </div>
        </div>

        <div className="flex items-center gap-2 mr-auto">
          {imageSrc && (
            <button
              onClick={() => setShowImage(!showImage)}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                showImage 
                ? 'bg-slate-100 dark:bg-slate-700 text-primary-600 dark:text-primary-400' 
                : 'bg-transparent text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700'
              }`}
              title={showImage ? "مخفی کردن تصویر" : "نمایش تصویر"}
            >
              {showImage ? <EyeOff size={18} /> : <Eye size={18} />}
              <span className="hidden md:inline">{t.image}</span>
            </button>
          )}
          
          <div className="w-px h-6 bg-slate-300 dark:bg-slate-600 mx-2 hidden md:block"></div>

          <button
            onClick={handleExport}
            disabled={isExporting}
            className={`flex items-center gap-2 px-4 py-2 text-white rounded-xl transition-all shadow-md active:scale-95 text-sm font-medium disabled:opacity-70 ${
              exportStatus === 'error' ? 'bg-red-500 hover:bg-red-600' : 
              exportStatus === 'success' ? 'bg-green-500 hover:bg-green-600' : 
              'bg-slate-800 hover:bg-slate-900 dark:bg-primary-600 dark:hover:bg-primary-700'
            }`}
          >
            {exportStatus === 'error' ? <AlertTriangle size={18} /> : 
             exportStatus === 'success' ? <Check size={18} /> : 
             <FileDown size={18} />}
            <span className="hidden sm:inline">
            {isExporting ? '...' : 
             exportStatus === 'success' ? t.downloaded :
             exportStatus === 'error' ? 'Error' :
             t.export}
            </span>
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className={`grid gap-4 transition-all duration-300 ${showImage && imageSrc ? 'grid-cols-1 lg:grid-cols-2 h-[600px] lg:h-[700px]' : 'h-[500px]'}`}>
        
        {/* Source Image Panel with Zoom */}
        {showImage && imageSrc && (
          <div className="relative group bg-slate-200 dark:bg-slate-900/50 rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-700 flex flex-col">
            {/* Header Badge */}
            <div className="absolute top-3 right-3 z-20 bg-black/60 backdrop-blur-md text-white px-3 py-1 rounded-full text-xs flex items-center gap-1.5 shadow-sm">
               <ImageIcon size={14} />
               <span>{t.originalImage}</span>
            </div>

            {/* Zoom Controls */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 flex items-center gap-1 p-1 bg-black/60 backdrop-blur-md rounded-lg shadow-lg">
                <button 
                  onClick={handleZoomOut} 
                  className="p-1.5 text-white hover:bg-white/20 rounded disabled:opacity-50"
                  disabled={scale <= 1}
                  title="Zoom Out"
                >
                    <ZoomOut size={18} />
                </button>
                <span className="text-white text-xs min-w-[30px] text-center font-mono">{Math.round(scale * 100)}%</span>
                <button 
                  onClick={handleZoomIn} 
                  className="p-1.5 text-white hover:bg-white/20 rounded disabled:opacity-50"
                  disabled={scale >= 4}
                  title="Zoom In"
                >
                    <ZoomIn size={18} />
                </button>
                <div className="w-px h-4 bg-white/30 mx-1"></div>
                <button 
                  onClick={handleResetZoom} 
                  className="p-1.5 text-white hover:bg-white/20 rounded"
                  title="Reset"
                >
                    <RotateCcw size={16} />
                </button>
            </div>

            {/* Image Container */}
            <div 
                ref={imageContainerRef}
                className={`flex-1 overflow-hidden p-4 flex items-center justify-center cursor-${scale > 1 ? (isDragging ? 'grabbing' : 'grab') : 'default'}`}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
            >
               <img 
                 src={imageSrc} 
                 alt="Original" 
                 style={{ 
                    transform: `scale(${scale}) translate(${position.x / scale}px, ${position.y / scale}px)`,
                    transition: isDragging ? 'none' : 'transform 0.2s ease-out'
                 }}
                 draggable={false}
                 className="max-w-full h-auto object-contain rounded-lg shadow-sm select-none"
               />
            </div>
          </div>
        )}

        {/* Text Editor Panel */}
        <div className="flex flex-col bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-100 dark:border-slate-700 overflow-hidden">
          {/* Editor Toolbar */}
          <div className="flex items-center justify-between px-4 py-2 bg-slate-50 dark:bg-slate-850 border-b border-slate-200 dark:border-slate-700">
             <div className="flex bg-slate-200 dark:bg-slate-700 rounded-lg p-1">
                <button
                  onClick={() => setDirection(TextDirection.RTL)}
                  className={`p-1.5 rounded-md transition-all ${
                    direction === TextDirection.RTL
                      ? 'bg-white dark:bg-slate-600 text-primary-600 dark:text-primary-300 shadow-sm'
                      : 'text-slate-500 dark:text-slate-400'
                  }`}
                  title="Right to Left"
                >
                  <AlignRight size={16} />
                </button>
                <button
                  onClick={() => setDirection(TextDirection.LTR)}
                  className={`p-1.5 rounded-md transition-all ${
                    direction === TextDirection.LTR
                      ? 'bg-white dark:bg-slate-600 text-primary-600 dark:text-primary-300 shadow-sm'
                      : 'text-slate-500 dark:text-slate-400'
                  }`}
                  title="Left to Right"
                >
                  <AlignLeft size={16} />
                </button>
             </div>
             
             <button
                onClick={handleCopy}
                className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
             >
                {copied ? <Check size={14} /> : <Copy size={14} />}
                {copied ? t.copied : t.copy}
             </button>
          </div>

          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            dir={direction}
            style={{ fontSize: `${fontSize}px` }}
            className="flex-1 w-full p-6 leading-loose resize-none outline-none bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:bg-slate-50 dark:focus:bg-slate-800/50 transition-colors"
            placeholder="..."
            spellCheck={false}
          />
          
          <div className="px-4 py-2 bg-slate-50 dark:bg-slate-850 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-400 flex justify-between">
             <span>{text.length} {t.chars}</span>
             <span>Gemini 2.5 AI</span>
          </div>
        </div>
      </div>
    </div>
  );
};