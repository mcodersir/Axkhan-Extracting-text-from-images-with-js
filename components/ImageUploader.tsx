import React, { useCallback, useState, useEffect } from 'react';
import { Upload } from 'lucide-react';
import { translations } from '../utils/translations';

type Translation = typeof translations.fa;

interface ImageUploaderProps {
  onImageSelected: (base64: string, mimeType: string) => void;
  isLoading: boolean;
  loadingMessage?: string;
  t: Translation;
}

export const ImageUploader: React.FC<ImageUploaderProps> = ({ onImageSelected, isLoading, loadingMessage, t }) => {
  const [dragActive, setDragActive] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);

  // Simulated progress bar effect
  useEffect(() => {
    if (isLoading) {
      setProgress(0);
      const interval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 90) return prev;
          return prev + Math.random() * 10;
        });
      }, 500);
      return () => clearInterval(interval);
    } else {
      setProgress(100);
    }
  }, [isLoading]);

  const handleFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      // Handled by parent toast now, but redundant check is okay
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      setPreview(result);
      onImageSelected(result, file.type);
    };
    reader.readAsDataURL(file);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  }, []);

  return (
    <div className="w-full mb-8">
      <div
        className={`relative group flex flex-col items-center justify-center w-full h-56 md:h-72 border-2 border-dashed rounded-3xl transition-all duration-300 ease-in-out cursor-pointer overflow-hidden shadow-sm hover:shadow-md
        ${dragActive 
            ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20 scale-[1.01]' 
            : 'border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 hover:border-primary-400 dark:hover:border-primary-500 hover:bg-slate-50 dark:hover:bg-slate-750'}
        ${isLoading ? 'pointer-events-none' : ''}`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <input
          type="file"
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
          onChange={handleChange}
          accept="image/*"
          disabled={isLoading}
        />

        {preview && !isLoading ? (
          <img 
            src={preview} 
            alt="Preview" 
            className="w-full h-full object-contain p-4" 
          />
        ) : (
          !isLoading && (
            <div className="flex flex-col items-center justify-center p-6 text-slate-500 dark:text-slate-400 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors text-center">
              <div className="bg-slate-100 dark:bg-slate-700 p-4 rounded-full mb-4 group-hover:bg-primary-100 dark:group-hover:bg-primary-900/40 transition-colors">
                <Upload className="w-8 h-8 md:w-10 md:h-10" />
              </div>
              <p className="mb-2 text-base md:text-xl font-medium">
                <span className="font-bold">{t.click}</span> {t.orDrop}
              </p>
              <p className="text-xs md:text-sm opacity-70">{t.paste}</p>
            </div>
          )
        )}
        
        {isLoading && (
          <div className="absolute inset-0 bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm flex flex-col items-center justify-center z-20 px-8">
            <div className="relative w-20 h-20 mb-6">
               <div className="absolute inset-0 border-4 border-slate-200 dark:border-slate-700 rounded-full"></div>
               <div className="absolute inset-0 border-4 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
            
            <h4 className="text-lg font-bold text-slate-800 dark:text-white mb-2 animate-pulse">
                {loadingMessage || t.processing}
            </h4>
            
            {/* Progress Bar */}
            <div className="w-full max-w-[200px] h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                <div 
                    className="h-full bg-gradient-to-r from-primary-500 to-primary-400 transition-all duration-300 ease-out"
                    style={{ width: `${progress}%` }}
                ></div>
            </div>
            <p className="mt-2 text-xs text-slate-500 font-mono">{Math.round(progress)}%</p>
          </div>
        )}
      </div>
    </div>
  );
};
