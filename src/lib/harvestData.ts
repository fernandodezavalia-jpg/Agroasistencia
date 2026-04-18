export type HarvestRecord = {
  attendance?: number;
  bins?: number;
  bus?: boolean;
  foreman?: boolean;
};

export type HarvestData = Record<string, Record<string, HarvestRecord>>;

const YEAR = 2026;
export const DT: string[] = [];
export const SN: number[] = [];

for (let m = 0; m < 12; m++) {
  const daysInMonth = new Date(YEAR, m + 1, 0).getDate();
  for (let d = 1; d <= daysInMonth; d++) {
    const date = new Date(YEAR, m, d);
    DT.push(`${String(d).padStart(2, '0')}/${String(m + 1).padStart(2, '0')}`);
    SN.push(date.getDay() === 0 ? 1 : 0);
  }
}

export const monthNames: Record<string, string> = {
  '01': 'Enero',
  '02': 'Febrero',
  '03': 'Marzo',
  '04': 'Abril',
  '05': 'Mayo',
  '06': 'Junio',
  '07': 'Julio',
  '08': 'Agosto',
  '09': 'Septiembre',
  '10': 'Octubre',
  '11': 'Noviembre',
  '12': 'Diciembre',
};

export const CQ_DEFAULT = [
  'CEBALLOS', 'DIAZ G', 'DIAZ HUGO', 'JAIME', 'MALDONADO',
  'MONSERRAT', 'RODRIGUEZ', 'VIZCARRA H', 'VIZCARRA M'
];

export const CC_DEFAULT: Record<string, string> = {
  'CEBALLOS': 'Limas y Limones S.R.L.',
  'DIAZ G': 'Limas y Limones S.R.L.',
  'DIAZ HUGO': 'A.Z. Agricolas S.R.L.',
  'JAIME': 'A.Z. Agricolas S.R.L.',
  'MALDONADO': 'Limas y Limones S.R.L.',
  'MONSERRAT': 'A.Z. Agricolas S.R.L.',
  'RODRIGUEZ': 'Limas y Limones S.R.L.',
  'VIZCARRA H': 'A.Z. Agricolas S.R.L.',
  'VIZCARRA M': 'Limas y Limones S.R.L.'
};

export const COMPANIES = ['Limas y Limones S.R.L.', 'A.Z. Agricolas S.R.L.'];

export const AS_SEED: Record<string, Record<string, number>> = {
  'CEBALLOS': { '25/03': 25, '26/03': 23, '28/03': 20, '30/03': 26, '31/03': 28, '01/04': 23, '02/04': 32, '04/04': 26, '08/04': 31, '11/04': 25, '13/04': 24, '14/04': 22 },
  'DIAZ G': { '25/03': 26, '26/03': 29, '28/03': 20, '30/03': 30, '31/03': 36, '01/04': 41, '02/04': 29, '04/04': 46, '08/04': 54, '11/04': 25, '13/04': 40, '14/04': 30 },
  'DIAZ HUGO': { '25/03': 27, '26/03': 20, '28/03': 17, '30/03': 23, '31/03': 20, '01/04': 24, '02/04': 28, '04/04': 29, '08/04': 30, '11/04': 19, '13/04': 31, '14/04': 20 },
  'JAIME': { '25/03': 23, '26/03': 20, '28/03': 19, '30/03': 21, '31/03': 28, '01/04': 27, '02/04': 21, '04/04': 26, '08/04': 34, '11/04': 11, '14/04': 34 },
  'MALDONADO': { '25/03': 15, '26/03': 13, '28/03': 18, '30/03': 19, '31/03': 20, '01/04': 20, '02/04': 21, '04/04': 20, '08/04': 21, '11/04': 18 },
  'MONSERRAT': { '30/03': 19, '31/03': 20, '01/04': 19, '04/04': 19, '08/04': 21, '11/04': 17, '13/04': 21 },
  'RODRIGUEZ': { '25/03': 20, '28/03': 19, '30/03': 25, '01/04': 26, '02/04': 25, '04/04': 25, '08/04': 31, '13/04': 29, '14/04': 36 },
  'VIZCARRA H': { '25/03': 27, '26/03': 29, '28/03': 27, '30/03': 26, '01/04': 34, '02/04': 35, '04/04': 34, '08/04': 39, '11/04': 31, '13/04': 31, '14/04': 31 },
  'VIZCARRA M': { '25/03': 23, '26/03': 23, '28/03': 22, '30/03': 20, '01/04': 26, '02/04': 28, '04/04': 24, '08/04': 26, '11/04': 17, '13/04': 28, '14/04': 30 },
};

