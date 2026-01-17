
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  X, ShieldCheck, Cpu, Zap, Database, ChevronRight, Menu, Layout, 
  Lock, BarChart3, Activity, Layers, Sparkles, BookOpen, Globe, 
  TrendingUp, Search, MousePointer2, Target, Info, CheckCircle2, 
  TrendingDown, Minus, LayoutGrid, BrainCircuit, Lightbulb, Scale,
  LineChart, AlertTriangle, ArrowUpRight, Gauge, Star, ArrowUpToLine, ArrowDownToLine,
  Building2, Users, ExternalLink, Share2, Calculator, ArrowUpDown, MessageSquare, Flame,
  RefreshCw, Trash2, Waves, Briefcase, Wallet, Download, Upload, List, Edit3
} from 'lucide-react';
import { APP_VERSION } from './Version';

interface ManualProps {
  isOpen: boolean;
  onClose: () => void;
}

interface Section {
  id: string;
  title: string;
  icon: React.ReactNode;
}

const SECTIONS: Section[] = [
  { id: 'man-philosophy', title: 'Visión y Filosofía', icon: <Lightbulb size={16} /> },
  { id: 'man-asset-card', title: 'Anatomía de la Ficha', icon: <Layout size={16} /> },
  { id: 'man-algorithm', title: 'Núcleo Algorítmico', icon: <Activity size={16} /> },
  { id: 'man-portfolio', title: 'Gestión de Cartera', icon: <Briefcase size={16} /> },
  { id: 'man-correlation', title: 'Análisis de Correlación', icon: <Calculator size={16} /> },
  { id: 'man-gemini', title: 'Motor de Inteligencia', icon: <Cpu size={16} /> },
  { id: 'man-lp', title: 'Estrategias de Liquidez', icon: <Gauge size={16} /> },
  { id: 'man-backup', title: 'Respaldo y Portabilidad', icon: <Database size={16} /> },
  { id: 'man-ux', title: 'Guía de Interfaz', icon: <MousePointer2 size={16} /> },
  { id: 'man-security', title: 'Arquitectura Privada', icon: <ShieldCheck size={16} /> }
];

const UIClip: React.FC<{ children: React.ReactNode, label: string }> = ({ children, label }) => (
  <div className="my-10 space-y-3">
    <div className="flex items-center gap-2">
      <div className="h-px flex-1 bg-gray-100"></div>
      <span className="text-[9px] font-black text-gray-300 uppercase tracking-[0.3em]">{label}</span>
      <div className="h-px flex-1 bg-gray-100"></div>
    </div>
    <div className="p-6 bg-gray-50/50 rounded-[3rem] border border-gray-100 shadow-inner flex justify-center overflow-hidden">
      <div className="bg-white p-6 rounded-2xl shadow-2xl border border-gray-100 scale-90 md:scale-100 origin-center max-w-full">
        {children}
      </div>
    </div>
  </div>
);

