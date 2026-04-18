import { useCallback, useMemo } from 'react';
import { getAttendance, getBins, getBus, getForeman } from '../lib/harvestData';
import type { HarvestData } from '../lib/harvestData';

interface MetricsInput {
  filteredCrews: string[];
  filteredDT: string[];
  harvestData: HarvestData;
  asDate: string;
  todayKey: string;
  formCrews: string[];
  crewCompanies: Record<string, string>;
  companies: string[];
  activeDT: string[];
  activeSN: number[];
}

export function useDashboardMetrics({
  filteredCrews,
  filteredDT,
  harvestData,
  asDate,
  todayKey,
  formCrews,
  crewCompanies,
  companies,
  activeDT,
  activeSN,
}: MetricsInput) {
  const dayW = useCallback(
    (date: string) => filteredCrews.reduce((sum, crew) => sum + (getAttendance(harvestData, crew, date) ?? 0), 0),
    [filteredCrews, harvestData],
  );

  const dayB = useCallback(
    (date: string) => filteredCrews.reduce((sum, crew) => sum + (getBins(harvestData, crew, date) ?? 0), 0),
    [filteredCrews, harvestData],
  );

  const totalW = useMemo(
    () => filteredDT.reduce((sum, date) => sum + dayW(date), 0),
    [filteredCrews, filteredDT, harvestData],
  );

  const totalB = useMemo(
    () =>
      filteredCrews.reduce(
        (sum, crew) =>
          sum + filteredDT.reduce((v, date) => v + (getBins(harvestData, crew, date) ?? 0), 0),
        0,
      ),
    [filteredCrews, filteredDT, harvestData],
  );

  const asDays = useMemo(
    () =>
      filteredDT.filter((date) =>
        filteredCrews.some((crew) => getAttendance(harvestData, crew, date) !== null),
      ).length,
    [filteredCrews, filteredDT, harvestData],
  );

  const biDays = useMemo(
    () =>
      filteredDT.filter((date) =>
        filteredCrews.some((crew) => getBins(harvestData, crew, date) !== null),
      ).length,
    [filteredCrews, filteredDT, harvestData],
  );

  const activeCQ = useMemo(
    () =>
      filteredCrews.filter((crew) =>
        filteredDT.some((date) => getAttendance(harvestData, crew, date) !== null),
      ).length,
    [filteredCrews, filteredDT, harvestData],
  );

  const totalBuses = useMemo(
    () =>
      filteredDT.reduce(
        (sum, date) => sum + filteredCrews.filter((crew) => getBus(harvestData, crew, date)).length,
        0,
      ),
    [filteredCrews, filteredDT, harvestData],
  );

  const totalForemen = useMemo(
    () =>
      filteredDT.reduce(
        (sum, date) =>
          sum + filteredCrews.filter((crew) => getForeman(harvestData, crew, date)).length,
        0,
      ),
    [filteredCrews, filteredDT, harvestData],
  );

  const crewRend = (crew: string): number | null => {
    let totalBins = 0;
    let totalAttendance = 0;
    filteredDT.forEach((date) => {
      const a = getAttendance(harvestData, crew, date);
      const b = getBins(harvestData, crew, date);
      if (a !== null && b !== null) {
        totalBins += b;
        totalAttendance += a;
      }
    });
    return totalAttendance > 0 ? totalBins / totalAttendance : null;
  };

  const avgRend = useMemo(() => {
    const values = filteredCrews.map(crewRend).filter((v): v is number => v !== null);
    if (values.length === 0) return '—';
    return (values.reduce((s, v) => s + v, 0) / values.length).toFixed(2);
  }, [filteredCrews, filteredDT, harvestData]);

  const rankedData = useMemo(
    () =>
      filteredCrews
        .map((crew) => ({
          name: crew.charAt(0) + crew.slice(1).toLowerCase(),
          rendimiento: crewRend(crew) ?? 0,
          bines: filteredDT.reduce((sum, date) => sum + (getBins(harvestData, crew, date) ?? 0), 0),
        }))
        .filter((item) => item.bines > 0)
        .sort((a, b) => b.rendimiento - a.rendimiento)
        .slice(0, 6),
    [filteredCrews, filteredDT, harvestData],
  );

  const evolutionData = useMemo(
    () =>
      filteredDT.map((date) => {
        const index = activeDT.indexOf(date);
        if (activeSN[index]) return { name: date, bines: null, trabajadores: null, rendimiento: null };
        const b = dayB(date);
        const w = dayW(date);
        return {
          name: date,
          bines: b > 0 ? b : null,
          trabajadores: w > 0 ? w : null,
          rendimiento: w > 0 && b > 0 ? Number((b / w).toFixed(2)) : null,
        };
      }),
    [filteredDT, harvestData, activeDT, activeSN],
  );

  const missingTodayCrews = useMemo(
    () => filteredCrews.filter((crew) => getAttendance(harvestData, crew, todayKey) === null).length,
    [filteredCrews, harvestData, todayKey],
  );

  const daysWithAttendanceAndNoBins = useMemo(
    () =>
      filteredDT.filter(
        (date) =>
          filteredCrews.some((crew) => getAttendance(harvestData, crew, date) !== null) &&
          filteredCrews.every((crew) => getBins(harvestData, crew, date) === null),
      ).length,
    [filteredCrews, filteredDT, harvestData],
  );

  const projectedMonthBins = useMemo(() => {
    const month = asDate.split('/')[1];
    const monthWorkDates = activeDT.filter((date, i) => date.split('/')[1] === month && activeSN[i] === 0);
    const monthBinsSoFar = filteredCrews.reduce(
      (sum, crew) =>
        sum + monthWorkDates.reduce((ds, date) => ds + (getBins(harvestData, crew, date) ?? 0), 0),
      0,
    );
    const activeMonthWorkDays = monthWorkDates.filter((date) =>
      filteredCrews.some((crew) => getBins(harvestData, crew, date) !== null),
    ).length;
    return activeMonthWorkDays > 0
      ? Math.round((monthBinsSoFar / activeMonthWorkDays) * monthWorkDates.length)
      : null;
  }, [asDate, filteredCrews, harvestData, activeDT, activeSN]);

  // Bus/foreman period counts for AttendanceSection
  const asCurrentMonth = asDate.split('/')[1];
  const asCurrentDayNum = parseInt(asDate.split('/')[0], 10);
  const asIsFirstFortnight = asCurrentDayNum <= 15;

  const busesToday = useMemo(
    () => formCrews.reduce((sum, crew) => sum + (getBus(harvestData, crew, asDate) ? 1 : 0), 0),
    [formCrews, harvestData, asDate],
  );

  const busesFortnight = useMemo(() => {
    const fortDates = activeDT.filter((date) => {
      const month = date.split('/')[1];
      const dayNum = parseInt(date.split('/')[0], 10);
      return month === asCurrentMonth && (asIsFirstFortnight ? dayNum <= 15 : dayNum > 15);
    });
    return formCrews.reduce(
      (sum, crew) =>
        sum + fortDates.reduce((ds, date) => ds + (getBus(harvestData, crew, date) ? 1 : 0), 0),
      0,
    );
  }, [formCrews, harvestData, asDate, activeDT, asCurrentMonth, asIsFirstFortnight]);

  const busesMonth = useMemo(() => {
    const monthDates = activeDT.filter((date) => date.split('/')[1] === asCurrentMonth);
    return formCrews.reduce(
      (sum, crew) =>
        sum + monthDates.reduce((ds, date) => ds + (getBus(harvestData, crew, date) ? 1 : 0), 0),
      0,
    );
  }, [formCrews, harvestData, asDate, activeDT, asCurrentMonth]);

  const foremenToday = useMemo(
    () => formCrews.reduce((sum, crew) => sum + (getForeman(harvestData, crew, asDate) ? 1 : 0), 0),
    [formCrews, harvestData, asDate],
  );

  const foremenFortnight = useMemo(() => {
    const fortDates = activeDT.filter((date) => {
      const month = date.split('/')[1];
      const dayNum = parseInt(date.split('/')[0], 10);
      return month === asCurrentMonth && (asIsFirstFortnight ? dayNum <= 15 : dayNum > 15);
    });
    return formCrews.reduce(
      (sum, crew) =>
        sum + fortDates.reduce((ds, date) => ds + (getForeman(harvestData, crew, date) ? 1 : 0), 0),
      0,
    );
  }, [formCrews, harvestData, asDate, activeDT, asCurrentMonth, asIsFirstFortnight]);

  const foremenMonth = useMemo(() => {
    const monthDates = activeDT.filter((date) => date.split('/')[1] === asCurrentMonth);
    return formCrews.reduce(
      (sum, crew) =>
        sum + monthDates.reduce((ds, date) => ds + (getForeman(harvestData, crew, date) ? 1 : 0), 0),
      0,
    );
  }, [formCrews, harvestData, asDate, activeDT, asCurrentMonth]);

  // Per-company metrics for Dashboard comparison
  const companyMetrics = useMemo(
    () =>
      companies.map((company) => {
        const compCrews = filteredCrews.filter((crew) => crewCompanies[crew] === company);
        const compW = filteredDT.reduce(
          (sum, date) =>
            sum + compCrews.reduce((s, crew) => s + (getAttendance(harvestData, crew, date) ?? 0), 0),
          0,
        );
        const compB = compCrews.reduce(
          (sum, crew) =>
            sum + filteredDT.reduce((v, date) => v + (getBins(harvestData, crew, date) ?? 0), 0),
          0,
        );
        const rendValues = compCrews
          .map((crew) => {
            let tb = 0, ta = 0;
            filteredDT.forEach((date) => {
              const a = getAttendance(harvestData, crew, date);
              const b = getBins(harvestData, crew, date);
              if (a !== null && b !== null) { tb += b; ta += a; }
            });
            return ta > 0 ? tb / ta : null;
          })
          .filter((v): v is number => v !== null);
        return {
          company: company.split(' ')[0],
          fullCompany: company,
          crewCount: compCrews.length,
          totalW: compW,
          totalB: compB,
          avgRend: rendValues.length > 0
            ? (rendValues.reduce((s, v) => s + v, 0) / rendValues.length).toFixed(2)
            : '—',
        };
      }),
    [companies, filteredCrews, crewCompanies, filteredDT, harvestData],
  );

  return {
    dayW,
    dayB,
    totalW,
    totalB,
    asDays,
    biDays,
    activeCQ,
    totalBuses,
    totalForemen,
    crewRend,
    avgRend,
    rankedData,
    evolutionData,
    missingTodayCrews,
    daysWithAttendanceAndNoBins,
    projectedMonthBins,
    busesToday,
    busesFortnight,
    busesMonth,
    foremenToday,
    foremenFortnight,
    foremenMonth,
    companyMetrics,
  };
}
