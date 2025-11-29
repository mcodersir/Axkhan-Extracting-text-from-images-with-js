import React, { useState, useEffect } from 'react';
import { ImageUploader } from './components/ImageUploader';
import { ResultEditor } from './components/ResultEditor';
import { extractTextFromImage } from './services/geminiService';
import { ScanText, Sparkles, Moon, Sun, Download, Settings, ChevronDown, ChevronUp, Key, X, Save, Globe, Type, ExternalLink, Github, Zap, BarChart, Info } from 'lucide-react';
import { translations, Language } from './utils/translations';
import { ToastContainer, ToastMessage, ToastType } from './components/Toast';

const App: React.FC = () => {
  const [extractedText, setExtractedText] = useState<string>("");
  const [resultImage, setResultImage] = useState<string | null>(null);
  
  // Enhanced Loading State
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [loadingMessage, setLoadingMessage] = useState<string>("");
  
  // Toast State
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const [isDarkMode, setIsDarkMode] = useState<boolean>(false);
  const [isDraggingFile, setIsDraggingFile] = useState<boolean>(false);
  
  // Settings State
  const [showSettings, setShowSettings] = useState(false);
  const [apiKey, setApiKey] = useState("");
  const [language, setLanguage] = useState<Language>('fa');
  const [fontSize, setFontSize] = useState<number>(18);
  const [isEcoMode, setIsEcoMode] = useState<boolean>(false);
  const [usageCount, setUsageCount] = useState<number>(0);
  
  // Custom Instructions
  const [showInstructions, setShowInstructions] = useState(false);
  const [customInstructions, setCustomInstructions] = useState("");

  const t = translations[language];

  // Constants
  const DAILY_LIMIT = 1500;
  const remainingRequests = Math.max(0, DAILY_LIMIT - usageCount);
  const usagePercentage = Math.min(100, (usageCount / DAILY_LIMIT) * 100);

  // Helper to add Toast
  const addToast = (message: string, type: ToastType = 'info', title?: string) => {
    const id = Date.now().toString();
    setToasts(prev => [...prev, { id, type, message, title }]);
  };

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  // Auto-Connect API Key from URL & LocalStorage Logic
  useEffect(() => {
    // 1. Check URL parameters
    const searchParams = new URLSearchParams(window.location.search);
    const keyFromUrl = searchParams.get('key');

    if (keyFromUrl) {
      setApiKey(keyFromUrl);
      localStorage.setItem('user_gemini_api_key', keyFromUrl);
      // Clean URL for security
      window.history.replaceState({}, '', window.location.pathname);
      addToast(t.statusConnected, 'success');
    } else {
      // 2. Check Local Storage
      const savedKey = localStorage.getItem('user_gemini_api_key');
      if (savedKey) setApiKey(savedKey);
    }

    // Load other settings
    const savedTheme = localStorage.getItem('app_theme');
    if (savedTheme === 'dark') {
      setIsDarkMode(true);
      document.documentElement.classList.add('dark');
    }

    const savedLang = localStorage.getItem('app_language');
    if (savedLang && translations[savedLang as Language]) {
      setLanguage(savedLang as Language);
    }

    const savedFontSize = localStorage.getItem('app_font_size');
    if (savedFontSize) {
      setFontSize(parseInt(savedFontSize));
    }

    const savedEco = localStorage.getItem('app_eco_mode');
    if (savedEco) setIsEcoMode(savedEco === 'true');

    // Load Usage Count
    const today = new Date().toDateString();
    const storedDate = localStorage.getItem('usage_date');
    if (storedDate !== today) {
        localStorage.setItem('usage_date', today);
        localStorage.setItem('usage_count', '0');
        setUsageCount(0);
    } else {
        const count = localStorage.getItem('usage_count');
        if (count) setUsageCount(parseInt(count));
    }

  }, []);

  const toggleTheme = () => {
    const newMode = !isDarkMode;
    setIsDarkMode(newMode);
    if (newMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('app_theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('app_theme', 'light');
    }
  };

  const incrementUsage = () => {
      const newCount = usageCount + 1;
      setUsageCount(newCount);
      localStorage.setItem('usage_count', newCount.toString());
  };

  const saveSettings = () => {
    localStorage.setItem('user_gemini_api_key', apiKey);
    localStorage.setItem('app_language', language);
    localStorage.setItem('app_font_size', fontSize.toString());
    localStorage.setItem('app_eco_mode', isEcoMode.toString());
    setShowSettings(false);
    addToast(t.toastSuccess, 'success');
  };

  const processFile = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      addToast(t.fileTypeWarning, 'error');
      return;
    }

    setIsLoading(true);
    setLoadingMessage(isEcoMode ? t.loadingOptimizing : t.loadingUploading);
    setExtractedText("");
    setResultImage(null);

    const reader = new FileReader();
    reader.onload = async (e) => {
      const base64 = e.target?.result as string;
      setResultImage(base64);
      const mimeType = file.type;
      
      try {
        // Simulate "Uploading" delay slightly for UX
        await new Promise(r => setTimeout(r, 800));
        
        setLoadingMessage(t.loadingAnalyzing);
        const text = await extractTextFromImage(base64, mimeType, apiKey, customInstructions, isEcoMode);
        
        setLoadingMessage(t.loadingFormatting);
        await new Promise(r => setTimeout(r, 500));

        setExtractedText(text);
        incrementUsage();
        addToast(t.toastSuccess, 'success');

        // Scroll to result on mobile
        setTimeout(() => {
            document.getElementById('result-section')?.scrollIntoView({ behavior: 'smooth' });
        }, 100);
      } catch (err: any) {
        addToast(err.message || "Error processing image.", 'error');
      } finally {
        setIsLoading(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleImageSelected = async (base64: string, mimeType: string) => {
    setIsLoading(true);
    setLoadingMessage(isEcoMode ? t.loadingOptimizing : t.loadingUploading);
    setExtractedText("");
    setResultImage(base64);

    try {
      await new Promise(r => setTimeout(r, 800));
      setLoadingMessage(t.loadingAnalyzing);
      
      const text = await extractTextFromImage(base64, mimeType, apiKey, customInstructions, isEcoMode);
      
      setLoadingMessage(t.loadingFormatting);
      await new Promise(r => setTimeout(r, 500));

      setExtractedText(text);
      incrementUsage();
      addToast(t.toastSuccess, 'success');
    } catch (err: any) {
        addToast(err.message || "Error processing image.", 'error');
    } finally {
      setIsLoading(false);
    }
  };

  // Global Paste Listener
  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') return;

      if (e.clipboardData?.items) {
        const items = e.clipboardData.items;
        for (let i = 0; i < items.length; i++) {
          if (items[i].type.indexOf("image") !== -1) {
            const file = items[i].getAsFile();
            if (file) processFile(file);
            break;
          }
        }
      }
    };
    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, [apiKey, customInstructions, isEcoMode]); // Added deps

  // Global Drag & Drop Listener
  useEffect(() => {
    let dragCounter = 0;
    const handleDragEnter = (e: DragEvent) => { e.preventDefault(); e.stopPropagation(); dragCounter++; setIsDraggingFile(true); };
    const handleDragLeave = (e: DragEvent) => { e.preventDefault(); e.stopPropagation(); dragCounter--; if (dragCounter === 0) setIsDraggingFile(false); };
    const handleDragOver = (e: DragEvent) => { e.preventDefault(); e.stopPropagation(); };
    const handleDrop = (e: DragEvent) => { 
      e.preventDefault(); e.stopPropagation(); setIsDraggingFile(false); dragCounter = 0; 
      if (e.dataTransfer?.files?.[0]) processFile(e.dataTransfer.files[0]); 
    };

    window.addEventListener('dragenter', handleDragEnter);
    window.addEventListener('dragleave', handleDragLeave);
    window.addEventListener('dragover', handleDragOver);
    window.addEventListener('drop', handleDrop);

    return () => {
      window.removeEventListener('dragenter', handleDragEnter);
      window.removeEventListener('dragleave', handleDragLeave);
      window.removeEventListener('dragover', handleDragOver);
      window.removeEventListener('drop', handleDrop);
    };
  }, [apiKey, customInstructions, isEcoMode]); // Added deps

  return (
    <div className={`min-h-screen bg-slate-50 dark:bg-slate-900 dark:text-slate-100 transition-colors duration-300 flex flex-col relative ${language === 'fa' || language === 'ar' ? 'font-sans' : ''}`} dir={language === 'fa' || language === 'ar' ? 'rtl' : 'ltr'}>
      
      {/* Toast Container */}
      <ToastContainer toasts={toasts} removeToast={removeToast} />

      {/* Settings Modal */}
      {showSettings && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in-up">
          <div className="bg-white dark:bg-slate-800 rounded-2xl w-full max-w-md shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-850 sticky top-0 z-10">
              <h3 className="font-bold flex items-center gap-2 text-slate-800 dark:text-white">
                <Settings size={20} />
                {t.settings}
              </h3>
              <button onClick={() => setShowSettings(false)} className="text-slate-500 hover:text-slate-700 dark:hover:text-slate-300">
                <X size={20} />
              </button>
            </div>
            
            <div className="p-6 space-y-6">
              {/* API Key */}
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  {t.apiKey}
                </label>
                <div className="relative">
                   <div className={`absolute inset-y-0 ${language === 'fa' || language === 'ar' ? 'left-0 pl-3' : 'right-0 pr-3'} flex items-center pointer-events-none ${apiKey ? 'text-green-500' : 'text-slate-400'}`}>
                      <Key size={16} />
                   </div>
                   <input 
                     type="password" 
                     value={apiKey}
                     onChange={(e) => setApiKey(e.target.value)}
                     placeholder={t.apiKeyPlaceholder}
                     className={`w-full py-2 rounded-xl border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 focus:ring-2 focus:ring-primary-500 outline-none transition-all ${language === 'fa' || language === 'ar' ? 'pl-10 pr-4' : 'pr-10 pl-4'}`}
                   />
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
                  {t.apiKeyHelp}
                </p>
              </div>

               {/* Usage Statistics with Progress Bar */}
              <div className="bg-slate-50 dark:bg-slate-900/50 p-5 rounded-2xl border border-slate-200 dark:border-slate-700">
                <div className="flex items-center justify-between mb-4">
                  <div>
                     <span className="block text-sm font-bold text-slate-800 dark:text-slate-200">{t.usageToday}</span>
                     <span className="text-xs text-slate-500">{t.plan}: {apiKey ? 'Pro' : 'Free'}</span>
                  </div>
                  <div className="flex items-center gap-2 px-2 py-1 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
                     <BarChart size={16} className="text-primary-500" />
                     <span className="text-base font-bold font-mono text-slate-700 dark:text-slate-300">{usageCount}</span>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="relative w-full h-3 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden mb-2">
                    <div 
                        className={`absolute top-0 h-full rounded-full transition-all duration-500 ${usagePercentage > 90 ? 'bg-red-500' : 'bg-primary-500'} ${language === 'fa' || language === 'ar' ? 'right-0' : 'left-0'}`}
                        style={{ width: `${usagePercentage}%` }}
                    ></div>
                </div>

                <div className="flex justify-between text-xs text-slate-500 dark:text-slate-400 mt-2 font-medium">
                    <span>{t.remaining}: <span className="text-slate-800 dark:text-white font-mono">{remainingRequests}</span></span>
                    <span>{t.dailyLimit}: <span className="font-mono">{DAILY_LIMIT}</span></span>
                </div>
                
                <div className="mt-3 flex items-start gap-1.5 text-[10px] text-slate-400 leading-tight bg-blue-50 dark:bg-blue-900/10 p-2 rounded-lg">
                    <Info size={12} className="shrink-0 mt-0.5" />
                    {t.freeTierNote}
                </div>
              </div>

              {/* Eco Mode - Responsive Fix */}
              <div className="flex flex-wrap sm:flex-nowrap items-center justify-between p-3 gap-4 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 cursor-pointer hover:border-primary-300 transition-colors" onClick={() => setIsEcoMode(!isEcoMode)}>
                 <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className={`p-2 rounded-lg shrink-0 ${isEcoMode ? 'bg-green-100 text-green-600 dark:bg-green-900/20 dark:text-green-400' : 'bg-slate-200 text-slate-500 dark:bg-slate-700'}`}>
                        <Zap size={20} />
                    </div>
                    <div className="min-w-0">
                        <h4 className="font-bold text-sm text-slate-800 dark:text-white truncate">{t.ecoMode}</h4>
                        <p className="text-xs text-slate-500 truncate">{t.ecoModeDesc}</p>
                    </div>
                 </div>
                 <div className={`w-12 h-6 rounded-full p-1 shrink-0 transition-colors ${isEcoMode ? 'bg-green-500' : 'bg-slate-300 dark:bg-slate-600'}`}>
                    <div className={`w-4 h-4 rounded-full bg-white shadow-sm transition-transform ${isEcoMode ? 'translate-x-6' : 'translate-x-0'}`} dir="ltr"></div>
                 </div>
              </div>

              {/* Language Selector */}
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2 flex items-center gap-2">
                   <Globe size={16} /> {t.language}
                </label>
                <select 
                  value={language}
                  onChange={(e) => setLanguage(e.target.value as Language)}
                  className="w-full p-2 rounded-xl border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 outline-none"
                >
                  <option value="fa">فارسی (Persian)</option>
                  <option value="en">English</option>
                  <option value="ar">العربية (Arabic)</option>
                  <option value="tr">Türkçe (Turkish)</option>
                  <option value="de">Deutsch (German)</option>
                  <option value="fr">Français (French)</option>
                  <option value="es">Español (Spanish)</option>
                  <option value="ru">Русский (Russian)</option>
                  <option value="zh">中文 (Chinese)</option>
                </select>
              </div>

              {/* Font Size Selector */}
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2 flex items-center gap-2">
                   <Type size={16} /> {t.fontSize}
                </label>
                <div className="flex items-center gap-4">
                  <input 
                    type="range" 
                    min="12" 
                    max="32" 
                    step="2" 
                    value={fontSize} 
                    onChange={(e) => setFontSize(parseInt(e.target.value))}
                    className="w-full accent-primary-600 cursor-pointer"
                  />
                  <span className="text-sm font-mono bg-slate-100 dark:bg-slate-700 px-2 py-1 rounded">
                    {fontSize}px
                  </span>
                </div>
                <div className="mt-2 p-2 bg-slate-100 dark:bg-slate-700 rounded text-center border border-slate-200 dark:border-slate-600">
                    <span style={{ fontSize: `${fontSize}px` }}>{t.sampleText}</span>
                </div>
              </div>
            </div>

            <div className="p-4 bg-slate-50 dark:bg-slate-850 flex justify-end">
              <button 
                onClick={saveSettings}
                className="flex items-center gap-2 px-6 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-xl font-medium transition-colors"
              >
                <Save size={18} />
                {t.save}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Full Screen Drag Overlay */}
      {isDraggingFile && (
        <div className="fixed inset-0 z-40 bg-primary-500/90 backdrop-blur-sm flex flex-col items-center justify-center text-white animate-fade-in-up pointer-events-none">
           <Download size={64} className="mb-4 animate-bounce" />
           <h2 className="text-3xl font-bold">{t.dragDrop}</h2>
        </div>
      )}

      {/* Header */}
      <header className="bg-white/80 dark:bg-slate-850/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 sticky top-0 z-30 transition-colors duration-300">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-br from-primary-500 to-primary-700 p-2 rounded-xl text-white shadow-lg shadow-primary-500/30">
              <ScanText size={24} />
            </div>
            <div>
              <h1 className="text-xl font-black text-slate-800 dark:text-white tracking-tight">{t.title}</h1>
              <p className="hidden xs:block text-[10px] text-slate-500 dark:text-slate-400 font-medium -mt-1">{t.subtitle}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2 sm:gap-3">
             {/* API Status Badge */}
             <div 
               className={`hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border transition-colors cursor-help
               ${apiKey 
                  ? 'bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-400 border-green-200 dark:border-green-800/50' 
                  : 'bg-yellow-50 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 border-yellow-200 dark:border-yellow-800/50'}`}
               title={apiKey ? t.statusConnected : t.statusDefault}
             >
                <Sparkles size={14} />
                <span>{apiKey ? 'Gemini Pro' : 'Gemini 2.5'}</span>
                <span className={`w-2 h-2 rounded-full ml-1 ${apiKey ? 'bg-green-500 animate-pulse' : 'bg-yellow-500'}`}></span>
             </div>

             <button 
                onClick={() => setShowSettings(true)}
                className={`p-2 rounded-lg transition-colors relative ${apiKey ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-600' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'}`}
                aria-label={t.settings}
             >
                <Settings size={20} />
                {apiKey && <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-green-500 rounded-full border border-white dark:border-slate-800"></span>}
             </button>

             <button 
                onClick={toggleTheme}
                className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                aria-label={t.theme}
             >
                {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
             </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-grow container mx-auto px-4 py-8 max-w-6xl">
        
        {/* Hero Section */}
        <div className="text-center mb-8 space-y-4">
          <h2 className="text-3xl md:text-5xl font-black text-slate-800 dark:text-white leading-tight">
            {t.heroTitle} <br/>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-600 to-purple-600 dark:from-primary-400 dark:to-purple-400">{t.heroSubtitle}</span>
          </h2>
          <p className="text-slate-600 dark:text-slate-400 text-base md:text-lg max-w-2xl mx-auto leading-relaxed">
             {t.dragDrop} {t.paste}
          </p>
        </div>

        {/* Custom Instructions Accordion */}
        <div className="max-w-3xl mx-auto mb-6">
          <button 
            onClick={() => setShowInstructions(!showInstructions)}
            className="flex items-center justify-between w-full px-5 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-sm text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-750 transition-colors"
          >
            <div className="flex items-center gap-2">
              <Settings size={16} className="text-primary-500" />
              <span>{t.customInstructions}</span>
            </div>
            {showInstructions ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>
          
          <div className={`overflow-hidden transition-all duration-300 ease-in-out ${showInstructions ? 'max-h-60 opacity-100 mt-2' : 'max-h-0 opacity-0'}`}>
            <div className="p-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-sm">
              <textarea
                value={customInstructions}
                onChange={(e) => setCustomInstructions(e.target.value)}
                placeholder={t.instructionsPlaceholder}
                className="w-full h-24 p-3 rounded-lg border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-100 text-sm focus:ring-2 focus:ring-primary-500 outline-none resize-none"
              />
            </div>
          </div>
        </div>

        {/* Upload Section */}
        <ImageUploader 
          onImageSelected={handleImageSelected} 
          isLoading={isLoading} 
          loadingMessage={loadingMessage}
          t={t}
        />

        {/* Result Section */}
        {extractedText && (
          <div className="scroll-mt-24" id="result-section">
            <ResultEditor 
              initialText={extractedText} 
              imageSrc={resultImage} 
              fontSize={fontSize} 
              language={language}
            />
          </div>
        )}

        {/* Features Grid */}
        {!extractedText && !isLoading && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 md:gap-6 mt-16">
            {[
              { title: t.feature1, desc: t.feature1Desc },
              { title: t.feature2, desc: t.feature2Desc },
              { title: t.feature3, desc: t.feature3Desc }
            ].map((item, i) => (
              <div key={i} className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm hover:shadow-md transition-all text-center">
                <h3 className="font-bold text-slate-800 dark:text-slate-200 mb-2">{item.title}</h3>
                <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        )}

      </main>

      {/* Footer */}
      <footer className="py-8 border-t border-slate-200 dark:border-slate-800 mt-auto bg-slate-100/50 dark:bg-slate-850/50 backdrop-blur">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6 text-sm">
            
            {/* Developer Info */}
            <div className="flex flex-col gap-2 text-center md:text-right">
               <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                  <span>{t.developedBy}</span>
                  <a href="https://dicode.ir" target="_blank" rel="noopener noreferrer" className="font-bold text-primary-600 dark:text-primary-400 hover:underline">DICODE</a>
                  <span className="opacity-50">|</span>
                  <a href="https://t.me/dicodeir" target="_blank" rel="noopener noreferrer" className="hover:text-primary-500 transition-colors">
                     @dicodeir
                  </a>
               </div>
               <div className="flex items-center gap-2 text-slate-500 dark:text-slate-500 justify-center md:justify-start">
                  <span>{t.creator}:</span>
                  <span className="font-medium text-slate-700 dark:text-slate-300">{t.creatorName}</span>
               </div>
            </div>

            {/* Social Links */}
            <div className="flex flex-wrap items-center justify-center gap-3">
              <a 
                href="https://t.me/M_CODERir" 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-full hover:bg-blue-500 hover:text-white transition-all text-xs font-medium"
              >
                Telegram <ExternalLink size={10} />
              </a>
              <a 
                href="https://x.com/mcoderss" 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800/10 text-slate-700 dark:text-slate-300 rounded-full hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black transition-all text-xs font-medium"
              >
                X (Twitter) <ExternalLink size={10} />
              </a>
               <a 
                href="https://github.com/mcodersir" 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 text-white rounded-full hover:bg-slate-700 transition-all text-xs font-medium dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200"
              >
                GitHub <Github size={10} />
              </a>
            </div>
          </div>
          
          <div className="mt-6 pt-4 border-t border-slate-200 dark:border-slate-700/50 text-center text-xs text-slate-400">
            © {new Date().getFullYear()} {t.title}
          </div>
        </div>
      </footer>
    </div>
  );
};

export default App;