import React, { useState, useMemo, useRef } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { Github, UploadCloud, Loader2, FileText, BarChart3, Download, Calculator, Edit3, Search, Filter, CheckCircle2, ArrowLeft, Check, X, BarChart2, PieChart as PieChartIcon, AlertCircle, ChevronDown, Save } from 'lucide-react';

// ИМПОРТ ЛОГОТИПА
// Убедись, что файл logo.png лежит в папке src
import logoPng from './logo.png'; 

// ==========================================
// КОНФИГУРАЦИЯ
// ==========================================
const API_URL = "http://localhost:8000";
const REPO_LINK = "https://github.com/Marina/Hackathon2025"; // Вставь свою ссылку

// Цвета из твоего дизайна
const COLORS = {
  lime: '#ccff00', 
  purple: '#b026ff',
  red: '#ff4d4f',
  gray: '#6b7280',
  dark: '#0a0a0a'
};

const CHART_COLORS_LIST = [COLORS.lime, COLORS.purple, COLORS.red, '#3b82f6', '#f59e0b', '#10b981'];

// ==========================================
// ВСПОМОГАТЕЛЬНЫЕ КОМПОНЕНТЫ UI
// ==========================================

const MatrixCell = ({ value, row, col }) => {
    const isDiagonal = row === col;
    const bgColor = isDiagonal ? 'bg-[#ccff00]/20' : 'bg-white/5';
    const shadow = isDiagonal ? 'shadow-[inset_0_0_20px_rgba(204,255,0,0.2)]' : '';

    return (
      <div className={`aspect-square border border-white/5 rounded-lg flex items-center justify-center text-white font-bold text-lg md:text-xl ${bgColor} ${shadow}`}>
        <span className={`text-center ${isDiagonal ? 'text-white' : 'text-gray-400'}`}>
            {value}
        </span>
      </div>
    );
};

