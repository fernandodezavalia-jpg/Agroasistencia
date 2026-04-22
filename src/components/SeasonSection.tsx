import { useState, useEffect } from 'react';
import { monthNames } from '../lib/harvestData';
import type { SeasonConfig } from '../lib/harvestData';

interface Props {
  seasonConfig: SeasonConfig | undefined;
  onSave: (config: SeasonConfig) => void;
  currentMonthBins: number;
  currentFortBins: number;
  projectedMonthBins: number | null;
  todayKey: string;
  activeDT: string[];
  activeSN: number[];
}

export default function SeasonSection({
  seasonConfig,
  onSave,
  currentMonthBins,
  currentFortBins,
  projectedMonthBins,
  todayKey,
  activeDT,
  activeSN,
}: Props) {
  const [monthlyTarget, setMonthlyTarget] = useState(seasonConfig?.monthlyTarget ?? 0);
  const [quincenalTarget, setQuincenalTarget] = useState(seasonConfig?.quincenalTarget ?? 0);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setMonthlyTarget(seasonConfig?.monthlyTarget ?? 0);
    setQuincenalTarget(seasonConfig?.quincenalTarget ?? 0);
  }, [seasonConfig?.monthlyTarget, seasonConfig?.quincenalTarget]);

  const handleSave = () => {
    onSave({ monthlyTarget, quincenalTarget });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const month = todayKey.split('/')[1];
  const dayNum = parseInt(todayKey.split('/')[0], 10);
  const isFirstFort = dayNum <= 15;

  const monthWorkDays = activeDT.filter(
    (date, i) => date.split('/')[1] === month && activeSN[i] === 0,
  ).length;
  const fortWorkDays = activeDT.filter((date, i) => {
    const dm = date.split('/')[1];
    const dd = parseInt(date.split('/')[0], 10);
    return dm === month && activeSN[i] === 0 && (isFirstFort ? dd <= 15 : dd > 15);
  }).length;

  const monthPct = seasonConfig?.monthlyTarget
    ? Math.min(100, Math.round((currentMonthBins / seasonConfig.monthlyTarget) * 100))
    : 0;
  const fortPct = seasonConfig?.quincenalTarget
    ? Math.min(100, Math.round((currentFortBins / seasonConfig.quincenalTarget) * 100))
    : 0;

  const barColor = (pct: number) =>
    pct >= 100 ? 'bg-emerald-500' : pct >= 70 ? 'bg-amber-400' : 'bg-red-500';
  const textColor = (pct: number) =>
    pct >= 100 ? 'text-emerald-500' : pct >= 70 ? 'text-amber-500' : 'text-red-500';

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-6">
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
        <p className="text-xs text-brand-secondary font-bold mb-6 tracking-widest uppercase">Metas de Producción</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div>
            <label className="block text-xs font-bold text-brand-secondary mb-2 uppercase tracking-wider">
              Meta Mensual (Bins)
            </label>
            <input
              type="number"
              min={0}
              value={monthlyTarget || ''}
              onChange={(e) => setMonthlyTarget(Number(e.target.value))}
              placeholder="Ej: 1500"
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-brand-primary font-bold focus:outline-none focus:ring-2 focus:ring-brand-primary/20"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-brand-secondary mb-2 uppercase tracking-wider">
              Meta Quincenal (Bins)
            </label>
            <input
              type="number"
              min={0}
              value={quincenalTarget || ''}
              onChange={(e) => setQuincenalTarget(Number(e.target.value))}
              placeholder="Ej: 750"
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-brand-primary font-bold focus:outline-none focus:ring-2 focus:ring-brand-primary/20"
            />
          </div>
        </div>
        <div className="mt-6 flex items-center gap-3">
          <button
            type="button"
            onClick={handleSave}
            className="bg-brand-primary text-white text-sm font-bold px-6 py-2.5 rounded-full hover:bg-[#122e22] transition-all"
          >
            Guardar metas
          </button>
          {saved && <span className="text-emerald-500 text-sm font-bold">Guardado</span>}
        </div>
      </div>

      {seasonConfig && (seasonConfig.monthlyTarget > 0 || seasonConfig.quincenalTarget > 0) && (
        <div className="space-y-4">
          {seasonConfig.monthlyTarget > 0 && (
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-xs text-brand-secondary font-bold uppercase tracking-widest">
                    Progreso Mensual — {monthNames[month]}
                  </p>
                  <p className="text-3xl font-heading font-extrabold text-brand-primary mt-1">
                    {currentMonthBins.toLocaleString('es-AR')}{' '}
                    <span className="text-lg font-bold text-brand-secondary">
                      / {seasonConfig.monthlyTarget.toLocaleString('es-AR')}
                    </span>
                  </p>
                </div>
                <div className={`text-3xl font-heading font-extrabold ${textColor(monthPct)}`}>
                  {monthPct}%
                </div>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-3 overflow-hidden">
                <div
                  className={`h-3 rounded-full transition-all duration-700 ${barColor(monthPct)}`}
                  style={{ width: `${monthPct}%` }}
                />
              </div>
              {projectedMonthBins !== null && (
                <p className={`mt-3 text-xs font-bold ${projectedMonthBins >= seasonConfig.monthlyTarget ? 'text-emerald-600' : 'text-red-500'}`}>
                  {projectedMonthBins >= seasonConfig.monthlyTarget
                    ? `Proyección: ${projectedMonthBins.toLocaleString('es-AR')} bins — en ritmo`
                    : `Proyección: ${projectedMonthBins.toLocaleString('es-AR')} bins — ${(seasonConfig.monthlyTarget - projectedMonthBins).toLocaleString('es-AR')} bins por debajo de la meta`}
                </p>
              )}
              <p className="text-xs text-brand-secondary mt-2">{monthWorkDays} días hábiles en el mes</p>
            </div>
          )}

          {seasonConfig.quincenalTarget > 0 && (
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-xs text-brand-secondary font-bold uppercase tracking-widest">
                    Progreso Quincenal — {isFirstFort ? '1ra quincena' : '2da quincena'} {monthNames[month]}
                  </p>
                  <p className="text-3xl font-heading font-extrabold text-brand-primary mt-1">
                    {currentFortBins.toLocaleString('es-AR')}{' '}
                    <span className="text-lg font-bold text-brand-secondary">
                      / {seasonConfig.quincenalTarget.toLocaleString('es-AR')}
                    </span>
                  </p>
                </div>
                <div className={`text-3xl font-heading font-extrabold ${textColor(fortPct)}`}>
                  {fortPct}%
                </div>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-3 overflow-hidden">
                <div
                  className={`h-3 rounded-full transition-all duration-700 ${barColor(fortPct)}`}
                  style={{ width: `${fortPct}%` }}
                />
              </div>
              <p className="text-xs text-brand-secondary mt-3">{fortWorkDays} días hábiles en la quincena</p>
            </div>
          )}
        </div>
      )}

      {!seasonConfig && (
        <div className="bg-brand-neutral border border-gray-200 rounded-2xl p-6 text-center">
          <p className="text-sm text-brand-secondary">
            Definí las metas y hacé click en "Guardar metas" para ver el progreso.
          </p>
        </div>
      )}
    </div>
  );
}
