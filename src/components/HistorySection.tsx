import { useState, useMemo, useEffect } from 'react';
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
  preselectedCompany?: string;
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

function computeCrewStats(
  crew: string,
  years: number[],
  historicalData: Record<number, CampaignDoc | null>,
): YearStats[] {
  return years
    .map((year): YearStats | null => {
      const campaignDoc = historicalData[year];
      if (!campaignDoc) return null;
      const { DT } = generateCalendarForYear(year);
      let jornales = 0, binsTotal = 0, binsInd = 0, binsExp = 0, dias = 0, diasBins = 0;
      DT.forEach((date) => {
        const a = getAttendance(campaignDoc.harvestData, crew, date);
        const b = getBins(campaignDoc.harvestData, crew, date);
        const rec = getRecord(campaignDoc.harvestData, crew, date);
        if (a !== null) { jornales += a; dias++; }
        if (b !== null) { binsTotal += b; diasBins++; }
        if (rec.binsIndustria) binsInd += rec.binsIndustria;
        if (rec.binsExportacion) binsExp += rec.binsExportacion;
      });
      if (jornales === 0 && binsTotal === 0) return null;
      return {
        year, jornales, binsTotal, binsInd, binsExp,
        rendimiento: jornales > 0 && binsTotal > 0 ? Number((binsTotal / jornales).toFixed(2)) : null,
        dias, diasBins, hasSplit: binsInd > 0 || binsExp > 0,
      };
    })
    .filter((s): s is YearStats => s !== null);
}

function computeCompanyStats(
  companyCrews: string[],
  years: number[],
  historicalData: Record<number, CampaignDoc | null>,
): YearStats[] {
  return years
    .map((year): YearStats | null => {
      const campaignDoc = historicalData[year];
      if (!campaignDoc) return null;
      const { DT } = generateCalendarForYear(year);
      let jornales = 0, binsTotal = 0, binsInd = 0, binsExp = 0;
      const diasSet = new Set<string>();
      const diasBinsSet = new Set<string>();
      DT.forEach((date) => {
        companyCrews.forEach((crew) => {
          const a = getAttendance(campaignDoc.harvestData, crew, date);
          const b = getBins(campaignDoc.harvestData, crew, date);
          const rec = getRecord(campaignDoc.harvestData, crew, date);
          if (a !== null) { jornales += a; diasSet.add(date); }
          if (b !== null) { binsTotal += b; diasBinsSet.add(date); }
          if (rec.binsIndustria) binsInd += rec.binsIndustria;
          if (rec.binsExportacion) binsExp += rec.binsExportacion;
        });
      });
      if (jornales === 0 && binsTotal === 0) return null;
      return {
        year, jornales, binsTotal, binsInd, binsExp,
        rendimiento: jornales > 0 && binsTotal > 0 ? Number((binsTotal / jornales).toFixed(2)) : null,
        dias: diasSet.size, diasBins: diasBinsSet.size,
        hasSplit: binsInd > 0 || binsExp > 0,
      };
    })
    .filter((s): s is YearStats => s !== null);
}

