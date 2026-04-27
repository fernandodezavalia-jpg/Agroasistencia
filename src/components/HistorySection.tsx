import { useState, useMemo } from 'react';
import {
  ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend,
} from 'recharts';
import type { ValueType } from 'recharts/types/component/DefaultTooltipContent';
import {
  generateCalendarForYear,
  getAttendance,
  getBins,
  getRecord,
  displayCrewName,
} from '../lib/harvestData';
import type { CampaignDoc } from '../lib/firestore';

interface Props {
  crews: string[];
  crewCompanies: Record<string, string>;
  historicalData: Record<number, CampaignDoc | null>;
  isLoading: boolean;
  campaignYear: number;
}

interface YearStats {
  year: number;
  jornales: number;
  binsTotal: number;
  binsInd: number;
  binsExp: number;
  rendimiento: number | null;
  dias: number;
  diasBins: number;
  hasSplit: boolean;
}

const COMPANY_BADGE: Record<string, string> = {
  'Limas y Limones S.R.L.': 'bg-emerald-100 text-emerald-800 border-emerald-200',
  'A.Z. Agricolas S.R.L.': 'bg-amber-100 text-amber-800 border-amber-200',
};

export default function HistorySection({
  crews,
  crewCompanies,
  historicalData,
  isLoading,
  campaignYear,
}: Props) {
  const [selectedCrew, setSelectedCrew] = useState<string>(crews[0] ?? '');

  const years = useMemo(
    () => Object.keys(historicalData).map(Number).sort(),
    [historicalData],
  );

  const stats = useMemo((): YearStats[] => {
    if (!selectedCrew) return [];
    return years
      .map((year): YearStats | null => {
        const campaignDoc = historicalData[year];
        if (!campaignDoc) return null;
        const { DT } = generateCalendarForYear(year);

        let jornales = 0, binsTotal = 0, binsInd = 0, binsExp = 0, dias = 0, diasBins = 0;

        DT.forEach((date) => {
          const a = getAttendance(campaignDoc.harvestData, selectedCrew, date);
          const b = getBins(campaignDoc.harvestData, selectedCrew, date);
          const rec = getRecord(campaignDoc.harvestData, selectedCrew, date);

          if (a !== null) { jornales += a; dias++; }
          if (b !== null) { binsTotal += b; diasBins++; }
          if (rec.binsIndustria !== undefined) binsInd += rec.binsIndustria;
          if (rec.binsExportacion !== undefined) binsExp += rec.binsExportacion;
        });

        if (jornales === 0 && binsTotal === 0) return null;

        return {
          year,
          jornales,
          binsTotal,
          binsInd,
          binsExp,
          rendimiento: jornales > 0 && binsTotal > 0 ? Number((binsTotal / jornales).toFixed(2)) : null,
          dias,
          diasBins,
          hasSplit: binsInd > 0 || binsExp > 0,
        };
      })
      .filter((s): s is YearStats => s !== null);
  }, [selectedCrew, historicalData, years]);

  const hasSplitData = stats.some((s) => s.hasSplit);

  const chartData = stats.map((s) => ({
    year: String(s.year),
    ...(hasSplitData
      ? { 'Industria': s.binsInd, 'Exportación': s.binsExp }
      : { 'Bins/Bolsones': s.binsTotal }),
    Rendimiento: s.rendimiento,
  }));

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24 animate-in fade-in duration-300">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-brand-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-sm font-bold text-brand-secondary">Cargando historial de temporadas...</p>
        </div>
      </div>
    );
  }

  if (years.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-12 text-center animate-in fade-in duration-300">
        <p className="text-brand-secondary text-sm font-medium">No hay datos históricos disponibles.</p>
      </div>
    );
  }

  const company = crewCompanies[selectedCrew] ?? '';

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header + crew picker */}
      <div className="bg-white/95 border border-gray-200 shadow-[0_18px_50px_-35px_rgba(15,23,42,0.35)] rounded-[30px] p-6">
        <h2 className="text-xl font-heading font-bold text-brand-primary">Evolución Histórica</h2>
        <p className="text-sm text-brand-secondary mt-1 mb-5">Comparativa de temporadas por cuadrilla.</p>
        <div className="flex flex-wrap items-end gap-4">
          <div className="flex-1 min-w-[200px]">
            <label className="text-xs font-bold text-brand-secondary block mb-2">Cuadrilla</label>
            <select
              value={selectedCrew}
              onChange={(e) => setSelectedCrew(e.target.value)}
              className="w-full border border-gray-200 bg-brand-neutral rounded-xl px-4 py-2.5 text-sm font-bold text-brand-secondary focus:outline-none focus:ring-2 focus:ring-brand-primary/20 transition-all cursor-pointer"
            >
              {crews.map((crew) => (
                <option key={crew} value={crew}>{displayCrewName(crew)}</option>
              ))}
            </select>
          </div>
          {company && (
            <span className={`text-xs font-bold px-3 py-2 rounded-full border ${COMPANY_BADGE[company] ?? 'bg-gray-100 text-gray-700 border-gray-200'}`}>
              {company.split(' ')[0]}
            </span>
          )}
        </div>
      </div>

      {stats.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-12 text-center">
          <p className="text-brand-secondary text-sm font-medium">
            {displayCrewName(selectedCrew)} no tiene actividad registrada en ninguna temporada cargada.
          </p>
        </div>
      ) : (
        <>
          {/* Tabla */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-gray-100">
              <p className="text-xs text-brand-secondary font-bold tracking-widest uppercase">
                Resumen por Temporada — {displayCrewName(selectedCrew)}
              </p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-brand-neutral">
                    <th className="text-center text-xs font-bold text-brand-secondary uppercase tracking-wider px-5 py-3">Temporada</th>
                    <th className="text-center text-xs font-bold text-brand-secondary uppercase tracking-wider px-4 py-3">Días trab.</th>
                    <th className="text-center text-xs font-bold text-brand-secondary uppercase tracking-wider px-4 py-3">Jornales</th>
                    <th className="text-center text-xs font-bold text-brand-secondary uppercase tracking-wider px-4 py-3">Bins Total</th>
                    {hasSplitData && (
                      <>
                        <th className="text-center text-xs font-bold text-[#1B4332] uppercase tracking-wider px-4 py-3">Industria</th>
                        <th className="text-center text-xs font-bold text-[#92400E] uppercase tracking-wider px-4 py-3">Exportación</th>
                      </>
                    )}
                    <th className="text-center text-xs font-bold text-brand-secondary uppercase tracking-wider px-4 py-3">Rendimiento</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {stats.map((s, idx) => (
                    <tr
                      key={s.year}
                      className={`${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'} ${s.year === campaignYear ? 'ring-1 ring-inset ring-brand-primary/20' : ''} hover:bg-brand-neutral/50 transition-colors`}
                    >
                      <td className="px-5 py-4 text-center">
                        <span className={`font-extrabold text-sm font-heading ${s.year === campaignYear ? 'text-brand-primary' : 'text-brand-secondary'}`}>
                          {s.year}
                          {s.year === campaignYear && (
                            <span className="ml-1.5 text-[9px] font-bold text-brand-primary/60 uppercase tracking-wider">actual</span>
                          )}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-center">
                        <span className="font-medium text-brand-secondary text-sm">{s.dias}</span>
                      </td>
                      <td className="px-4 py-4 text-center">
                        <span className="font-bold text-brand-primary text-sm">{s.jornales.toLocaleString('es-AR')}</span>
                      </td>
                      <td className="px-4 py-4 text-center">
                        <span className="font-bold text-brand-primary text-sm">{s.binsTotal > 0 ? s.binsTotal.toLocaleString('es-AR') : '—'}</span>
                      </td>
                      {hasSplitData && (
                        <>
                          <td className="px-4 py-4 text-center">
                            <span className="font-bold text-[#1B4332] text-sm">{s.binsInd > 0 ? s.binsInd.toLocaleString('es-AR') : '—'}</span>
                          </td>
                          <td className="px-4 py-4 text-center">
                            <span className="font-bold text-[#92400E] text-sm">{s.binsExp > 0 ? s.binsExp.toLocaleString('es-AR') : '—'}</span>
                          </td>
                        </>
                      )}
                      <td className="px-4 py-4 text-center">
                        <span className={`font-bold text-sm ${s.rendimiento !== null ? 'text-brand-primary' : 'text-gray-400'}`}>
                          {s.rendimiento !== null ? `${s.rendimiento} b/t` : '—'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Gráfico */}
          {stats.length >= 2 && (
            <div className="bg-white border border-gray-200 shadow-sm rounded-2xl p-6">
              <p className="text-xs text-brand-secondary font-bold mb-6 tracking-widest uppercase">
                Evolución por Temporada — {displayCrewName(selectedCrew)}
              </p>
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={chartData} margin={{ top: 5, right: 20, left: -10, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                    <XAxis
                      dataKey="year"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 12, fill: '#4A5568', fontFamily: 'Inter', fontWeight: 700 }}
                      dy={10}
                    />
                    <YAxis
                      yAxisId="left"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 11, fill: '#4A5568', fontFamily: 'Inter', fontWeight: 600 }}
                      dx={-5}
                    />
                    <YAxis
                      yAxisId="right"
                      orientation="right"
                      domain={[0, 'auto']}
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 11, fill: '#4A5568', fontFamily: 'Inter', fontWeight: 600 }}
                      dx={10}
                    />
                    <Tooltip
                      contentStyle={{ borderRadius: '12px', border: '1px solid #E2E8F0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                      formatter={(value: ValueType, name: string) => [
                        name === 'Rendimiento'
                          ? `${Number(value).toFixed(2)} b/t`
                          : Number(value).toLocaleString('es-AR'),
                        name,
                      ]}
                    />
                    <Legend
                      wrapperStyle={{ fontSize: '11px', fontWeight: 700, paddingTop: '16px' }}
                    />
                    {hasSplitData ? (
                      <>
                        <Bar yAxisId="left" dataKey="Industria" stackId="bins" fill="#1B4332" radius={[0, 0, 0, 0]} barSize={32} />
                        <Bar yAxisId="left" dataKey="Exportación" stackId="bins" fill="#92400E" radius={[4, 4, 0, 0]} barSize={32} />
                      </>
                    ) : (
                      <Bar yAxisId="left" dataKey="Bins/Bolsones" fill="#1B4332" radius={[4, 4, 0, 0]} barSize={32} />
                    )}
                    <Line
                      yAxisId="right"
                      type="monotone"
                      dataKey="Rendimiento"
                      stroke="#52B788"
                      strokeWidth={3}
                      dot={{ r: 5, fill: '#52B788', strokeWidth: 2, stroke: '#fff' }}
                      activeDot={{ r: 7 }}
                      connectNulls
                    />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
