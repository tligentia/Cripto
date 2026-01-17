
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  Sparkles, MessageSquare, ChevronRight, Repeat, Eye, EyeOff, 
  Plus, Trash2, Edit2, FileText, Play, ExternalLink, BrainCircuit, 
  Zap, Heart, Globe, Save, X, ListOrdered
} from 'lucide-react';
import { GoogleGenAI } from "@google/genai";
import { MODAL_CONTENT, GEMINI_LABS } from '../constants';

// --- TYPES ---

interface ResourceLink {
  name: string;
  url: string;
  explanation: string;
  networks: string;
  isFavorite?: boolean;
}

interface Category {
  id: string;
  title: string;
  order: number;
  emoji: string;
  desc: string;
  links: ResourceLink[];
}

// --- CONSTANTS ---

const CATEGORY_ICONS: Record<string, string> = {
  'Wallets': '🔑',
  'DEXs': '🔄',
  'Lending': '💰',
  'Agregadores': '📊',
  'Data Agg': '🪙',
  'On-Chain': '🔗',
  'Explorers': '🔎',
  'Explorador': '🔎',
  'Trackers': '🛰️',
  'TradFi': '🏛️',
  'Visualizador': '🖥️',
  'Fiscalidad': '⚖️',
  'Rastreador': '📡'
};

const CATEGORY_DESCS: Record<string, string> = {
  'Wallets': 'Gestión de claves y custodia de activos digitales.',
  'DEXs': 'Intercambios descentralizados sin intermediarios.',
  'Lending': 'Protocolos de préstamo y generación de interés.',
  'Agregadores': 'Optimización de rutas y liquidez multired.',
  'Visualizador': 'Análisis de mercado y monitorización de carteras.',
  'Fiscalidad': 'Control de impuestos y reporting tributario.',
  'Rastreador': 'Inteligencia y seguimiento de flujos on-chain.',
  'Explorador': 'Verificación de transacciones y contratos.'
};

// --- SUB-COMPONENTES ---

const EditLinkForm: React.FC<{
  link: ResourceLink;
  onSave: (updated: ResourceLink) => void;
  onCancel: () => void;
}> = ({ link, onSave, onCancel }) => {
  const [local, setLocal] = useState<ResourceLink>({ ...link });

  return (
    <div className="bg-gray-50 border border-gray-200 rounded-2xl p-4 mt-2 animate-in zoom-in-95 duration-200 shadow-inner">
      <div className="flex justify-between items-center mb-3">
        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Editor de Recurso</span>
        <button onClick={onCancel} className="text-gray-400 hover:text-red-700 transition-colors"><X size={14} /></button>
      </div>
      <div className="grid grid-cols-1 gap-3">
        <input 
          type="text" 
          value={local.name} 
          onChange={(e) => setLocal({ ...local, name: e.target.value })} 
          placeholder="Nombre"
          className="w-full text-[11px] font-bold p-2 bg-white border border-gray-200 rounded-xl outline-none focus:border-red-700"
        />
        <input 
          type="text" 
          value={local.url} 
          onChange={(e) => setLocal({ ...local, url: e.target.value })} 
          placeholder="URL"
          className="w-full text-[11px] font-bold p-2 bg-white border border-gray-200 rounded-xl outline-none focus:border-red-700"
        />
        <textarea 
          value={local.explanation} 
          onChange={(e) => setLocal({ ...local, explanation: e.target.value })} 
          placeholder="Descripción"
          className="w-full text-[11px] font-bold p-2 bg-white border border-gray-200 rounded-xl outline-none focus:border-red-700 min-h-[60px]"
        />
      </div>
      <button 
        onClick={() => onSave(local)} 
        className="w-full mt-3 bg-red-700 text-white py-2 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-red-800 transition-all shadow-md"
      >
        <Save size={14} /> Guardar Cambios
      </button>
    </div>
  );
};