export default function HistorySection({
  crews,
  crewCompanies,
  historicalData,
  isLoading,
  campaignYear,
  preselectedCompany,
}: Props) {
  const [viewMode, setViewMode] = useState<'crew' | 'company'>('crew');
  const [selectedCompany, setSelectedCompany] = useState<string>('');
  const [selectedCrew, setSelectedCrew] = useState<string>('');

  const years = useMemo(
    () => Object.keys(historicalData).map(Number).sort(),
    [historicalData],
  );

  // Union de cuadrillas y empresas entre años + campaña actual
  const allCrewCompanies = useMemo(() => {
    const result: Record<string, string> = { ...crewCompanies };
    Object.values(historicalData).forEach((doc) => {
      if (doc) Object.entries(doc.crewCompanies).forEach(([c, co]) => {
        if (!result[c]) result[c] = co;
      });
    });
    return result;
  }, [crewCompanies, historicalData]);

  const allCrews = useMemo(() => {
    const set = new Set<string>(crews);
    Object.values(historicalData).forEach((doc) => {
      if (doc) Object.keys(doc.harvestData).forEach((c) => set.add(c));
    });
    return Array.from(set).sort();
  }, [crews, historicalData]);

  const companies = useMemo(
    () => [...new Set(Object.values(allCrewCompanies))].filter(Boolean).sort(),
    [allCrewCompanies],
  );

  // Inicializar selecciones cuando llegan los datos
  useEffect(() => {
    if (preselectedCompany && companies.includes(preselectedCompany)) {
      setSelectedCompany(preselectedCompany);
    } else if (companies.length > 0 && !selectedCompany) {
      setSelectedCompany(companies[0]);
    }
  }, [companies, preselectedCompany]);

  useEffect(() => {
    const list = selectedCompany
      ? allCrews.filter((c) => allCrewCompanies[c] === selectedCompany)
      : allCrews;
    if (list.length > 0 && (!selectedCrew || !list.includes(selectedCrew))) {
      setSelectedCrew(list[0]);
    }
  }, [selectedCompany, allCrews, allCrewCompanies]);

  const filteredCrewsForPicker = useMemo(
    () => (selectedCompany ? allCrews.filter((c) => allCrewCompanies[c] === selectedCompany) : allCrews),
    [selectedCompany, allCrews, allCrewCompanies],
  );

  // Stats por cuadrilla o empresa
  const stats = useMemo((): YearStats[] => {
    if (viewMode === 'crew') {
      if (!selectedCrew) return [];
      return computeCrewStats(selectedCrew, years, historicalData);
    } else {
      if (!selectedCompany) return [];
      const compCrews = allCrews.filter((c) => allCrewCompanies[c] === selectedCompany);
      return computeCompanyStats(compCrews, years, historicalData);
    }
  }, [viewMode, selectedCrew, selectedCompany, years, historicalData, allCrews, allCrewCompanies]);

  // Preview rápido de cada cuadrilla en el picker
  const crewPreviews = useMemo(() => {
    const result: Record<string, { seasons: number; avgRend: number | null }> = {};
    filteredCrewsForPicker.forEach((crew) => {
      const s = computeCrewStats(crew, years, historicalData);
      const rends = s.map((x) => x.rendimiento).filter((v): v is number => v !== null);
      result[crew] = {
        seasons: s.length,
        avgRend: rends.length > 0 ? Number((rends.reduce((a, b) => a + b, 0) / rends.length).toFixed(2)) : null,
      };
    });
    return result;
  }, [filteredCrewsForPicker, years, historicalData]);

  const hasSplitData = stats.some((s) => s.hasSplit);

  // KPIs de resumen
  const kpis = useMemo(() => {
    if (stats.length === 0) return null;
    const withRend = stats.filter((s) => s.rendimiento !== null);
    const best = withRend.length > 0 ? withRend.reduce((a, b) => (b.rendimiento! > a.rendimiento! ? b : a)) : null;
    const avgRend = withRend.length > 0
      ? Number((withRend.reduce((sum, s) => sum + s.rendimiento!, 0) / withRend.length).toFixed(2))
      : null;
    const last = stats[stats.length - 1];
    const prev = stats.length >= 2 ? stats[stats.length - 2] : null;
    const trend = last?.rendimiento !== null && prev?.rendimiento !== null && prev?.rendimiento
      ? Number((((last!.rendimiento! - prev!.rendimiento!) / prev!.rendimiento!) * 100).toFixed(1))
      : null;
    return { best, avgRend, trend, seasons: stats.length };
  }, [stats]);

  // Datos para los gráficos
  const productionChartData = stats.map((s) => ({
    year: String(s.year),
    ...(hasSplitData
      ? { Industria: s.binsInd, Exportación: s.binsExp }
      : { 'Bins/Bolsones': s.binsTotal }),
    Rendimiento: s.rendimiento,
  }));

  const workersChartData = stats.map((s) => ({
    year: String(s.year),
    Jornales: s.jornales,
    'Días trabajados': s.dias,
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

  const entityLabel = viewMode === 'crew'
    ? displayCrewName(selectedCrew)
    : (selectedCompany.split(' ').slice(0, 2).join(' '));

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">

      {/* Header + toggle + pickers */}
      <div className="bg-white/95 border border-gray-200 shadow-[0_18px_50px_-35px_rgba(15,23,42,0.35)] rounded-[30px] p-6">
        <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
          <div>
            <h2 className="text-xl font-heading font-bold text-brand-primary">Evolución Histórica</h2>
            <p className="text-sm text-brand-secondary mt-1">Comparativa de temporadas por cuadrilla o empresa.</p>
          </div>
          <div className="flex gap-1 p-1 bg-brand-neutral border border-gray-200 rounded-full">
            {[{ id: 'crew', label: 'Por cuadrilla' }, { id: 'company', label: 'Por empresa' }].map((opt) => (
              <button
                key={opt.id}
                onClick={() => setViewMode(opt.id as 'crew' | 'company')}
                className={`px-4 py-1.5 text-xs font-bold rounded-full transition-all ${viewMode === opt.id ? 'bg-white text-brand-primary shadow-sm border border-gray-200' : 'text-brand-secondary hover:text-brand-primary'}`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {viewMode === 'crew' ? (
          <div className="flex flex-wrap items-end gap-4">
            {companies.length > 1 && (
              <div>
                <label className="text-xs font-bold text-brand-secondary block mb-2">Empresa</label>
                <select
                  value={selectedCompany}
                  onChange={(e) => setSelectedCompany(e.target.value)}
                  className="border border-gray-200 bg-brand-neutral rounded-xl px-4 py-2.5 text-sm font-bold text-brand-secondary focus:outline-none focus:ring-2 focus:ring-brand-primary/20 transition-all cursor-pointer"
                >
                  <option value="">Todas</option>
                  {companies.map((co) => (
                    <option key={co} value={co}>{co.split(' ').slice(0, 2).join(' ')}</option>
                  ))}
                </select>
              </div>
            )}
            <div className="flex-1 min-w-[200px]">
              <label className="text-xs font-bold text-brand-secondary block mb-2">Cuadrilla</label>
              <select
                value={selectedCrew}
                onChange={(e) => setSelectedCrew(e.target.value)}
                className="w-full border border-gray-200 bg-brand-neutral rounded-xl px-4 py-2.5 text-sm font-bold text-brand-secondary focus:outline-none focus:ring-2 focus:ring-brand-primary/20 transition-all cursor-pointer"
              >
                {filteredCrewsForPicker.map((crew) => {
                  const p = crewPreviews[crew];
                  return (
                    <option key={crew} value={crew}>
                      {displayCrewName(crew)}
                      {p ? ` · ${p.seasons} temp${p.seasons !== 1 ? 's' : ''}.${p.avgRend !== null ? ` · ${p.avgRend} b/t` : ''}` : ''}
                    </option>
                  );
                })}
              </select>
            </div>
            {selectedCrew && allCrewCompanies[selectedCrew] && (
              <span className={`text-xs font-bold px-3 py-2 rounded-full border ${COMPANY_BADGE[allCrewCompanies[selectedCrew]] ?? 'bg-gray-100 text-gray-700 border-gray-200'}`}>
                {allCrewCompanies[selectedCrew].split(' ')[0]}
              </span>
            )}
          </div>
        ) : (
          <div className="flex flex-wrap items-end gap-4">
            <div>
              <label className="text-xs font-bold text-brand-secondary block mb-2">Empresa</label>
              <select
                value={selectedCompany}
                onChange={(e) => setSelectedCompany(e.target.value)}
                className="border border-gray-200 bg-brand-neutral rounded-xl px-4 py-2.5 text-sm font-bold text-brand-secondary focus:outline-none focus:ring-2 focus:ring-brand-primary/20 transition-all cursor-pointer"
              >
                {companies.map((co) => (
                  <option key={co} value={co}>{co}</option>
                ))}
              </select>
            </div>
            {selectedCompany && (
              <span className={`text-xs font-bold px-3 py-2 rounded-full border ${COMPANY_BADGE[selectedCompany] ?? 'bg-gray-100 text-gray-700 border-gray-200'}`}>
                {allCrews.filter((c) => allCrewCompanies[c] === selectedCompany).length} cuadrillas
              </span>
            )}
          </div>
        )}
      </div>

      {stats.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-12 text-center">
          <p className="text-brand-secondary text-sm font-medium">
            {entityLabel} no tiene actividad registrada en las temporadas cargadas.
          </p>
        </div>
      ) : (
        <>
          {/* KPIs de resumen */}
          {kpis && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-white rounded-2xl p-5 border border-gray-200 shadow-sm">
                <p className="text-[10px] font-bold text-brand-secondary uppercase tracking-wider mb-2">Temporadas activas</p>
                <p className="text-3xl font-heading font-extrabold text-brand-primary">{kpis.seasons}</p>
                <p className="text-xs text-brand-secondary mt-1">con datos registrados</p>
              </div>
              <div className="bg-white rounded-2xl p-5 border border-gray-200 shadow-sm">
                <p className="text-[10px] font-bold text-brand-secondary uppercase tracking-wider mb-2">Rend. promedio histórico</p>
                <p className="text-3xl font-heading font-extrabold text-brand-primary">
                  {kpis.avgRend !== null ? kpis.avgRend : '—'}
                </p>
                <p className="text-xs text-brand-secondary mt-1">bins / trabajador</p>
              </div>
              <div className="bg-white rounded-2xl p-5 border border-gray-200 shadow-sm">
                <p className="text-[10px] font-bold text-brand-secondary uppercase tracking-wider mb-2">Mejor temporada</p>
                <p className="text-3xl font-heading font-extrabold text-brand-primary">
                  {kpis.best ? kpis.best.year : '—'}
                </p>
                <p className="text-xs text-brand-secondary mt-1">
                  {kpis.best?.rendimiento !== null ? `${kpis.best?.rendimiento} b/t` : 'sin rendimiento'}
                </p>
              </div>
              <div className="bg-white rounded-2xl p-5 border border-gray-200 shadow-sm">
                <p className="text-[10px] font-bold text-brand-secondary uppercase tracking-wider mb-2">Tendencia vs. año anterior</p>
                <p className={`text-3xl font-heading font-extrabold ${kpis.trend === null ? 'text-brand-secondary' : kpis.trend >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                  {kpis.trend === null ? '—' : `${kpis.trend > 0 ? '+' : ''}${kpis.trend}%`}
                </p>
                <p className="text-xs text-brand-secondary mt-1">en rendimiento</p>
              </div>
            </div>
          )}

          {/* Tabla */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-gray-100">
              <p className="text-xs text-brand-secondary font-bold tracking-widest uppercase">
                Detalle por Temporada — {entityLabel}
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
                  {stats.map((s, idx) => {
                    const isLast = s === stats[stats.length - 1];
                    const prev = idx > 0 ? stats[idx - 1] : null;
                    const rendDelta = s.rendimiento !== null && prev?.rendimiento != null
                      ? s.rendimiento - prev.rendimiento
                      : null;
                    return (
                      <tr
                        key={s.year}
                        className={`${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'} ${s.year === campaignYear ? 'ring-1 ring-inset ring-brand-primary/20' : ''} hover:bg-brand-neutral/50 transition-colors`}
                      >
                        <td className="px-5 py-4 text-center">
                          <span className={`font-extrabold text-sm font-heading ${s.year === campaignYear ? 'text-brand-primary' : 'text-brand-secondary'}`}>
                            {s.year}
                            {s.year === campaignYear && <span className="ml-1.5 text-[9px] font-bold text-brand-primary/60 uppercase tracking-wider">actual</span>}
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
                          <div className="flex items-center justify-center gap-1.5">
                            <span className={`font-bold text-sm ${s.rendimiento !== null ? 'text-brand-primary' : 'text-gray-400'}`}>
                              {s.rendimiento !== null ? `${s.rendimiento} b/t` : '—'}
                            </span>
                            {rendDelta !== null && !isLast && (
                              <span className={`text-[10px] font-bold ${rendDelta > 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                                {rendDelta > 0 ? '▲' : '▼'}
                              </span>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Gráficos año vs año */}
          {stats.length >= 2 && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Producción */}
              <div className="bg-white border border-gray-200 shadow-sm rounded-2xl p-6">
                <p className="text-xs text-brand-secondary font-bold mb-6 tracking-widest uppercase">
                  Producción por Temporada
                </p>
                <div className="h-[260px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={productionChartData} margin={{ top: 5, right: 20, left: -10, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                      <XAxis dataKey="year" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#4A5568', fontFamily: 'Inter', fontWeight: 700 }} dy={8} />
                      <YAxis yAxisId="left" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#4A5568', fontFamily: 'Inter', fontWeight: 600 }} dx={-5} />
                      <YAxis yAxisId="right" orientation="right" domain={[0, 'auto']} axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#4A5568', fontFamily: 'Inter', fontWeight: 600 }} dx={10} />
                      <Tooltip
                        contentStyle={{ borderRadius: '12px', border: '1px solid #E2E8F0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                        formatter={(value: ValueType, name: string) => [
                          name === 'Rendimiento' ? `${Number(value).toFixed(2)} b/t` : Number(value).toLocaleString('es-AR'),
                          name,
                        ]}
                      />
                      <Legend wrapperStyle={{ fontSize: '11px', fontWeight: 700, paddingTop: '12px' }} />
                      {hasSplitData ? (
                        <>
                          <Bar yAxisId="left" dataKey="Industria" stackId="bins" fill="#1B4332" barSize={28} />
                          <Bar yAxisId="left" dataKey="Exportación" stackId="bins" fill="#92400E" radius={[4, 4, 0, 0]} barSize={28} />
                        </>
                      ) : (
                        <Bar yAxisId="left" dataKey="Bins/Bolsones" fill="#1B4332" radius={[4, 4, 0, 0]} barSize={28} />
                      )}
                      <Line yAxisId="right" type="monotone" dataKey="Rendimiento" stroke="#52B788" strokeWidth={3} dot={{ r: 5, fill: '#52B788', strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 7 }} connectNulls />
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Trabajadores */}
              <div className="bg-white border border-gray-200 shadow-sm rounded-2xl p-6">
                <p className="text-xs text-brand-secondary font-bold mb-6 tracking-widest uppercase">
                  Trabajadores por Temporada
                </p>
                <div className="h-[260px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={workersChartData} margin={{ top: 5, right: 20, left: -10, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                      <XAxis dataKey="year" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#4A5568', fontFamily: 'Inter', fontWeight: 700 }} dy={8} />
                      <YAxis yAxisId="left" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#4A5568', fontFamily: 'Inter', fontWeight: 600 }} dx={-5} />
                      <YAxis yAxisId="right" orientation="right" domain={[0, 'auto']} axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#4A5568', fontFamily: 'Inter', fontWeight: 600 }} dx={10} />
                      <Tooltip
                        contentStyle={{ borderRadius: '12px', border: '1px solid #E2E8F0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                        formatter={(value: ValueType, name: string) => [Number(value).toLocaleString('es-AR'), name]}
                      />
                      <Legend wrapperStyle={{ fontSize: '11px', fontWeight: 700, paddingTop: '12px' }} />
                      <Bar yAxisId="left" dataKey="Jornales" fill="#2D6A4F" radius={[4, 4, 0, 0]} barSize={28} />
                      <Line yAxisId="right" type="monotone" dataKey="Días trabajados" stroke="#74C69D" strokeWidth={3} dot={{ r: 5, fill: '#74C69D', strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 7 }} connectNulls />
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
