import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Download } from 'lucide-react';
import XLSXStyle from 'xlsx-js-style';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import type { User } from 'firebase/auth';
import AttendanceSection from './components/AttendanceSection';
import BinsSection from './components/BinsSection';
import CrewSection from './components/CrewSection';
import DashboardSection from './components/DashboardSection';
import HeatmapSection from './components/HeatmapSection';
import ConfirmModal from './components/ConfirmModal';
import LoginScreen from './components/LoginScreen';
import { useDashboardMetrics } from './hooks/useDashboardMetrics';
import { auth } from './lib/firebase';
import { loadCampaign, saveCampaign } from './lib/firestore';
import {
  CC_DEFAULT,
  COMPANIES,
  CQ_DEFAULT,
  DEFAULT_HARVEST_DATA,
  DT,
  generateCalendarForYear,
  getAttendance,
  getBins,
  getBus,
  getForeman,
  getRecord,
  normalizeCrewName,
} from './lib/harvestData';
import type { HarvestData, HarvestRecord } from './lib/harvestData';

const currentYear = new Date().getFullYear();

export default function App() {
  const [user, setUser] = useState<User | null | undefined>(undefined); // undefined = loading
  const [activeTab, setActiveTab] = useState<'db' | 'as' | 'bi' | 'cq' | 'dt'>('db');
  const [campaignYear, setCampaignYear] = useState<number>(currentYear);
  const [crews, setCrews] = useState<string[]>(campaignYear === currentYear ? CQ_DEFAULT : []);
  const [crewCompanies, setCrewCompanies] = useState<Record<string, string>>(campaignYear === currentYear ? CC_DEFAULT : {});
  const [harvestData, setHarvestData] = useState<HarvestData>(campaignYear === currentYear ? DEFAULT_HARVEST_DATA : {});
  const [hmMode, setHmMode] = useState<'a' | 'b' | 'r'>('a');
  const [selectedCompany, setSelectedCompany] = useState<string>('all');
  const [daysFilter, setDaysFilter] = useState<number>(15);
  const [asDate, setAsDate] = useState(DT[0]);
  const [biDate, setBiDate] = useState(DT[0]);
  const [asInputs, setAsInputs] = useState<Record<string, string>>({});
  const [busInputs, setBusInputs] = useState<Record<string, boolean>>({});
  const [foremenInputs, setForemenInputs] = useState<Record<string, boolean>>({});
  const [biInputs, setBiInputs] = useState<Record<string, string>>({});
  const [asMsg, setAsMsg] = useState({ text: '', color: '' });
  const [biMsg, setBiMsg] = useState({ text: '', color: '' });
  const [cqMsg, setCqMsg] = useState({ text: '', color: '' });
  const [importMsg, setImportMsg] = useState({ text: '', color: '' });
  const [newCq, setNewCq] = useState('');
  const [newCqCompany, setNewCqCompany] = useState(COMPANIES[0]);
  const [selectedCrew, setSelectedCrew] = useState<string | null>(null);
  const [confirmModal, setConfirmModal] = useState<{
    open: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    danger?: boolean;
  }>({ open: false, title: '', message: '', onConfirm: () => {} });
  const importInputRef = useRef<HTMLInputElement | null>(null);

  // Year-aware calendar
  const { DT: activeDT, SN: activeSN } = useMemo(
    () => generateCalendarForYear(campaignYear),
    [campaignYear],
  );

  const formatDateKey = (date: Date) =>
    `${String(date.getDate()).padStart(2, '0')}/${String(date.getMonth() + 1).padStart(2, '0')}`;

  const getClosestWorkday = (dateKey: string) => {
    const currentIndex = activeDT.indexOf(dateKey);
    if (currentIndex === -1) return activeDT[0];
    for (let i = currentIndex; i >= 0; i -= 1) {
      if (activeSN[i] === 0) return activeDT[i];
    }
    return activeDT[0];
  };

  const todayKey = getClosestWorkday(formatDateKey(new Date()));

  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Auth listener
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => setUser(u));
    return unsub;
  }, []);

  // Load from Firestore when year changes or user logs in
  useEffect(() => {
    if (!user) return;
    loadCampaign(campaignYear).then((doc) => {
      if (doc) {
        setCrews(doc.crews);
        setCrewCompanies(doc.crewCompanies);
        setHarvestData(doc.harvestData);
      } else {
        setCrews(campaignYear === currentYear ? CQ_DEFAULT : []);
        setCrewCompanies(campaignYear === currentYear ? CC_DEFAULT : {});
        setHarvestData(campaignYear === currentYear ? DEFAULT_HARVEST_DATA : {});
      }
    }).catch((err) => console.error('Error loading campaign', err));
  }, [campaignYear, user]);

  // Debounced save to Firestore on data changes
  useEffect(() => {
    if (!user) return;
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => {
      saveCampaign(campaignYear, { harvestData, crews, crewCompanies }).catch((err) =>
        console.error('Error saving campaign', err),
      );
    }, 1500);
    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    };
  }, [crews, crewCompanies, harvestData, campaignYear, user]);

  const showMsg = (setter: React.Dispatch<React.SetStateAction<{ text: string; color: string }>>, text: string, color: string) => {
    setter({ text, color });
    setTimeout(() => setter({ text: '', color: '' }), 2500);
  };

  const openConfirm = (title: string, message: string, onConfirm: () => void, danger = false) => {
    setConfirmModal({ open: true, title, message, onConfirm, danger });
  };
  const closeConfirm = () => setConfirmModal((prev) => ({ ...prev, open: false }));

  const filteredCrews = useMemo(() => {
    if (selectedCompany === 'all') return crews;
    return crews.filter((crew: string) => crewCompanies[crew] === selectedCompany);
  }, [crews, crewCompanies, selectedCompany]);

  // Reset heatmap crew selection when it's no longer visible
  useEffect(() => {
    if (selectedCrew && !filteredCrews.includes(selectedCrew)) setSelectedCrew(null);
  }, [filteredCrews, selectedCrew]);

  const filteredDT = useMemo(() => {
    if (daysFilter === 365) return activeDT;
    let lastIndex = activeDT.length - 1;
    for (let i = activeDT.length - 1; i >= 0; i--) {
      const date = activeDT[i];
      const hasData = filteredCrews.some((crew: string) => {
        const record = getRecord(harvestData, crew, date);
        return record.attendance !== undefined || record.bins !== undefined;
      });
      if (hasData) {
        lastIndex = i;
        break;
      }
    }
    const startIndex = Math.max(0, lastIndex - daysFilter + 1);
    return activeDT.slice(startIndex, lastIndex + 1);
  }, [daysFilter, filteredCrews, harvestData, activeDT]);

  const metrics = useDashboardMetrics({
    filteredCrews,
    filteredDT,
    harvestData,
    asDate,
    todayKey,
    formCrews: crews,
    crewCompanies,
    companies: COMPANIES,
    activeDT,
    activeSN,
  });

  // Sync form inputs when date or crew list changes
  useEffect(() => {
    const newAsInputs: Record<string, string> = {};
    const newBusInputs: Record<string, boolean> = {};
    const newForemenInputs: Record<string, boolean> = {};
    crews.forEach((crew) => {
      const attendance = getAttendance(harvestData, crew, asDate);
      newAsInputs[crew] = attendance !== null ? String(attendance) : '';
      newBusInputs[crew] = getBus(harvestData, crew, asDate);
      newForemenInputs[crew] = getForeman(harvestData, crew, asDate);
    });
    setAsInputs(newAsInputs);
    setBusInputs(newBusInputs);
    setForemenInputs(newForemenInputs);
  }, [asDate, crews, harvestData]);

  useEffect(() => {
    const newBiInputs: Record<string, string> = {};
    crews.forEach((crew) => {
      const bins = getBins(harvestData, crew, biDate);
      newBiInputs[crew] = bins !== null ? String(bins) : '';
    });
    setBiInputs(newBiInputs);
  }, [biDate, crews, harvestData]);

  const setRecord = (data: HarvestData, crew: string, date: string, record: HarvestRecord) => {
    if (Object.keys(record).length > 0) {
      data[crew] = { ...data[crew], [date]: record };
    } else {
      if (!data[crew]) return;
      const { [date]: _removed, ...rest } = data[crew];
      if (Object.keys(rest).length > 0) data[crew] = rest;
      else delete data[crew];
    }
  };

  const handleSaveAs = () => {
    const nextData: HarvestData = { ...harvestData };
    crews.forEach((crew) => {
      const currentRecord = { ...getRecord(nextData, crew, asDate) };
      const raw = asInputs[crew]?.trim();
      if (!raw) {
        delete currentRecord.attendance;
        delete currentRecord.bins;
        delete currentRecord.bus;
        delete currentRecord.foreman;
      } else {
        const value = parseInt(raw, 10);
        if (!isNaN(value) && value >= 0) {
          currentRecord.attendance = value;
          if (busInputs[crew]) currentRecord.bus = true;
          else delete currentRecord.bus;
          if (foremenInputs[crew]) currentRecord.foreman = true;
          else delete currentRecord.foreman;
        }
      }
      setRecord(nextData, crew, asDate, currentRecord);
    });
    setHarvestData(nextData);
    showMsg(setAsMsg, 'Guardado', 'text-emerald-500');
  };

  const handleClearAs = () => {
    openConfirm(
      'Borrar día',
      '¿Estás seguro que querés borrar todos los datos de este día? Esta acción no se puede deshacer.',
      () => {
        const nextData: HarvestData = { ...harvestData };
        crews.forEach((crew) => setRecord(nextData, crew, asDate, {}));
        setHarvestData(nextData);
        showMsg(setAsMsg, 'Día borrado', 'text-gray-400');
        closeConfirm();
      },
      true,
    );
  };

  const handleSaveBi = () => {
    const nextData: HarvestData = { ...harvestData };
    crews.forEach((crew) => {
      if (getAttendance(nextData, crew, biDate) === null) return;
      const currentRecord = { ...getRecord(nextData, crew, biDate) };
      const raw = biInputs[crew]?.trim();
      if (!raw) {
        delete currentRecord.bins;
      } else {
        const value = parseInt(raw, 10);
        if (!isNaN(value) && value >= 0) currentRecord.bins = value;
      }
      setRecord(nextData, crew, biDate, currentRecord);
    });
    setHarvestData(nextData);
    showMsg(setBiMsg, 'Guardado', 'text-emerald-500');
  };

  const handleClearBi = () => {
    openConfirm(
      'Borrar producción',
      '¿Estás seguro que querés borrar la producción de este día? Esta acción no se puede deshacer.',
      () => {
        const nextData: HarvestData = { ...harvestData };
        crews.forEach((crew) => {
          const currentRecord = { ...getRecord(nextData, crew, biDate) };
          delete currentRecord.bins;
          setRecord(nextData, crew, biDate, currentRecord);
        });
        setHarvestData(nextData);
        showMsg(setBiMsg, 'Día borrado', 'text-gray-400');
        closeConfirm();
      },
      true,
    );
  };

  const handleAddCq = () => {
    const name = normalizeCrewName(newCq);
    if (!name) {
      showMsg(setCqMsg, 'Ingresá un nombre', 'text-red-500');
      return;
    }
    if (crews.includes(name)) {
      showMsg(setCqMsg, 'Ya existe', 'text-red-500');
      return;
    }
    setCrews([...crews, name]);
    setCrewCompanies({ ...crewCompanies, [name]: newCqCompany });
    setNewCq('');
    showMsg(setCqMsg, 'Cuadrilla agregada', 'text-emerald-500');
  };

  const handleRemoveCq = (crew: string) => {
    openConfirm(
      'Eliminar cuadrilla',
      `¿Querés eliminar la cuadrilla "${crew}" y todo su histórico de datos?`,
      () => {
        const nextCompanies = { ...crewCompanies };
        delete nextCompanies[crew];
        const nextData: HarvestData = { ...harvestData };
        delete nextData[crew];
        setCrews(crews.filter((item) => item !== crew));
        setCrewCompanies(nextCompanies);
        setHarvestData(nextData);
        if (selectedCrew === crew) setSelectedCrew(null);
        showMsg(setCqMsg, 'Cuadrilla eliminada', 'text-gray-500');
        closeConfirm();
      },
      true,
    );
  };

  const handleExportExcel = () => {
    const headerFill = { fgColor: { rgb: '1B4332' } };
    const headerFont = { bold: true, color: { rgb: 'FFFFFF' }, name: 'Calibri', sz: 11 };
    const totalsFill = { fgColor: { rgb: 'D1FAE5' } };
    const totalsFont = { bold: true, name: 'Calibri', sz: 11 };
    const infoFont = { italic: true, color: { rgb: '4A5568' }, name: 'Calibri', sz: 10 };
    const rowEven = { fgColor: { rgb: 'F7FAFC' } };

    const periodLabel = daysFilter === 365 ? 'Todo el año' : `Últimos ${daysFilter} días`;
    const companyLabel = selectedCompany === 'all' ? 'Consolidado' : selectedCompany;
    const rangeLabel = filteredDT.length > 0 ? `${filteredDT[0]} → ${filteredDT[filteredDT.length - 1]}` : '—';
    const exportDate = formatDateKey(new Date());

    const rows: Array<Record<string, string | number>> = [];
    filteredDT.forEach((date) => {
      filteredCrews.forEach((crew) => {
        const attendance = getAttendance(harvestData, crew, date);
        const bins = getBins(harvestData, crew, date);
        const bus = getBus(harvestData, crew, date) ? 1 : 0;
        const foreman = getForeman(harvestData, crew, date) ? 1 : 0;
        if (attendance !== null || bins !== null || bus || foreman) {
          rows.push({
            Día: date,
            Cuadrilla: crew.charAt(0) + crew.slice(1).toLowerCase(),
            Capataz: foreman,
            Colectivo: bus,
            Asistencia: attendance ?? 0,
            'Bins/Bolsones': bins ?? 0,
          });
        }
      });
    });

    // Totals
    const sumCapataz = rows.reduce((s, r) => s + (r['Capataz'] as number), 0);
    const sumColectivo = rows.reduce((s, r) => s + (r['Colectivo'] as number), 0);
    const sumAsistencia = rows.reduce((s, r) => s + (r['Asistencia'] as number), 0);
    const sumBins = rows.reduce((s, r) => s + (r['Bins/Bolsones'] as number), 0);

    const ws = XLSXStyle.utils.aoa_to_sheet([]);

    // Info rows (rows 1–4)
    const infoRows = [
      ['COSECHA CITRUS — Exportación de Datos'],
      [`Campaña: ${campaignYear}`, `Empresa: ${companyLabel}`, `Período: ${periodLabel}`],
      [`Rango de fechas: ${rangeLabel}`, '', `Exportado: ${exportDate}`],
      [],
    ];
    infoRows.forEach((row) => XLSXStyle.utils.sheet_add_aoa(ws, [row], { origin: -1 }));

    const HEADER_ROW = 5;
    const headers = ['Día', 'Cuadrilla', 'Capataz', 'Colectivo', 'Asistencia', 'Bins/Bolsones'];
    XLSXStyle.utils.sheet_add_aoa(ws, [headers], { origin: -1 });

    // Style header row
    headers.forEach((_, colIdx) => {
      const cellRef = XLSXStyle.utils.encode_cell({ r: HEADER_ROW - 1, c: colIdx });
      if (!ws[cellRef]) ws[cellRef] = { v: headers[colIdx], t: 's' };
      ws[cellRef].s = {
        fill: headerFill,
        font: headerFont,
        alignment: { horizontal: 'center', vertical: 'center' },
        border: { bottom: { style: 'medium', color: { rgb: '40916C' } } },
      };
    });

    // Data rows
    rows.forEach((row, rowIdx) => {
      const values = headers.map((h) => row[h] ?? '');
      XLSXStyle.utils.sheet_add_aoa(ws, [values], { origin: -1 });
      const isEven = rowIdx % 2 === 0;
      headers.forEach((_, colIdx) => {
        const cellRef = XLSXStyle.utils.encode_cell({ r: HEADER_ROW + rowIdx, c: colIdx });
        if (!ws[cellRef]) ws[cellRef] = { v: values[colIdx], t: typeof values[colIdx] === 'number' ? 'n' : 's' };
        ws[cellRef].s = {
          fill: isEven ? { fgColor: { rgb: 'FFFFFF' } } : rowEven,
          font: { name: 'Calibri', sz: 11 },
          alignment: colIdx >= 2 ? { horizontal: 'center' } : { horizontal: 'left' },
        };
      });
    });

    // Blank separator row
    XLSXStyle.utils.sheet_add_aoa(ws, [[]], { origin: -1 });

    // Totals row
    const totalsRow = ['TOTALES', '', sumCapataz, sumColectivo, sumAsistencia, sumBins];
    XLSXStyle.utils.sheet_add_aoa(ws, [totalsRow], { origin: -1 });
    const totalsRowIdx = HEADER_ROW + rows.length + 1;
    totalsRow.forEach((val, colIdx) => {
      const cellRef = XLSXStyle.utils.encode_cell({ r: totalsRowIdx, c: colIdx });
      if (!ws[cellRef]) ws[cellRef] = { v: val, t: typeof val === 'number' ? 'n' : 's' };
      ws[cellRef].s = {
        fill: totalsFill,
        font: { ...totalsFont, color: { rgb: '1B4332' } },
        alignment: colIdx >= 2 ? { horizontal: 'center' } : { horizontal: 'left' },
        border: { top: { style: 'medium', color: { rgb: '40916C' } } },
      };
    });

    // Style info rows
    for (let r = 0; r < 3; r++) {
      const cellRef = XLSXStyle.utils.encode_cell({ r, c: 0 });
      if (ws[cellRef]) ws[cellRef].s = { font: r === 0 ? { ...infoFont, bold: true, sz: 12 } : infoFont };
    }

    // Column widths
    ws['!cols'] = [
      { wch: 10 }, { wch: 22 }, { wch: 12 }, { wch: 12 }, { wch: 14 }, { wch: 16 },
    ];

    const wb = XLSXStyle.utils.book_new();
    XLSXStyle.utils.book_append_sheet(wb, ws, 'Datos');
    XLSXStyle.writeFile(wb, `Cosecha_${campaignYear}_${companyLabel.replace(/[^a-zA-Z0-9]/g, '_')}_${daysFilter}d.xlsx`);
  };

  const handleImportExcelFile = (file: File | null) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = new Uint8Array(event.target?.result as ArrayBuffer);
        const workbook = XLSXStyle.read(data, { type: 'array' });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const xlsxRows = XLSXStyle.utils.sheet_to_json<Record<string, string | number>>(sheet, { defval: '' });
        const nextData: HarvestData = { ...harvestData };
        const nextCrews = [...crews];
        const nextCompanies = { ...crewCompanies };
        let importedRows = 0;
        const importedCrews = new Set<string>();
        const importedDates = new Set<string>();
        let withBins = 0, withBus = 0, withForeman = 0, skippedRows = 0;

        xlsxRows.forEach((row: Record<string, string | number>) => {
          const rawDate = String(row['Día'] ?? row['Dia'] ?? row['Date'] ?? '').trim();
          const rawCrew = String(row['Cuadrilla'] ?? row['cuadrilla'] ?? row['Crew'] ?? '').trim();
          const rawAttendance = row['Asistencia'] ?? row['Attendance'] ?? '';
          const rawBins = row['Bins/Bolsones'] ?? row['Bins'] ?? row['bins'] ?? '';
          const rawBus = String(row['Colectivo'] ?? row['Bus'] ?? '').trim().toLowerCase();
          const rawForeman = String(row['Capataz'] ?? row['Foreman'] ?? '').trim().toLowerCase();
          const rawCompany = String(row['Empresa'] ?? row['Company'] ?? '').trim().toLowerCase();
          const crew = normalizeCrewName(rawCrew);
          if (!crew || !rawDate) { skippedRows += 1; return; }

          const resolvedCompany = rawCompany.includes('az') || rawCompany.includes('a.z')
            ? 'A.Z. Agricolas S.R.L.'
            : rawCompany.includes('lim')
              ? 'Limas y Limones S.R.L.'
              : COMPANIES[0];

          if (!nextCrews.includes(crew)) {
            nextCrews.push(crew);
            nextCompanies[crew] = resolvedCompany;
          } else if (rawCompany) {
            nextCompanies[crew] = resolvedCompany;
          }
          if (!nextData[crew]) nextData[crew] = {};

          const record: HarvestRecord = {};
          const attendanceValue = Number(rawAttendance);
          const binsValue = Number(rawBins);
          if (!Number.isNaN(attendanceValue) && rawAttendance !== '') record.attendance = attendanceValue;
          if (!Number.isNaN(binsValue) && rawBins !== '') { record.bins = binsValue; withBins += 1; }
          const busVal = String(rawBus);
          const foremanVal = String(rawForeman);
          if (busVal.startsWith('s') || busVal === '1') { record.bus = true; withBus += 1; }
          if (foremanVal.startsWith('s') || foremanVal === '1') { record.foreman = true; withForeman += 1; }
          if (Object.keys(record).length > 0) {
            nextData[crew][rawDate] = { ...nextData[crew][rawDate], ...record };
            importedRows += 1;
            importedCrews.add(crew);
            importedDates.add(rawDate);
          }
        });

        if (importedRows === 0) {
          showMsg(setImportMsg, 'El archivo no contenía filas válidas', 'text-red-500');
          return;
        }

        setCrews(nextCrews);
        setCrewCompanies(nextCompanies);
        setHarvestData(nextData);

        const summary = [
          `✓ ${importedRows} filas`,
          `${importedCrews.size} cuadrillas`,
          `${importedDates.size} días`,
          withBins > 0 ? `${withBins} con bins` : '',
          withBus > 0 ? `${withBus} con colectivo` : '',
          withForeman > 0 ? `${withForeman} con capataz` : '',
          skippedRows > 0 ? `⚠ ${skippedRows} filas ignoradas` : '',
        ].filter(Boolean).join(' · ');
        showMsg(setImportMsg, summary, 'text-emerald-600');
      } catch (error) {
        console.error(error);
        showMsg(setImportMsg, 'Error procesando el archivo', 'text-red-500');
      }
    };
    reader.readAsArrayBuffer(file);
  };

  if (user === undefined) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#f0faf4] to-[#e8f5ee]">
        <div className="w-10 h-10 border-4 border-brand-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (user === null) return <LoginScreen />;

  return (
    <div className="max-w-6xl mx-auto p-4 sm:p-8 font-sans text-brand-secondary min-h-screen">
      <ConfirmModal
        open={confirmModal.open}
        title={confirmModal.title}
        message={confirmModal.message}
        onConfirm={confirmModal.onConfirm}
        onCancel={closeConfirm}
        danger={confirmModal.danger}
        confirmLabel={confirmModal.danger ? 'Eliminar' : 'Confirmar'}
      />

      {/* Header */}
      <div className="mb-8 bg-white rounded-[32px] shadow-[0_24px_80px_-12px_rgba(27,67,50,0.28)] border border-gray-100 overflow-hidden">
        <div className="h-1.5 bg-gradient-to-r from-brand-primary via-[#40916C] to-[#74C69D]" />
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-5 sm:p-7 gap-5">
        <div className="flex items-center gap-4">
          <div className="w-11 h-11 rounded-2xl bg-brand-primary flex items-center justify-center shadow-lg shadow-brand-primary/25 flex-shrink-0">
            <img src="/icon.svg" alt="" className="w-7 h-7" />
          </div>
          <h1 className="text-[1.75rem] font-heading font-extrabold tracking-tight text-brand-primary m-0 leading-none">AgroAsistencia</h1>
        </div>
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 flex-wrap">
          <div className="flex items-center gap-2 bg-brand-neutral px-4 py-2 rounded-full border border-gray-200">
            <span className="text-xs font-bold text-brand-secondary">Campaña:</span>
            <select
              value={campaignYear}
              onChange={(e) => setCampaignYear(Number(e.target.value))}
              className="bg-transparent text-xs font-bold text-brand-primary outline-none cursor-pointer"
            >
              {[currentYear - 1, currentYear, currentYear + 1].map((y) => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-2 bg-brand-neutral px-4 py-2 rounded-full border border-gray-200">
            <span className="text-xs font-bold text-brand-secondary">Período:</span>
            <select
              value={daysFilter}
              onChange={(e) => setDaysFilter(Number(e.target.value))}
              className="bg-transparent text-xs font-bold text-brand-primary outline-none cursor-pointer"
            >
              <option value={7}>Últimos 7 días</option>
              <option value={15}>Últimos 15 días</option>
              <option value={30}>Últimos 30 días</option>
              <option value={365}>Todo el año</option>
            </select>
          </div>
          <div className="flex items-center gap-2 bg-brand-neutral px-4 py-2 rounded-full border border-gray-200">
            <span className="text-xs font-bold text-brand-secondary">Empresa:</span>
            <select
              value={selectedCompany}
              onChange={(e) => setSelectedCompany(e.target.value)}
              className="bg-transparent text-xs font-bold text-brand-primary outline-none cursor-pointer"
            >
              <option value="all">Consolidado</option>
              {COMPANIES.map((company) => (
                <option key={company} value={company}>{company}</option>
              ))}
            </select>
          </div>
          <button
            type="button"
            onClick={() => { setActiveTab('as'); setAsDate(todayKey); }}
            className="bg-brand-primary hover:bg-[#122e22] text-white text-xs font-bold px-4 py-2 rounded-full transition-all"
          >
            Cargar hoy
          </button>
          <button
            type="button"
            onClick={() => importInputRef.current?.click()}
            className="bg-white border border-gray-200 text-brand-secondary text-xs font-bold px-4 py-2 rounded-full transition-all hover:bg-brand-neutral"
          >
            Importar
          </button>
          <button
            type="button"
            onClick={() => signOut(auth)}
            className="bg-white border border-gray-200 text-brand-secondary text-xs font-bold px-4 py-2 rounded-full transition-all hover:bg-red-50 hover:text-red-600 hover:border-red-200"
            title={user.email ?? ''}
          >
            Salir
          </button>
          <input
            ref={importInputRef}
            type="file"
            accept=".xlsx,.xls"
            className="hidden"
            onChange={(e) => {
              handleImportExcelFile(e.target.files?.[0] ?? null);
              if (e.target) e.target.value = '';
            }}
          />
        </div>
        {importMsg.text && (
          <div className={`mt-3 text-sm font-bold ${importMsg.color}`}>{importMsg.text}</div>
        )}
      </div>
      </div>

      {/* Tab bar */}
      <div className="flex gap-2 mb-8 overflow-x-auto pb-2">
        {[
          { id: 'db', label: 'Dashboard', icon: '📊' },
          { id: 'as', label: 'Asistencia', icon: '👥' },
          { id: 'bi', label: 'Bins/Bolsones', icon: '🍋' },
          { id: 'cq', label: 'Cuadrillas', icon: '📋' },
          { id: 'dt', label: 'Detalle', icon: '📅' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as typeof activeTab)}
            className={`px-6 py-3 text-sm font-bold rounded-full transition-all whitespace-nowrap flex items-center gap-2 ${activeTab === tab.id ? 'bg-brand-primary text-white shadow-md' : 'bg-white text-brand-secondary border border-gray-200 hover:bg-brand-neutral hover:text-brand-primary'}`}
          >
            <span>{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'db' && (
        <DashboardSection
          totalW={metrics.totalW}
          asDays={metrics.asDays}
          totalB={metrics.totalB}
          biDays={metrics.biDays}
          avgRend={metrics.avgRend}
          totalBuses={metrics.totalBuses}
          totalForemen={metrics.totalForemen}
          activeCQ={metrics.activeCQ}
          filteredCrewsCount={filteredCrews.length}
          rankedData={metrics.rankedData}
          evolutionData={metrics.evolutionData}
          missingTodayCrews={metrics.missingTodayCrews}
          daysWithAttendanceAndNoBins={metrics.daysWithAttendanceAndNoBins}
          projectedMonthBins={metrics.projectedMonthBins}
          companyMetrics={metrics.companyMetrics}
        />
      )}

      {activeTab === 'as' && (
        <AttendanceSection
          harvestData={harvestData}
          filteredCrews={filteredCrews}
          calendarDT={activeDT}
          calendarSN={activeSN}
          asDate={asDate}
          setAsDate={setAsDate}
          asInputs={asInputs}
          busInputs={busInputs}
          foremenInputs={foremenInputs}
          setAsInputs={setAsInputs}
          setBusInputs={setBusInputs}
          setForemenInputs={setForemenInputs}
          handleSaveAs={handleSaveAs}
          handleClearAs={handleClearAs}
          asMsg={asMsg}
          busesToday={metrics.busesToday}
          busesFortnight={metrics.busesFortnight}
          busesMonth={metrics.busesMonth}
          foremenToday={metrics.foremenToday}
          foremenFortnight={metrics.foremenFortnight}
          foremenMonth={metrics.foremenMonth}
          dayW={metrics.dayW}
        />
      )}

      {activeTab === 'bi' && (
        <BinsSection
          harvestData={harvestData}
          filteredCrews={filteredCrews}
          calendarDT={activeDT}
          calendarSN={activeSN}
          biDate={biDate}
          setBiDate={setBiDate}
          biInputs={biInputs}
          setBiInputs={setBiInputs}
          handleSaveBi={handleSaveBi}
          handleClearBi={handleClearBi}
          biMsg={biMsg}
        />
      )}

      {activeTab === 'cq' && (
        <CrewSection
          filteredCrews={filteredCrews}
          crewCompanies={crewCompanies}
          harvestData={harvestData}
          calendarDT={activeDT}
          totalW={metrics.totalW}
          totalB={metrics.totalB}
          newCq={newCq}
          setNewCq={setNewCq}
          newCqCompany={newCqCompany}
          setNewCqCompany={setNewCqCompany}
          handleAddCq={handleAddCq}
          handleRemoveCq={handleRemoveCq}
          cqMsg={cqMsg}
        />
      )}

      {activeTab === 'dt' && (
        <div className="bg-white border border-gray-200 shadow-sm rounded-2xl p-6 overflow-x-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
            <div className="flex items-center gap-4">
              <p className="text-xs text-brand-secondary font-bold m-0 tracking-widest uppercase">Mapa de Calor</p>
              <button
                onClick={handleExportExcel}
                className="flex items-center gap-1.5 bg-brand-primary hover:bg-[#122e22] text-white px-3 py-1.5 rounded-lg text-xs font-bold transition-all shadow-sm"
                title="Exportar a Excel"
              >
                <Download className="w-3.5 h-3.5" />
                Exportar
              </button>
            </div>
            <div className="flex gap-2 p-1 bg-brand-neutral border border-gray-200 rounded-full">
              {[
                { id: 'a', label: 'Asistencia' },
                { id: 'b', label: 'Bins/Bolsones' },
                { id: 'r', label: 'Rendimiento' },
              ].map((option) => (
                <button
                  key={option.id}
                  onClick={() => setHmMode(option.id as 'a' | 'b' | 'r')}
                  className={`rounded-full px-4 py-1.5 text-xs font-bold transition-all ${hmMode === option.id ? 'bg-white text-brand-primary shadow-sm border border-gray-200' : 'bg-transparent text-brand-secondary hover:text-brand-primary'}`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          <HeatmapSection
            harvestData={harvestData}
            filteredCrews={filteredCrews}
            filteredDT={filteredDT}
            calendarDT={activeDT}
            calendarSN={activeSN}
            hmMode={hmMode}
            setHmMode={setHmMode}
            dayW={metrics.dayW}
            dayB={metrics.dayB}
            selectedCrew={selectedCrew}
            onSelectCrew={setSelectedCrew}
          />
        </div>
      )}
    </div>
  );
}