const ResourceForm: React.FC<{
  categoryId: string;
  title: string;
  onAdd: (categoryId: string, link: ResourceLink) => void;
}> = ({ categoryId, title, onAdd }) => {
  const [localLink, setLocalLink] = useState<ResourceLink>({ 
    name: '', 
    url: '', 
    explanation: '', 
    networks: '' 
  });

  const handleAdd = () => {
    if (!localLink.name || !localLink.url) return;
    onAdd(categoryId, localLink);
    setLocalLink({ name: '', url: '', explanation: '', networks: '' });
  };

  return (
    <div className="mt-4 pt-4 border-t border-gray-100 flex flex-col gap-3 animate-in fade-in slide-in-from-top-2 duration-300">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <input 
          type="text" 
          placeholder="Nombre" 
          value={localLink.name} 
          onChange={(e) => setLocalLink({ ...localLink, name: e.target.value })} 
          className="w-full text-[11px] font-bold p-2.5 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-red-700" 
        />
        <input 
          type="text" 
          placeholder="URL" 
          value={localLink.url} 
          onChange={(e) => setLocalLink({ ...localLink, url: e.target.value })} 
          className="w-full text-[11px] font-bold p-2.5 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-red-700" 
        />
      </div>
      <button 
        onClick={handleAdd} 
        className="w-full bg-gray-900 text-white py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-black transition-all flex items-center justify-center gap-2"
      >
        <Plus size={14} /> Añadir a {title}
      </button>
    </div>
  );
};

interface ResourceCardProps {
  item: Category;
  editingId: string | null;
  setEditingId: (id: string | null) => void;
  removeResourceLink: (categoryId: string, linkName: string) => void;
  addResourceLink: (categoryId: string, link: ResourceLink) => void;
  updateResourceLink: (categoryId: string, oldName: string, updated: ResourceLink) => void;
  toggleFavorite: (categoryId: string, linkName: string) => void;
}

const ResourceCard: React.FC<ResourceCardProps> = ({ 
  item, 
  editingId, 
  setEditingId, 
  removeResourceLink, 
  addResourceLink, 
  updateResourceLink,
  toggleFavorite
}) => {
  const [editingLinkName, setEditingLinkName] = useState<string | null>(null);

  const sortedLinks = useMemo(() => {
    return [...item.links].sort((a, b) => {
      if (a.isFavorite && !b.isFavorite) return -1;
      if (!a.isFavorite && b.isFavorite) return 1;
      return a.name.localeCompare(b.name);
    });
  }, [item.links]);

  return (
    <div className="bg-white border border-gray-100 p-6 rounded-3xl shadow-sm hover:border-gray-200 hover:shadow-md transition-all flex flex-col group h-full relative">
      <div className="flex gap-4 items-start mb-5">
        <div className="flex-shrink-0 w-12 h-12 bg-gray-50 rounded-2xl border border-gray-100 flex items-center justify-center text-2xl grayscale group-hover:grayscale-0 transition-all">
          {item.emoji}
        </div>
        <div className="flex-1 min-w-0 pt-0.5">
          <div className="flex justify-between items-center mb-1">
            <h4 className="font-black text-gray-900 uppercase text-xs tracking-wider truncate leading-none">
              {item.title}
            </h4>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black text-gray-300 font-mono">{item.order}</span>
              <button 
                onClick={() => {
                  setEditingId(editingId === item.id ? null : item.id);
                  setEditingLinkName(null);
                }} 
                className={`p-1.5 rounded-lg transition-colors ${editingId === item.id ? 'text-red-700 bg-red-50' : 'text-gray-300 hover:text-red-700 hover:bg-gray-50'}`}
              >
                <Edit2 size={14} />
              </button>
            </div>
          </div>
          <p className="text-gray-400 text-[10px] font-bold uppercase tracking-widest leading-none">
            {item.desc}
          </p>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 mb-2">
        {sortedLinks.map((link) => (
          <div 
            key={link.name} 
            onClick={() => editingId === item.id && setEditingLinkName(link.name)}
            className={`inline-flex items-center gap-2 px-3 py-1.5 border rounded-2xl group/link transition-all cursor-pointer ${link.isFavorite ? 'bg-red-50 border-red-200 shadow-sm' : 'bg-gray-50 border-gray-100 hover:border-gray-300'} ${editingId === item.id ? 'ring-2 ring-red-700/10' : ''}`}
            title={link.explanation || 'Ver Recurso'}
          >
            <button 
              onClick={(e) => { e.stopPropagation(); toggleFavorite(item.id, link.name); }}
              className={`transition-colors ${link.isFavorite ? 'text-red-700' : 'text-gray-300 hover:text-red-400'}`}
            >
              <Heart size={10} fill={link.isFavorite ? "currentColor" : "none"} />
            </button>
            <div className="flex flex-col">
              <a 
                href={editingId === item.id ? '#' : link.url} 
                target={editingId === item.id ? '_self' : '_blank'} 
                rel="noreferrer" 
                className="text-[10px] font-black text-gray-800 uppercase tracking-tight group-hover/link:text-red-700 transition-colors"
                onClick={(e) => editingId === item.id && e.preventDefault()}
              >
                {link.name}
              </a>
            </div>
            {editingId === item.id && (
              <button 
                onClick={(e) => { e.stopPropagation(); removeResourceLink(item.id, link.name); }} 
                className="text-gray-300 hover:text-red-700 transition-colors ml-1"
              >
                <Trash2 size={10} />
              </button>
            )}
            <ExternalLink size={10} className="text-gray-300 group-hover/link:text-red-400 transition-colors" />
          </div>
        ))}
      </div>

      {editingId === item.id && editingLinkName && (
        <EditLinkForm 
          link={item.links.find(l => l.name === editingLinkName)!}
          onSave={(upd) => { updateResourceLink(item.id, editingLinkName, upd); setEditingLinkName(null); }}
          onCancel={() => setEditingLinkName(null)}
        />
      )}

      {editingId === item.id && !editingLinkName && (
        <ResourceForm 
          categoryId={item.id} 
          title={item.title} 
          onAdd={addResourceLink} 
        />
      )}
    </div>
  );
};

