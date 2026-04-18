import React from 'react';
import { monthNames, displayCrewName, getAttendance } from '../lib/harvestData';
import type { HarvestData } from '../lib/harvestData';

interface AttendanceSectionProps {
  harvestData: HarvestData;
  filteredCrews: string[];
  calendarDT: string[];
  calendarSN: number[];
  asDate: string;
  setAsDate: (value: string) => void;
  asInputs: Record<string, string>;
  busInputs: Record<string, boolean>;
  foremenInputs: Record<string, boolean>;
  setAsInputs: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  setBusInputs: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;
  setForemenInputs: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;
  handleSaveAs: () => void;
  handleClearAs: () => void;
  asMsg: { text: string; color: string };
  busesToday: number;
  busesFortnight: number;
  busesMonth: number;
  foremenToday: number;
  foremenFortnight: number;
  foremenMonth: number;
  dayW: (date: string) => number;
}

export default function AttendanceSection({
  harvestData,
  filteredCrews,
  calendarDT,
  calendarSN,
  asDate,
  setAsDate,
  asInputs,
  busInputs,
  foremenInputs,
  setAsInputs,
  setBusInputs,
  setForemenInputs,
  handleSaveAs,
  handleClearAs,
  asMsg,
  busesToday,
  busesFortnight,
  busesMonth,
  foremenToday,
  foremenFortnight,
  foremenMonth,
  dayW,
}: AttendanceSectionProps) {
  const currentMonth = asDate.split('/')[1];

  const crewList = filteredCrews.length === 0 ? (
    <div className="rounded-[24px] border border-dashed border-gray-300 bg-slate-50/90 p-8 text-center text-sm font-bold text-brand-secondary">
      No hay cuadrillas para este filtro. Cambiá empresa o agregá cuadrillas para ver la carga de asistencia.
    </div>
  ) : (
    filteredCrews.map((crew) => {
      const attendance = getAttendance(harvestData, crew, asDate);
      const hasAttendance = attendance !== null;
      const busSelected = busInputs[crew] || false;
      const foremanSelected = foremenInputs[crew] || false;

      return (
        <div key={crew} className="flex flex-col gap-3 p-4 bg-slate-50/90 rounded-[24px] border border-gray-200 hover:border-brand-primary/30 hover:shadow-lg transition-all">
          <p className="text-sm font-bold text-brand-primary m-0">{displayCrewName(crew)}</p>
          <div className="flex flex-wrap items-center gap-3">
            {hasAttendance ? (
              <span className="text-xs text-[#1B4332] font-bold whitespace-nowrap bg-[#1B4332]/10 px-2 py-1 rounded-md">
                ✓ {attendance} trab. {busSelected && ' 🚌'}{foremanSelected && ' 👷‍♂️'}
              </span>
            ) : (
              <span className="text-xs text-gray-400 whitespace-nowrap">sin dato</span>
            )}

            <div className="flex items-center gap-4 bg-white px-3 py-1.5 rounded-2xl border border-gray-200 shadow-sm">
              <label className="flex items-center gap-2 cursor-pointer group" title="¿Asistió el capataz?">
                <input
                  type="checkbox"
                  checked={foremanSelected}
                  onChange={(e) => setForemenInputs({ ...foremenInputs, [crew]: e.target.checked })}
                  className="w-4 h-4 rounded border-gray-300 text-brand-primary focus:ring-brand-primary cursor-pointer"
                />
                <span className="text-xl leading-none group-hover:scale-110 transition-transform" aria-hidden="true">👷‍♂️</span>
              </label>
              <div className="w-px h-5 bg-gray-200"></div>
              <label className="flex items-center gap-2 cursor-pointer group" title="¿Asistió con colectivo?">
                <input
                  type="checkbox"
                  checked={busSelected}
                  onChange={(e) => setBusInputs({ ...busInputs, [crew]: e.target.checked })}
                  className="w-4 h-4 rounded border-gray-300 text-brand-primary focus:ring-brand-primary cursor-pointer"
                />
                <span className="text-xl leading-none group-hover:scale-110 transition-transform" aria-hidden="true">🚌</span>
              </label>
            </div>

            <input
              type="number"
              inputMode="numeric"
              min="0"
              placeholder="cant."
              value={asInputs[crew] || ''}
              onChange={(e) => setAsInputs({ ...asInputs, [crew]: e.target.value })}
              className="w-[80px] text-center font-mono text-sm font-bold border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-brand-primary/20 transition-all"
              aria-label={`Cantidad de trabajadores para ${displayCrewName(crew)}`}
            />
          </div>
        </div>
      );
    })
  );

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="rounded-[30px] bg-white/95 border border-gray-200 shadow-[0_18px_50px_-35px_rgba(15,23,42,0.35)] p-6">
        <h2 className="text-xl font-heading font-bold text-brand-primary">Asistencia</h2>
        <p className="text-sm text-brand-secondary mt-2">Seleccioná el día y cargá asistencia, colectivos y capataces.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white/95 border border-gray-200 shadow-[0_18px_50px_-35px_rgba(15,23,42,0.35)] rounded-[30px] p-6">
          <p className="text-xs text-brand-secondary font-bold mb-6 tracking-widest uppercase">Ingresar Asistencia</p>

          <div className="mb-6 grid gap-4 sm:grid-cols-2">
            <div className="flex-1">
              <label className="text-xs font-bold text-brand-secondary block mb-2">Mes</label>
              <select
                value={currentMonth}
                onChange={(e) => {
                  const newMonth = e.target.value;
                  const firstDay = calendarDT.find((d) => d.split('/')[1] === newMonth);
                  if (firstDay) setAsDate(firstDay);
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
                value={asDate}
                onChange={(e) => setAsDate(e.target.value)}
                className="w-full border border-gray-200 bg-brand-neutral rounded-xl px-4 py-2.5 text-sm font-bold text-brand-secondary focus:outline-none focus:ring-2 focus:ring-brand-primary/20 transition-all cursor-pointer"
              >
                {calendarDT.filter((d) => d.split('/')[1] === currentMonth).map((date) => (
                  <option key={date} value={date}>{date.split('/')[0]}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="mb-6 bg-gradient-to-r from-emerald-50 to-slate-50 rounded-3xl p-5 border border-gray-200/80 shadow-sm">
            <div className="grid grid-cols-2 gap-4 divide-x divide-gray-200">
              <div>
                <p className="text-[10px] text-brand-secondary font-bold mb-3 tracking-widest uppercase flex items-center gap-2 justify-center">
                  <span>🚌</span> Colectivos
                </p>
                <div className="flex justify-around">
                  <div className="text-center">
                    <p className="text-xl font-heading font-extrabold text-brand-primary">{busesToday}</p>
                    <p className="text-[9px] font-bold text-gray-500 uppercase mt-1">Hoy</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xl font-heading font-extrabold text-brand-primary">{busesFortnight}</p>
                    <p className="text-[9px] font-bold text-gray-500 uppercase mt-1">Quinc</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xl font-heading font-extrabold text-brand-primary">{busesMonth}</p>
                    <p className="text-[9px] font-bold text-gray-500 uppercase mt-1">Mes</p>
                  </div>
                </div>
              </div>
              <div>
                <p className="text-[10px] text-brand-secondary font-bold mb-3 tracking-widest uppercase flex items-center gap-2 justify-center">
                  <span>👷‍♂️</span> Capataces
                </p>
                <div className="flex justify-around">
                  <div className="text-center">
                    <p className="text-xl font-heading font-extrabold text-brand-primary">{foremenToday}</p>
                    <p className="text-[9px] font-bold text-gray-500 uppercase mt-1">Hoy</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xl font-heading font-extrabold text-brand-primary">{foremenFortnight}</p>
                    <p className="text-[9px] font-bold text-gray-500 uppercase mt-1">Quinc</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xl font-heading font-extrabold text-brand-primary">{foremenMonth}</p>
                    <p className="text-[9px] font-bold text-gray-500 uppercase mt-1">Mes</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-3">{crewList}</div>

          <div className="mt-6 flex items-center gap-3 flex-wrap pt-2">
            <button
              onClick={handleSaveAs}
              className="bg-brand-primary hover:bg-[#122e22] text-white px-6 py-3 rounded-full text-sm font-bold transition-all shadow-lg shadow-brand-primary/10"
            >
              Guardar
            </button>
            <button
              onClick={handleClearAs}
              className="bg-white border border-gray-200 hover:bg-brand-neutral text-brand-secondary px-5 py-3 rounded-full text-sm font-bold transition-all"
            >
              Borrar día
            </button>
            <span className={`text-sm font-bold ${asMsg.color}`}>{asMsg.text}</span>
          </div>
        </div>

        <div className="bg-white border border-gray-200 shadow-sm rounded-2xl p-6">
          <p className="text-xs text-brand-secondary font-bold mb-6 tracking-widest uppercase">Cobertura de Asistencia</p>
          <div className="flex flex-wrap gap-2 mb-6">
            {calendarDT.filter((date) => date.split('/')[1] === currentMonth).map((date) => {
              const index = calendarDT.indexOf(date);
              const hasAttendance = filteredCrews.some((crew) => getAttendance(harvestData, crew, date) !== null);
              const isSunday = calendarSN[index] === 1;

              return (
                <div
                  key={date}
                  onClick={() => setAsDate(date)}
                  className={`w-11 h-11 rounded-xl flex flex-col items-center justify-center gap-0.5 cursor-pointer transition-colors select-none ${isSunday ? 'bg-[#E2E8F0] hover:bg-[#d5e5f2]' : date === asDate ? 'bg-brand-primary border border-brand-primary shadow-md' : 'bg-white border border-gray-200 hover:border-gray-400'}`}
                >
                  <span className={`text-[10px] font-medium ${isSunday ? 'text-brand-secondary' : 'text-gray-400'}`}>{date.split('/')[0]}</span>
                  <span className={`text-xs font-bold ${isSunday ? 'text-brand-secondary' : 'text-gray-300'}`}>{isSunday ? 'D' : hasAttendance ? dayW(date) : '·'}</span>
                </div>
              );
            })}
          </div>

          <div className="flex gap-4 text-xs font-bold text-brand-secondary flex-wrap">
            <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-brand-primary inline-block"></span>Con datos</span>
            <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-white border border-gray-200 inline-block"></span>Sin cargar</span>
            <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-[#E2E8F0] inline-block"></span>Domingo</span>
          </div>
        </div>
      </div>
    </div>
  );
}