export const STORAGE_KEYS = {
  harvest: 'harvest_cit_v1',
  crews: 'cq_cit_v4',
  companies: 'cc_cit_v4',
  legacy: {
    attendance: 'asist_cit_v4',
    bins: 'bins_cit_v4',
    buses: 'buses_cit_v4',
    foremen: 'foremen_cit_v4',
  },
};

export const DEFAULT_HARVEST_DATA: HarvestData = createHarvestDataFromSeed(AS_SEED);

export function createHarvestDataFromSeed(seed: Record<string, Record<string, number>>): HarvestData {
  const data: HarvestData = {};
  Object.entries(seed).forEach(([crew, dates]) => {
    data[crew] = {};
    Object.entries(dates).forEach(([date, attendance]) => {
      data[crew][date] = { attendance };
    });
  });
  return data;
}

export function normalizeCrewName(name: string) {
  return name.trim().toUpperCase();
}

export function displayCrewName(name: string) {
  return name.charAt(0) + name.slice(1).toLowerCase();
}

export function getRecord(data: HarvestData, crew: string, date: string): HarvestRecord {
  return data[crew]?.[date] ?? {};
}

export function getAttendance(data: HarvestData, crew: string, date: string): number | null {
  const value = getRecord(data, crew, date).attendance;
  return typeof value === 'number' ? value : null;
}

export function getBins(data: HarvestData, crew: string, date: string): number | null {
  const value = getRecord(data, crew, date).bins;
  return typeof value === 'number' ? value : null;
}

export function getBus(data: HarvestData, crew: string, date: string): boolean {
  return getRecord(data, crew, date).bus === true;
}

export function getForeman(data: HarvestData, crew: string, date: string): boolean {
  return getRecord(data, crew, date).foreman === true;
}

export function mergeLegacyData(
  attendance: Record<string, Record<string, number>>,
  bins: Record<string, Record<string, number>>,
  buses: Record<string, Record<string, boolean>>,
  foremen: Record<string, Record<string, boolean>>,
): HarvestData {
  const merged: HarvestData = {};
  const allCrews = new Set<string>([
    ...Object.keys(attendance),
    ...Object.keys(bins),
    ...Object.keys(buses),
    ...Object.keys(foremen),
  ]);

  allCrews.forEach((crew) => {
    merged[crew] = {};
    const dates = new Set<string>([
      ...Object.keys(attendance[crew] ?? {}),
      ...Object.keys(bins[crew] ?? {}),
      ...Object.keys(buses[crew] ?? {}),
      ...Object.keys(foremen[crew] ?? {}),
    ]);

    dates.forEach((date) => {
      const record: HarvestRecord = {};
      if (attendance[crew]?.[date] !== undefined) {
        record.attendance = attendance[crew][date];
      }
      if (bins[crew]?.[date] !== undefined) {
        record.bins = bins[crew][date];
      }
      if (buses[crew]?.[date]) {
        record.bus = true;
      }
      if (foremen[crew]?.[date]) {
        record.foreman = true;
      }
      merged[crew][date] = record;
    });
  });

  return merged;
}

export function getDaysByMonth(month: string): string[] {
  return DT.filter((date) => date.split('/')[1] === month);
}

export function getWorkDaysByMonth(month: string): string[] {
  return DT.filter((date, index) => date.split('/')[1] === month && SN[index] === 0);
}

export function generateCalendarForYear(year: number): { DT: string[]; SN: number[] } {
  const dt: string[] = [];
  const sn: number[] = [];
  for (let m = 0; m < 12; m++) {
    const daysInMonth = new Date(year, m + 1, 0).getDate();
    for (let d = 1; d <= daysInMonth; d++) {
      const date = new Date(year, m, d);
      dt.push(`${String(d).padStart(2, '0')}/${String(m + 1).padStart(2, '0')}`);
      sn.push(date.getDay() === 0 ? 1 : 0);
    }
  }
  return { DT: dt, SN: sn };
}
