import { GoogleGenAI, Type } from "@google/genai";
import { AdData, AdAsset, TextStyle, StylePreference } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// Helper function to fetch and extract text from a URL via a CORS proxy
const fetchPageContent = async (url: string): Promise<string> => {
  try {
    const proxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(url)}`;
    const response = await fetch(proxyUrl);
    const data = await response.json();
    
    if (!data.contents) throw new Error("No content found");

    const parser = new DOMParser();
    const doc = parser.parseFromString(data.contents, 'text/html');

    const scripts = doc.querySelectorAll('script, style, noscript, svg, footer, nav');
    scripts.forEach(script => script.remove());

    const title = doc.title;
    const metaDesc = doc.querySelector('meta[name="description"]')?.getAttribute('content') || '';
    const h1s = Array.from(doc.querySelectorAll('h1')).map(h => h.innerText).join(' | ');
    
    const bodyText = doc.body.innerText
      .replace(/\s+/g, ' ')
      .trim()
      .substring(0, 15000);

    return `
      PAGE TITLE: ${title}
      META DESCRIPTION: ${metaDesc}
      MAIN HEADINGS (H1): ${h1s}
      PAGE CONTENT: ${bodyText}
    `;
  } catch (error) {
    console.warn("Could not fetch page content directly, falling back to URL analysis.", error);
    return `URL: ${url} (Der Inhalt konnte nicht direkt abgerufen werden. Bitte analysiere basierend auf der URL-Struktur und deinem Wissen.)`;
  }
};

const getStyleInstruction = (style: TextStyle, tags: string[] = []): string => {
  let base = "";
  switch (style) {
    case 'BRAND': base = "BRAND-FOKUS: Verwende den Markennamen. Baue Vertrauen auf."; break;
    case 'GENERIC': base = "ALLGEMEIN-FOKUS: Generisch, sachlich, beschreibe das Angebot."; break;
    case 'PROBLEM': base = "PROBLEM-FOKUS: Sprich gezielt Schmerzpunkte (Pain Points) des Kunden an."; break;
    case 'SOLUTION': base = "LÖSUNGS-FOKUS: Betone das Ergebnis, die Lösung oder den Nutzen (Benefits)."; break;
    case 'QUESTION': base = "FRAGE-FOKUS: Formuliere Headlines als Fragen, die Nutzer sich stellen."; break;
    case 'CTA': base = "CTA-FOKUS: Handlungsaufforderung. 'Jetzt kaufen', 'Angebot sichern', 'Hier anmelden'."; break;
    case 'PRODUCT': base = "PRODUKT-FOKUS: Erwähne ausschließlich das Produkt und seine direkten Eigenschaften. Keine werblichen Floskeln, nur der Produktname und relevante Details."; break;
    case 'SERVICE': base = "DIENSTLEISTUNGS-FOKUS: Betone die Dienstleistung, Expertise, Beratung oder den Service-Aspekt. Keine physischen Produktbeschreibungen, sondern den Prozess oder die Kompetenz."; break;
    default: base = "Allgemeine Vorteile und Keywords.";
  }

  if (tags.length > 0) {
    base += `\nBeziehe dich UNBEDINGT auf diese spezifischen Themen/Aspekte: ${tags.join(', ')}.`;
  }

  return base;
};

const preparePromptParts = async (url: string, manualContent?: string, pdfContent?: string) => {
  const parts: any[] = [];
  
  if (pdfContent) {
    parts.push({
      inlineData: {
        mimeType: 'application/pdf',
        data: pdfContent
      }
    });
  }

  const textSource = manualContent || (url ? await fetchPageContent(url) : "");
  if (textSource) {
    parts.push({ text: `Kontext-Informationen (Webseite/Text): \n${textSource}` });
  }

  return parts;
};

export const suggestKeywords = async (url: string, selectedStyles: TextStyle[], stylePreferences: Record<TextStyle, StylePreference>, manualContent?: string, pdfContent?: string): Promise<string[]> => {
  const model = "gemini-3-flash-preview";
  const contentParts = await preparePromptParts(url, manualContent, pdfContent);
  
  const stylePrompts = selectedStyles.map((style, index) => {
    const activeTags = stylePreferences[style]?.activeTags || [];
    return `${index + 1}. ANALYSE-FOKUS '${style}': Suche Begriffe, die zu diesem Stil passen. (${getStyleInstruction(style, activeTags)})`;
  }).join("\n");

  const analysisPrompt = {
    text: `
      Verhalte dich wie ein hochqualifizierter SEA-Experte. Deine Aufgabe ist es, die beigefügten Materialien (PDF und/oder Webseiten-Inhalt) akribisch zu analysieren und die relevantesten Keywords für eine Google Ads Kampagne zu extrahieren.
      
      ANALYSE-AUFTRAG:
      1. Identifiziere das Kernprodukt oder die Hauptdienstleistung.
      2. Extrahiere die stärksten Verkaufsargumente (USPs).
      3. Finde Begriffe, die die Zielgruppe direkt ansprechen.
      4. Berücksichtige dabei folgende gewünschte Anzeigen-Strategien:
      ${stylePrompts}
      
      REGELN:
      - Max 20 Begriffe insgesamt.
      - Gib das Ergebnis NUR als JSON-Array von Strings zurück.
    `
  };

  try {
    const response = await ai.models.generateContent({
      model: model,
      contents: { parts: [...contentParts, analysisPrompt] },
      config: { 
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: { type: Type.STRING }
        }
      }
    });
    
    const result = JSON.parse(response.text || "[]");
    return Array.isArray(result) ? result : [];
  } catch (error) {
    console.error("Error suggesting keywords:", error);
    throw error;
  }
};

export const generateAdCopy = async (url: string, keywords: string, selectedStyles: TextStyle[], stylePreferences: Record<TextStyle, StylePreference>, manualContent?: string, pdfContent?: string): Promise<Partial<AdData>> => {
  const model = "gemini-3-flash-preview";
  const contentParts = await preparePromptParts(url, manualContent, pdfContent);

  const pos1Style = selectedStyles[0];
  const pos2Style = selectedStyles[1];
  const pos3Style = selectedStyles[2];

  let positionInstructions = `
    1. Position 1 (5 Stück): ${getStyleInstruction(pos1Style, stylePreferences[pos1Style]?.activeTags)} (Max 30 Zeichen)
  `;

  if (pos2Style) {
    positionInstructions += `
    2. Position 2 (5 Stück): ${getStyleInstruction(pos2Style, stylePreferences[pos2Style]?.activeTags)} (Max 30 Zeichen)
    `;
  }

  if (pos3Style) {
    positionInstructions += `
    3. Position 3 (5 Stück): ${getStyleInstruction(pos3Style, stylePreferences[pos3Style]?.activeTags)} (Max 30 Zeichen)
    `;
  }

  const generationPrompt = {
    text: `
      Erstelle Google Ads (RSA) Assets basierend auf dem beigefügten Material und diesen Keywords: ${keywords}.
      Sprache: Deutsch.

      Strukturiere die Headlines streng nach den gewünschten Positionen:
      ${positionInstructions}

      Zusätzlich: 4 Beschreibungen (Descriptions). Max 90 Zeichen.
    `
  };

  try {
    const response = await ai.models.generateContent({
      model: model,
      contents: { parts: [...contentParts, generationPrompt] },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            pos1_headlines: { type: Type.ARRAY, items: { type: Type.STRING } },
            pos2_headlines: { type: Type.ARRAY, items: { type: Type.STRING } },
            pos3_headlines: { type: Type.ARRAY, items: { type: Type.STRING } },
            descriptions: { type: Type.ARRAY, items: { type: Type.STRING } }
          },
          required: ["pos1_headlines", "pos2_headlines", "pos3_headlines", "descriptions"]
        }
      }
    });

    const parsed = JSON.parse(response.text || "{}");
    const headlines: AdAsset[] = [];

    const addHeadlines = (list: string[], pos: 1 | 2 | 3) => {
      if (Array.isArray(list)) {
        list.forEach(text => {
          if (text && text.trim()) {
             headlines.push({ id: crypto.randomUUID(), text: text.substring(0, 30), type: 'headline', pinnedPosition: pos });
          }
        });
      }
    };

    addHeadlines(parsed.pos1_headlines, 1);
    addHeadlines(parsed.pos2_headlines, 2);
    addHeadlines(parsed.pos3_headlines, 3);

    const descriptions: AdAsset[] = Array.isArray(parsed.descriptions) 
      ? parsed.descriptions.map((text: string) => ({
          id: crypto.randomUUID(),
          text: text.substring(0, 90),
          type: 'description'
        }))
      : [];

    return { headlines, descriptions };

  } catch (error) {
    console.error("Error generating ad copy:", error);
    throw error;
  }
};