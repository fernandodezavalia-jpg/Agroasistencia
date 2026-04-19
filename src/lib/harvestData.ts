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

export const COMPANIES = ['Limas y Limones S.R.L.', 'A.Z. Agricolas S.R.L.'];

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
