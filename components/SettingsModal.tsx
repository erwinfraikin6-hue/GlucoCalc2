
import React, { useState } from 'react';
import { UserSettings } from '../types';

interface SettingsModalProps {
  settings: UserSettings;
  onSave: (settings: UserSettings) => void;
  onClose: () => void;
}

const SettingsModal: React.FC<SettingsModalProps> = ({ settings, onSave, onClose }) => {
  const [localSettings, setLocalSettings] = useState<UserSettings>(settings);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
      <div className="bg-white rounded-3xl w-full max-w-md p-8 shadow-2xl animate-in fade-in zoom-in duration-200">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-slate-800">Mijn Instellingen</h2>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
            <i className="fa-solid fa-xmark text-xl"></i>
          </button>
        </div>

        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-slate-600 mb-1">
              Koolhydraatratio (KIR/ICR)
            </label>
            <div className="relative">
              <input
                type="number"
                value={localSettings.icr}
                onChange={(e) => setLocalSettings({ ...localSettings, icr: Number(e.target.value) })}
                className="w-full pl-4 pr-24 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-slate-400">g koolh./unit</span>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-600 mb-1">
              Insulinegevoeligheid (ISF)
            </label>
            <div className="relative">
              <input
                type="number"
                value={localSettings.isf}
                onChange={(e) => setLocalSettings({ ...localSettings, isf: Number(e.target.value) })}
                className="w-full pl-4 pr-24 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-slate-400">{localSettings.unit}/unit</span>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-600 mb-1">
              Streefwaarde Bloedsuiker
            </label>
            <div className="relative">
              <input
                type="number"
                value={localSettings.targetBg}
                onChange={(e) => setLocalSettings({ ...localSettings, targetBg: Number(e.target.value) })}
                className="w-full pl-4 pr-16 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-slate-400">{localSettings.unit}</span>
            </div>
          </div>

          <button
            onClick={() => onSave(localSettings)}
            className="w-full bg-blue-600 text-white py-4 rounded-xl font-bold shadow-lg shadow-blue-200 hover:bg-blue-700 transition-colors active:scale-95 transform"
          >
            Profiel Opslaan
          </button>
        </div>
      </div>
    </div>
  );
};

export default SettingsModal;
