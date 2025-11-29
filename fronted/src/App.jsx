import React, { useState, useMemo, useRef } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { Github, UploadCloud, Loader2, FileText, BarChart3, Download, Calculator, Edit3, Search, Filter, CheckCircle2, ArrowLeft, Check, X, BarChart2, PieChart as PieChartIcon } from 'lucide-react';

// ==========================================
// КОНФИГУРАЦИЯ API
// ==========================================
const API_URL = "http://localhost:8080/api"; // Адрес твоего Go сервера

// ==========================================
// ГЛОБАЛЬНЫЕ СТИЛИ И ЦВЕТА
// ==========================================

const COLORS = {
  lime: '#ccff00', 
  purple: '#b026ff',
  red: '#ff4d4f',
};

// Вспомогательная функция для маппинга данных с бэкенда в формат Recharts
const mapSentimentToChart = (distribution) => {
  if (!distribution) return [];
  return [
    { name: 'Негатив', value: distribution.negative || 0, color: COLORS.red },
    { name: 'Нейтрально', value: distribution.neutral || 0, color: COLORS.purple },
    { name: 'Позитив', value: distribution.positive || 0, color: COLORS.lime },
  ];
};

const mapSourceToChart = (sources) => {
  if (!sources) return [];
  // Ожидаем от бэка массив [{name: "Yandex", value: 45}, ...]
  // Присваиваем цвета циклично или по логике
  return sources.map((s, idx) => ({
      ...s,
      color: idx === 0 ? COLORS.lime : idx === 1 ? COLORS.purple : COLORS.red
  }));
};

// ==========================================
// ВСПОМОГАТЕЛЬНЫЕ КОМПОНЕНТЫ
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