const ResultBox: React.FC<{
  id: string;
  label: string;
  res: { loading: boolean; text: string } | undefined;
  isExpanded: boolean;
  onToggleExpand: (id: string) => void;
  onAction?: () => void;
}> = ({ id, label, res, isExpanded, onToggleExpand, onAction }) => {
  if (!res && id.startsWith('quadrant-')) {
      return (
          <button 
              onClick={onAction}
              className="w-full text-left bg-gray-50 hover:bg-red-50 rounded-2xl border border-dashed border-gray-200 hover:border-red-200 transition-all group p-5 flex items-center justify-between"
          >
              <div className="flex items-center gap-3">
                  <div className="p-2 bg-white rounded-lg shadow-sm group-hover:bg-red-700 group-hover:text-white transition-colors">
                      <Play size={12} fill="currentColor" />
                  </div>
                  <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest group-hover:text-red-700">Explorar Teoría</span>
              </div>
              <ChevronRight size={14} className="text-gray-300 group-hover:text-red-700 group-hover:translate-x-1 transition-all" />
          </button>
      );
  }

  if (!res) return null;

  return (
    <div className="w-full text-left bg-white rounded-2xl border border-gray-200 animate-in fade-in slide-in-from-top-2 duration-500 overflow-hidden shadow-sm mt-4">
      <div className="flex items-center justify-between px-6 py-3 bg-gray-50/80 border-b border-gray-200">
        <div className="flex items-center gap-2 text-[10px] font-black text-gray-500 uppercase tracking-widest">
          <MessageSquare size={14} className="text-red-700" /> {label}
        </div>
        <button onClick={() => onToggleExpand(id)} className="text-[9px] font-black text-gray-400 uppercase tracking-widest hover:text-red-700 flex items-center gap-1">
          {isExpanded ? <><EyeOff size={10} /> Resumir</> : <><Eye size={10} /> Ver Todo</>}
        </button>
      </div>
      <div className="p-6">
        {res.loading ? (
          <div className="py-10 flex flex-col items-center justify-center">
            <Repeat size={24} className="text-gray-200 animate-spin mb-3" />
            <p className="text-gray-400 text-[10px] font-black uppercase tracking-widest">Sintetizando...</p>
          </div>
        ) : (
          <div className={`text-gray-900 text-[13px] leading-relaxed whitespace-pre-wrap font-sans font-semibold transition-all duration-300 ${!isExpanded ? 'line-clamp-4 opacity-80' : 'opacity-100'}`}>
            {res.text}
          </div>
        )}
      </div>
    </div>
  );
};

// --- COMPONENTE PRINCIPAL ---