// Бейдж тональности (для просмотра)
const renderSentimentBadge = (sentiment) => {
    let styles = "";
    let label = "";
    const s = sentiment ? String(sentiment).toLowerCase() : 'neutral';
    
    switch(s) {
      case 'positive': styles = "border-[#ccff00]/30 text-[#ccff00] bg-[#ccff00]/10"; label = "Позитив"; break;
      case 'negative': styles = "border-red-500/30 text-red-400 bg-red-500/10"; label = "Негатив"; break;
      default: styles = "border-purple-500/30 text-purple-400 bg-purple-500/10"; label = "Нейтрально";
    }

    return (
      <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide border ${styles} flex items-center justify-center gap-2`}>
        {label}
      </span>
    );
};

// Селект тональности (для редактирования в таблице)
const SentimentSelect = ({ sentiment, onChange }) => {
    const s = sentiment ? String(sentiment).toLowerCase() : 'neutral';
    let color = COLORS.purple;
    if (s === 'positive') color = COLORS.lime;
    if (s === 'negative') color = COLORS.red;

    return (
        <div className="relative inline-block group">
            <select 
                value={s}
                onChange={(e) => onChange(e.target.value)}
                className="appearance-none bg-transparent border border-white/20 rounded-full px-4 py-1 pr-8 text-xs font-bold uppercase cursor-pointer hover:border-white/50 transition focus:outline-none focus:border-[#ccff00]"
                style={{ color: color, borderColor: `${color}40`, backgroundColor: `${color}10` }}
            >
                <option value="positive" className="bg-[#0a0a0a] text-[#ccff00]">Позитив</option>
                <option value="neutral" className="bg-[#0a0a0a] text-[#b026ff]">Нейтрально</option>
                <option value="negative" className="bg-[#0a0a0a] text-[#ff4d4f]">Негатив</option>
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2">
                <ChevronDown size={12} color={color} />
            </div>
        </div>
    );
};

// --- ВИЗУАЛИЗАЦИЯ (CHARTS) ---

const SentimentPieChart = ({ data }) => (
    <div className="flex-grow min-h-[250px] relative w-full h-full flex items-center justify-center">
        <ResponsiveContainer width="100%" height="100%">
            <PieChart>
                <Pie
                    data={data}
                    innerRadius={75} 
                    outerRadius={95}
                    paddingAngle={6}
                    dataKey="value"
                    stroke="none"
                >
                {data.map((entry, index) => (
                    <Cell 
                        key={`cell-${index}`} 
                        fill={entry.color} 
                        fillOpacity={0.8}
                        stroke={entry.color} 
                        strokeWidth={2}
                    />
                ))}
                </Pie>
                <Tooltip 
                    contentStyle={{ backgroundColor: '#1e1433', border: '1px solid #ffffff20', borderRadius: '12px', color: '#fff' }}
                    itemStyle={{ color: '#fff' }}
                />
                <Legend verticalAlign="bottom" height={36} iconType="circle"/>
            </PieChart>
        </ResponsiveContainer>
    </div>
);

const SourcePieChart = ({ data }) => (
    <div className="flex-grow min-h-[250px] relative w-full h-full flex items-center justify-center">
        <ResponsiveContainer width="100%" height="100%">
            <PieChart>
                <Pie
                    data={data}
                    innerRadius={75} 
                    outerRadius={95}
                    paddingAngle={6}
                    dataKey="value"
                    stroke="none"
                >
                {data.map((entry, index) => (
                    <Cell 
                        key={`cell-${index}`} 
                        fill={entry.color} 
                        fillOpacity={0.8}
                        stroke={entry.color} 
                        strokeWidth={2}
                    />
                ))}
                </Pie>
                <Tooltip 
                    contentStyle={{ backgroundColor: '#1e1433', border: '1px solid #ffffff20', borderRadius: '12px', color: '#fff' }}
                    itemStyle={{ color: '#fff' }}
                />
                <Legend verticalAlign="bottom" height={36} iconType="square"/>
            </PieChart>
        </ResponsiveContainer>
    </div>
);

const WordFrequencyList = ({ sentiment, data }) => {
    const list = sentiment === 'negative' ? (data?.negative || []) : (data?.positive || []);
    const title = sentiment === 'negative' ? 'Самые частые слова (Негатив)' : 'Самые частые слова (Позитив)';
    const colorClass = sentiment === 'negative' ? 'text-red-400' : 'text-lime-400';

    return (
        <div className="flex-grow flex flex-col justify-center p-4">
            <h4 className={`text-xl font-bold mb-4 ${colorClass}`}>
                {title}
            </h4>
            <ul className="space-y-3">
                {list.length > 0 ? list.slice(0, 5).map((item, index) => (
                    <li key={index} className="flex justify-between items-center bg-white/5 p-3 rounded-lg border border-white/10">
                        <span className="text-gray-200 font-medium capitalize">{item.word}</span>
                        <span className="text-sm font-bold text-gray-400">{item.count}</span>
                    </li>
                )) : (
                    <li className="text-gray-500 italic">Нет данных для анализа слов</li>
                )}
            </ul>
            <p className="text-xs text-gray-500 mt-4 text-center">Основано на лемматизированных данных.</p>
        </div>
    );
};


// ==========================================
// 1. ЭКРАН ЗАГРУЗКИ (UploadScreen)
// ==========================================
const UploadScreen = ({ onUploadStart, error }) => {
  const fileInputRef = useRef(null);

  const handleClick = () => fileInputRef.current?.click();

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      onUploadStart(e.target.files[0]);
    }
  };

  const handleDrag = (e) => { e.preventDefault(); e.stopPropagation(); };
  const handleDrop = (e) => {
    e.preventDefault(); e.stopPropagation();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
        onUploadStart(e.dataTransfer.files[0]);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] w-full px-4 animate-fade-in">
      <div className="text-center mb-10 max-w-4xl w-full">
        <h1 className="text-4xl md:text-6xl font-bold text-white mb-6 leading-tight drop-shadow-[0_0_25px_rgba(176,38,255,0.6)]">
          АНАЛИЗАТОР ТОНАЛЬНОСТИ
        </h1>
        <p className="text-gray-300 text-lg md:text-xl font-light">
          Загрузите датасет (.csv, .xlsx) для автоматической разметки отзывов нейросетью
        </p>
      </div>

      {error && (
        <div className="mb-6 flex items-center gap-3 bg-red-500/10 border border-red-500/50 p-4 rounded-xl text-red-200 animate-pulse">
            <AlertCircle size={20} />
            <span>{error}</span>
        </div>
      )}

      <input type="file" ref={fileInputRef} onChange={handleFileChange} accept=".csv,.xlsx" className="hidden" />

      <div 
        onClick={handleClick}
        onDragEnter={handleDrag} onDragOver={handleDrag} onDrop={handleDrop}
        className={`w-full max-w-4xl aspect-[16/7] min-h-[300px] border-2 border-dashed rounded-[2.5rem] bg-white/[0.02] hover:bg-white/[0.05] transition-all cursor-pointer flex flex-col items-center justify-center gap-6 group shadow-lg ${error ? 'border-red-500/40' : 'border-[#ccff00]/30 hover:border-[#ccff00]'}`}
      >
        <div className="w-24 h-24 rounded-full bg-[#ccff00]/10 flex items-center justify-center group-hover:scale-110 transition-transform duration-300 border border-[#ccff00]/20">
          <UploadCloud size={48} color={COLORS.lime} />
        </div>
        
        <div className="text-center">
          <p className="text-2xl text-white font-medium mb-2">Перетащите файл сюда или нажмите</p>
          <p className="text-sm text-gray-400">Поддерживаются форматы: .csv, .xlsx</p>
        </div>

        <button className="px-10 py-4 bg-[#ccff00] hover:bg-[#b3e600] text-black font-bold rounded-full transition-colors text-lg shadow-[0_0_20px_rgba(204,255,0,0.4)]">
          Загрузить данные
        </button>
      </div>
    </div>
  );
};

// ==========================================
// 2. ЭКРАН ОЖИДАНИЯ (LoadingScreen)
// ==========================================
const LoadingScreen = ({ text = "Модель анализирует эмоциональный окрас текста..." }) => {
  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] w-full px-4">
      <div className="relative">
        <div className="absolute inset-0 bg-[#ccff00] blur-xl opacity-20 animate-pulse"></div>
        <Loader2 size={100} color={COLORS.lime} className="animate-spin relative z-10" />
      </div>
      <h2 className="text-3xl font-bold text-white mt-8 mb-2">Обработка...</h2>
      <p className="text-gray-300 text-lg">{text}</p>
    </div>
  );
};


// ==========================================
// 3. ЭКРАН РЕЗУЛЬТАТОВ (Dashboard)
// ==========================================
const ResultsScreen = ({ data, onOpenTable, onBackToUpload, onOpenValidation, onDownload }) => {
  const [showVisMenu, setShowVisMenu] = useState(false);
  const [currentVis, setCurrentVis] = useState('sentiment_pie'); 
  
  // Рассчет графиков на лету (важно для обновления после редактирования)
  const sentimentChartData = useMemo(() => {
     const counts = { positive: 0, negative: 0, neutral: 0 };
     data.reviews.forEach(r => {
         const s = r.sentiment?.toLowerCase() || 'neutral';
         if (counts[s] !== undefined) counts[s]++;
     });
     const chart = [
        { name: 'Негатив', value: counts.negative, color: COLORS.red },
        { name: 'Нейтрально', value: counts.neutral, color: COLORS.purple },
        { name: 'Позитив', value: counts.positive, color: COLORS.lime },
     ].filter(x => x.value > 0);
     
     if (chart.length === 0) return [{ name: 'Нет данных', value: 1, color: '#333' }];
     return chart;
  }, [data.reviews]);

  const sourceChartData = useMemo(() => {
     if (!data?.source_distribution) return [];
     return data.source_distribution.map((item, index) => ({
         name: item.name || "Unknown",
         value: item.value,
         color: CHART_COLORS_LIST[index % CHART_COLORS_LIST.length] 
     }));
  }, [data]);

  const handleVisSelect = (visMode) => {
    setCurrentVis(visMode);
    setShowVisMenu(false);
  };

  const getVisContent = () => {
    switch (currentVis) {
      case 'source_pie':
        return { title: 'Распределение по источникам', content: <SourcePieChart data={sourceChartData} /> };
      case 'word_negative':
        return { title: 'Топ слов (Негатив)', content: <WordFrequencyList sentiment="negative" data={data?.top_words} /> };
      case 'word_positive':
        return { title: 'Топ слов (Позитив)', content: <WordFrequencyList sentiment="positive" data={data?.top_words} /> };
      case 'sentiment_pie':
      default:
        return { title: 'Распределение по тональности', content: <SentimentPieChart data={sentimentChartData} /> };
    }
  };

  const vis = getVisContent();

  return (
    <div className="w-full max-w-7xl mx-auto pb-12 px-4 animate-fade-in-up">
      
      <button 
        onClick={onBackToUpload}
        className="mb-6 flex items-center text-gray-400 hover:text-[#ccff00] transition gap-2 group text-sm font-medium"
      >
         <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform"/>
         Загрузить новый файл
      </button>

      <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
        <h2 className="text-3xl font-bold text-white">Результаты анализа</h2>
        <div className="flex gap-4 w-full md:w-auto">
            <button 
               onClick={onOpenValidation}
               className="flex-1 md:flex-none py-3 px-6 bg-white/10 hover:bg-white/20 text-white font-semibold rounded-full transition border border-purple-500/50 flex items-center justify-center gap-2 shadow-[0_0_10px_rgba(176,38,255,0.2)]"
            >
              <Calculator size={18} className="text-purple-400" />
               Точность модели
            </button>

            <button 
                onClick={onDownload}
                className="flex-1 md:flex-none py-3 px-8 bg-[#ccff00] hover:bg-[#b3e600] text-black font-bold rounded-full transition shadow-[0_0_20px_rgba(204,255,0,0.3)] flex items-center justify-center gap-2">
              <Download size={20} /> Скачать CSV
            </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-6">
        
        {/* Карточка 1: СТАТИСТИКА */}
        <div className="lg:col-span-4 bg-white/[0.05] backdrop-blur-xl border border-white/10 rounded-[2.5rem] p-8 flex flex-col justify-center relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-[#ccff00] blur-[80px] opacity-10"></div>
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-[#ccff00]/10 rounded-full">
              <FileText size={24} className="text-[#ccff00]" />
            </div>
            <span className="text-gray-300 font-medium">Обработано отзывов</span>
          </div>
          <div className="mt-2">
            <span className="text-7xl lg:text-8xl font-bold text-white tracking-tighter block">
              {data.reviews.length > 1000 ? `${(data.reviews.length / 1000).toFixed(1)}k` : data.reviews.length}
            </span>
          </div>
           <div className="mt-6 p-4 bg-white/5 rounded-2xl border border-white/5">
                <p className="text-sm text-gray-300">Время обработки:</p>
                <p className="text-xl font-bold text-white">{data.processing_time || "0.5s"}</p>
           </div>
        </div>

        {/* Карточка 2 (ВИЗУАЛИЗАЦИЯ) */}
        <div className="lg:col-span-5 bg-white/[0.05] backdrop-blur-xl border border-white/10 rounded-[2.5rem] p-8 flex flex-col relative">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl text-white font-bold">{vis.title}</h3>
          </div>
          {vis.content}
        </div>

        {/* Карточка 3 (ИСТОЧНИКИ + МЕНЮ) */}
        <div className="lg:col-span-3 flex flex-col gap-6">
            <div className="bg-white/[0.05] backdrop-blur-xl border border-white/10 rounded-[2.5rem] p-8 flex-grow">
                <h3 className="text-xl text-white font-bold mb-6">Источники</h3>
                <div className="space-y-4">
                    {sourceChartData.length > 0 ? sourceChartData.slice(0, 5).map((src, idx) => (
                        <div key={idx} className="flex justify-between items-center">
                            <span className="text-gray-300 truncate w-24" title={src.name}>{src.name}</span>
                            <div className="w-16 h-2 bg-gray-700 rounded-full overflow-hidden">
                                <div className="h-full" style={{width: `${Math.max(src.value, 5)}%`, backgroundColor: src.color}}></div>
                            </div>
                            <span className="font-bold text-sm" style={{color: src.color}}>{src.value}%</span>
                        </div>
                    )) : (
                        <p className="text-gray-500 text-sm">Данные об источниках не найдены</p>
                    )}
                </div>
            </div>

            <div className="relative w-full">
                <button 
                    onClick={() => setShowVisMenu(!showVisMenu)}
                    className="w-full py-3 bg-white/5 hover:bg-white/10 border border-white/10 text-white font-bold rounded-full transition flex items-center justify-center gap-3"
                >
                    <BarChart2 size={18} className="text-gray-400" />
                    Иная визуализация
                </button>
                
                {showVisMenu && (
                    <div className="absolute top-full left-0 mt-2 w-full bg-[#1e1433]/95 backdrop-blur-xl border border-purple-500 rounded-2xl shadow-2xl z-50 p-2 animate-fade-in-up origin-top">
                        <div 
                           onClick={() => handleVisSelect('source_pie')}
                           className="flex items-center gap-3 p-3 text-sm text-gray-300 hover:bg-white/10 rounded-lg cursor-pointer transition"
                        >
                           <PieChartIcon size={16} className="text-purple-400"/> Источники
                        </div>
                        <div 
                           onClick={() => handleVisSelect('word_negative')}
                           className="flex items-center gap-3 p-3 text-sm text-gray-300 hover:bg-white/10 rounded-lg cursor-pointer transition"
                        >
                           <X size={16} className="text-red-400"/> Слова (Негатив)
                        </div>
                         <div 
                           onClick={() => handleVisSelect('word_positive')}
                           className="flex items-center gap-3 p-3 text-sm text-gray-300 hover:bg-white/10 rounded-lg cursor-pointer transition"
                        >
                           <Check size={16} className="text-lime-400"/> Слова (Позитив)
                        </div>
                        <div 
                           onClick={() => handleVisSelect('sentiment_pie')}
                           className="flex items-center gap-3 p-3 text-sm text-gray-300 hover:bg-white/10 rounded-lg cursor-pointer transition"
                        >
                           <BarChart3 size={16} className="text-purple-400"/> Тональность (Default)
                        </div>
                    </div>
                )}
            </div>
        </div>
        
        {/* ПЛАШКА ПЕРЕХОДА К ТАБЛИЦЕ */}
        <div className="lg:col-span-12">
           <div className="bg-gradient-to-r from-purple-500/10 to-transparent border border-white/5 rounded-[2rem] p-6 flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-green-500/20 rounded-full flex items-center justify-center text-green-400 font-bold">
                      ✓
                  </div>
                  <div>
                      <h4 className="text-white font-bold">Анализ завершен успешно</h4>
                      <p className="text-gray-300 text-sm">Данные готовы к выгрузке и просмотру</p>
                  </div>
              </div>
              <button 
                onClick={onOpenTable}
                className="text-[#ccff00] font-bold hover:underline decoration-[#ccff00] underline-offset-4 transition flex items-center gap-2"
              >
                  Открыть предварительный просмотр →
              </button>
           </div>
        </div>

      </div>
    </div>
  );
};

// ==========================================
// 5. ТАБЛИЦА (TableScreen)
// ==========================================
const TableScreen = ({ data, onBack, onUpdateRow }) => {
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [visibleCount, setVisibleCount] = useState(50); // ПАГИНАЦИЯ
  const [selectedSentiments, setSelectedSentiments] = useState([]);
  const [selectedSources, setSelectedSources] = useState([]);

  // ДИНАМИЧЕСКИЙ СПИСОК ИСТОЧНИКОВ
  const uniqueSources = useMemo(() => {
      const sources = new Set(data.reviews.map(r => r.source));
      // Убираем "Unknown" если он там есть, чтобы добавить в конец, или сортируем
      return Array.from(sources).filter(s => s).sort();
  }, [data.reviews]);

  const toggleSentiment = (s) => {
      setSelectedSentiments(prev => prev.includes(s) ? prev.filter(i => i !== s) : [...prev, s]);
  };

  const toggleSource = (src) => {
      setSelectedSources(prev => prev.includes(src) ? prev.filter(i => i !== src) : [...prev, src]);
  };

  const filteredData = useMemo(() => {
    return data.reviews.filter(row => {
      // 1. Поиск
      if (searchQuery && !row.text.toLowerCase().includes(searchQuery.toLowerCase())) return false;
      
      // 2. Фильтр тональности
      if (selectedSentiments.length > 0 && !selectedSentiments.includes(row.sentiment)) return false;

      // 3. Фильтр источников
      if (selectedSources.length > 0 && !selectedSources.includes(row.source)) return false;

      return true;
    });
  }, [searchQuery, selectedSentiments, selectedSources, data.reviews]);

  const visibleRows = filteredData.slice(0, visibleCount);

  return (
    <div className="w-full max-w-7xl mx-auto pb-12 px-4 animate-fade-in">
        
        <button onClick={onBack} className="mb-6 flex items-center text-gray-400 hover:text-[#ccff00] transition gap-2 group">
            <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform"/> Назад к графикам
        </button>

        <div className="bg-white/[0.05] border border-white/10 rounded-[2rem] p-6 backdrop-blur-xl overflow-hidden shadow-2xl min-h-[70vh] flex flex-col">
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 relative">
            <div className="flex items-center gap-3">
                <CheckCircle2 className="text-[#ccff00]" />
                <h3 className="text-2xl font-bold text-white">Детализация</h3>
                <span className="text-gray-500 text-sm">({filteredData.length})</span>
            </div>
            
            <div className="flex items-center gap-3 w-full md:w-auto relative">
                <div className="flex-grow md:w-80 bg-black/30 rounded-full px-4 py-3 flex items-center border border-white/10 focus-within:border-purple-500/50 transition">
                    <Search className="text-gray-400 mr-3" size={18} />
                    <input 
                        type="text" 
                        placeholder="Поиск..." 
                        className="bg-transparent outline-none text-white w-full text-sm" 
                        value={searchQuery} 
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
                
                <div className="relative">
                    <button 
                        onClick={() => setIsFilterOpen(!isFilterOpen)} 
                        className={`p-3 rounded-full flex items-center gap-2 border transition ${isFilterOpen || selectedSentiments.length > 0 || selectedSources.length > 0 ? 'bg-[#ccff00] text-black border-[#ccff00]' : 'bg-white/5 text-white border-white/10 hover:bg-white/10'}`}
                    >
                        <Filter size={20} />
                    </button>
                    
                    {isFilterOpen && (
                        <div className="absolute right-0 top-full mt-4 w-72 bg-[#1e1433]/95 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl z-50 p-4 animate-fade-in-up origin-top-right">
                            <div className="flex justify-between items-center mb-4">
                                <h4 className="text-white font-bold">Фильтрация</h4>
                                <button onClick={() => setIsFilterOpen(false)}><X size={16} className="text-gray-400 hover:text-white"/></button>
                            </div>
                            
                            <div className="mb-4">
                                <p className="text-xs text-gray-400 uppercase font-bold tracking-wider mb-2">Тональность</p>
                                <div className="space-y-2">
                                    {['positive', 'neutral', 'negative'].map(key => (
                                        <label key={key} className="flex items-center gap-3 cursor-pointer group">
                                            <div className={`w-5 h-5 rounded border flex items-center justify-center transition ${selectedSentiments.includes(key) ? 'bg-[#ccff00] border-[#ccff00]' : 'border-gray-600 group-hover:border-gray-400'}`}>
                                                {selectedSentiments.includes(key) && <Check size={14} className="text-black"/>}
                                            </div>
                                            <button onClick={() => toggleSentiment(key)} className="text-gray-200 text-sm capitalize hover:text-white text-left">{key}</button>
                                        </label>
                                    ))}
                                </div>
                            </div>

                            <div className="max-h-40 overflow-y-auto custom-scrollbar">
                                <p className="text-xs text-gray-400 uppercase font-bold tracking-wider mb-2">Источники</p>
                                <div className="flex flex-wrap gap-2">
                                     {uniqueSources.map(src => (
                                         <button 
                                            key={src} 
                                            onClick={() => toggleSource(src)} 
                                            className={`px-3 py-1 rounded-lg text-xs border transition ${selectedSources.includes(src) ? 'bg-white/20 border-white text-white' : 'border-white/10 text-gray-400 hover:border-white/30'}`}
                                         >
                                             {src}
                                         </button>
                                     ))}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>

        <div className="overflow-x-auto flex-grow">
            <table className="w-full text-left border-collapse">
                <thead>
                    <tr className="border-b border-white/10 text-gray-400 text-sm uppercase tracking-wider">
                        <th className="p-4 w-[55%]">Текст отзыва</th>
                        <th className="p-4 text-center w-[25%]">Тональность</th>
                        <th className="p-4 text-right w-[20%]">Источник</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                    {visibleRows.map((row) => (
                    <tr key={row.id} className="hover:bg-white/5 transition group animate-fade-in">
                        <td className="p-4 text-gray-200 text-sm leading-relaxed">{row.text}</td>
                        <td className="p-4 flex justify-center">
                            {/* РЕДАКТИРОВАНИЕ */}
                            <SentimentSelect sentiment={row.sentiment} onChange={(newVal) => onUpdateRow(row.id, newVal)} />
                        </td>
                        <td className="p-4 text-right text-gray-500 text-sm">{row.source || 'Unknown'}</td>
                    </tr>
                    ))}
                </tbody>
            </table>
            {filteredData.length === 0 && <div className="p-10 text-center text-gray-500">Ничего не найдено</div>}
        </div>

        {/* КНОПКА ЗАГРУЗИТЬ ЕЩЕ */}
        {visibleCount < filteredData.length && (
            <div className="mt-6 flex justify-center">
                <button 
                    onClick={() => setVisibleCount(prev => prev + 50)}
                    className="px-6 py-2 bg-white/10 hover:bg-white/20 text-white rounded-full transition text-sm font-bold border border-white/20"
                >
                    Загрузить еще 50 (Осталось: {filteredData.length - visibleCount})
                </button>
            </div>
        )}
        </div>
    </div>
  );
};

// ==========================================
// 4. СТРАНИЦА: ВАЛИДАЦИЯ (ValidationScreen)
// ==========================================
const ValidationScreen = ({ onBack, predictions }) => {
  const [step, setStep] = useState('upload'); 
  const [metrics, setMetrics] = useState(null);
  const [error, setError] = useState(null);
  const fileInputRef = useRef(null);

  const handleFileChange = async (e) => {
      const file = e.target.files[0];
      if(!file) return;

      setStep('analyzing');
      setError(null);

      const formData = new FormData();
      formData.append('file', file);
      // Отправляем предсказания, которые уже есть на фронте
      formData.append('predictions_json', JSON.stringify(predictions));

      try {
          const response = await fetch(`${API_URL}/validate`, {
              method: 'POST',
              body: formData
          });
          const data = await response.json();
          if (!response.ok) throw new Error(data.detail || "Ошибка валидации");
          
          setMetrics(data);
          setStep('results');

      } catch (err) {
          console.error(err);
          setError(err.message || "Ошибка соединения");
          setStep('upload');
      }
  };

  if (step === 'upload') {
     return (
        <div className="w-full max-w-7xl mx-auto px-4 animate-fade-in">
           <button onClick={onBack} className="mb-8 flex items-center text-gray-400 hover:text-[#ccff00] transition gap-2 group">
              <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform"/> Назад к результатам
           </button>
           
           <div className="flex flex-col items-center justify-center min-h-[50vh] text-center">
              <h2 className="text-4xl font-bold text-white mb-4">Точность модели</h2>
              <p className="text-gray-400 max-w-lg mb-10 text-lg">
                Загрузите файл с эталонной разметкой (Golden Dataset). Мы сравним текущие результаты модели с ним и покажем реальную точность.
              </p>
              
              {error && (
                 <div className="mb-4 text-red-400 bg-red-500/10 p-3 rounded-xl border border-red-500/20">
                    {error}
                 </div>
              )}

              <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept=".csv,.xlsx"/>

              <div 
                onClick={() => fileInputRef.current?.click()}
                className="w-full max-w-3xl aspect-[16/6] border-2 border-dashed border-purple-500/40 rounded-[2.5rem] bg-white/[0.02] hover:bg-purple-500/10 hover:border-purple-500 transition-all cursor-pointer flex flex-col items-center justify-center gap-6 group"
              >
                <UploadCloud size={64} className="text-purple-400 group-hover:scale-110 transition-transform"/>
                <div className="text-center">
                   <p className="text-xl text-white font-bold">Загрузить Golden Dataset</p>
                   <p className="text-sm text-gray-500 mt-1">.csv, .xlsx (с колонкой 'target' или 'sentiment')</p>
                </div>
              </div>
           </div>
        </div>
     );
  }

  if (step === 'analyzing') {
    return <LoadingScreen text="Сверка данных и расчет F1-score..." />;
  }
  
  const { f1_macro, precision, recall, accuracy, confusion_matrix: cm } = metrics;

  return (
    <div className="w-full max-w-7xl mx-auto px-4 pb-12 animate-fade-in">
        <button onClick={onBack} className="mb-6 flex items-center text-gray-400 hover:text-[#ccff00] transition gap-2 group">
            <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform"/> Назад
        </button>

        <h2 className="text-4xl font-bold text-white mb-6">Результаты валидации</h2>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* МЕТРИКИ */}
            <div className="bg-white/[0.08] border border-white/15 rounded-[2.5rem] p-6 lg:p-8 flex flex-col items-center justify-center relative overflow-hidden text-center backdrop-blur-xl">
                <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-transparent via-[#ccff00] to-transparent opacity-50"></div>
                <h3 className="text-lg lg:text-xl text-gray-400 uppercase tracking-widest font-bold mt-2 mb-3">Macro-F1</h3>
                
                <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden mb-5 mt-2">
                    <div className="h-full bg-[#ccff00] shadow-[0_0_10px_rgba(204,255,0,0.8)]" style={{ width: `${f1_macro * 100}%` }}></div>
                </div>
                
                <div className="flex flex-col items-center justify-center my-6 py-4"> 
                    <span className="text-7xl lg:text-8xl font-bold text-white tracking-tighter mb-4">{f1_macro}</span>
                    <span className="text-green-400 text-sm lg:text-base font-bold bg-green-500/20 px-4 py-2 rounded-full">
                         {f1_macro > 0.8 ? "Высокая точность" : f1_macro > 0.6 ? "Средняя точность" : "Требует дообучения"}
                    </span>
                </div>
                
                <div className="mt-6 grid grid-cols-3 gap-3 w-full text-sm">
                    <div className="bg-white/5 p-3 rounded-xl border border-white/5">
                        <div className="text-gray-400">Precision</div>
                        <div className="text-white font-bold text-lg">{precision}</div>
                    </div>
                    <div className="bg-white/5 p-3 rounded-xl border border-white/5">
                        <div className="text-gray-400">Recall</div>
                        <div className="text-white font-bold text-lg">{recall}</div>
                    </div>
                    <div className="bg-white/5 p-3 rounded-xl border border-white/5">
                        <div className="text-gray-400">Accuracy</div>
                        <div className="text-white font-bold text-lg">{accuracy}</div>
                    </div>
                </div>
            </div>

            {/* МАТРИЦА ОШИБОК */}
            <div className="bg-white/[0.08] border border-white/15 rounded-[2.5rem] p-6 flex flex-col backdrop-blur-xl">
                <h3 className="text-xl lg:text-2xl font-bold text-white mb-4">Матрица ошибок</h3>
                <div className="flex-grow flex flex-col justify-center">
                    <div className="text-center text-gray-500 text-xs uppercase mb-3">Предсказанный класс</div>
                    <div className="flex items-stretch">
                        <div className="flex flex-col justify-center items-center mr-4 w-6">
                            <span className="text-gray-500 text-xs uppercase transform -rotate-90 whitespace-nowrap">Истинный класс</span>
                        </div>
                        <div className="flex-grow">
                             <div className="grid grid-cols-3 gap-2 pb-2 pl-1">
                                {cm.labels.map(l => (
                                    <div key={l} className="text-center text-xs text-gray-500 uppercase">{l}</div>
                                ))}
                             </div>
                             {cm.matrix.map((row, rowIndex) => (
                                <div key={rowIndex} className="flex items-center gap-2 mb-2">
                                    <div className={`text-right text-xs font-bold w-12 pt-3 ${rowIndex === 0 ? 'text-[#ff4d4f]' : rowIndex === 1 ? 'text-[#b026ff]' : 'text-[#ccff00]'}`}>
                                        {cm.labels[rowIndex]}
                                    </div>
                                    <div className="grid grid-cols-3 gap-2 flex-grow">
                                        {row.map((value, colIndex) => (
                                            <MatrixCell key={colIndex} value={value} row={rowIndex} col={colIndex} />
                                        ))}
                                    </div>
                                </div>
                             ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
  );
};

// ==========================================
// ГЛАВНЫЙ КОМПОНЕНТ
// ==========================================
export default function App() {
  const [screen, setScreen] = useState('upload'); 
  const [analysisData, setAnalysisData] = useState(null);
  const [uploadError, setUploadError] = useState(null);

  const handleStart = async (file) => {
    setScreen('loading');
    setUploadError(null);
    
    const formData = new FormData();
    formData.append('file', file);

    try {
        const response = await fetch(`${API_URL}/analyze`, { method: 'POST', body: formData });
        const data = await response.json();
        
        if (!response.ok) throw new Error(data.detail || "Ошибка сервера");
        
        setAnalysisData(data);
        setTimeout(() => setScreen('results'), 500); 

    } catch (err) {
        console.error(err);
        setUploadError(err.message || "Не удалось загрузить файл");
        setScreen('upload');
    }
  };

  // ФУНКЦИЯ РУЧНОЙ ПРАВКИ
  const handleUpdateRow = (id, newSentiment) => {
      setAnalysisData(prev => {
          const newReviews = prev.reviews.map(r => r.id === id ? { ...r, sentiment: newSentiment } : r);
          // Можно добавить отправку на сервер для дообучения в будущем
          return { ...prev, reviews: newReviews };
      });
  };

  // ФУНКЦИЯ СКАЧИВАНИЯ (Исправленная)
  const handleDownloadCsv = () => {
    if (!analysisData?.reviews) return;
    
    const headers = ["text", "label", "src"].join(",");
    const rows = analysisData.reviews.map(row => {
        const safeText = `"${String(row.text).replace(/"/g, '""')}"`;
        return `${safeText},${row.sentiment},${row.source || ''}`;
    }).join("\n");

    const blob = new Blob(["\uFEFF" + headers + "\n" + rows], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "result.csv";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div 
      className="w-full min-h-screen font-sans flex flex-col relative overflow-x-hidden text-white"
      style={{
        background: 'radial-gradient(circle at 90% 0%, #4c1d95 0%, #0f0518 50%, #000000 90%)',
        backgroundColor: '#000000'
      }}
    >
      {/* HEADER */}
      <header className="w-full max-w-7xl mx-auto px-6 py-6 flex justify-between items-center relative z-20">
        <div className="flex items-center gap-3">
          {/* ЛОГОТИП */}
          <div className="w-12 h-12 flex items-center justify-center rounded-lg overflow-hidden bg-white/10 shadow-[0_0_15px_rgba(255,255,255,0.2)]">
             <img 
               src={logoPng} 
               alt="Logo" 
               className="w-full h-full object-contain" 
               onError={(e) => {e.target.style.display='none';}} 
             />
             <span className="absolute text-xs font-bold" style={{display: 'none'}}>Logo</span>
          </div>
          <div>
            <span className="font-bold text-white tracking-wide block leading-none">HACK&CHANGE 2025</span>
            <span className="text-xs text-gray-300 block mt-1">{'>>'} wazi lai</span>
          </div>
        </div>
        
        {/* ССЫЛКА НА РЕПОЗИТОРИЙ */}
        <a href= "https://github.com/woarrr/key-classifier"
        target="_blank" rel="noreferrer" 
        className="flex items-center gap-2 text-sm font-semibold text-white/70 hover:text-[#ccff00] transition"
        >
          <Github size={18} />
          <span className="hidden md:inline">Репозиторий</span>
        </a>
      </header>

      {/* MAIN CONTENT */}
      <main className="flex-grow w-full relative z-10 flex flex-col justify-center py-4">
        
        {screen === 'upload' && <UploadScreen onUploadStart={handleStart} error={uploadError} />}
        
        {screen === 'loading' && <LoadingScreen />}
        
        {screen === 'results' && analysisData && 
            <ResultsScreen 
                data={analysisData}
                onOpenTable={() => setScreen('table')} 
                onBackToUpload={() => setScreen('upload')}
                onOpenValidation={() => setScreen('validation')}
                onDownload={handleDownloadCsv}
            />
        }
        
        {screen === 'table' && analysisData && 
            <TableScreen 
                data={analysisData} 
                onBack={() => setScreen('results')} 
                onUpdateRow={handleUpdateRow} 
            />
        }
        
        {screen === 'validation' && analysisData && (
            <ValidationScreen 
                onBack={() => setScreen('results')} 
                predictions={analysisData.reviews} 
            />
        )}
      </main>

       {/* Нижнее левое свечение */}
       <div className="fixed bottom-[-20%] left-[-20%] w-[50vw] h-[50vw] bg-[#6d28d9] rounded-full mix-blend-screen filter blur-[120px] opacity-20 pointer-events-none z-0"></div>

    </div>
  );
}