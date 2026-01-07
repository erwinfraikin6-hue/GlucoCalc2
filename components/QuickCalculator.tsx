
import React, { useState, useEffect, useRef } from 'react';
import { UserSettings, FoodEntry } from '../types';
import { searchProductDatabase, ProductSearchResponse } from '../services/geminiService';

interface QuickCalculatorProps {
  settings: UserSettings;
  onLog: (entry: FoodEntry) => void;
  onOpenSettings: () => void;
}

interface MealItem {
  id: string;
  name: string;
  carbs: number;
  insulin: number;
}

const QuickCalculator: React.FC<QuickCalculatorProps> = ({ settings, onLog, onOpenSettings }) => {
  const [carbsPerUnit, setCarbsPerUnit] = useState<string>('');
  const [baseUnit, setBaseUnit] = useState<string>('100');
  const [amountConsumed, setAmountConsumed] = useState<string>('');
  const [foodName, setFoodName] = useState<string>('');
  const [totalCarbs, setTotalCarbs] = useState<number>(0);
  const [insulinDose, setInsulinDose] = useState<number>(0);
  
  // Maaltijd state
  const [mealItems, setMealItems] = useState<MealItem[]>([]);
  
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<ProductSearchResponse['products']>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const cp = parseFloat(carbsPerUnit) || 0;
    const bu = parseFloat(baseUnit) || 1;
    const ac = parseFloat(amountConsumed) || 0;

    const calculatedCarbs = (cp / bu) * ac;
    setTotalCarbs(Math.round(calculatedCarbs * 10) / 10);
    
    const dose = calculatedCarbs / settings.icr;
    setInsulinDose(Math.round(dose * 10) / 10);
  }, [carbsPerUnit, baseUnit, amountConsumed, settings.icr]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearch = async () => {
    if (foodName.length < 2) return;
    setIsSearching(true);
    try {
      const data = await searchProductDatabase(foodName);
      setSearchResults(data.products);
      setShowDropdown(true);
    } catch (error) {
      console.error("Zoekfout:", error);
    } finally {
      setIsSearching(false);
    }
  };

  const selectProduct = (p: ProductSearchResponse['products'][0]) => {
    setFoodName(p.brand ? `${p.brand} ${p.name}` : p.name);
    setCarbsPerUnit(p.carbsPer100g.toString());
    setBaseUnit('100');
    setShowDropdown(false);
  };

  const addToMeal = () => {
    if (totalCarbs <= 0) return;
    const newItem: MealItem = {
      id: Date.now().toString(),
      name: foodName || 'Onbekend item',
      carbs: totalCarbs,
      insulin: insulinDose
    };
    setMealItems([...mealItems, newItem]);
    
    // Reset velden voor volgende item
    setCarbsPerUnit('');
    setAmountConsumed('');
    setFoodName('');
  };

  const removeFromMeal = (id: string) => {
    setMealItems(mealItems.filter(item => item.id !== id));
  };

  const handleLogMeal = () => {
    if (mealItems.length === 0) return;
    
    const totalMealCarbs = mealItems.reduce((acc, item) => acc + item.carbs, 0);
    const totalMealInsulin = mealItems.reduce((acc, item) => acc + item.insulin, 0);
    const combinedName = mealItems.map(item => item.name).join(', ');

    const entry: FoodEntry = {
      id: Date.now().toString(),
      timestamp: Date.now(),
      foodName: combinedName,
      carbs: Math.round(totalMealCarbs * 10) / 10,
      calculatedInsulin: Math.round(totalMealInsulin * 10) / 10,
      portionDescription: `Samengestelde maaltijd (${mealItems.length} items)`
    };
    
    onLog(entry);
    setMealItems([]);
  };

  const currentMealTotalCarbs = mealItems.reduce((acc, item) => acc + item.carbs, 0);
  const currentMealTotalInsulin = mealItems.reduce((acc, item) => acc + item.insulin, 0);

  return (
    <div className="bg-white p-6 rounded-3xl shadow-xl border border-slate-100 space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
          <i className="fa-solid fa-calculator text-blue-500"></i>
          Snelle Calculator
        </h3>
        <button 
          onClick={onOpenSettings}
          className="bg-blue-50 px-3 py-1 rounded-full border border-blue-100 hover:bg-blue-100 transition-colors cursor-pointer group"
          title="Klik om KIR/ICR te wijzigen"
        >
          <span className="text-[10px] font-black text-blue-600 uppercase tracking-tighter group-hover:text-blue-700">KIR/ICR: 1:{settings.icr}</span>
        </button>
      </div>
      
      <div className="space-y-4">
        <div className="relative" ref={dropdownRef}>
          <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Product Zoeken</label>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <input
                type="text"
                placeholder="bijv. AH Volkoren Brood"
                value={foodName}
                onChange={(e) => setFoodName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all pr-10"
              />
              {isSearching && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  <i className="fa-solid fa-circle-notch fa-spin text-blue-500"></i>
                </div>
              )}
            </div>
            <button 
              onClick={handleSearch}
              className="px-4 bg-slate-100 text-slate-600 rounded-xl hover:bg-slate-200 transition-colors border border-slate-200"
            >
              <i className="fa-solid fa-magnifying-glass"></i>
            </button>
          </div>

          {showDropdown && searchResults.length > 0 && (
            <div className="absolute z-50 left-0 right-0 mt-2 bg-white border border-slate-200 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
              {searchResults.map((p, idx) => (
                <button
                  key={idx}
                  onClick={() => selectProduct(p)}
                  className="w-full text-left px-4 py-3 hover:bg-blue-50 transition-colors flex justify-between items-center group"
                >
                  <div>
                    <p className="text-sm font-bold text-slate-700">{p.name}</p>
                    {p.brand && <p className="text-[10px] text-slate-400">{p.brand}</p>}
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-black text-blue-600">{p.carbsPer100g}g</p>
                    <p className="text-[10px] text-slate-400">per 100g</p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Koolhydraten (g)</label>
            <input
              type="number"
              placeholder="bijv. 70"
              value={carbsPerUnit}
              onChange={(e) => setCarbsPerUnit(e.target.value)}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Per Hoeveelheid</label>
            <input
              type="number"
              placeholder="100"
              value={baseUnit}
              onChange={(e) => setBaseUnit(e.target.value)}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Hoeveelheid Gegeten</label>
          <input
            type="number"
            placeholder="Aantal gram/ml"
            value={amountConsumed}
            onChange={(e) => setAmountConsumed(e.target.value)}
            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
          />
        </div>

        <div className="flex gap-2">
          <button
            onClick={addToMeal}
            disabled={totalCarbs <= 0}
            className="flex-1 bg-blue-50 text-blue-700 py-3 rounded-xl font-bold border border-blue-100 hover:bg-blue-100 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
          >
            <i className="fa-solid fa-plus"></i>
            Voeg toe aan maaltijd
          </button>
          <button
            onClick={() => {
               if(totalCarbs > 0) {
                 const entry: FoodEntry = {
                   id: Date.now().toString(),
                   timestamp: Date.now(),
                   foodName: foodName || 'Handmatige Invoer',
                   carbs: totalCarbs,
                   calculatedInsulin: insulinDose,
                   portionDescription: `${amountConsumed} eenheden van ${carbsPerUnit}g/${baseUnit}g`
                 };
                 onLog(entry);
                 setCarbsPerUnit('');
                 setAmountConsumed('');
                 setFoodName('');
               }
            }}
            disabled={totalCarbs <= 0}
            className="flex-1 bg-slate-100 text-slate-700 py-3 rounded-xl font-bold hover:bg-slate-200 disabled:opacity-50 transition-all"
          >
            Direct loggen
          </button>
        </div>
      </div>

      {mealItems.length > 0 && (
        <div className="pt-6 border-t border-slate-100 animate-in fade-in slide-in-from-top-4 duration-300">
          <div className="flex justify-between items-center mb-4">
            <h4 className="text-sm font-black text-slate-400 uppercase tracking-widest">Huidige Maaltijd</h4>
            <span className="text-[10px] bg-slate-100 px-2 py-0.5 rounded-full font-bold text-slate-500">{mealItems.length} items</span>
          </div>
          
          <div className="space-y-2 mb-6 max-h-48 overflow-y-auto pr-2">
            {mealItems.map(item => (
              <div key={item.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-2xl border border-slate-100 group">
                <div className="flex-1">
                  <p className="text-sm font-bold text-slate-800">{item.name}</p>
                  <p className="text-[10px] text-slate-500">{item.carbs}g koolh. • {item.insulin}u insuline</p>
                </div>
                <button 
                  onClick={() => removeFromMeal(item.id)}
                  className="w-8 h-8 flex items-center justify-center text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-full transition-all"
                >
                  <i className="fa-solid fa-trash-can text-xs"></i>
                </button>
              </div>
            ))}
          </div>

          <div className="bg-blue-600 rounded-2xl p-4 text-white shadow-lg shadow-blue-100">
            <div className="flex justify-between items-end mb-4">
              <div className="text-left">
                <p className="text-[10px] font-bold text-blue-200 uppercase tracking-widest">Koolhydraten</p>
                <p className="text-3xl font-black">{currentMealTotalCarbs.toFixed(1)}g</p>
              </div>
              <div className="text-right">
                <p className="text-[10px] font-bold text-blue-200 uppercase tracking-widest">Dosering</p>
                <p className="text-3xl font-black">{currentMealTotalInsulin.toFixed(1)} <span className="text-sm font-normal opacity-80">Units</span></p>
              </div>
            </div>
            
            <button
              onClick={handleLogMeal}
              className="w-full bg-white text-blue-600 py-3 rounded-xl font-black hover:bg-blue-50 transition-all active:scale-95 shadow-sm"
            >
              Maaltijd Registreren
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default QuickCalculator;
