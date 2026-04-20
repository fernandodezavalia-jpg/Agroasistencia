import { useMemo } from 'react';
import { getAttendance, getBins } from '../lib/harvestData';
import type { HarvestData } from '../lib/harvestData';

interface Props {
  crews: string[];
  crewCompanies: Record<string, string>;
  harvestData: HarvestData;
  activeDT: string[];
}

const COMPANY_BADGE: Record<string, string> = {
  'Limas y Limones S.R.L.': 'bg-emerald-100 text-emerald-800 border-emerald-200',
  'A.Z. Agricolas S.R.L.': 'bg-amber-100 text-amber-800 border-amber-200',
};

const MEDAL_COLOR = ['text-amber-400', 'text-slate-400', 'text-amber-700'];

export default function RankingSection({ crews, crewCompanies, harvestData, activeDT }: Props) {
  const ranked = useMemo(() => {
    return crews
      .map((crew) => {
        let totalBins = 0, totalAttendance = 0, diasTrabajados = 0;
        activeDT.forEach((date) => {
          const a = getAttendance(harvestData, crew, date);
          const b = getBins(harvestData, crew, date);
          if (a !== null) { totalAttendance += a; diasTrabajados += 1; }
          if (b !== null) totalBins += b;
        });
        return {
          crew,
          displayName: crew.charAt(0) + crew.slice(1).toLowerCase(),
          company: crewCompanies[crew] ?? '',
          jornales: totalAttendance,
          bins: totalBins,
          rendimiento: totalAttendance > 0 && totalBins > 0 ? totalBins / totalAttendance : null,
          diasTrabajados,
        };
      })
      .filter((item) => item.jornales > 0 || item.bins > 0)
      .sort((a, b) => (b.rendimiento ?? -1) - (a.rendimiento ?? -1));
  }, [crews, harvestData, activeDT, crewCompanies]);

  if (ranked.length === 0) {
    return (
      <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-12 text-center">
          <p className="text-brand-secondary text-sm font-medium">No hay datos de temporada aún.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-gray-100">
          <p className="text-xs text-brand-secondary font-bold tracking-widest uppercase">
            Ranking Histórico — Temporada Completa
          </p>
          <p className="text-xs text-brand-secondary mt-1">
            {ranked.length} cuadrillas con actividad · ordenadas por rendimiento
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-brand-neutral">
                <th className="text-left text-xs font-bold text-brand-secondary uppercase tracking-wider px-6 py-3">#</th>
                <th className="text-left text-xs font-bold text-brand-secondary uppercase tracking-wider px-4 py-3">Cuadrilla</th>
                <th className="text-left text-xs font-bold text-brand-secondary uppercase tracking-wider px-4 py-3">Empresa</th>
                <th className="text-right text-xs font-bold text-brand-secondary uppercase tracking-wider px-4 py-3">Jornales</th>
                <th className="text-right text-xs font-bold text-brand-secondary uppercase tracking-wider px-4 py-3">Bins</th>
                <th className="text-right text-xs font-bold text-brand-secondary uppercase tracking-wider px-4 py-3">Rendimiento</th>
                <th className="text-right text-xs font-bold text-brand-secondary uppercase tracking-wider px-4 py-3">Días Trab.</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {ranked.map((item, index) => (
                <tr
                  key={item.crew}
                  className={`${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'} hover:bg-brand-neutral/50 transition-colors`}
                >
                  <td className="px-6 py-4">
                    <span className={`text-sm font-extrabold ${MEDAL_COLOR[index] ?? 'text-brand-secondary'}`}>
                      {index + 1}
                    </span>
                  </td>
                  <td className="px-4 py-4">
                    <span className="font-bold text-brand-primary text-sm">{item.displayName}</span>
                  </td>
                  <td className="px-4 py-4">
                    <span
                      className={`text-xs font-bold px-2.5 py-1 rounded-full border ${COMPANY_BADGE[item.company] ?? 'bg-gray-100 text-gray-700 border-gray-200'}`}
                    >
                      {item.company.split(' ')[0]}
                    </span>
                  </td>
                  <td className="px-4 py-4 text-right">
                    <span className="font-bold text-brand-primary text-sm">
                      {item.jornales.toLocaleString('es-AR')}
                    </span>
                  </td>
                  <td className="px-4 py-4 text-right">
                    <span className="font-bold text-brand-primary text-sm">
                      {item.bins > 0 ? item.bins.toLocaleString('es-AR') : '—'}
                    </span>
                  </td>
                  <td className="px-4 py-4 text-right">
                    <span className="font-bold text-brand-primary text-sm">
                      {item.rendimiento !== null ? item.rendimiento.toFixed(2) : '—'}
                    </span>
                  </td>
                  <td className="px-4 py-4 text-right">
                    <span className="font-medium text-brand-secondary text-sm">{item.diasTrabajados}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
