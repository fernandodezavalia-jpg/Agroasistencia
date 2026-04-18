import React from 'react';
import { displayCrewName, getAttendance, getBins } from '../lib/harvestData';
import type { HarvestData } from '../lib/harvestData';

interface HeatmapSectionProps {
  harvestData: HarvestData;
  filteredCrews: string[];
  filteredDT: string[];
  calendarDT: string[];
  calendarSN: number[];
  hmMode: 'a' | 'b' | 'r';
  setHmMode: React.Dispatch<React.SetStateAction<'a' | 'b' | 'r'>>;
  dayW: (date: string) => number;
  dayB: (date: string) => number;
  selectedCrew: string | null;
  onSelectCrew: (crew: string | null) => void;
}

const bgA = (value: number | null, sunday: number) => {
  if (sunday) return 'bg-[#E2E8F0]';
  if (value === null) return '';
  if (value === 0) return 'bg-white border border-gray-200';
  if (value <= 15) return 'bg-[#1B4332]/20';
  if (value <= 25) return 'bg-[#1B4332]/40';
  if (value <= 35) return 'bg-[#1B4332]/60';
  if (value <= 45) return 'bg-[#1B4332]/80';
  return 'bg-[#1B4332]';
};

const fgA = (value: number | null) => (value && value > 25 ? 'text-white' : 'text-brand-primary font-bold');

const bgB = (value: number | null, sunday: number) => {
  if (sunday) return 'bg-[#E2E8F0]';
  if (value === null) return '';
  if (value === 0) return 'bg-white border border-gray-200';
  if (value <= 5) return 'bg-[#4A5568]/20';
  if (value <= 10) return 'bg-[#4A5568]/40';
  if (value <= 15) return 'bg-[#4A5568]/60';
  if (value <= 20) return 'bg-[#4A5568]/80';
  return 'bg-[#4A5568]';
};

const fgB = (value: number | null) => (value && value > 10 ? 'text-white' : 'text-brand-secondary font-bold');

const bgR = (value: number | null, sunday: number) => {
  if (sunday) return 'bg-[#E2E8F0]';
  if (value === null) return '';
  if (value < 0.2) return 'bg-[#5A302F]/20';
  if (value < 0.4) return 'bg-[#5A302F]/40';
  if (value < 0.6) return 'bg-[#5A302F]/60';
  if (value < 0.8) return 'bg-[#5A302F]/80';
  return 'bg-[#5A302F]';
};

const fgR = (value: number | null) => (value && value >= 0.4 ? 'text-white' : 'text-brand-tertiary font-bold');

