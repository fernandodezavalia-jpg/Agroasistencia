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
  periodFilter: string;
  periodLabel: string;
}

interface YearStats {
  year: number;
  jornales: number;
  binsTotal: number;
  binsInd: number;
  binsExp: number;
  rendimiento: number | null;
  jornadaPromedio: number | null;
  binsPorDia: number | null;
  dias: number;
  diasBins: number;
  hasSplit: boolean;
}

interface InsightItem {
  text: string;
  type: 'positive' | 'negative' | 'neutral';
}

const COMPANY_BADGE: Record<string, string> = {
  'Limas y Limones S.R.L.': 'bg-emerald-100 text-emerald-800 border-emerald-200',
  'A.Z. Agricolas S.R.L.': 'bg-amber-100 text-amber-800 border-amber-200',
};

function filterDatesForPeriod(DT: string[], periodFilter: string): string[] {
  if (periodFilter === 'all') return DT;
  const [half, month] = periodFilter.split('-');
  return DT.filter((date) => {
    const [dayStr, monthStr] = date.split('/');
    if (monthStr !== month) return false;
    if (half === 'M') return true;
    const day = parseInt(dayStr, 10);
    return half === 'Q1' ? day <= 15 : day >= 16;
  });
}

function computeCrewStats(
  crew: string,
  years: number[],
  historicalData: Record<number, CampaignDoc | null>,
  periodFilter: string,
): YearStats[] {
  return years
    .map((year): YearStats | null => {
      const campaignDoc = historicalData[year];
      if (!campaignDoc) return null;
      const { DT: allDT } = generateCalendarForYear(year);
      const DT = filterDatesForPeriod(allDT, periodFilter);
      let jornales = 0, binsTotal = 0, binsInd = 0, binsExp = 0, dias = 0, diasBins = 0;
      DT.forEach((date) => {
        const a = getAttendance(campaignDoc.harvestData, crew, date);
        const b = getBins(campaignDoc.harvestData, crew, date);
        const rec = getRecord(campaignDoc.harvestData, crew, date);
        if (a !== null && a > 0) { jornales += a; dias++; }
        if (b !== null && b > 0) { binsTotal += b; diasBins++; }
        if (rec.binsIndustria && rec.binsIndustria > 0) binsInd += rec.binsIndustria;
        if (rec.binsExportacion && rec.binsExportacion > 0) binsExp += rec.binsExportacion;
      });
      if (jornales === 0 && binsTotal === 0) return null;
      return {
        year, jornales, binsTotal, binsInd, binsExp,
        rendimiento: jornales > 0 && binsTotal > 0 ? Number((binsTotal / jornales).toFixed(2)) : null,
        jornadaPromedio: dias > 0 ? Number((jornales / dias).toFixed(1)) : null,
        binsPorDia: diasBins > 0 ? Number((binsTotal / diasBins).toFixed(1)) : null,
        dias, diasBins, hasSplit: binsInd > 0 || binsExp > 0,
      };
    })
    .filter((s): s is YearStats => s !== null);
}

