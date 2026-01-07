
import React from 'react';
import { FoodEntry, UserSettings } from '../types';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import QuickCalculator from './QuickCalculator';

interface DashboardProps {
  entries: FoodEntry[];
  settings: UserSettings;
  onLogEntry: (entry: FoodEntry) => void;
  onOpenSettings: () => void;
}

const Dashboard: React.FC<DashboardProps> = ({ entries, settings, onLogEntry, onOpenSettings }) => {
  const todayEntries = entries.filter(e => {
    const date = new Date(e.timestamp);
    const now = new Date();
    return date.getDate() === now.getDate() && date.getMonth() === now.getMonth();
  });

  const totalCarbs = todayEntries.reduce((acc, curr) => acc + curr.carbs, 0);
  const totalInsulin = todayEntries.reduce((acc, curr) => acc + curr.calculatedInsulin, 0);
  
  const chartData = todayEntries.slice().reverse().map(e => ({
    time: new Date(e.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    carbs: e.carbs,
    insulin: e.calculatedInsulin
  }));

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-gradient-to-br from-blue-500 to-blue-700 p-6 rounded-3xl text-white shadow-xl shadow-blue-100">
          <p className="text-blue-100 text-xs font-bold uppercase tracking-widest mb-1">Koolhydraten Vandaag</p>
          <p className="text-3xl font-black">{totalCarbs.toFixed(1)} <span className="text-sm font-normal">g</span></p>
        </div>
        <div className="bg-gradient-to-br from-emerald-500 to-emerald-700 p-6 rounded-3xl text-white shadow-xl shadow-emerald-100">
          <p className="text-emerald-100 text-xs font-bold uppercase tracking-widest mb-1">Insuline Vandaag</p>
          <p className="text-3xl font-black">{totalInsulin.toFixed(1)} <span className="text-sm font-normal">u</span></p>
        </div>
      </div>

      <QuickCalculator settings={settings} onLog={onLogEntry} onOpenSettings={onOpenSettings} />

      <div className="bg-white p-6 rounded-3xl shadow-xl border border-slate-100">
        <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
          <i className="fa-solid fa-chart-line text-blue-500"></i>
          Activiteitstijdlijn
        </h3>
        <div className="h-48 w-full">
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorCarbs" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10}} />
                <YAxis hide />
                <Tooltip 
                  contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)'}}
                  cursor={{stroke: '#3b82f6', strokeWidth: 2, strokeDasharray: '4 4'}}
                />
                <Area 
                  type="monotone" 
                  dataKey="carbs" 
                  stroke="#3b82f6" 
                  strokeWidth={3}
                  fillOpacity={1} 
                  fill="url(#colorCarbs)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-slate-400">
              <i className="fa-solid fa-chart-line text-3xl mb-2 opacity-20"></i>
              <p className="text-sm">Geen activiteit geregistreerd vandaag</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