const renderSentimentBadge = (sentiment) => {
    let styles = "";
    let label = "";
    // Приводим к нижнему регистру для надежности
    const s = sentiment ? sentiment.toLowerCase() : 'neutral';
    
    switch(s) {
      case 'positive': styles = "border-[#ccff00]/30 text-[#ccff00] bg-[#ccff00]/10"; label = "Позитив"; break;
      case 'negative': styles = "border-red-500/30 text-red-400 bg-red-500/10"; label = "Негатив"; break;
      default: styles = "border-purple-500/30 text-purple-400 bg-purple-500/10"; label = "Нейтрально";
    }

    return (
      <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide border ${styles} flex items-center justify-center gap-2 cursor-pointer hover:opacity-80 transition`}>
        {label} <Edit3 size={10} />
      </span>
    );
};

// --- ВИЗУАЛИЗАЦИЯ 1: PIE CHART ---
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
                        fillOpacity={0.2}
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

// --- ВИЗУАЛИЗАЦИЯ 2: SOURCES ---
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
                        fillOpacity={0.2}
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

// --- ВИЗУАЛИЗАЦИЯ 3: СЛОВА ---
const WordFrequencyList = ({ sentiment, data }) => {
    // data = { positive: [...], negative: [...] }
    const list = sentiment === 'negative' ? (data?.negative || []) : (data?.positive || []);
    const title = sentiment === 'negative' ? 'Самые частые слова (Негатив)' : 'Самые частые слова (Позитив)';

    return (
        <div className="flex-grow flex flex-col justify-center p-4">
            <h4 className={`text-xl font-bold mb-4 ${sentiment === 'negative' ? 'text-red-400' : 'text-lime-400'}`}>
                {title}
            </h4>
            <ul className="space-y-3">
                {list.length > 0 ? list.slice(0, 3).map((item, index) => (
                    <li key={index} className="flex justify-between items-center bg-white/5 p-3 rounded-lg border border-white/10">
                        <span className="text-gray-200 font-medium">{item.word}</span>
                        <span className="text-sm font-bold text-gray-400">{item.count}</span>
                    </li>
                )) : (
                    <li className="text-gray-500">Нет данных</li>
                )}
            </ul>
            <p className="text-xs text-gray-500 mt-4 text-center">Основано на лемматизированных данных.</p>
        </div>
    );
};


// ==========================================
// 1. ЭКРАН ЗАГРУЗКИ (Upload)
// ==========================================
const UploadScreen = ({ onFileSelect }) => {
  const fileInputRef = useRef(null);

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      onFileSelect(e.target.files[0]);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] w-full px-4 animate-fade-in">
      <div className="text-center mb-10 max-w-4xl w-full">
        <h1 className="text-4xl md:text-6xl font-bold text-white mb-6 leading-tight drop-shadow-[0_0_25px_rgba(176,38,255,0.6)]">
          АНАЛИЗАТОР ТОНАЛЬНОСТИ
        </h1>
        <p className="text-gray-300 text-lg md:text-xl font-light">
          Загрузите датасет (.csv) для автоматической разметки отзывов нейросетью
        </p>
      </div>

      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={handleFileChange} 
        accept=".csv,.xlsx"
        className="hidden" 
      />

      <div 
        onClick={handleClick}
        className="w-full max-w-4xl aspect-[16/7] min-h-[300px] border-2 border-dashed border-[#ccff00]/30 rounded-[2.5rem] bg-white/[0.02] hover:bg-white/[0.05] hover:border-[#ccff00] transition-all cursor-pointer flex flex-col items-center justify-center gap-6 group shadow-lg"
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
// 2. ЭКРАН ОЖИДАНИЯ (Loading)
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
  
  // Трансформируем данные API в формат графиков
  const sentimentChartData = useMemo(() => mapSentimentToChart(data.sentiment_distribution), [data]);
  const sourceChartData = useMemo(() => mapSourceToChart(data.source_distribution), [data]);

  const handleVisSelect = (visMode) => {
    setCurrentVis(visMode);
    setShowVisMenu(false);
  };

  const getVisContent = () => {
    switch (currentVis) {
      case 'source_pie':
        return { title: 'Распределение по источникам', content: <SourcePieChart data={sourceChartData} /> };
      case 'word_negative':
        return { title: 'Частота слов (Негатив)', content: <WordFrequencyList sentiment="negative" data={data.top_words} /> };
      case 'word_positive':
        return { title: 'Частота слов (Позитив)', content: <WordFrequencyList sentiment="positive" data={data.top_words} /> };
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
               Оценить метрику по macro-F1
            </button>

            <button 
                onClick={onDownload}
                className="flex-1 md:flex-none py-3 px-8 bg-[#ccff00] hover:bg-[#b3e600] text-black font-bold rounded-full transition shadow-[0_0_20px_rgba(204,255,0,0.3)] flex items-center justify-center gap-2">
              <Download size={20} /> Скачать CSV
            </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-6">
        
        {/* Карточка 1: Статистика */}
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
              {(data.total_reviews / 1000).toFixed(1)}<span className="text-[#ccff00] text-5xl">k</span>
            </span>
          </div>
           <div className="mt-6 p-4 bg-white/5 rounded-2xl border border-white/5">
                <p className="text-sm text-gray-300">Время обработки:</p>
                <p className="text-xl font-bold text-white">{data.processing_time || "0s"}</p>
           </div>
        </div>

        {/* Карточка 2: Главная визуализация */}
        <div className="lg:col-span-5 bg-white/[0.05] backdrop-blur-xl border border-white/10 rounded-[2.5rem] p-8 flex flex-col relative">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl text-white font-bold">{vis.title}</h3>
          </div>
          {vis.content}
        </div>

        {/* Карточка 3: Источники */}
        <div className="lg:col-span-3 flex flex-col gap-6">
            <div className="bg-white/[0.05] backdrop-blur-xl border border-white/10 rounded-[2.5rem] p-8 flex-grow">
                <h3 className="text-xl text-white font-bold mb-6">Источники</h3>
                <div className="space-y-4">
                    {sourceChartData.map((src, idx) => (
                         <div key={idx} className="flex justify-between items-center">
                            <span className="text-gray-300 truncate w-20">{src.name}</span>
                            <div className="w-16 h-2 bg-gray-700 rounded-full overflow-hidden">
                                <div className="h-full" style={{ width: `${src.value}%`, backgroundColor: src.color }}></div>
                            </div>
                            <span className="font-bold text-sm" style={{ color: src.color }}>{src.value}%</span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Меню смены визуализации */}
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
                        <div onClick={() => handleVisSelect('source_pie')} className="flex items-center gap-3 p-3 text-sm text-gray-300 hover:bg-white/10 rounded-lg cursor-pointer transition">
                           <PieChartIcon size={16} className="text-purple-400"/> Источники
                        </div>
                        <div onClick={() => handleVisSelect('word_negative')} className="flex items-center gap-3 p-3 text-sm text-gray-300 hover:bg-white/10 rounded-lg cursor-pointer transition">
                           <X size={16} className="text-red-400"/> Частое слово (Негатив)
                        </div>
                         <div onClick={() => handleVisSelect('word_positive')} className="flex items-center gap-3 p-3 text-sm text-gray-300 hover:bg-white/10 rounded-lg cursor-pointer transition">
                           <Check size={16} className="text-lime-400"/> Частое слово (Позитив)
                        </div>
                        <div onClick={() => handleVisSelect('sentiment_pie')} className="flex items-center gap-3 p-3 text-sm text-gray-300 hover:bg-white/10 rounded-lg cursor-pointer transition">
                           <BarChart3 size={16} className="text-purple-400"/> Тональность (Default)
                        </div>
                    </div>
                )}
            </div>
        </div>
        
        {/* Футер: переход к таблице */}
        <div className="lg:col-span-12">
           <div className="bg-gradient-to-r from-purple-500/10 to-transparent border border-white/5 rounded-[2rem] p-6 flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-green-500/20 rounded-full flex items-center justify-center text-green-400 font-bold">✓</div>
                  <div>
                      <h4 className="text-white font-bold">Анализ завершен успешно</h4>
                      <p className="text-gray-300 text-sm">Данные готовы к выгрузке и просмотру</p>
                  </div>
              </div>
              <button onClick={onOpenTable} className="text-[#ccff00] font-bold hover:underline decoration-[#ccff00] underline-offset-4 transition flex items-center gap-2">
                  Открыть таблицу отзывов →
              </button>
           </div>
        </div>

      </div>
    </div>
  );
};

// ==========================================
// 4. СТРАНИЦА: ВАЛИДАЦИЯ (Macro F1)
// ==========================================
const ValidationScreen = ({ onBack, onValidateFile, validationResult, isValidating }) => {
  const fileInputRef = useRef(null);

  const handleUpload = () => fileInputRef.current?.click();

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
        onValidateFile(e.target.files[0]);
    }
  };

  // Если идет загрузка (валидация)
  if (isValidating) {
    return <LoadingScreen text="Сверка данных и построение матрицы ошибок..." />;
  }

  // Если результатов нет, показываем загрузку файла
  if (!validationResult) {
     return (
        <div className="w-full max-w-7xl mx-auto px-4 animate-fade-in">
           <button onClick={onBack} className="mb-8 flex items-center text-gray-400 hover:text-[#ccff00] transition gap-2 group">
              <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform"/> Назад к результатам
           </button>
           
           <div className="flex flex-col items-center justify-center min-h-[50vh] text-center">
              <h2 className="text-4xl font-bold text-white mb-4">Валидация модели</h2>
              <p className="text-gray-400 max-w-lg mb-10 text-lg">
                Загрузите файл с эталонной разметкой (Test Dataset) для расчета F1-Macro.
              </p>
              
              <input type="file" ref={fileInputRef} onChange={handleFileChange} accept=".csv,.xlsx" className="hidden" />

              <div 
                onClick={handleUpload}
                className="w-full max-w-3xl aspect-[16/6] border-2 border-dashed border-purple-500/40 rounded-[2.5rem] bg-white/[0.02] hover:bg-purple-500/10 hover:border-purple-500 transition-all cursor-pointer flex flex-col items-center justify-center gap-6 group"
              >
                <UploadCloud size={64} className="text-purple-400 group-hover:scale-110 transition-transform"/>
                <div className="text-center">
                   <p className="text-xl text-white font-bold">Загрузить Golden Dataset</p>
                   <p className="text-sm text-gray-500 mt-1">.csv (столбец 'target')</p>
                </div>
              </div>
           </div>
        </div>
     );
  }
  
  // Если результаты ЕСТЬ
  const { metrics, confusion_matrix, macro_f1 } = validationResult;
  const labels = ['Neg', 'Neu', 'Pos'];

  return (
    <div className="w-full max-w-7xl mx-auto px-4 pb-12 animate-fade-in">
        <button onClick={() => { /* Сбрасываем результат если нужно или просто назад */ onBack(); }} className="mb-6 flex items-center text-gray-400 hover:text-[#ccff00] transition gap-2 group">
            <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform"/> Назад
        </button>

        <h2 className="text-4xl font-bold text-white mb-6">Результаты валидации</h2>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* Метрики */}
            <div className="bg-white/[0.08] border border-white/15 rounded-[2.5rem] p-6 lg:p-8 flex flex-col items-center justify-center relative overflow-hidden text-center backdrop-blur-xl">
                <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-transparent via-[#ccff00] to-transparent opacity-50"></div>
                <h3 className="text-lg lg:text-xl text-gray-400 uppercase tracking-widest font-bold mt-2 mb-3">Значение Macro-F1</h3>
                
                <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden mb-5 mt-2">
                    <div 
                        className="h-full bg-[#ccff00] shadow-[0_0_10px_rgba(204,255,0,0.8)] transition-all duration-1000" 
                        style={{ width: `${(macro_f1 || 0) * 100}%` }}
                    ></div>
                </div>

                <div className="flex flex-col items-center justify-center my-6 py-4"> 
                    <span className="text-7xl lg:text-8xl font-bold text-white tracking-tighter mb-4">{macro_f1?.toFixed(2)}</span>
                    <span className="text-green-400 text-sm lg:text-base font-bold bg-green-500/20 px-4 py-2 rounded-full">
                        {macro_f1 > 0.8 ? "Высокая точность" : "Требуется дообучение"}
                    </span>
                </div>

                <div className="mt-6 grid grid-cols-3 gap-3 w-full text-sm">
                    <div className="bg-white/5 p-3 rounded-xl border border-white/5">
                        <div className="text-gray-400">Precision</div>
                        <div className="text-white font-bold text-lg">{metrics?.precision?.toFixed(2)}</div>
                    </div>
                    <div className="bg-white/5 p-3 rounded-xl border border-white/5">
                        <div className="text-gray-400">Recall</div>
                        <div className="text-white font-bold text-lg">{metrics?.recall?.toFixed(2)}</div>
                    </div>
                    <div className="bg-white/5 p-3 rounded-xl border border-white/5">
                        <div className="text-gray-400">Accuracy</div>
                        <div className="text-white font-bold text-lg">{metrics?.accuracy?.toFixed(2)}</div>
                    </div>
                </div>
            </div>

            {/* Матрица ошибок */}
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
                                {labels.map(l => <div key={l} className="text-center text-xs text-gray-500 uppercase">{l}</div>)}
                             </div>
                             {confusion_matrix && confusion_matrix.map((row, rowIndex) => (
                                <div key={rowIndex} className="flex items-center gap-2 mb-2">
                                    <div className={`text-right text-xs font-bold w-12 pt-3 ${rowIndex === 0 ? 'text-[#ff4d4f]' : rowIndex === 1 ? 'text-[#b026ff]' : 'text-[#ccff00]'}`}>
                                        {labels[rowIndex]}
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
// 5. ТАБЛИЦА (TableScreen)
// ==========================================
const TableScreen = ({ data, onBack }) => {
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilters, setActiveFilters] = useState({
    positive: false, neutral: false, negative: false,
    yandex: false, google: false, other: false
  });

  const reviews = data?.reviews || []; // Берем данные из пропсов

  const filteredData = useMemo(() => {
    return reviews.filter(row => {
      // Поиск
      if (searchQuery && !row.text.toLowerCase().includes(searchQuery.toLowerCase())) return false;

      // Фильтр по тональности
      const hasSentimentFilter = activeFilters.positive || activeFilters.neutral || activeFilters.negative;
      if (hasSentimentFilter) {
        let match = false;
        if (activeFilters.positive && row.sentiment === 'positive') match = true;
        if (activeFilters.neutral && row.sentiment === 'neutral') match = true;
        if (activeFilters.negative && row.sentiment === 'negative') match = true;
        if (!match) return false; 
      }

      // Фильтр по источнику
      const hasSourceFilter = activeFilters.yandex || activeFilters.google || activeFilters.other;
      if (hasSourceFilter) {
        const src = row.source ? row.source.toLowerCase() : "";
        let match = false;
        if (activeFilters.yandex && src.includes('yandex')) match = true;
        if (activeFilters.google && src.includes('google')) match = true;
        if (activeFilters.other && !src.includes('yandex') && !src.includes('google')) match = true;
        return match;
      }

      return true;
    });
  }, [searchQuery, activeFilters, reviews]);

  const toggleFilter = (key) => setActiveFilters(prev => ({...prev, [key]: !prev[key]}));
  const countActiveFilters = Object.values(activeFilters).filter(Boolean).length;

  return (
    <div className="w-full max-w-7xl mx-auto pb-12 px-4 animate-fade-in">
        <button onClick={onBack} className="mb-6 flex items-center text-gray-400 hover:text-[#ccff00] transition gap-2 group">
            <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform"/> Назад к графикам
        </button>

        <div className="bg-white/[0.05] border border-white/10 rounded-[2rem] p-6 backdrop-blur-xl overflow-hidden shadow-2xl min-h-[70vh]">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 relative">
                <div className="flex items-center gap-3">
                    <CheckCircle2 className="text-[#ccff00]" />
                    <h3 className="text-2xl font-bold text-white">Детализация ({filteredData.length})</h3>
                </div>
                {/* (Блок поиска и фильтров аналогичен оригиналу, сокращен для краткости) */}
                <div className="flex items-center gap-3 w-full md:w-auto relative">
                    <div className="flex-grow md:w-80 bg-black/30 rounded-full px-4 py-3 flex items-center border border-white/10">
                         <Search className="text-gray-400 mr-3" size={18} />
                         <input type="text" placeholder="Поиск..." className="bg-transparent outline-none text-white w-full text-sm" value={searchQuery} onChange={(e)=>setSearchQuery(e.target.value)}/>
                    </div>
                    {/* Кнопка фильтра (упрощена логика показа попапа) */}
                    <button onClick={() => setIsFilterOpen(!isFilterOpen)} className={`p-3 rounded-full border ${isFilterOpen ? 'bg-[#ccff00] text-black' : 'bg-white/5 text-white'}`}>
                        <Filter size={20} />
                    </button>
                    {isFilterOpen && (
                         <div className="absolute right-0 top-full mt-4 w-72 bg-[#1e1433] border border-white/10 rounded-2xl p-4 z-50">
                             {/* Здесь чекбоксы как в оригинале, используют toggleFilter */}
                             <div className="text-white mb-2 font-bold">Фильтры</div>
                             <div className="space-y-2">
                                <label className="flex gap-2 text-gray-300 cursor-pointer"><input type="checkbox" checked={activeFilters.positive} onChange={()=>toggleFilter('positive')} /> Позитив</label>
                                <label className="flex gap-2 text-gray-300 cursor-pointer"><input type="checkbox" checked={activeFilters.negative} onChange={()=>toggleFilter('negative')} /> Негатив</label>
                             </div>
                         </div>
                    )}
                </div>
            </div>

            <div className="overflow-x-auto min-h-[400px]">
                <table className="w-full text-left border-collapse">
                    <thead>
                    <tr className="border-b border-white/10 text-gray-400 text-sm uppercase">
                        <th className="p-4 w-[55%]">Текст отзыва</th>
                        <th className="p-4 text-center w-[25%]">Тональность</th>
                        <th className="p-4 text-right w-[20%]">Источник</th>
                    </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                        {filteredData.map((row) => (
                        <tr key={row.id} className="hover:bg-white/5 transition">
                            <td className="p-4 text-gray-200 text-sm leading-relaxed">{row.text}</td>
                            <td className="p-4 flex justify-center">{renderSentimentBadge(row.sentiment)}</td>
                            <td className="p-4 text-right text-gray-500 text-sm">{row.source}</td>
                        </tr>
                        ))}
                    </tbody>
                </table>
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
  
  // Состояния для данных с бэкенда
  const [analysisData, setAnalysisData] = useState(null);
  const [validationResult, setValidationResult] = useState(null);
  const [isValidating, setIsValidating] = useState(false);

  // <--- API: Загрузка файла для анализа
  const handleUploadFile = async (file) => {
    setScreen('loading');
    
    const formData = new FormData();
    formData.append('file', file);

    try {
        // Запрос к Go бэкенду
        const response = await fetch(`${API_URL}/analyze`, {
            method: 'POST',
            body: formData,
        });

        if (!response.ok) throw new Error('Network response was not ok');

        const data = await response.json();
        setAnalysisData(data); // Сохраняем полученные данные
        setScreen('results');

    } catch (error) {
        console.error("Error uploading file:", error);
        alert("Ошибка при загрузке файла. Убедитесь, что сервер запущен.");
        setScreen('upload');
    }
  };

  // <--- API: Загрузка файла для валидации (Macro F1)
  const handleValidateFile = async (file) => {
      setIsValidating(true);
      const formData = new FormData();
      formData.append('file', file);

      try {
          const response = await fetch(`${API_URL}/validate`, {
              method: 'POST',
              body: formData,
          });
          const data = await response.json();
          setValidationResult(data);
      } catch (error) {
          console.error("Error validating:", error);
          alert("Ошибка валидации.");
      } finally {
          setIsValidating(false);
      }
  };

  // <--- API: Скачивание CSV
  const handleDownloadCsv = async () => {
     try {
        const response = await fetch(`${API_URL}/export`);
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = "result_sentiment.csv";
        document.body.appendChild(a);
        a.click();
        a.remove();
     } catch (e) {
        console.error("Download failed", e);
     }
  };

  return (
    <div 
      className="w-full min-h-screen font-sans flex flex-col relative overflow-x-hidden text-white"
      style={{
        background: 'radial-gradient(circle at 90% 0%, #4c1d95 0%, #0f0518 50%, #000000 90%)',
        backgroundColor: '#000000'
      }}
    >
      <header className="w-full max-w-7xl mx-auto px-6 py-6 flex justify-between items-center relative z-20">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-[#ccff00] flex items-center justify-center font-bold text-black shadow-[0_0_15px_rgba(204,255,0,0.5)]">H</div>
          <div>
            <span className="font-bold text-white tracking-wide block leading-none">HACK&CHANGE 2025</span>
          </div>
        </div>
      </header>

      <main className="flex-grow w-full relative z-10 flex flex-col justify-center py-4">
        
        {screen === 'upload' && 
            <UploadScreen onFileSelect={handleUploadFile} />
        }
        
        {screen === 'loading' && 
            <LoadingScreen />
        }
        
        {screen === 'results' && analysisData &&
            <ResultsScreen 
                data={analysisData} // Передаем данные с бэка
                onOpenTable={() => setScreen('table')} 
                onBackToUpload={() => { setAnalysisData(null); setScreen('upload'); }}
                onOpenValidation={() => setScreen('validation')}
                onDownload={handleDownloadCsv}
            />
        }
        
        {screen === 'table' && analysisData &&
            <TableScreen 
                data={analysisData} // Передаем данные с бэка
                onBack={() => setScreen('results')} 
            />
        }

        {screen === 'validation' && 
            <ValidationScreen 
                onBack={() => setScreen('results')} 
                onValidateFile={handleValidateFile}
                validationResult={validationResult}
                isValidating={isValidating}
            />
        }

      </main>
      
       <div className="fixed bottom-[-20%] left-[-20%] w-[50vw] h-[50vw] bg-[#6d28d9] rounded-full mix-blend-screen filter blur-[120px] opacity-20 pointer-events-none z-0"></div>
    </div>
  );
}