function computeCompanyStats(
  companyCrews: string[],
  years: number[],
  historicalData: Record<number, CampaignDoc | null>,
  periodFilter: string,
): YearStats[] {
  return years
    .map((year): YearStats | null => {
      const campaignDoc = historicalData[year];
      if (!campaignDoc) return null;
      const { DT: allDT } = generateCalendarForYear(year);
      const DT = filterDatesForPeriod(allDT, periodFilter);
      let jornales = 0, binsTotal = 0, binsInd = 0, binsExp = 0;
      const diasSet = new Set<string>();
      const diasBinsSet = new Set<string>();
      DT.forEach((date) => {
        companyCrews.forEach((crew) => {
          const a = getAttendance(campaignDoc.harvestData, crew, date);
          const b = getBins(campaignDoc.harvestData, crew, date);
          const rec = getRecord(campaignDoc.harvestData, crew, date);
          if (a !== null && a > 0) { jornales += a; diasSet.add(date); }
          if (b !== null && b > 0) { binsTotal += b; diasBinsSet.add(date); }
          if (rec.binsIndustria && rec.binsIndustria > 0) binsInd += rec.binsIndustria;
          if (rec.binsExportacion && rec.binsExportacion > 0) binsExp += rec.binsExportacion;
        });
      });
      if (jornales === 0 && binsTotal === 0) return null;
      const dias = diasSet.size;
      const diasBins = diasBinsSet.size;
      return {
        year, jornales, binsTotal, binsInd, binsExp,
        rendimiento: jornales > 0 && binsTotal > 0 ? Number((binsTotal / jornales).toFixed(2)) : null,
        jornadaPromedio: dias > 0 ? Number((jornales / dias).toFixed(1)) : null,
        binsPorDia: diasBins > 0 ? Number((binsTotal / diasBins).toFixed(1)) : null,
        dias, diasBins, hasSplit: binsInd > 0 || binsExp > 0,
      };
    })
    .filter((s): s is YearStats => s !== null);
}

function computeInsights(stats: YearStats[]): InsightItem[] {
  if (stats.length < 2) return [];
  const insights: InsightItem[] = [];
  const withRend = stats.filter((s) => s.rendimiento !== null);

  // Tendencia de rendimiento
  if (withRend.length >= 2) {
    const first = withRend[0];
    const last = withRend[withRend.length - 1];
    const totalChange = ((last.rendimiento! - first.rendimiento!) / first.rendimiento!) * 100;

    if (totalChange >= 5) {
      insights.push({
        text: `Rendimiento en alza: creció ${totalChange.toFixed(0)}% entre ${first.year} y ${last.year} (${first.rendimiento} → ${last.rendimiento} b/t).`,
        type: 'positive',
      });
    } else if (totalChange <= -5) {
      insights.push({
        text: `Rendimiento en baja: cayó ${Math.abs(totalChange).toFixed(0)}% entre ${first.year} y ${last.year} (${first.rendimiento} → ${last.rendimiento} b/t).`,
        type: 'negative',
      });
    } else {
      insights.push({
        text: `Rendimiento estable entre ${first.year} y ${last.year}: ${first.rendimiento} → ${last.rendimiento} b/t (variación < 5%).`,
        type: 'neutral',
      });
    }

    // Consistencia (coeficiente de variación)
    if (withRend.length >= 3) {
      const mean = withRend.reduce((s, r) => s + r.rendimiento!, 0) / withRend.length;
      const variance = withRend.reduce((s, r) => s + Math.pow(r.rendimiento! - mean, 2), 0) / withRend.length;
      const cv = Math.sqrt(variance) / mean;
      if (cv < 0.10) {
        insights.push({
          text: `Rendimiento muy consistente entre temporadas (variación del ${(cv * 100).toFixed(0)}% respecto al promedio de ${mean.toFixed(2)} b/t). Perfil estable y predecible.`,
          type: 'positive',
        });
      } else if (cv > 0.25) {
        insights.push({
          text: `Rendimiento variable entre temporadas (desviación del ${(cv * 100).toFixed(0)}% respecto al promedio). Hay margen para mejorar la consistencia.`,
          type: 'negative',
        });
      }
    }
  }

  // Pico de producción vs pico de rendimiento
  const bestBins = stats.reduce((best, s) => s.binsTotal > best.binsTotal ? s : best, stats[0]);
  const bestRend = withRend.length > 0
    ? withRend.reduce((best, s) => s.rendimiento! > best.rendimiento! ? s : best)
    : null;

  if (bestRend && bestBins.year !== bestRend.year) {
    insights.push({
      text: `El pico de producción fue en ${bestBins.year} (${bestBins.binsTotal.toLocaleString('es-AR')} bins), pero el mejor rendimiento individual fue en ${bestRend.year} (${bestRend.rendimiento} b/t). Más producción no siempre significa más eficiencia.`,
      type: 'neutral',
    });
  } else if (bestRend && bestBins.year === bestRend.year) {
    insights.push({
      text: `${bestBins.year} fue el año pico en ambas métricas: mayor producción (${bestBins.binsTotal.toLocaleString('es-AR')} bins) y mejor rendimiento (${bestRend.rendimiento} b/t).`,
      type: 'positive',
    });
  }

  // Tendencia de equipo (jornales/día)
  const withStaff = stats.filter((s) => s.jornadaPromedio !== null);
  if (withStaff.length >= 2) {
    const firstS = withStaff[0];
    const lastS = withStaff[withStaff.length - 1];
    const staffChange = ((lastS.jornadaPromedio! - firstS.jornadaPromedio!) / firstS.jornadaPromedio!) * 100;
    if (staffChange >= 10) {
      insights.push({
        text: `El equipo promedio por día creció: ${firstS.jornadaPromedio} → ${lastS.jornadaPromedio} trabajadores/día entre ${firstS.year} y ${lastS.year} (+${staffChange.toFixed(0)}%).`,
        type: 'positive',
      });
    } else if (staffChange <= -10) {
      insights.push({
        text: `El equipo promedio por día se redujo: ${firstS.jornadaPromedio} → ${lastS.jornadaPromedio} trabajadores/día entre ${firstS.year} y ${lastS.year} (${staffChange.toFixed(0)}%).`,
        type: 'negative',
      });
    }
  }

  // Tendencia ratio exportación (si hay datos split)
  const splitStats = stats.filter((s) => s.hasSplit && s.binsTotal > 0);
  if (splitStats.length >= 2) {
    const firstSplit = splitStats[0];
    const lastSplit = splitStats[splitStats.length - 1];
    const firstExpPct = (firstSplit.binsExp / firstSplit.binsTotal) * 100;
    const lastExpPct = (lastSplit.binsExp / lastSplit.binsTotal) * 100;
    const diff = lastExpPct - firstExpPct;
    if (diff >= 5) {
      insights.push({
        text: `La proporción de exportación creció del ${firstExpPct.toFixed(0)}% al ${lastExpPct.toFixed(0)}% del total de bins entre ${firstSplit.year} y ${lastSplit.year}.`,
        type: 'positive',
      });
    } else if (diff <= -5) {
      insights.push({
        text: `La proporción de exportación bajó del ${firstExpPct.toFixed(0)}% al ${lastExpPct.toFixed(0)}% del total de bins entre ${firstSplit.year} y ${lastSplit.year}.`,
        type: 'neutral',
      });
    }
  }

  return insights;
}

