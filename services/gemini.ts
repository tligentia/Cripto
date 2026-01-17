import { GoogleGenAI } from "@google/genai";

/**
 * Obtiene el modelo preferido del almacenamiento local o el predeterminado.
 */
const getPreferredModel = () => localStorage.getItem('app_selected_model') || 'gemini-3-flash-preview';

export const generateGeminiContent = async (prompt: string, userApiKey?: string): Promise<string> => {
  // Prioridad: 1. Clave pasada por argumento, 2. LocalStorage, 3. Variable de entorno
  const keyToUse = userApiKey || localStorage.getItem('app_apikey') || process.env.API_KEY || '';

  if (!keyToUse) {
    throw new Error("API_MISSING");
  }

  try {
    const ai = new GoogleGenAI({ apiKey: keyToUse });
    const response = await ai.models.generateContent({
      model: getPreferredModel(),
      contents: prompt,
    });
    return response.text || "No se pudo generar una respuesta.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    throw error;
  }
};

export interface SmartSuggestion {
    symbol: string;
    reason: string;
}

export const getSmartRecommendation = async (
  command: 'BEST' | 'SHORT' | 'MID' | 'RISK', 
  marketType: 'CRYPTO' | 'STOCK',
  apiKey: string,
  excludedSymbols: string[] = []
): Promise<SmartSuggestion | null> => {
    const keyToUse = apiKey || localStorage.getItem('app_apikey') || process.env.API_KEY || '';
    if (!keyToUse) throw new Error("API_MISSING");

    const context = marketType === 'CRYPTO' ? 'Criptomonedas (Binance)' : 'Mercado de Valores (Yahoo Finance)';
    
    let criteria = "";
    switch (command) {
        case 'BEST': criteria = "El activo líder con la tendencia alcista más saludable, fuerte y definida buscando nuevos máximos."; break;
        case 'SHORT': criteria = "El activo con mayor aceleración alcista (Momentum) rompiendo resistencias AHORA MISMO."; break;
        case 'MID': criteria = "Tendencia estructural alcista perfecta con proyección directa a romper máximos históricos."; break;
        case 'RISK': criteria = "Activo volátil en plena explosión de precio vertical (Parabólico/Breakout agresivo)."; break;
    }

    const excludedText = excludedSymbols.length > 0
        ? `IMPORTANTE: NO recomiendes ninguno de estos activos (ya están en cartera): ${excludedSymbols.join(', ')}.`
        : "";

    const prompt = `
      Actúa como un experto broker financiero algorítmico especializado en "Momentum Trading" y "Breakouts".
      Mercado: ${context}.
      DIRECTRIZ: Propon SIEMPRE valores en ALZA PRONUNCIADA hacia MÁXIMOS.
      TAREA: Recomienda UN ÚNICO Ticker para este criterio: "${criteria}".
      ${excludedText}
      FORMATO JSON: {"symbol": "TICKER", "reason": "Explica brevemente (máx 30 palabras)"}
    `;

    try {
        const ai = new GoogleGenAI({ apiKey: keyToUse });
        const response = await ai.models.generateContent({
            model: getPreferredModel(),
            contents: prompt,
            config: { responseMimeType: "application/json" }
        });
        
        const data = JSON.parse(response.text || "{}");
        return {
            symbol: (data.symbol || "").toUpperCase().replace(/\./g, '').trim(),
            reason: data.reason || ""
        };
    } catch (error) {
        console.error("Smart Search Error", error);
        return null;
    }
};