export const Guia: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'herramientas' | 'ia' | 'teoria'>('herramientas');
  const [aiResults, setAiResults] = useState<Record<string, { loading: boolean, text: string }>>({});
  const [expandedResults, setExpandedResults] = useState<Record<string, boolean>>({});
  const [formStates, setFormStates] = useState<Record<string, any>>({});
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isLoadingCsv, setIsLoadingCsv] = useState(true);

  // Cargamos el estado guardado del localStorage para inyectar preferencias de usuario
  const [categories, setCategories] = useState<Category[]>(() => {
    try {
      const saved = localStorage.getItem('guia_user_categories_v25');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });

  // CARGA DINÁMICA DE CSV AL INICIAR
  useEffect(() => {
    const loadCsvData = async () => {
      try {
        // Usamos el endpoint de exportación de Google Sheets para obtener el CSV
        const spreadsheetId = '19BqYHKLXXjNmZCU7DSQeqj1VKoASD1Kt4lj8Vnu1XoA';
        const targetUrl = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/export?format=csv`;
        
        // Usamos corsproxy.io para evitar errores de CORS si ocurren
        const proxyUrl = `https://corsproxy.io/?${encodeURIComponent(targetUrl)}`;
        
        const response = await fetch(proxyUrl);
        if (!response.ok) throw new Error(`HTTP Error: ${response.status}`);
        
        const text = await response.text();
        const lines = text.split('\n').filter(l => l.trim() !== '');
        
        const rows = lines.map(line => {
          const parts: string[] = [];
          let current = '';
          let inQuotes = false;
          for (let i = 0; i < line.length; i++) {
            if (line[i] === '"') inQuotes = !inQuotes;
            else if (line[i] === ',' && !inQuotes) { parts.push(current.trim()); current = ''; }
            else current += line[i];
          }
          parts.push(current.trim());
          return parts;
        }).filter(row => {
          const ordinal = parseInt(row[0]);
          return !isNaN(ordinal) && row.length > 1; // Solo procesar filas con ordinal válido (numérico)
        });

        const csvCategoriesMap = new Map<string, Category>();

        rows.forEach(row => {
          const ordinal = parseInt(row[0]);
          const tipologia = row[1]; // COLUMNA 2: Nombre del Grupo (Tipología)
          const nombre = row[2];
          const url = row[3];
          const redes = row[4] || '';
          const explicacion = row[5] || '';
          
          if (!csvCategoriesMap.has(tipologia)) {
            csvCategoriesMap.set(tipologia, {
              id: tipologia.toLowerCase().replace(/\s+/g, '-'),
              title: tipologia,
              order: ordinal,
              emoji: CATEGORY_ICONS[tipologia] || '📦',
              desc: CATEGORY_DESCS[tipologia] || `Recursos de ${tipologia}.`,
              links: []
            });
          }

          csvCategoriesMap.get(tipologia)!.links.push({
            name: nombre,
            url: url,
            explanation: explicacion,
            networks: redes,
            isFavorite: false
          });
        });

        // Ordenar categorías según el ordinal del CSV
        const csvCategoriesSorted = Array.from(csvCategoriesMap.values()).sort((a, b) => a.order - b.order);

        // MEZCLA INTELIGENTE CON MEMORIA LOCAL
        if (categories.length > 0) {
          const merged = csvCategoriesSorted.map(csvCat => {
            const localCat = categories.find(lc => lc.id === csvCat.id);
            if (!localCat) return csvCat;

            const finalLinks = [...csvCat.links].map(csvLink => {
              const localLink = localCat.links.find(ll => ll.name === csvLink.name);
              // Inyectar ajustes de usuario (favoritos, etc.) sobre los datos del CSV
              return localLink ? { ...csvLink, ...localLink } : csvLink;
            });

            // Preservar links añadidos manualmente por el usuario que no están en el CSV original
            localCat.links.forEach(ll => {
              if (!finalLinks.find(fl => fl.name === ll.name)) {
                finalLinks.push(ll);
              }
            });

            return { ...csvCat, links: finalLinks };
          });
          
          setCategories(merged);
        } else {
          setCategories(csvCategoriesSorted);
        }

      } catch (e) {
        console.error("Error al cargar la base de datos CSV:", e);
      } finally {
        setIsLoadingCsv(false);
      }
    };

    loadCsvData();
  }, []);

  // Persistencia de cambios en localStorage
  useEffect(() => { 
    if (categories.length > 0) {
      localStorage.setItem('guia_user_categories_v25', JSON.stringify(categories)); 
    }
  }, [categories]);

  const toggleExpand = useCallback((id: string) => {
    setExpandedResults(prev => ({ ...prev, [id]: !prev[id] }));
  }, []);

  const addResourceLink = useCallback((categoryId: string, link: ResourceLink) => {
    setCategories(prev => prev.map(cat => 
      cat.id === categoryId 
        ? { ...cat, links: [...cat.links, { ...link, isFavorite: false }] } 
        : cat
    ));
  }, []);

  const updateResourceLink = useCallback((categoryId: string, oldName: string, updated: ResourceLink) => {
    setCategories(prev => prev.map(cat => 
      cat.id === categoryId 
        ? { ...cat, links: cat.links.map(l => l.name === oldName ? updated : l) } 
        : cat
    ));
  }, []);

  const removeResourceLink = useCallback((categoryId: string, linkName: string) => {
    setCategories(prev => prev.map(cat => 
      cat.id === categoryId 
        ? { ...cat, links: cat.links.filter(l => l.name !== linkName) } 
        : cat
    ));
  }, []);

  const toggleFavorite = useCallback((categoryId: string, linkName: string) => {
    setCategories(prev => prev.map(cat => 
      cat.id === categoryId 
        ? { 
            ...cat, 
            links: cat.links.map(l => l.name === linkName ? { ...l, isFavorite: !l.isFavorite } : l) 
          } 
        : cat
    ));
  }, []);

  const handleAiAction = async (labId: string, promptTemplate: string, inputs: any[] = []) => {
    const apiKey = process.env.API_KEY || localStorage.getItem('app_apikey');
    if (!apiKey) return;
    
    setAiResults(prev => ({ ...prev, [labId]: { loading: true, text: prev[labId]?.text || '' } }));
    let finalPrompt = promptTemplate;
    inputs.forEach(input => {
      const val = formStates[`${labId}-${input.id}`] || (input.options ? input.options[0] : '');
      finalPrompt = finalPrompt.replace(`{${input.id}}`, val);
    });

    try {
      const ai = new GoogleGenAI({ apiKey });
      const response = await ai.models.generateContent({ 
        model: 'gemini-3-flash-preview', 
        contents: finalPrompt, 
        config: { temperature: 0.7 } 
      });
      setAiResults(prev => ({ ...prev, [labId]: { loading: false, text: response.text || 'Sin respuesta' } }));
      setExpandedResults(prev => ({ ...prev, [labId]: true }));
    } catch (e) {
      setAiResults(prev => ({ ...prev, [labId]: { loading: false, text: 'Error en la conexión con la IA.' } }));
    }
  };

  if (isLoadingCsv && categories.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 animate-pulse">
        <Repeat size={48} className="text-red-700 animate-spin mb-6" />
        <p className="text-[11px] font-black uppercase tracking-[0.3em] text-gray-400">Sincronizando Recursos Dinámicos...</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto py-2 px-6 animate-in fade-in duration-700">
      <div className="flex justify-center mb-12">
        <div className="flex w-full max-w-3xl bg-gray-50 p-1.5 rounded-3xl border border-gray-100 shadow-sm">
          {[
            { id: 'herramientas', label: 'Herramientas', icon: Zap }, 
            { id: 'ia', label: 'Laborator-IA', icon: BrainCircuit }, 
            { id: 'teoria', label: 'Saber Hacer', icon: FileText }
          ].map(tab => (
            <button 
              key={tab.id} 
              onClick={() => setActiveTab(tab.id as any)} 
              className={`flex-1 flex items-center justify-center gap-3 px-10 py-4 rounded-2xl text-[11px] font-black uppercase tracking-[0.2em] transition-all ${activeTab === tab.id ? 'bg-white shadow-md text-red-700' : 'text-gray-400 hover:text-gray-700 hover:bg-white/50'}`}
            >
              <tab.icon size={16} /> {tab.label}
            </button>
          ))}
        </div>
      </div>

      {activeTab === 'herramientas' && (
        <div className="space-y-12 animate-in slide-in-from-bottom-2 duration-500">
          <div>
            <div className="flex items-center justify-between mb-8 pl-1">
              <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.4em] flex items-center gap-3">
                <ListOrdered size={14} className="text-red-700" /> Directorio Dinámico
              </h3>
              <a 
                href="https://docs.google.com/spreadsheets/d/19BqYHKLXXjNmZCU7DSQeqj1VKoASD1Kt4lj8Vnu1XoA/edit" 
                target="_blank" 
                rel="noreferrer"
                className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2 hover:text-red-700 transition-colors bg-gray-50 px-3 py-1.5 rounded-xl border border-gray-100 shadow-sm"
              >
                Google Sheets <ExternalLink size={12} />
              </a>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-start">
              {categories.map((cat) => (
                <ResourceCard 
                  key={cat.id} 
                  item={cat} 
                  editingId={editingId}
                  setEditingId={setEditingId}
                  removeResourceLink={removeResourceLink}
                  addResourceLink={addResourceLink}
                  updateResourceLink={updateResourceLink}
                  toggleFavorite={toggleFavorite}
                />
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'ia' && (
        <div className="space-y-8 animate-in slide-in-from-bottom-2 max-w-4xl mx-auto">
          {GEMINI_LABS.map((lab) => (
            <div key={lab.id} className="bg-white rounded-[2.5rem] shadow-sm border border-gray-100 p-10 flex flex-col items-center text-center">
              <h3 className="text-3xl font-black text-gray-900 tracking-tight mb-3 flex items-center gap-3">
                {lab.title.replace('Laboratoria', 'Laborator-IA')} <Sparkles size={24} className="text-red-700" />
              </h3>
              <p className="text-gray-500 text-sm mb-10 max-w-xl font-medium leading-relaxed">{lab.desc}</p>
              <div className="flex flex-col md:flex-row gap-5 w-full items-end justify-center mb-2">
                {lab.inputs.map(input => (
                  <div key={input.id} className="flex-1 w-full text-left">
                    {input.label && <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">{input.label}</label>}
                    {input.type === 'select' ? (
                      <select 
                        className="w-full bg-gray-50 border border-gray-200 p-3.5 rounded-2xl text-xs font-black outline-none appearance-none cursor-pointer focus:ring-2 focus:ring-red-700/20" 
                        onChange={(e) => setFormStates(prev => ({ ...prev, [`${lab.id}-${input.id}`]: e.target.value }))}
                      >
                        {input.options?.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                      </select>
                    ) : (
                      <input 
                        type={input.type} 
                        placeholder={input.placeholder} 
                        className="w-full bg-gray-50 border border-gray-200 p-3.5 rounded-2xl text-xs font-bold outline-none focus:ring-2 focus:ring-red-700/20" 
                        onChange={(e) => setFormStates(prev => ({ ...prev, [`${lab.id}-${input.id}`]: e.target.value }))} 
                      />
                    )}
                  </div>
                ))}
                <button 
                  onClick={() => handleAiAction(lab.id, lab.prompt, lab.inputs)} 
                  disabled={aiResults[lab.id]?.loading} 
                  className="h-12 px-8 bg-gray-900 hover:bg-red-800 text-white rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-3 disabled:opacity-50 shadow-lg shadow-gray-200 hover:shadow-red-200"
                >
                  {aiResults[lab.id]?.loading ? <Repeat className="animate-spin" size={18} /> : <Sparkles size={18} />} {lab.buttonText}
                </button>
              </div>
              <ResultBox 
                id={lab.id} 
                label="Análisis Laborator-IA" 
                res={aiResults[lab.id]} 
                isExpanded={!!expandedResults[lab.id]}
                onToggleExpand={toggleExpand}
              />
            </div>
          ))}
        </div>
      )}

      {activeTab === 'teoria' && (
        <div className="space-y-12 animate-in slide-in-from-bottom-2">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
            {Object.entries(MODAL_CONTENT).map(([key, content]) => (
              <div key={key} className="bg-white border border-gray-100 p-10 rounded-[2.5rem] shadow-sm flex flex-col relative overflow-hidden group h-full">
                <div className="absolute -right-6 -top-6 opacity-[0.03] group-hover:opacity-10 transition-opacity">
                  <content.icon size={150} />
                </div>
                <div className="flex items-center gap-5 mb-6 relative z-10">
                  <div className={`p-4 rounded-2xl bg-gray-50 ${content.color} shadow-inner`}>
                    <content.icon size={28} />
                  </div>
                  <h3 className="text-xl font-black text-gray-900 uppercase tracking-tight">{content.title}</h3>
                </div>
                <p className="text-gray-500 text-[12px] leading-relaxed mb-6 font-medium relative z-10">{content.body}</p>
                
                <div className="relative z-10">
                  <ResultBox 
                      id={`quadrant-${content.id}`} 
                      label="Teoría Aplicada" 
                      res={aiResults[`quadrant-${content.id}`]}
                      isExpanded={!!expandedResults[`quadrant-${content.id}`]}
                      onToggleExpand={toggleExpand}
                      onAction={() => handleAiAction(`quadrant-${content.id}`, content.prompt)}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