const insightIcon = (type: InsightItem['type']) =>
  type === 'positive' ? '↑' : type === 'negative' ? '↓' : '→';

const insightColors = {
  positive: { border: 'border-emerald-200', bg: 'bg-emerald-50', icon: 'text-emerald-600', text: 'text-emerald-900' },
  negative: { border: 'border-red-200', bg: 'bg-red-50', icon: 'text-red-600', text: 'text-red-900' },
  neutral: { border: 'border-blue-200', bg: 'bg-blue-50', icon: 'text-blue-600', text: 'text-blue-900' },
};

export default function HistorySection({
  crews,
  crewCompanies,
  historicalData,
  isLoading,
  campaignYear,
  preselectedCompany,
  periodFilter,
  periodLabel,
}: Props) {
  const [viewMode, setViewMode] = useState<'crew' | 'company'>('crew');
  const [selectedCompany, setSelectedCompany] = useState<string>('');
  const [selectedCrew, setSelectedCrew] = useState<string>('');

  const years = useMemo(
    () => Object.keys(historicalData).map(Number).sort(),
    [historicalData],
  );

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

  const stats = useMemo((): YearStats[] => {
    if (viewMode === 'crew') {
      if (!selectedCrew) return [];
      return computeCrewStats(selectedCrew, years, historicalData, periodFilter);
    } else {
      if (!selectedCompany) return [];
      const compCrews = allCrews.filter((c) => allCrewCompanies[c] === selectedCompany);
      return computeCompanyStats(compCrews, years, historicalData, periodFilter);
    }
  }, [viewMode, selectedCrew, selectedCompany, years, historicalData, allCrews, allCrewCompanies, periodFilter]);

  const crewPreviews = useMemo(() => {
    const result: Record<string, { seasons: number; avgRend: number | null }> = {};
    filteredCrewsForPicker.forEach((crew) => {
      const s = computeCrewStats(crew, years, historicalData, periodFilter);
      const rends = s.map((x) => x.rendimiento).filter((v): v is number => v !== null);
      result[crew] = {
        seasons: s.length,
        avgRend: rends.length > 0 ? Number((rends.reduce((a, b) => a + b, 0) / rends.length).toFixed(2)) : null,
      };
    });
    return result;
  }, [filteredCrewsForPicker, years, historicalData, periodFilter]);

  const hasSplitData = stats.some((s) => s.hasSplit);

  const kpis = useMemo(() => {
    if (stats.length === 0) return null;
    const withRend = stats.filter((s) => s.rendimiento !== null);
    const best = withRend.length > 0 ? withRend.reduce((a, b) => (b.rendimiento! > a.rendimiento! ? b : a)) : null;
    const avgRend = withRend.length > 0
      ? Number((withRend.reduce((sum, s) => sum + s.rendimiento!, 0) / withRend.length).toFixed(2))
      : null;
    const last = stats[stats.length - 1];
    const prev = stats.length >= 2 ? stats[stats.length - 2] : null;
    const trend = last?.rendimiento != null && prev?.rendimiento != null && prev.rendimiento > 0
      ? Number((((last.rendimiento - prev.rendimiento) / prev.rendimiento) * 100).toFixed(1))
      : null;
    const totalBins = stats.reduce((s, r) => s + r.binsTotal, 0);
    const withStaff = stats.filter((s) => s.jornadaPromedio !== null);
    const avgStaff = withStaff.length > 0
      ? Number((withStaff.reduce((s, r) => s + r.jornadaPromedio!, 0) / withStaff.length).toFixed(1))
      : null;
    const avgDias = Math.round(stats.reduce((s, r) => s + r.dias, 0) / stats.length);
    return { best, avgRend, trend, seasons: stats.length, totalBins, avgStaff, avgDias };
  }, [stats]);

  const insights = useMemo(() => computeInsights(stats), [stats]);

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
    'Trab./día': s.jornadaPromedio,
    'Días trab.': s.dias,
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
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              <p className="text-sm text-brand-secondary">Comparativa año vs año.</p>
              <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-brand-primary/10 text-brand-primary px-2.5 py-1 rounded-full">
                📅 {periodLabel}
              </span>
            </div>
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
          {/* KPIs — fila 1: Producción */}
          {kpis && (
            <>
              <p className="text-[10px] font-bold text-brand-secondary uppercase tracking-widest ml-1">Resumen histórico — {entityLabel}</p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                <div className="bg-white rounded-2xl p-5 border border-gray-200 shadow-sm relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-1 h-full bg-brand-primary" />
                  <p className="text-[10px] font-bold text-brand-secondary uppercase tracking-wider mb-2">Temporadas activas</p>
                  <p className="text-3xl font-heading font-extrabold text-brand-primary">{kpis.seasons}</p>
                  <p className="text-xs text-brand-secondary mt-1">con datos registrados</p>
                </div>
                <div className="bg-white rounded-2xl p-5 border border-gray-200 shadow-sm relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-1 h-full bg-[#52B788]" />
                  <p className="text-[10px] font-bold text-brand-secondary uppercase tracking-wider mb-2">Rend. promedio histórico</p>
                  <p className="text-3xl font-heading font-extrabold text-brand-primary">
                    {kpis.avgRend !== null ? kpis.avgRend : '—'}
                  </p>
                  <p className="text-xs text-brand-secondary mt-1">bins / trabajador</p>
                </div>
                <div className="bg-white rounded-2xl p-5 border border-gray-200 shadow-sm relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-1 h-full bg-amber-400" />
                  <p className="text-[10px] font-bold text-brand-secondary uppercase tracking-wider mb-2">Mejor temporada</p>
                  <p className="text-3xl font-heading font-extrabold text-brand-primary">
                    {kpis.best ? kpis.best.year : '—'}
                  </p>
                  <p className="text-xs text-brand-secondary mt-1">
                    {kpis.best?.rendimiento != null ? `${kpis.best.rendimiento} b/t` : 'sin rendimiento'}
                  </p>
                </div>
                <div className="bg-white rounded-2xl p-5 border border-gray-200 shadow-sm relative overflow-hidden">
                  <div className={`absolute top-0 left-0 w-1 h-full ${kpis.trend === null ? 'bg-gray-300' : kpis.trend >= 0 ? 'bg-emerald-500' : 'bg-red-400'}`} />
                  <p className="text-[10px] font-bold text-brand-secondary uppercase tracking-wider mb-2">Tendencia vs. año anterior</p>
                  <p className={`text-3xl font-heading font-extrabold ${kpis.trend === null ? 'text-brand-secondary' : kpis.trend >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                    {kpis.trend === null ? '—' : `${kpis.trend > 0 ? '+' : ''}${kpis.trend}%`}
                  </p>
                  <p className="text-xs text-brand-secondary mt-1">en rendimiento</p>
                </div>
                <div className="bg-white rounded-2xl p-5 border border-gray-200 shadow-sm relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-1 h-full bg-brand-secondary" />
                  <p className="text-[10px] font-bold text-brand-secondary uppercase tracking-wider mb-2">Bins acumulados</p>
                  <p className="text-3xl font-heading font-extrabold text-brand-primary">
                    {kpis.totalBins.toLocaleString('es-AR')}
                  </p>
                  <p className="text-xs text-brand-secondary mt-1">en todas las temporadas</p>
                </div>
                <div className="bg-white rounded-2xl p-5 border border-gray-200 shadow-sm relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-1 h-full bg-brand-primary opacity-40" />
                  <p className="text-[10px] font-bold text-brand-secondary uppercase tracking-wider mb-2">Equipo promedio / día</p>
                  <p className="text-3xl font-heading font-extrabold text-brand-primary">
                    {kpis.avgStaff !== null ? kpis.avgStaff : '—'}
                  </p>
                  <p className="text-xs text-brand-secondary mt-1">trabajadores por día trabajado</p>
                </div>
              </div>
            </>
          )}

          {/* Panel de análisis automático */}
          {insights.length > 0 && (
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100 bg-brand-neutral/40">
                <p className="text-xs text-brand-secondary font-bold tracking-widest uppercase">Análisis automático</p>
              </div>
              <div className="p-5 flex flex-col gap-3">
                {insights.map((ins, i) => {
                  const c = insightColors[ins.type];
                  return (
                    <div key={i} className={`flex items-start gap-3 rounded-xl border px-4 py-3 ${c.border} ${c.bg}`}>
                      <span className={`text-xs font-extrabold mt-0.5 flex-shrink-0 w-4 text-center ${c.icon}`}>
                        {insightIcon(ins.type)}
                      </span>
                      <p className={`text-sm font-medium leading-snug ${c.text}`}>{ins.text}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Tabla detallada con Δ% */}
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
                    <th className="text-center text-xs font-bold text-brand-secondary uppercase tracking-wider px-4 py-3">Días</th>
                    <th className="text-center text-xs font-bold text-brand-secondary uppercase tracking-wider px-4 py-3">Jornales</th>
                    <th className="text-center text-xs font-bold text-brand-secondary uppercase tracking-wider px-4 py-3">Trab./día</th>
                    <th className="text-center text-xs font-bold text-brand-secondary uppercase tracking-wider px-4 py-3">Bins Total</th>
                    {hasSplitData && (
                      <>
                        <th className="text-center text-xs font-bold text-[#1B4332] uppercase tracking-wider px-4 py-3">Industria</th>
                        <th className="text-center text-xs font-bold text-[#92400E] uppercase tracking-wider px-4 py-3">Exportación</th>
                      </>
                    )}
                    <th className="text-center text-xs font-bold text-brand-secondary uppercase tracking-wider px-4 py-3">Bins/día</th>
                    <th className="text-center text-xs font-bold text-brand-secondary uppercase tracking-wider px-4 py-3">Rendimiento</th>
                    <th className="text-center text-xs font-bold text-brand-secondary uppercase tracking-wider px-4 py-3">Δ rend.</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {stats.map((s, idx) => {
                    const prev = idx > 0 ? stats[idx - 1] : null;
                    const rendDelta = s.rendimiento != null && prev?.rendimiento != null && prev.rendimiento > 0
                      ? Number((((s.rendimiento - prev.rendimiento) / prev.rendimiento) * 100).toFixed(1))
                      : null;
                    const binsDelta = prev?.binsTotal != null && prev.binsTotal > 0
                      ? Number((((s.binsTotal - prev.binsTotal) / prev.binsTotal) * 100).toFixed(1))
                      : null;
                    void binsDelta; // computed but shown via rendDelta column per UX
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
                          <span className="font-medium text-brand-secondary text-sm">{s.jornadaPromedio ?? '—'}</span>
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
                          <span className="font-medium text-brand-secondary text-sm">{s.binsPorDia ?? '—'}</span>
                        </td>
                        <td className="px-4 py-4 text-center">
                          <span className={`font-bold text-sm ${s.rendimiento != null ? 'text-brand-primary' : 'text-gray-400'}`}>
                            {s.rendimiento != null ? `${s.rendimiento} b/t` : '—'}
                          </span>
                        </td>
                        <td className="px-4 py-4 text-center">
                          {rendDelta !== null ? (
                            <span className={`text-xs font-bold px-2 py-1 rounded-full ${rendDelta > 0 ? 'bg-emerald-100 text-emerald-700' : rendDelta < 0 ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-500'}`}>
                              {rendDelta > 0 ? '+' : ''}{rendDelta}%
                            </span>
                          ) : (
                            <span className="text-xs text-gray-300">—</span>
                          )}
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
              {/* Producción y rendimiento */}
              <div className="bg-white border border-gray-200 shadow-sm rounded-2xl p-6">
                <p className="text-xs text-brand-secondary font-bold mb-6 tracking-widest uppercase">
                  Producción y Rendimiento por Temporada
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

              {/* Trabajadores y equipo */}
              <div className="bg-white border border-gray-200 shadow-sm rounded-2xl p-6">
                <p className="text-xs text-brand-secondary font-bold mb-6 tracking-widest uppercase">
                  Jornales y Equipo por Temporada
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
                        formatter={(value: ValueType, name: string) => [
                          name === 'Trab./día' ? `${Number(value).toFixed(1)} trab.` : Number(value).toLocaleString('es-AR'),
                          name,
                        ]}
                      />
                      <Legend wrapperStyle={{ fontSize: '11px', fontWeight: 700, paddingTop: '12px' }} />
                      <Bar yAxisId="left" dataKey="Jornales" fill="#2D6A4F" radius={[4, 4, 0, 0]} barSize={28} />
                      <Line yAxisId="right" type="monotone" dataKey="Trab./día" stroke="#74C69D" strokeWidth={3} dot={{ r: 5, fill: '#74C69D', strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 7 }} connectNulls />
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
