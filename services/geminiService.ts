
import { GoogleGenAI, Type } from "@google/genai";
import { GeminiFoodResponse } from "../types";

// Hulpmiddel om de AI client veilig te initialiseren
const getAIClient = () => {
  return new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
};

export interface ProductSearchResponse {
  products: {
    name: string;
    carbsPer100g: number;
    brand?: string;
  }[];
}

export const searchProductDatabase = async (query: string): Promise<ProductSearchResponse> => {
  const ai = getAIClient();
  const model = "gemini-3-flash-preview";
  
  const systemInstruction = `
    Je bent een voedingsdatabase-expert. Zoek naar de gevraagde producten en geef hun koolhydraatgehalte per 100 gram/ml.
    Geef een lijst van maximaal 5 meest relevante resultaten (bijv. verschillende merken of varianten).
    Als het een specifiek merk is, vermeld dit dan.
    Geef het antwoord strikt in JSON-formaat in de gevraagde structuur.
  `;

  const responseSchema = {
    type: Type.OBJECT,
    properties: {
      products: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            name: { type: Type.STRING, description: "Naam van het product." },
            carbsPer100g: { type: Type.NUMBER, description: "Koolhydraten per 100g of 100ml." },
            brand: { type: Type.STRING, description: "Merknaam, indien van toepassing." }
          },
          required: ["name", "carbsPer100g"]
        }
      }
    },
    required: ["products"]
  };

  const response = await ai.models.generateContent({
    model,
    contents: `Zoek koolhydraatinformatie voor: ${query}`,
    config: {
      systemInstruction,
      responseMimeType: "application/json",
      responseSchema
    }
  });

  const text = response.text || '{"products": []}';
  return JSON.parse(text) as ProductSearchResponse;
};

export const estimateCarbs = async (foodInput: string | { base64: string, mimeType: string }): Promise<GeminiFoodResponse> => {
  const ai = getAIClient();
  const model = "gemini-3-flash-preview";
  
  const systemInstruction = `
    Je bent een professionele diëtist voor diabetici met expertise in OCR (tekstherkenning). 
    Jouw taak is om het totale koolhydraatgehalte in grammen te bepalen.
    
    BELANGRIJK:
    1. Als de afbeelding een VOEDINGSWAARDETABEL of ETIKET bevat, lees dan de tekst en gebruik de exacte waarden (bijv. koolhydraten per 100g) in combinatie met de zichtbare portie.
    2. Als er GEEN label zichtbaar is, schat dan de koolhydraten op basis van de visuele portiegrootte van de maaltijd op de foto.
    3. Als er alleen tekst is, schat dan op basis van een standaard portie voor die omschrijving.
    
    Geef het antwoord strikt in JSON-formaat en gebruik de Nederlandse taal voor alle tekstvelden.
  `;

  const responseSchema = {
    type: Type.OBJECT,
    properties: {
      foodName: { type: Type.STRING, description: "De geïdentificeerde naam van het voedsel." },
      carbsGrams: { type: Type.NUMBER, description: "Geschatte of gelezen koolhydraten in grammen." },
      portionSize: { type: Type.STRING, description: "Beschrijving van de portiegrootte (bijv. 'Volgens etiket', '1 stuk', '250g')." },
      confidence: { type: Type.NUMBER, description: "Betrouwbaarheidsscore van 0 tot 1." },
      explanation: { type: Type.STRING, description: "Een korte uitsplitsing. Vermeld of je de data van een etiket hebt gelezen of hebt geschat." }
    },
    required: ["foodName", "carbsGrams", "portionSize", "confidence", "explanation"]
  };

  let contents;
  if (typeof foodInput === 'string') {
    contents = `Schat de koolhydraten voor: ${foodInput}`;
  } else {
    contents = {
      parts: [
        { inlineData: { data: foodInput.base64, mimeType: foodInput.mimeType } },
        { text: "Bepaal de koolhydraten. Kijk eerst of er een voedingslabel zichtbaar is." }
      ]
    };
  }

  const response = await ai.models.generateContent({
    model,
    contents,
    config: {
      systemInstruction,
      responseMimeType: "application/json",
      responseSchema
    }
  });

  const text = response.text || "{}";
  return JSON.parse(text) as GeminiFoodResponse;
};
