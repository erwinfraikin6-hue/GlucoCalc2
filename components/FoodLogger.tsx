
import React, { useState, useRef } from 'react';
import { estimateCarbs } from '../services/geminiService';
import { UserSettings, FoodEntry } from '../types';

interface FoodLoggerProps {
  settings: UserSettings;
  onEntryAdded: (entry: FoodEntry) => void;
}

const FoodLogger: React.FC<FoodLoggerProps> = ({ settings, onEntryAdded }) => {
  const [foodInput, setFoodInput] = useState('');
  const [isEstimating, setIsEstimating] = useState(false);
  const [result, setResult] = useState<{ foodName: string; carbs: number; explanation: string } | null>(null);
  const [currentBg, setCurrentBg] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleTextSearch = async () => {
    if (!foodInput.trim()) return;
    setIsEstimating(true);
    try {
      const estimation = await estimateCarbs(foodInput);
      setResult({
        foodName: estimation.foodName,
        carbs: estimation.carbsGrams,
        explanation: estimation.explanation
      });
    } catch (error) {
      console.error(error);
      alert("Koolhydraatschatting mislukt. Probeer het opnieuw.");
    } finally {
      setIsEstimating(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsEstimating(true);
    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64 = (reader.result as string).split(',')[1];
      try {
        const estimation = await estimateCarbs({ base64, mimeType: file.type });
        setResult({
          foodName: estimation.foodName,
          carbs: estimation.carbsGrams,
          explanation: estimation.explanation
        });
      } catch (error) {
        console.error(error);
        alert("Afbeeldingsanalyse mislukt. Probeer het opnieuw.");
      } finally {
        setIsEstimating(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const calculateDose = () => {
    if (!result) return 0;
    const carbDose = result.carbs / settings.icr;
    let correctionDose = 0;
    if (currentBg && Number(currentBg) > settings.targetBg) {
      correctionDose = (Number(currentBg) - settings.targetBg) / settings.isf;
    }
    return Math.round((carbDose + correctionDose) * 10) / 10;
  };

  const handleConfirm = () => {
    if (!result) return;
    const dose = calculateDose();
    const newEntry: FoodEntry = {
      id: Date.now().toString(),
      timestamp: Date.now(),
      foodName: result.foodName,
      carbs: result.carbs,
      currentBg: currentBg ? Number(currentBg) : undefined,
      calculatedInsulin: dose,
      portionDescription: result.explanation
    };
    onEntryAdded(newEntry);
    setResult(null);
    setFoodInput('');
    setCurrentBg('');
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-3xl p-6 shadow-xl border border-slate-100">
        <h3 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2">
          <i className="fa-solid fa-utensils text-blue-500"></i>
          Wat gaat u eten?
        </h3>
        
        <div className="flex flex-col gap-3">
          <div className="relative">
            <input
              type="text"
              placeholder="bijv. Een grote kom havermout met aardbeien"
              value={foodInput}
              onChange={(e) => setFoodInput(e.target.value)}
              className="w-full pl-4 pr-12 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
              onKeyDown={(e) => e.key === 'Enter' && handleTextSearch()}
            />
            <button 
              onClick={handleTextSearch}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-blue-600 p-2 hover:bg-blue-50 rounded-xl"
            >
              <i className="fa-solid fa-arrow-right"></i>
            </button>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex-1 h-px bg-slate-200"></div>
            <span className="text-slate-400 text-sm font-medium">OF</span>
            <div className="flex-1 h-px bg-slate-200"></div>
          </div>

          <div className="space-y-2">
            <button 
              onClick={() => fileInputRef.current?.click()}
              className="w-full py-4 bg-blue-600 text-white rounded-2xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-blue-200 hover:bg-blue-700 transition-all active:scale-95"
            >
              <i className="fa-solid fa-camera"></i>
              Scan Maaltijd of Etiket
            </button>
            <p className="text-[10px] text-center text-slate-400 font-medium">
              <i className="fa-solid fa-lightbulb text-amber-400 mr-1"></i>
              Tip: Fotografeer het etiket voor de hoogste nauwkeurigheid.
            </p>
          </div>
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileUpload} 
            className="hidden" 
            accept="image/*" 
          />
        </div>
      </div>

      {isEstimating && (
        <div className="bg-white rounded-3xl p-12 shadow-xl border border-slate-100 flex flex-col items-center justify-center text-center animate-pulse">
          <div className="w-16 h-16 border-4 border-blue-100 border-t-blue-600 rounded-full animate-spin mb-4"></div>
          <p className="text-slate-600 font-medium">AI analyseert de foto...</p>
          <p className="text-slate-400 text-sm">Bezig met herkennen van voeding of label...</p>
        </div>
      )}

      {result && !isEstimating && (
        <div className="bg-white rounded-3xl p-6 shadow-xl border border-blue-100 animate-in slide-in-from-bottom-4 duration-300">
          <div className="flex items-start justify-between mb-6">
            <div>
              <h4 className="text-2xl font-black text-slate-800">{result.foodName}</h4>
              <p className="text-blue-600 font-bold text-lg">{result.carbs}g Koolhydraten</p>
            </div>
            <button onClick={() => setResult(null)} className="text-slate-400 hover:text-slate-600">
              <i className="fa-solid fa-rotate-left"></i>
            </button>
          </div>

          <div className="p-4 bg-slate-50 rounded-2xl mb-6">
            <p className="text-sm text-slate-600 italic">"{result.explanation}"</p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-slate-600 mb-1">
                Huidige Bloedsuiker (Optioneel)
              </label>
              <div className="relative">
                <input
                  type="number"
                  placeholder="Voer waarde in"
                  value={currentBg}
                  onChange={(e) => setCurrentBg(e.target.value)}
                  className="w-full pl-4 pr-16 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-slate-400">{settings.unit}</span>
              </div>
            </div>

            <div className="bg-blue-600 rounded-2xl p-6 text-white text-center shadow-lg shadow-blue-200">
              <p className="text-blue-100 text-sm font-bold uppercase tracking-wider mb-1">Aanbevolen Dosering</p>
              <div className="text-5xl font-black mb-2">{calculateDose()} <span className="text-2xl font-normal">Units</span></div>
              <p className="text-xs text-blue-200 opacity-80">Op basis van KIR/ICR 1:{settings.icr} en ISF 1:{settings.isf}</p>
            </div>

            <button
              onClick={handleConfirm}
              className="w-full bg-slate-900 text-white py-4 rounded-xl font-bold hover:bg-slate-800 transition-colors active:scale-95 transform"
            >
              Registreren & Sluiten
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default FoodLogger;
