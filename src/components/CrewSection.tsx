import React from 'react';
import { displayCrewName, getAttendance } from '../lib/harvestData';
import type { HarvestData } from '../lib/harvestData';

interface CrewSectionProps {
  filteredCrews: string[];
  crewCompanies: Record<string, string>;
  harvestData: HarvestData;
  calendarDT: string[];
  totalW: number;
  totalB: number;
  newCq: string;
  setNewCq: React.Dispatch<React.SetStateAction<string>>;
  newCqCompany: string;
  setNewCqCompany: React.Dispatch<React.SetStateAction<string>>;
  handleAddCq: () => void;
  handleRemoveCq: (crew: string) => void;
  cqMsg: { text: string; color: string };
}

const COMPANY_MAP: Record<string, { label: string; badge: string; accent: string }> = {
  'Limas y Limones S.R.L.': {
    label: 'Limas y Limones',
    badge: 'bg-emerald-100 text-emerald-800',
    accent: 'before:bg-emerald-400',
  },
  'A.Z. Agricolas S.R.L.': {
    label: 'A.Z. Agricolas',
    badge: 'bg-amber-100 text-amber-800',
    accent: 'before:bg-amber-400',
  },
};

export default function CrewSection({
  filteredCrews,
  crewCompanies,
  harvestData,
  calendarDT,
  totalW,
  newCq,
  setNewCq,
  newCqCompany,
  setNewCqCompany,
  handleAddCq,
  handleRemoveCq,
  cqMsg,
}: CrewSectionProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="bg-white/95 border border-gray-200 shadow-[0_18px_50px_-35px_rgba(15,23,42,0.35)] rounded-[30px] p-6">
        <p className="text-xs text-brand-secondary font-bold mb-6 tracking-widest uppercase">Cuadrillas Registradas</p>
        {filteredCrews.length === 0 ? (
          <div className="bg-brand-neutral rounded-xl p-6 text-center border border-gray-200">
            <p className="text-sm font-bold text-brand-secondary m-0">Sin cuadrillas registradas.</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {filteredCrews.map((crew) => {
              const company = crewCompanies[crew];
              const companyMeta = COMPANY_MAP[company] ?? { label: company, badge: 'bg-slate-100 text-slate-700', accent: 'before:bg-slate-400' };
              const totalAttendance = calendarDT.reduce((sum, date) => sum + (getAttendance(harvestData, crew, date) ?? 0), 0);

              return (
                <div key={crew} className={`relative overflow-hidden rounded-[28px] border border-gray-200/80 bg-slate-50/95 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-lg ${companyMeta.accent} before:absolute before:left-0 before:top-0 before:h-full before:w-1`}>
                  <div className="relative p-5 sm:p-6">
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                      <div>
                        <p className="text-base font-heading font-extrabold text-brand-primary">{displayCrewName(crew)}</p>
                        <span className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-[0.18em] ${companyMeta.badge}`}>
                          {companyMeta.label}
                        </span>
                      </div>
                      <button
                        onClick={() => handleRemoveCq(crew)}
                        className="self-start rounded-full border border-red-200 bg-white px-3 py-2 text-xs font-bold text-red-600 transition hover:bg-red-50"
                        title="Eliminar cuadrilla"
                      >
                        Eliminar
                      </button>
                    </div>

                    <div className="mt-5 rounded-[22px] border border-gray-200 bg-white px-4 py-3 shadow-sm">
                      <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-brand-secondary">Jornales totales</p>
                      <p className="text-2xl font-heading font-extrabold text-brand-primary mt-2">{totalAttendance.toLocaleString('es-AR')}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
        <p className="text-xs text-gray-400 mt-4 font-medium">Al eliminar una cuadrilla se borran todos sus datos de asistencia y producción.</p>
      </div>

      <div className="bg-white border border-gray-200 shadow-sm rounded-2xl p-6">
        <p className="text-xs text-brand-secondary font-bold mb-6 tracking-widest uppercase">Agregar Cuadrilla</p>
        <div className="mb-6">
          <label className="text-xs font-bold text-brand-secondary block mb-2">Nombre del capataz</label>
          <input
            type="text"
            placeholder="Ej: GONZALEZ"
            value={newCq}
            onChange={(e) => setNewCq(e.target.value.toUpperCase())}
            onKeyDown={(e) => e.key === 'Enter' && handleAddCq()}
            className="w-full uppercase font-sans text-sm font-bold border border-gray-200 bg-brand-neutral rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-brand-primary/20 transition-all mb-4"
          />
          <label className="text-xs font-bold text-brand-secondary block mb-2">Empresa</label>
          <select
            value={newCqCompany}
            onChange={(e) => setNewCqCompany(e.target.value)}
            className="w-full border border-gray-200 bg-brand-neutral rounded-xl px-4 py-2.5 text-sm font-bold text-brand-secondary focus:outline-none focus:ring-2 focus:ring-brand-primary/20 transition-all cursor-pointer"
          >
            {Object.keys(COMPANY_MAP).map((company) => (
              <option key={company} value={company}>{company}</option>
            ))}
          </select>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <button onClick={handleAddCq} className="bg-brand-primary hover:bg-[#122e22] text-white px-6 py-3 rounded-full text-sm font-bold transition-all shadow-lg shadow-brand-primary/10">Agregar</button>
          <span className={`text-sm font-bold ${cqMsg.color}`}>{cqMsg.text}</span>
        </div>
        <div className="mt-8 pt-6 border-t border-gray-200">
          <p className="text-xs text-brand-secondary font-bold mb-4 tracking-widest uppercase">Resumen</p>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-3xl font-heading font-extrabold text-brand-primary">{filteredCrews.length}</p>
              <p className="text-xs font-bold text-brand-secondary mt-1">cuadrillas</p>
            </div>
            <div>
              <p className="text-3xl font-heading font-extrabold text-brand-primary">{totalW.toLocaleString('es-AR')}</p>
              <p className="text-xs font-bold text-brand-secondary mt-1">jornales</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