export default function HeatmapSection({
  harvestData,
  filteredCrews,
  filteredDT,
  calendarDT,
  calendarSN,
  hmMode,
  setHmMode,
  dayW,
  dayB,
  selectedCrew,
  onSelectCrew,
}: HeatmapSectionProps) {
  const getRend = (crew: string, date: string) => {
    const attendance = getAttendance(harvestData, crew, date);
    const bins = getBins(harvestData, crew, date);
    if (attendance && bins !== null) {
      return bins / attendance;
    }
    return null;
  };

  const getSN = (date: string) => {
    const index = calendarDT.indexOf(date);
    return index >= 0 ? calendarSN[index] : 0;
  };

  return (
    <div className="bg-white border border-gray-200 shadow-sm rounded-2xl p-6 overflow-x-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
        <div className="flex min-w-0 flex-col gap-2">
          <p className="text-xs text-brand-secondary font-bold m-0 tracking-widest uppercase">Mapa de Calor</p>
          {selectedCrew && (
            <p className="text-sm text-brand-primary font-semibold">Cuadrilla seleccionada: {displayCrewName(selectedCrew)}</p>
          )}
        </div>
        <div className="flex gap-2 p-1 bg-brand-neutral border border-gray-200 rounded-full">
          {[
            { id: 'a', label: 'Asistencia' },
            { id: 'b', label: 'Bins/Bolsones' },
            { id: 'r', label: 'Rendimiento' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setHmMode(tab.id as 'a' | 'b' | 'r')}
              className={`rounded-full px-4 py-1.5 text-xs font-bold transition-all ${hmMode === tab.id ? 'bg-white text-brand-primary shadow-sm border border-gray-200' : 'bg-transparent text-brand-secondary hover:text-brand-primary'}`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="min-w-[800px]">
        <table className="w-full border-collapse">
          <thead>
            <tr>
              <th className="text-left text-xs text-brand-secondary py-3 px-4 font-bold uppercase tracking-wider border-b border-gray-200">Cuadrilla</th>
              {filteredDT.map((date) => {
                const isSunday = getSN(date);
                return (
                  <th key={date} className={`text-[10px] text-brand-secondary text-center px-1 py-3 font-bold border-b border-gray-200 ${isSunday ? 'bg-[#E2E8F0]' : ''}`}>
                    {date.split('/')[0]}<br />
                    <span className="text-gray-400 font-medium">{date.split('/')[1]}</span>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filteredCrews.map((crew, idx) => {
              const isSelected = selectedCrew === crew;
              return (
                <tr
                  key={crew}
                  className={`${idx % 2 === 0 ? 'bg-white' : 'bg-brand-neutral/50'} ${isSelected ? 'ring-2 ring-brand-primary bg-brand-primary/10' : ''} hover:bg-brand-neutral transition-colors group cursor-pointer`}
                  onClick={() => onSelectCrew(isSelected ? null : crew)}
                >
                  <td className="text-xs font-bold text-brand-primary whitespace-nowrap py-2 px-4 group-hover:text-[#122e22] transition-colors">{displayCrewName(crew)}</td>
                  {filteredDT.map((date) => {
                    const isSunday = getSN(date);
                    let bgClass = '';
                    let fgClass = 'text-gray-400';
                    let value: string | number = '–';

                    if (hmMode === 'a') {
                      const attendance = getAttendance(harvestData, crew, date);
                      bgClass = bgA(attendance, isSunday);
                      fgClass = fgA(attendance);
                      value = isSunday ? '' : (attendance !== null ? attendance : '–');
                    } else if (hmMode === 'b') {
                      const bins = getBins(harvestData, crew, date);
                      bgClass = bgB(bins, isSunday);
                      fgClass = fgB(bins);
                      value = isSunday ? '' : (bins !== null ? bins : '–');
                    } else {
                      const rendimiento = getRend(crew, date);
                      if (rendimiento !== null) {
                        bgClass = bgR(rendimiento, isSunday);
                        fgClass = fgR(rendimiento);
                        value = rendimiento.toFixed(1);
                      } else {
                        bgClass = isSunday ? 'bg-[#E2E8F0]' : 'bg-brand-neutral border border-gray-100';
                        fgClass = 'text-gray-400';
                        value = isSunday ? '' : '–';
                      }
                    }
                    return (
                      <td key={date} className="p-1 text-center align-middle">
                        <div
                          className={`w-8 h-8 mx-auto flex items-center justify-center text-[10px] font-mono font-bold rounded-md transition-transform hover:scale-110 cursor-default ${bgClass} ${fgClass}`}
                          title={`${displayCrewName(crew)} - ${date}\n${hmMode === 'a' ? `Asistencia: ${value}` : hmMode === 'b' ? `Bins/Bolsones: ${value}` : `Rendimiento: ${value}`}`}
                        >
                          {value}
                        </div>
                      </td>
                    );
                  })}
                </tr>
              );
            })}
            <tr>
              <td className="text-xs font-bold text-brand-primary py-4 px-4 border-t border-gray-200">Total</td>
              {filteredDT.map((date) => {
                const isSunday = getSN(date);
                if (isSunday) {
                  return (
                    <td key={date} className="p-1 border-t border-gray-200">
                      <div className="w-8 h-8 mx-auto flex items-center justify-center text-[10px] font-bold rounded-md bg-[#E2E8F0] text-gray-400">D</div>
                    </td>
                  );
                }

                if (hmMode === 'a') {
                  const total = dayW(date);
                  return (
                    <td key={date} className="p-1 border-t border-gray-200">
                      <div className={`w-8 h-8 mx-auto flex items-center justify-center text-[10px] font-bold rounded-md ${total > 0 ? 'text-brand-primary' : 'text-gray-400'}`}>{total > 0 ? total : '–'}</div>
                    </td>
                  );
                }

                if (hmMode === 'b') {
                  const total = dayB(date);
                  return (
                    <td key={date} className="p-1 border-t border-gray-200">
                      <div className={`w-8 h-8 mx-auto flex items-center justify-center text-[10px] font-bold rounded-md ${total > 0 ? 'text-brand-primary' : 'text-gray-400'}`}>{total > 0 ? total : '–'}</div>
                    </td>
                  );
                }

                return (
                  <td key={date} className="p-1 border-t border-gray-200">
                    <div className="w-8 h-8 mx-auto flex items-center justify-center text-[10px] font-bold rounded-md text-gray-400">—</div>
                  </td>
                );
              })}
            </tr>
          </tbody>
        </table>
      </div>

      <div className="flex gap-4 mt-6 text-xs font-bold text-brand-secondary flex-wrap">
        {hmMode === 'a' && (
          <>
            <span className="flex items-center gap-1.5"><span className="w-4 h-4 rounded-md bg-[#1B4332]/20 inline-block"></span>≤15</span>
            <span className="flex items-center gap-1.5"><span className="w-4 h-4 rounded-md bg-[#1B4332]/40 inline-block"></span>16–25</span>
            <span className="flex items-center gap-1.5"><span className="w-4 h-4 rounded-md bg-[#1B4332]/60 inline-block"></span>26–35</span>
            <span className="flex items-center gap-1.5"><span className="w-4 h-4 rounded-md bg-[#1B4332]/80 inline-block"></span>36–45</span>
            <span className="flex items-center gap-1.5"><span className="w-4 h-4 rounded-md bg-[#1B4332] inline-block"></span>46+</span>
          </>
        )}
        {hmMode === 'b' && (
          <>
            <span className="flex items-center gap-1.5"><span className="w-4 h-4 rounded-md bg-[#4A5568]/20 inline-block"></span>≤5</span>
            <span className="flex items-center gap-1.5"><span className="w-4 h-4 rounded-md bg-[#4A5568]/40 inline-block"></span>6–10</span>
            <span className="flex items-center gap-1.5"><span className="w-4 h-4 rounded-md bg-[#4A5568]/60 inline-block"></span>11–15</span>
            <span className="flex items-center gap-1.5"><span className="w-4 h-4 rounded-md bg-[#4A5568]/80 inline-block"></span>16–20</span>
            <span className="flex items-center gap-1.5"><span className="w-4 h-4 rounded-md bg-[#4A5568] inline-block"></span>20+</span>
          </>
        )}
        {hmMode === 'r' && (
          <>
            <span className="flex items-center gap-1.5"><span className="w-4 h-4 rounded-md bg-[#5A302F]/20 inline-block"></span>&lt;0.2</span>
            <span className="flex items-center gap-1.5"><span className="w-4 h-4 rounded-md bg-[#5A302F]/40 inline-block"></span>0.2–0.4</span>
            <span className="flex items-center gap-1.5"><span className="w-4 h-4 rounded-md bg-[#5A302F]/60 inline-block"></span>0.4–0.6</span>
            <span className="flex items-center gap-1.5"><span className="w-4 h-4 rounded-md bg-[#5A302F]/80 inline-block"></span>0.6–0.8</span>
            <span className="flex items-center gap-1.5"><span className="w-4 h-4 rounded-md bg-[#5A302F] inline-block"></span>0.8+</span>
          </>
        )}
      </div>
    </div>
  );
}
