import React from 'react';
import { monthNames, displayCrewName, getAttendance, getBins } from '../lib/harvestData';
import type { HarvestData } from '../lib/harvestData';

interface BinsSectionProps {
  harvestData: HarvestData;
  filteredCrews: string[];
  calendarDT: string[];
  calendarSN: number[];
  biDate: string;
  setBiDate: (value: string) => void;
  biInputs: Record<string, string>;
  setBiInputs: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  handleSaveBi: () => void;
  handleClearBi: () => void;
  biMsg: { text: string; color: string };
}

export default function BinsSection({
  harvestData,
  filteredCrews,
  calendarDT,
  calendarSN,
  biDate,
  setBiDate,
  biInputs,
  setBiInputs,
  handleSaveBi,
  handleClearBi,
  biMsg,
}: BinsSectionProps) {
  const currentMonth = biDate.split('/')[1];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="bg-white/95 border border-gray-200 shadow-[0_18px_50px_-35px_rgba(15,23,42,0.35)] rounded-[30px] p-6">
        <p className="text-xs text-brand-secondary font-bold mb-6 tracking-widest uppercase">Ingresar Producción</p>
        <div className="mb-6 grid gap-4 sm:grid-cols-2">
          <div className="flex-1">
            <label className="text-xs font-bold text-brand-secondary block mb-2">Mes</label>
            <select
              value={currentMonth}
              onChange={(e) => {
                const newMonth = e.target.value;
                const firstDay = calendarDT.find((d) => d.split('/')[1] === newMonth && !calendarSN[calendarDT.indexOf(d)]);
                if (firstDay) setBiDate(firstDay);
              }}
              className="w-full border border-gray-200 bg-brand-neutral rounded-xl px-4 py-2.5 text-sm font-bold text-brand-secondary focus:outline-none focus:ring-2 focus:ring-brand-primary/20 transition-all cursor-pointer"
            >
              {[...new Set(calendarDT.map((d) => d.split('/')[1]))].map((month) => (
                <option key={month} value={month}>{monthNames[month] || month}</option>
              ))}
            </select>
          </div>
          <div className="flex-1">
            <label className="text-xs font-bold text-brand-secondary block mb-2">Día</label>
            <select
              value={biDate}
              onChange={(e) => setBiDate(e.target.value)}
              className="w-full border border-gray-200 bg-brand-neutral rounded-xl px-4 py-2.5 text-sm font-bold text-brand-secondary focus:outline-none focus:ring-2 focus:ring-brand-primary/20 transition-all cursor-pointer"
            >
              {calendarDT.filter((d) => d.split('/')[1] === currentMonth && !calendarSN[calendarDT.indexOf(d)]).map((date) => (
                <option key={date} value={date}>{date.split('/')[0]}</option>
              ))}
            </select>
          </div>
        </div>

        {filteredCrews.filter((crew) => getAttendance(harvestData, crew, biDate) !== null).length === 0 ? (
          <div className="bg-slate-50 rounded-3xl p-6 text-center border border-gray-200 shadow-sm">
            <p className="text-sm font-bold text-brand-secondary m-0">No hay asistencia cargada para este día.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {filteredCrews.filter((crew) => getAttendance(harvestData, crew, biDate) !== null).map((crew) => {
              const filled = getBins(harvestData, crew, biDate) !== null;
              const attendance = getAttendance(harvestData, crew, biDate);

              return (
                <div key={crew} className="flex items-center justify-between p-4 bg-slate-50/90 rounded-[24px] border border-gray-200/80 hover:border-brand-primary/20 transition-all shadow-sm">
                  <div>
                    <p className="text-sm font-bold text-brand-primary m-0">{displayCrewName(crew)}</p>
                    <p className="text-xs text-brand-secondary mt-0.5">{attendance} trabajadores</p>
                  </div>
                  <div className="flex items-center gap-3">
                    {filled ? (
                      <span className="text-xs text-[#1B4332] font-bold whitespace-nowrap bg-[#1B4332]/10 px-2 py-1 rounded-md">✓ cargado</span>
                    ) : (
                      <span className="text-xs text-gray-400 whitespace-nowrap">pendiente</span>
                    )}
                    <input
                      type="number"
                      inputMode="numeric"
                      min="0"
                      placeholder="bines"
                      value={biInputs[crew] || ''}
                      onChange={(e) => setBiInputs({ ...biInputs, [crew]: e.target.value })}
                      className="w-[80px] text-center font-mono text-sm font-bold border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-brand-primary/20 transition-all"
                      aria-label={`Cantidad de bines para ${displayCrewName(crew)}`}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <div className="mt-6 flex items-center gap-3 flex-wrap pt-2">
          <button onClick={handleSaveBi} className="bg-brand-primary hover:bg-[#122e22] text-white px-6 py-2.5 rounded-full text-sm font-bold transition-all shadow-sm hover:shadow">Guardar</button>
          <button onClick={handleClearBi} className="bg-white border border-gray-200 hover:bg-brand-neutral text-brand-secondary px-5 py-2.5 rounded-full text-sm font-bold transition-all">Borrar día</button>
          <span className={`text-sm font-bold ${biMsg.color}`}>{biMsg.text}</span>
        </div>
      </div>

      <div className="bg-white/95 border border-gray-200 shadow-[0_18px_50px_-35px_rgba(15,23,42,0.35)] rounded-[30px] p-6">
        <p className="text-xs text-brand-secondary font-bold mb-6 tracking-widest uppercase">Cobertura de Bins/Bolsones</p>
        <div className="flex flex-wrap gap-2 mb-6">
          {calendarDT.filter((date) => date.split('/')[1] === currentMonth).map((date) => {
            const index = calendarDT.indexOf(date);
            if (calendarSN[index]) {
              return (
                <div key={date} className="w-11 h-11 rounded-xl flex flex-col items-center justify-center gap-0.5 bg-[#E2E8F0] select-none">
                  <span className="text-[10px] text-brand-secondary font-medium">{date.split('/')[0]}</span>
                  <span className="text-xs text-brand-secondary font-bold">D</span>
                </div>
              );
            }

            const hasAttendance = filteredCrews.some((crew) => getAttendance(harvestData, crew, date) !== null);
            if (!hasAttendance) {
              return (
                <div key={date} className="w-11 h-11 rounded-xl flex flex-col items-center justify-center gap-0.5 bg-brand-neutral border border-gray-200 select-none opacity-50">
                  <span className="text-[10px] text-gray-400 font-medium">{date.split('/')[0]}</span>
                  <span className="text-xs text-gray-400 font-bold">—</span>
                </div>
              );
            }

            const hasBins = filteredCrews.some((crew) => getBins(harvestData, crew, date) !== null);
            if (hasBins) {
              return (
                <div
                  key={date}
                  onClick={() => setBiDate(date)}
                  className="w-11 h-11 rounded-xl flex flex-col items-center justify-center gap-0.5 bg-brand-secondary cursor-pointer hover:bg-[#323a46] transition-colors select-none shadow-sm"
                >
                  <span className="text-[10px] text-white/70 font-medium">{date.split('/')[0]}</span>
                  <span className="text-xs text-white font-bold">{filteredCrews.reduce((sum, crew) => sum + (getBins(harvestData, crew, date) || 0), 0)}</span>
                </div>
              );
            }

            return (
              <div
                key={date}
                onClick={() => setBiDate(date)}
                className="w-11 h-11 rounded-xl flex flex-col items-center justify-center gap-0.5 bg-white border border-gray-200 cursor-pointer hover:border-gray-400 transition-colors select-none"
              >
                <span className="text-[10px] text-gray-400 font-medium">{date.split('/')[0]}</span>
                <span className="text-xs text-gray-300 font-bold">·</span>
              </div>
            );
          })}
        </div>

        <div className="flex gap-4 text-xs font-bold text-brand-secondary flex-wrap">
          <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-brand-secondary inline-block"></span>Cargado</span>
          <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-white border border-gray-200 inline-block"></span>Pendiente</span>
          <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-[#E2E8F0] inline-block"></span>No laborable</span>
        </div>
      </div>
    </div>
  );
}