export const Manual: React.FC<ManualProps> = ({ isOpen, onClose }) => {
  const [activeSection, setActiveSection] = useState(SECTIONS[0].id);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const handleScroll = useCallback(() => {
    if (!scrollContainerRef.current) return;
    const container = scrollContainerRef.current;
    const scrollTop = container.scrollTop;
    const threshold = 150;

    for (const section of SECTIONS) {
      const element = document.getElementById(section.id);
      if (element) {
        const offsetTop = element.offsetTop - threshold;
        if (scrollTop >= offsetTop) setActiveSection(section.id);
      }
    }
  }, []);

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (isOpen && container) {
      container.addEventListener('scroll', handleScroll);
      return () => container.removeEventListener('scroll', handleScroll);
    }
  }, [isOpen, handleScroll]);

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element && scrollContainerRef.current) {
      scrollContainerRef.current.scrollTo({ 
        top: element.offsetTop - 20, 
        behavior: 'smooth' 
      });
      setActiveSection(id);
      if (window.innerWidth < 768) setIsSidebarOpen(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-md animate-in fade-in duration-300">
      <div className="bg-white w-full h-full md:h-[94vh] md:max-w-7xl md:rounded-[3rem] shadow-2xl overflow-hidden flex flex-col border border-gray-100 animate-in zoom-in-95 duration-300">
        
        <div className="p-6 md:p-8 border-b border-gray-100 flex justify-between items-center bg-white sticky top-0 z-30">
          <div className="flex items-center gap-4">
            <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-2 md:hidden hover:bg-gray-100 rounded-xl text-gray-900 transition-colors">
              <Menu size={24} />
            </button>
            <div className="p-3 bg-gray-900 rounded-2xl text-white shadow-xl shadow-black/10">
              <BookOpen size={24} />
            </div>
            <div>
              <h3 className="font-black text-gray-900 uppercase tracking-tighter text-2xl leading-none">Manual</h3>
              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-[0.3em] mt-1 hidden sm:block">Protocolo Operativo • Edición {APP_VERSION}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-3 hover:bg-red-50 rounded-full text-gray-400 hover:text-red-700 transition-all active:scale-90">
            <X size={28} />
          </button>
        </div>

        <div className="flex-1 flex overflow-hidden relative">
          <aside className={`absolute md:relative z-20 w-80 h-full bg-gray-50/30 border-r border-gray-100 flex flex-col transition-transform duration-300 ease-in-out ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}>
            <div className="p-8 space-y-2 overflow-y-auto">
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.25em] mb-6 px-4">Índice</p>
              {SECTIONS.map((section) => (
                <button 
                  key={section.id} 
                  onClick={() => scrollToSection(section.id)} 
                  className={`w-full flex items-center justify-between p-4 rounded-2xl transition-all group ${activeSection === section.id ? 'bg-white text-red-700 border-l-4 border-red-700 shadow-lg ring-1 ring-black/5' : 'text-gray-500 hover:bg-white hover:text-gray-900'}`}
                >
                  <div className="flex items-center gap-4">
                    <span className={activeSection === section.id ? 'text-red-700' : 'text-gray-400 group-hover:text-red-700 transition-colors'}>{section.icon}</span>
                    <span className={`text-[11px] font-black uppercase tracking-tight transition-all ${activeSection === section.id ? 'translate-x-1' : ''}`}>{section.title}</span>
                  </div>
                  {activeSection === section.id && <ChevronRight size={14} />}
                </button>
              ))}
            </div>
          </aside>

          <div ref={scrollContainerRef} className="flex-1 overflow-y-auto p-8 md:p-20 space-y-40 custom-scrollbar scroll-smooth bg-white">
            
            <section id="man-philosophy" className="max-w-4xl space-y-10 animate-in fade-in slide-in-from-bottom-6 duration-700 scroll-mt-20">
              <div className="space-y-4">
                <span className="text-red-700 font-black text-[11px] uppercase tracking-[0.5em] block">01. FUNDAMENTOS</span>
                <h2 className="text-7xl font-black text-gray-900 tracking-tighter leading-none italic">Análisis<br/><span className="text-red-700 not-italic">Determinist-IA.</span></h2>
              </div>
              <p className="text-gray-500 leading-relaxed text-lg font-medium border-l-4 border-gray-100 pl-8">
                CriptoGO mapea el presente con precisión matemática. Eliminamos el ruido priorizando el flujo del dinero real. Nuestro enfoque se basa en la Teoría de Ciclos de Mercado, donde cada fase tiene un propósito y una estrategia definida.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="p-8 rounded-3xl bg-gray-50 border border-gray-100 space-y-3">
                  <h4 className="font-black text-xs uppercase tracking-widest text-gray-900">Métricas de Verdad</h4>
                  <p className="text-xs text-gray-500 leading-relaxed">Priorizamos datos On-Chain y de mercado directo (Binance/Yahoo) sobre opiniones de terceros. Lo que ves es el consenso real del dinero.</p>
                </div>
                <div className="p-8 rounded-3xl bg-gray-50 border border-gray-100 space-y-3">
                  <h4 className="font-black text-xs uppercase tracking-widest text-gray-900">Soberanía de Datos</h4>
                  <p className="text-xs text-gray-500 leading-relaxed">Toda tu inteligencia operativa se queda en tu máquina. CriptoGO es una herramienta, no una plataforma de vigilancia.</p>
                </div>
              </div>
            </section>

            <section id="man-asset-card" className="max-w-4xl space-y-12 scroll-mt-20">
              <div className="space-y-4">
                <span className="text-red-700 font-black text-[11px] uppercase tracking-[0.5em] block">02. ANATOMÍA OPERATIVA</span>
                <h2 className="text-6xl font-black text-gray-900 tracking-tighter leading-tight">La Ficha de Activo<br/><span className="text-red-700">Multi-Herramienta Pro</span></h2>
              </div>
              
              <div className="space-y-16">
                <div className="space-y-6">
                    <div className="flex items-center gap-4 mb-4">
                        <div className="p-3 bg-gray-900 rounded-2xl text-white shadow-sm"><Layout size={24} /></div>
                        <h4 className="font-black text-xl uppercase tracking-tighter text-gray-900">1. Termómetro MA20 y Gráficos</h4>
                    </div>
                    <p className="text-sm text-gray-600 leading-relaxed text-justify">
                        La cabecera muestra el <strong>Termómetro MA20</strong>. Si el valor es muy alto (+20%), el activo está extendido. El botón **GRÁFICO** abre una instancia de TradingView con medias móviles preconfiguradas.
                    </p>
                </div>

                <div className="space-y-6">
                    <div className="flex items-center gap-4 mb-4">
                        <div className="p-3 bg-indigo-700 rounded-2xl text-white shadow-lg"><Waves size={24} /></div>
                        <h4 className="font-black text-xl uppercase tracking-tighter text-gray-900">2. Fibonacci y Pivotes (D/W/M)</h4>
                    </div>
                    <p className="text-sm text-gray-600 leading-relaxed text-justify">
                        Analizamos la estructura mediante <strong>Retrocesos de Fibonacci</strong> y <strong>Puntos Pivote</strong>. Al pulsar en los niveles R1/S1 o en el icono de Waves, se despliega la lógica matemática:
                    </p>
                    <ul className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs text-gray-600">
                      <li className="flex gap-3 items-start"><Waves size={16} className="text-indigo-500 mt-0.5 shrink-0" /> <div><strong>Golden Pocket (61.8%):</strong> Detectamos automáticamente la zona de mayor probabilidad de rebote institucional.</div></li>
                      <li className="flex gap-3 items-start"><AlertTriangle size={16} className="text-amber-500 mt-0.5 shrink-0" /> <div><strong>Paradoja de Pivotes:</strong> Explicamos por qué un R1 Mensual bajo el Diario indica "Descubrimiento de Precio".</div></li>
                    </ul>

                    <UIClip label="RECORTE: HERRAMIENTAS TÉCNICAS">
                        <div className="flex gap-2">
                            <div className="p-2 bg-indigo-50 border border-indigo-100 rounded-lg flex items-center gap-2"><Waves size={12} className="text-indigo-600"/> <span className="text-[9px] font-black text-indigo-700">FIBONACCI</span></div>
                            <div className="p-2 bg-gray-50 border border-gray-200 rounded-lg flex items-center gap-2"><ArrowUpToLine size={12} className="text-red-700"/> <span className="text-[9px] font-black text-gray-600">PIVOTS</span></div>
                        </div>
                    </UIClip>
                </div>
              </div>
            </section>

            <section id="man-algorithm" className="max-w-4xl space-y-12 scroll-mt-20">
              <div className="space-y-4">
                <span className="text-red-700 font-black text-[11px] uppercase tracking-[0.5em] block">03. NÚCLEO TÉCNICO</span>
                <h2 className="text-6xl font-black text-gray-900 tracking-tighter leading-tight">Las 4 Etapas del Ciclo</h2>
              </div>
              <p className="text-gray-600 leading-relaxed text-base">
                Nuestro motor clasifica el comportamiento del precio en cuatro cuadrantes definidos por la interacción con la <strong>MA20</strong>.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch">
                  <div className="p-8 rounded-[2.5rem] bg-emerald-50 border border-emerald-100 space-y-4 shadow-sm flex flex-col h-full">
                    <div className="flex items-center justify-between"><h4 className="text-emerald-900 font-black text-[10px] uppercase tracking-[0.2em]">1. ACUMULACIÓN</h4><div className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-emerald-600 font-black text-sm shadow-sm">1</div></div>
                    <p className="text-xs text-emerald-800/80 leading-relaxed flex-1">Lateralización. El precio abraza la MA20. **Acción: Vigilar.**</p>
                  </div>
                  <div className="p-8 rounded-[2.5rem] bg-emerald-900 text-white space-y-4 shadow-2xl relative overflow-hidden flex flex-col h-full">
                    <div className="absolute top-0 right-0 p-4 opacity-10"><TrendingUp size={80} /></div>
                    <div className="flex items-center justify-between relative z-10"><h4 className="text-emerald-100 font-black text-[10px] uppercase tracking-[0.2em]">2. ALCISTA</h4><div className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-emerald-900 font-black text-sm">2</div></div>
                    <p className="text-xs text-emerald-100/70 leading-relaxed relative z-10 flex-1">Tendencia fuerte confirmada. Zona de máxima rentabilidad. **Acción: Comprar.**</p>
                  </div>
              </div>
            </section>

            <section id="man-portfolio" className="max-w-4xl space-y-12 scroll-mt-20">
              <div className="space-y-4">
                <span className="text-red-700 font-black text-[11px] uppercase tracking-[0.5em] block">04. CONTROL DE POSICIONES</span>
                <h2 className="text-6xl font-black text-gray-900 tracking-tighter leading-tight">Gestión Maestro de Cartera</h2>
              </div>
              <p className="text-gray-500 leading-relaxed text-base font-medium">
                CriptoGO integra un motor de seguimiento de activos con múltiples carteras y valoración en tiempo real.
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-6">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-gray-900 rounded-xl text-white"><Globe size={20} /></div>
                    <h4 className="font-black text-sm uppercase tracking-widest text-gray-900">Vista Consolidada (TOTAL)</h4>
                  </div>
                  <p className="text-xs text-gray-500 leading-relaxed">
                    La pestaña **TOTAL** ofrece una visión virtual que suma todos tus activos de todas las carteras. Calcula el P&L global y el valor neto actual utilizando los tipos de cambio y precios de Binance/Yahoo.
                  </p>
                </div>
                <div className="space-y-6">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-red-700 rounded-xl text-white"><Zap size={20} /></div>
                    <h4 className="font-black text-sm uppercase tracking-widest text-gray-900">Auto-Check de Precios</h4>
                  </div>
                  <p className="text-xs text-gray-500 leading-relaxed">
                    Al registrar una posición, el icono de **Rayo (Zap)** consulta automáticamente el precio histórico del activo en la fecha seleccionada. No necesitas buscar precios pasados manualmente.
                  </p>
                </div>
              </div>

              <UIClip label="RECORTE: HERRAMIENTAS DE CARTERA">
                  <div className="flex flex-col gap-4">
                      <div className="flex gap-2">
                        <div className="p-3 bg-gray-50 border border-gray-200 rounded-2xl flex items-center gap-2"><List size={16} className="text-gray-400"/> <span className="text-[10px] font-black text-gray-900">LISTA</span></div>
                        <div className="p-3 bg-red-50 border border-red-100 rounded-2xl flex items-center gap-2"><LayoutGrid size={16} className="text-red-700"/> <span className="text-[10px] font-black text-red-700">GRID</span></div>
                        <div className="p-3 bg-indigo-50 border border-indigo-100 rounded-2xl flex items-center gap-2"><Wallet size={16} className="text-indigo-700"/> <span className="text-[10px] font-black text-indigo-700">AÑADIR DESDE ANÁLISIS</span></div>
                      </div>
                      <p className="text-[10px] text-gray-400 font-medium italic">Pulsa el icono de Cartera en cualquier tarjeta de Análisis para pre-cargar el activo en tu portafolio activo.</p>
                  </div>
              </UIClip>
            </section>

            <section id="man-correlation" className="max-w-4xl space-y-12 scroll-mt-20">
              <div className="space-y-4">
                <span className="text-red-700 font-black text-[11px] uppercase tracking-[0.5em] block">05. ANÁLISIS CUANTITATIVO</span>
                <h2 className="text-6xl font-black text-gray-900 tracking-tighter leading-tight">Motor de Correlación Matrix</h2>
              </div>
              <p className="text-gray-600 leading-relaxed text-base">
                El módulo Matrix compara matemáticamente dos activos mediante el <strong>Coeficiente de Pearson</strong> y la nueva métrica de <strong>Volatilidad del Par</strong>.
              </p>
              
              <div className="bg-gray-900 text-white p-10 rounded-[3rem] space-y-8 shadow-2xl overflow-hidden relative">
                 <div className="absolute top-0 right-0 p-8 opacity-5"><Calculator size={200} /></div>
                 <div className="flex items-center gap-3 text-red-500 relative z-10"><Calculator size={24} /> <h5 className="font-black text-sm uppercase tracking-widest">Métricas de Conexión</h5></div>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-10 relative z-10">
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 text-emerald-400 font-black text-xs uppercase tracking-widest"><Scale size={14}/> Coeficiente Pearson</div>
                      <p className="text-[11px] text-gray-400 leading-relaxed">Mide la sincronía. +1.0 indica que son "gemelos" (ideal para LP), mientras que 0.0 indica independencia total (ideal para diversificación).</p>
                    </div>
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 text-indigo-400 font-black text-xs uppercase tracking-widest"><Activity size={14}/> Volatilidad del Par</div>
                      <p className="text-[11px] text-gray-400 leading-relaxed">Mide el "riesgo de baile" del ratio. Si es alta (&gt;15%), los rangos de liquidez deben ser más anchos para evitar el Impermanent Loss.</p>
                    </div>
                 </div>
              </div>
            </section>

            <section id="man-gemini" className="max-w-4xl space-y-12 scroll-mt-20">
              <div className="space-y-4">
                <span className="text-red-700 font-black text-[11px] uppercase tracking-[0.5em] block">06. INTELIGENCIA GENERATIVA</span>
                <h2 className="text-6xl font-black text-gray-900 tracking-tighter leading-tight">Gemini AI Engine</h2>
              </div>
              <p className="text-gray-600 leading-relaxed text-base">
                Integramos modelos Gemini para procesar el sentimiento y la técnica. Al configurar tu <strong>API Key</strong>, habilitas el cerebro analítico.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="p-10 bg-white border border-gray-100 rounded-[3rem] shadow-sm hover:shadow-xl transition-all space-y-5 group">
                    <div className="flex items-center gap-3 text-gray-900 group-hover:text-red-700 transition-colors"><BrainCircuit size={32} /><h5 className="font-black text-xs uppercase tracking-[0.2em]">Oráculo de Mercado</h5></div>
                    <p className="text-xs text-gray-500 leading-relaxed italic">"Analiza la interacción técnica, detecta divergencias y te ofrece un veredicto en lenguaje natural."</p>
                  </div>
              </div>
            </section>

            <section id="man-lp" className="max-w-4xl space-y-12 scroll-mt-20">
              <div className="space-y-4">
                <span className="text-red-700 font-black text-[11px] uppercase tracking-[0.5em] block">07. GENERACIÓN DE RENDIMIENTO</span>
                <h2 className="text-6xl font-black text-gray-900 tracking-tighter leading-tight">Estrategias de Liquidez V3</h2>
              </div>
              <p className="text-gray-600 leading-relaxed text-base">
                Calculamos rangos óptimos para protocolos como <strong>Uniswap V3</strong> basándonos en la volatilidad actual del par.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="p-8 rounded-[2.5rem] bg-emerald-50 border border-emerald-100 flex flex-col items-center text-center group hover:bg-emerald-100 transition-colors">
                    <ShieldCheck className="text-emerald-600 mb-4 group-hover:scale-110 transition-transform" size={32} />
                    <h5 className="font-black text-[10px] uppercase tracking-widest text-emerald-900 mb-2">CONSERVADOR</h5>
                    <p className="text-[10px] text-emerald-800/70">Cubre el rango histórico + margen. Bajo riesgo de IL, mantenimiento mínimo.</p>
                </div>
                <div className="p-8 rounded-[2.5rem] bg-amber-50 border border-amber-100 flex flex-col items-center text-center group hover:bg-amber-100 transition-colors">
                    <Zap className="text-amber-600 mb-4 group-hover:scale-110 transition-transform" size={32} />
                    <h5 className="font-black text-[10px] uppercase tracking-widest text-amber-900 mb-2">AGRESIVO</h5>
                    <p className="text-[10px] text-amber-800/70">Concentrado en la volatilidad (1 Sigma). Máximo APR, alto riesgo de rango.</p>
                </div>
              </div>
            </section>

            <section id="man-backup" className="max-w-4xl space-y-12 scroll-mt-20">
              <div className="space-y-4">
                <span className="text-red-700 font-black text-[11px] uppercase tracking-[0.5em] block">08. PORTABILIDAD TOTAL</span>
                <h2 className="text-6xl font-black text-gray-900 tracking-tighter leading-tight">Respaldo y Restauración</h2>
              </div>
              <p className="text-gray-500 leading-relaxed text-base">
                Toda tu configuración puede ser exportada en un único archivo de sistema para migrar entre dispositivos o asegurar tus datos.
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="p-10 rounded-[3rem] bg-gray-50 border border-gray-100 space-y-4">
                  <div className="flex items-center gap-3">
                    <Download size={24} className="text-gray-900" />
                    <h4 className="font-black text-sm uppercase tracking-widest text-gray-900">Exportar (.config)</h4>
                  </div>
                  <p className="text-xs text-gray-500 leading-relaxed">
                    Genera un archivo JSON cifrado con tu **API Key**, favoritos, carteras de inversión, perfiles de riesgo y preferencias de UI. Es un backup completo de tu "Cerebro CriptoGO".
                  </p>
                </div>
                <div className="p-10 rounded-[3rem] bg-gray-50 border border-gray-100 space-y-4">
                  <div className="flex items-center gap-3">
                    <Upload size={24} className="text-red-700" />
                    <h4 className="font-black text-sm uppercase tracking-widest text-gray-900">Importar y Sincronizar</h4>
                  </div>
                  <p className="text-xs text-gray-500 leading-relaxed">
                    Al cargar un archivo de configuración, el sistema realiza una **Sincronización Atómica**. Los datos locales son sobrescritos por la boveda importada y la aplicación se reinicia automáticamente para aplicar los cambios.
                  </p>
                </div>
              </div>

              <div className="bg-red-50 p-6 rounded-3xl border border-red-100 flex items-start gap-4">
                <Info size={20} className="text-red-700 shrink-0 mt-0.5" />
                <p className="text-[11px] text-red-900 font-bold leading-relaxed uppercase tracking-tight">
                  Nota: El archivo de configuración contiene tu clave API. Mantenlo en un lugar seguro y no lo compartas con terceros.
                </p>
              </div>
            </section>

            <section id="man-ux" className="max-w-4xl space-y-12 scroll-mt-20">
              <div className="space-y-4">
                <span className="text-red-700 font-black text-[11px] uppercase tracking-[0.5em] block">09. EXPERIENCIA OPERATIVA</span>
                <h2 className="text-6xl font-black text-gray-900 tracking-tighter leading-tight">Guía de Interfaz</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                <div className="space-y-4 bg-gray-50 p-10 rounded-[3rem] border border-gray-100 shadow-inner">
                  <h5 className="font-black text-xs uppercase tracking-widest text-gray-900 flex items-center gap-2"><Search size={18} className="text-red-700" /> Búsqueda IA Inteligente</h5>
                  <p className="text-xs text-gray-500 leading-relaxed">Usa comandos especiales para que la IA te recomiende activos con el mejor Momentum:</p>
                  <ul className="text-[10px] text-gray-400 space-y-2">
                    <li className="flex items-center gap-3"><code className="bg-white border border-gray-200 px-1.5 py-0.5 rounded font-mono font-black text-red-700">?</code> <span>Mejor Setup equilibrado.</span></li>
                    <li className="flex items-center gap-3"><code className="bg-white border border-gray-200 px-1.5 py-0.5 rounded font-mono font-black text-red-700">?+</code> <span>Short Term Momentum.</span></li>
                  </ul>
                </div>
              </div>
            </section>

            <section id="man-security" className="max-w-4xl space-y-12 pb-40 scroll-mt-20">
              <div className="space-y-4">
                <span className="text-red-700 font-black text-[11px] uppercase tracking-[0.5em] block">10. PRIVACIDAD</span>
                <h2 className="text-6xl font-black text-gray-900 tracking-tighter leading-tight">Seguridad Maestro</h2>
              </div>
              <div className="bg-gray-900 text-white p-16 rounded-[4rem] border border-gray-800 space-y-12 relative overflow-hidden shadow-2xl">
                <div className="absolute top-0 right-0 p-12 opacity-[0.03] animate-pulse"><ShieldCheck size={260} /></div>
                <div className="flex items-center gap-6 text-red-500 relative z-10"><Lock size={48} className="animate-bounce" /><h4 className="font-black text-3xl uppercase tracking-tighter italic">Local-First Architecture</h4></div>
                <p className="text-sm text-gray-400 leading-relaxed relative z-10 text-justify max-w-2xl">Toda tu configuración, favoritos y API Keys se guardan en el <strong>LocalStorage</strong> de tu navegador. No existe servidor intermedio que recolecte tu actividad. Privacidad por diseño.</p>
              </div>
            </section>

          </div>
        </div>

        <div className="p-6 border-t border-gray-100 bg-white md:hidden">
          <button onClick={onClose} className="w-full bg-gray-900 hover:bg-black text-white py-4 rounded-[2rem] font-black text-xs uppercase tracking-[0.2em] transition-all shadow-xl active:scale-95">Cerrar Manual Operativo</button>
        </div>
      </div>
    </div>
  );
};
