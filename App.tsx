
import React, { useState, useEffect } from 'react';
import { UserSettings, FoodEntry } from './types';
import SettingsModal from './components/SettingsModal';
import FoodLogger from './components/FoodLogger';
import Dashboard from './components/Dashboard';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'history'>('dashboard');
  const [showSettings, setShowSettings] = useState(false);
  const [filterDate, setFilterDate] = useState<string>(''); // YYYY-MM-DD
  const [settings, setSettings] = useState<UserSettings>({
    icr: 10,
    isf: 50,
    targetBg: 100,
    unit: 'mg/dL'
  });
  const [entries, setEntries] = useState<FoodEntry[]>([]);

  useEffect(() => {
    const savedSettings = localStorage.getItem('gluco_settings');
    const savedEntries = localStorage.getItem('gluco_entries');
    if (savedSettings) setSettings(JSON.parse(savedSettings));
    if (savedEntries) setEntries(JSON.parse(savedEntries));
  }, []);

  const saveSettings = (newSettings: UserSettings) => {
    setSettings(newSettings);
    localStorage.setItem('gluco_settings', JSON.stringify(newSettings));
    setShowSettings(false);
  };

  const addEntry = (entry: FoodEntry) => {
    const newEntries = [entry, ...entries];
    setEntries(newEntries);
    localStorage.setItem('gluco_entries', JSON.stringify(newEntries));
  };

  const filteredEntries = entries.filter(entry => {
    if (!filterDate) return true;
    const entryDate = new Date(entry.timestamp);
    const [year, month, day] = filterDate.split('-').map(Number);
    return entryDate.getFullYear() === year && 
           entryDate.getMonth() === (month - 1) && 
           entryDate.getDate() === day;
  });

  const setTodayFilter = () => {
    const today = new Date();
    const formatted = today.toISOString().split('T')[0];
    setFilterDate(formatted);
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard entries={entries} settings={settings} onLogEntry={addEntry} onOpenSettings={() => setShowSettings(true)} />;
      case 'history':
        return (
          <div className="space-y-4 pb-4">
            <div className="flex justify-between items-center mb-2">
              <h3 className="text-xl font-bold text-slate-800">Maaltijdoverzicht</h3>
            </div>

            {/* Filter Bar */}
            <div className="bg-white p-4 rounded-3xl shadow-sm border border-slate-100 space-y-3">
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <input
                    type="date"
                    value={filterDate}
                    onChange={(e) => setFilterDate(e.target.value)}
                    className="w-full pl-4 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm font-medium text-slate-700"
                  />
                  {!filterDate && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                      <i className="fa-solid fa-calendar text-slate-300"></i>
                    </div>
                  )}
                </div>
                {filterDate && (
                  <button 
                    onClick={() => setFilterDate('')}
                    className="p-2.5 bg-slate-100 text-slate-500 rounded-xl hover:bg-slate-200 transition-colors"
                    title="Wis filter"
                  >
                    <i className="fa-solid fa-xmark"></i>
                  </button>
                )}
              </div>
              <div className="flex gap-2">
                <button 
                  onClick={setTodayFilter}
                  className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${filterDate === new Date().toISOString().split('T')[0] ? 'bg-blue-600 text-white shadow-md shadow-blue-100' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                >
                  Vandaag
                </button>
                <button 
                  onClick={() => setFilterDate('')}
                  className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${!filterDate ? 'bg-blue-600 text-white shadow-md shadow-blue-100' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                >
                  Alles tonen
                </button>
              </div>
            </div>

            {/* List */}
            <div className="space-y-3 pt-2">
              {filteredEntries.length > 0 ? filteredEntries.map((entry) => (
                <div key={entry.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-white rounded-2xl shadow-sm border border-slate-100 transition-all hover:border-blue-100 gap-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
                  <div className="flex gap-4 items-center">
                    <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center text-blue-500 shadow-sm border border-slate-100 flex-shrink-0">
                      <i className="fa-solid fa-burger"></i>
                    </div>
                    <div className="min-w-0">
                      <p className="font-bold text-slate-800 text-sm truncate">{entry.foodName}</p>
                      <p className="text-[10px] text-slate-400 font-medium">
                        {new Date(entry.timestamp).toLocaleDateString('nl-NL', { weekday: 'short', day: 'numeric', month: 'short' })} • {new Date(entry.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex gap-6 items-center justify-between sm:justify-end border-t sm:border-t-0 pt-3 sm:pt-0">
                    <div className="text-left sm:text-right">
                      <p className="text-[10px] text-blue-500 font-black uppercase tracking-tighter">Koolhydraten</p>
                      <p className="font-black text-slate-800 text-sm">{entry.carbs}g</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] text-slate-400 font-black uppercase tracking-tighter">Dosering</p>
                      <p className="font-black text-slate-800 text-sm">{entry.calculatedInsulin}u</p>
                    </div>
                  </div>
                </div>
              )) : (
                <div className="text-center py-20 px-6">
                  <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-300">
                    <i className="fa-solid fa-magnifying-glass text-2xl"></i>
                  </div>
                  <p className="text-slate-500 font-bold">Geen resultaten</p>
                  <p className="text-slate-400 text-xs mt-1">
                    {filterDate 
                      ? `Er zijn geen maaltijden gevonden voor ${new Date(filterDate).toLocaleDateString('nl-NL')}` 
                      : 'Je hebt nog geen maaltijden geregistreerd.'}
                  </p>
                  {filterDate && (
                    <button 
                      onClick={() => setFilterDate('')}
                      className="mt-4 text-blue-600 font-bold text-sm hover:underline"
                    >
                      Toon alle maaltijden
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen pb-28 max-w-lg mx-auto bg-slate-50 flex flex-col relative overflow-x-hidden">
      <header className="px-6 pt-8 pb-4 flex justify-between items-center sticky top-0 bg-slate-50/80 backdrop-blur-md z-30">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">
            Gluco<span className="text-blue-600">Calc</span> <span className="text-blue-300">Jinte</span>
          </h1>
          <p className="text-slate-400 text-sm font-medium">Glucose Calculator</p>
        </div>
        <button 
          onClick={() => setShowSettings(true)}
          className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-slate-500 shadow-lg shadow-slate-100 border border-slate-100 hover:text-blue-600 transition-colors"
        >
          <i className="fa-solid fa-user-gear text-lg"></i>
        </button>
      </header>

      <main className="px-6 flex-1">
        {renderContent()}
      </main>

      <div className="px-6 mt-8 mb-4">
        <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4 text-[11px] text-amber-800 flex gap-3">
          <i className="fa-solid fa-circle-exclamation text-amber-500 text-base"></i>
          <p>
            <strong>Medische Disclaimer:</strong> Schattingen kunnen onnauwkeurig zijn. 
            Verifieer de dosering altijd met een medisch professional.
          </p>
        </div>
      </div>

      <nav className="fixed bottom-6 left-1/2 -translate-x-1/2 w-full max-w-[calc(100%-3rem)] md:max-w-md bg-slate-900 rounded-3xl p-2 shadow-2xl flex items-center justify-between z-40 border border-slate-800">
        <button
          onClick={() => setActiveTab('dashboard')}
          className={`flex-1 py-4 flex flex-col items-center transition-all ${activeTab === 'dashboard' ? 'text-white' : 'text-slate-500'}`}
        >
          <i className={`fa-solid fa-house-chimney text-lg mb-1 ${activeTab === 'dashboard' ? 'animate-bounce-short text-blue-400' : ''}`}></i>
          <span className="text-[10px] font-bold uppercase tracking-widest">Start</span>
        </button>
        
        <div className="w-12 h-12 flex items-center justify-center">
          <button
            onClick={() => {
              const modal = document.getElementById('ai-vision-overlay');
              if (modal) modal.classList.remove('hidden');
            }}
            className="w-14 h-14 bg-blue-600 rounded-full flex items-center justify-center text-white shadow-lg shadow-blue-500/40 hover:scale-110 active:scale-95 transition-all transform -translate-y-4 border-4 border-slate-900"
          >
            <i className="fa-solid fa-camera text-2xl"></i>
          </button>
        </div>

        <button
          onClick={() => setActiveTab('history')}
          className={`flex-1 py-4 flex flex-col items-center transition-all ${activeTab === 'history' ? 'text-white' : 'text-slate-500'}`}
        >
          <i className={`fa-solid fa-clock-rotate-left text-lg mb-1 ${activeTab === 'history' ? 'text-blue-400' : ''}`}></i>
          <span className="text-[10px] font-bold uppercase tracking-widest">Historie</span>
        </button>
      </nav>

      <div id="ai-vision-overlay" className="fixed inset-0 bg-slate-900/90 z-50 p-6 hidden flex flex-col overflow-y-auto backdrop-blur-sm">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-white text-xl font-bold">Voedselscanner</h2>
          <button onClick={() => document.getElementById('ai-vision-overlay')?.classList.add('hidden')} className="text-white text-2xl">
            <i className="fa-solid fa-times"></i>
          </button>
        </div>
        <FoodLogger settings={settings} onEntryAdded={(e) => {
          addEntry(e);
          document.getElementById('ai-vision-overlay')?.classList.add('hidden');
        }} />
      </div>

      {showSettings && (
        <SettingsModal 
          settings={settings} 
          onSave={saveSettings} 
          onClose={() => setShowSettings(false)} 
        />
      )}

      <style>{`
        @keyframes bounce-short {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-4px); }
        }
        .animate-bounce-short {
          animation: bounce-short 1s ease-in-out infinite;
        }
        input[type="date"]::-webkit-calendar-picker-indicator {
          background: transparent;
          bottom: 0;
          color: transparent;
          cursor: pointer;
          height: auto;
          left: 0;
          position: absolute;
          right: 0;
          top: 0;
          width: auto;
        }
      `}</style>
    </div>
  );
};

export default App;
