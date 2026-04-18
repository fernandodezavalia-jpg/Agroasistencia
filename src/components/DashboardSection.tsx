import { Users, Box, TrendingUp, ClipboardList } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, ComposedChart, Line, CartesianGrid } from 'recharts';
import type { ValueType } from 'recharts/types/component/DefaultTooltipContent';

export interface RankedDataItem {
  name: string;
  rendimiento: number;
  bines: number;
}

export interface CompanyMetric {
  company: string;
  fullCompany: string;
  crewCount: number;
  totalW: number;
  totalB: number;
  avgRend: string;
}

interface DashboardSectionProps {
  totalW: number;
  asDays: number;
  totalB: number;
  biDays: number;
  avgRend: string;
  totalBuses: number;
  totalForemen: number;
  activeCQ: number;
  filteredCrewsCount: number;
  rankedData: RankedDataItem[];
  evolutionData: Array<{ name: string; bines: number | null; rendimiento: number | null; trabajadores: number | null }>;
  missingTodayCrews: number;
  daysWithAttendanceAndNoBins: number;
  projectedMonthBins: number | null;
  companyMetrics: CompanyMetric[];
}

const COMPANY_COLORS: Record<string, { primary: string; light: string; badge: string }> = {
  'Limas': { primary: '#1B4332', light: '#D1FAE5', badge: 'bg-emerald-100 text-emerald-800 border-emerald-200' },
  'A.Z.': { primary: '#92400E', light: '#FEF3C7', badge: 'bg-amber-100 text-amber-800 border-amber-200' },
};
const fallbackColor = { primary: '#4A5568', light: '#F1F5F9', badge: 'bg-slate-100 text-slate-700 border-slate-200' };

export default function DashboardSection({
  totalW,
  asDays,
  totalB,
  biDays,
  avgRend,
  totalBuses,
  totalForemen,
  activeCQ,
  filteredCrewsCount,
  rankedData,
  evolutionData,
  missingTodayCrews,
  daysWithAttendanceAndNoBins,
  projectedMonthBins,
  companyMetrics,
}: DashboardSectionProps) {
  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-4 mb-6">
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-200 flex flex-col justify-between relative overflow-hidden hover:shadow-md transition-shadow">
          <div className="absolute top-0 left-0 w-1 h-full bg-brand-primary"></div>
          <div className="flex justify-between items-start mb-2">
            <p className="text-xs font-bold text-brand-secondary uppercase tracking-wider">Total Jornales</p>
            <Users className="w-4 h-4 text-brand-primary opacity-50" />
          </div>
          <div>
            <p className="text-3xl font-heading font-extrabold text-brand-primary tracking-tight">{totalW.toLocaleString('es-AR')}</p>
            <p className="text-xs text-brand-secondary mt-1 font-medium">{asDays} días con asistencia</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-200 flex flex-col justify-between relative overflow-hidden hover:shadow-md transition-shadow">
          <div className="absolute top-0 left-0 w-1 h-full bg-brand-secondary"></div>
          <div className="flex justify-between items-start mb-2">
            <p className="text-xs font-bold text-brand-secondary uppercase tracking-wider">Total Bins</p>
            <Box className="w-4 h-4 text-brand-secondary opacity-50" />
          </div>
          <div>
            <p className="text-3xl font-heading font-extrabold text-brand-primary tracking-tight">{totalB > 0 ? totalB.toLocaleString('es-AR') : '—'}</p>
            <p className="text-xs text-brand-secondary mt-1 font-medium">{totalB > 0 ? `${biDays} días cargados` : 'sin datos aún'}</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-200 flex flex-col justify-between relative overflow-hidden hover:shadow-md transition-shadow">
          <div className="absolute top-0 left-0 w-1 h-full bg-brand-tertiary"></div>
          <div className="flex justify-between items-start mb-2">
            <p className="text-xs font-bold text-brand-secondary uppercase tracking-wider">Rendimiento</p>
            <TrendingUp className="w-4 h-4 text-brand-tertiary opacity-50" />
          </div>
          <div>
            <p className="text-3xl font-heading font-extrabold text-brand-primary tracking-tight">{avgRend}</p>
            <p className="text-xs text-brand-secondary mt-1 font-medium">Bins / trabajador</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-200 flex flex-col justify-between relative overflow-hidden hover:shadow-md transition-shadow">
          <div className="absolute top-0 left-0 w-1 h-full bg-[#52B788]"></div>
          <div className="flex justify-between items-start mb-2">
            <p className="text-xs font-bold text-brand-secondary uppercase tracking-wider">Colectivos</p>
            <span className="text-lg opacity-50">🚌</span>
          </div>
          <div>
            <p className="text-3xl font-heading font-extrabold text-brand-primary tracking-tight">{totalBuses}</p>
            <p className="text-xs text-brand-secondary mt-1 font-medium">viajes en el período</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-200 flex flex-col justify-between relative overflow-hidden hover:shadow-md transition-shadow">
          <div className="absolute top-0 left-0 w-1 h-full bg-[#52B788]"></div>
          <div className="flex justify-between items-start mb-2">
            <p className="text-xs font-bold text-brand-secondary uppercase tracking-wider">Capataces</p>
            <span className="text-lg opacity-50">👷‍♂️</span>
          </div>
          <div>
            <p className="text-3xl font-heading font-extrabold text-brand-primary tracking-tight">{totalForemen}</p>
            <p className="text-xs text-brand-secondary mt-1 font-medium">presencias en el período</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-200 flex flex-col justify-between relative overflow-hidden hover:shadow-md transition-shadow">
          <div className="absolute top-0 left-0 w-1 h-full bg-brand-primary opacity-50"></div>
          <div className="flex justify-between items-start mb-2">
            <p className="text-xs font-bold text-brand-secondary uppercase tracking-wider">Cuadrillas</p>
            <ClipboardList className="w-4 h-4 text-brand-primary opacity-30" />
          </div>
          <div>
            <p className="text-3xl font-heading font-extrabold text-brand-primary tracking-tight">{activeCQ} <span className="text-base font-bold text-brand-secondary">/ {filteredCrewsCount}</span></p>
            <p className="text-xs text-brand-secondary mt-1 font-medium">activas en el período</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-200 flex flex-col justify-between relative overflow-hidden hover:shadow-md transition-shadow">
          <div className="absolute top-0 left-0 w-1 h-full bg-[#D9480F] opacity-80"></div>
          <div className="flex justify-between items-start mb-2">
            <p className="text-xs font-bold text-brand-secondary uppercase tracking-wider">Alertas</p>
            <span className="text-lg opacity-50">⚠️</span>
          </div>
          <div>
            <p className="text-3xl font-heading font-extrabold text-brand-primary tracking-tight">{missingTodayCrews}</p>
            <p className="text-xs text-brand-secondary mt-1 font-medium">sin asistencia hoy</p>
          </div>
        </div>
      </div>

      {/* Projection */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200 mb-6">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <p className="text-xs text-brand-secondary font-bold tracking-widest uppercase">Proyección Mensual</p>
          <p className="text-xs text-brand-secondary">Días con asistencia pero sin bins: {daysWithAttendanceAndNoBins}</p>
        </div>
        <div className="text-5xl font-heading font-extrabold text-brand-primary">{projectedMonthBins !== null ? projectedMonthBins.toLocaleString('es-AR') : '—'}</div>
        <p className="text-sm text-brand-secondary mt-2">bins proyectados para el mes según el promedio de días cargados</p>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div className="bg-white border border-gray-200 shadow-sm rounded-2xl p-6">
          <p className="text-xs text-brand-secondary font-bold mb-6 tracking-widest uppercase">Ranking · Bins/Bolsones / Trabajador</p>
          <div className="h-[280px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={rankedData} layout="vertical" margin={{ top: 0, right: 20, left: 0, bottom: 0 }}>
                <XAxis type="number" hide />
                <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#4A5568', fontFamily: 'Inter', fontWeight: 600 }} width={90} />
                <Tooltip
                  cursor={{ fill: '#F7FAFC' }}
                  contentStyle={{ borderRadius: '12px', border: '1px solid #E2E8F0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  formatter={(value: ValueType, _name: string, props: { payload?: { bines?: number } }) =>
                    [`${Number(value).toFixed(2)} bins/trab · ${props.payload?.bines ?? 0} Bins/Bolsones`, 'Rendimiento']
                  }
                />
                <Bar
                  dataKey="rendimiento"
                  radius={[0, 6, 6, 0]}
                  barSize={20}
                  fill="#1B4332"
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  shape={(props: any) => {
                    const BAR_COLORS = ['#1B4332', '#2D6A4F', '#40916C', '#52B788', '#74C69D', '#95D5B2'];
                    const fill = BAR_COLORS[props.index] || '#cbd5e1';
                    const { x, y, width, height } = props;
                    const r = 6;
                    return (
                      <path
                        d={`M${x},${y + height} L${x},${y + r} Q${x},${y} ${x + r},${y} L${x + width - r},${y} Q${x + width},${y} ${x + width},${y + r} L${x + width},${y + height} Z`}
                        fill={fill}
                      />
                    );
                  }}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="flex gap-4 mt-4 text-xs font-bold text-brand-secondary flex-wrap">
            {['#1B4332', '#2D6A4F', '#40916C', '#52B788', '#74C69D', '#95D5B2'].map((color, i) => (
              <span key={i} className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full inline-block" style={{ background: color }}></span>
                {i + 1}º
              </span>
            ))}
          </div>
        </div>

        <div className="bg-white border border-gray-200 shadow-sm rounded-2xl p-6">
          <p className="text-xs text-brand-secondary font-bold mb-6 tracking-widest uppercase">Evolución Diaria de Producción</p>
          <div className="h-[280px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={evolutionData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#4A5568', fontFamily: 'Inter', fontWeight: 600 }} dy={10} />
                <YAxis yAxisId="left" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#4A5568', fontFamily: 'Inter', fontWeight: 600 }} dx={-10} />
                <YAxis yAxisId="right" orientation="right" domain={[0, 'auto']} axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#4A5568', fontFamily: 'Inter', fontWeight: 600 }} dx={10} />
                <Tooltip
                  cursor={{ fill: '#F7FAFC' }}
                  content={({ active, payload, label }: any) => {
                    if (active && payload && payload.length && payload[0].payload) {
                      const data = payload[0].payload;
                      if (data.bines === null && data.rendimiento === null) return null;
                      return (
                        <div className="bg-white p-3 border border-gray-200 shadow-lg rounded-xl min-w-[160px]">
                          <p className="font-bold text-gray-800 mb-2 border-b border-gray-100 pb-2">{label}</p>
                          <div className="flex flex-col gap-1.5 text-sm">
                            <p className="text-brand-primary font-bold flex justify-between gap-4">
                              <span>Bins/Bolsones:</span>
                              <span>{data.bines || 0}</span>
                            </p>
                            <p className="text-[#52B788] font-bold flex justify-between gap-4">
                              <span>Rendimiento:</span>
                              <span>{data.rendimiento || 0} <span className="text-xs font-normal text-gray-500">b/t</span></span>
                            </p>
                            <p className="text-gray-600 flex justify-between gap-4">
                              <span>Trabajadores:</span>
                              <span className="font-medium text-gray-900">{data.trabajadores || 0}</span>
                            </p>
                          </div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar yAxisId="left" dataKey="bines" fill="#1B4332" radius={[4, 4, 0, 0]} barSize={20} />
                <Line yAxisId="right" type="monotone" dataKey="rendimiento" stroke="#52B788" strokeWidth={3} dot={{ r: 4, fill: '#52B788', strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 6 }} connectNulls={true} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
          <div className="flex gap-4 mt-4 text-xs font-bold text-brand-secondary">
            <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-brand-primary inline-block"></span>Producción (Bins/Bolsones)</span>
            <span className="flex items-center gap-1.5"><span className="w-4 h-1 rounded-full bg-[#52B788] inline-block"></span>Rendimiento (Bins/Trabajador)</span>
          </div>
        </div>
      </div>

      {/* Company Comparison */}
      {companyMetrics.length >= 2 && (
        <div className="bg-white border border-gray-200 shadow-sm rounded-2xl p-6 mb-6">
          <p className="text-xs text-brand-secondary font-bold mb-6 tracking-widest uppercase">Comparativa por Empresa</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
            {companyMetrics.map((m) => {
              const colors = COMPANY_COLORS[m.company] ?? fallbackColor;
              return (
                <div key={m.company} className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
                  <div className="flex items-center justify-between mb-4">
                    <span className={`text-xs font-bold uppercase tracking-widest px-2.5 py-1 rounded-full border ${colors.badge}`}>
                      {m.fullCompany.split(' ').slice(0, 2).join(' ')}
                    </span>
                    <span className="text-xs text-brand-secondary font-medium">{m.crewCount} cuadrillas</span>
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="text-center">
                      <p className="text-2xl font-heading font-extrabold text-brand-primary">{m.totalW.toLocaleString('es-AR')}</p>
                      <p className="text-[10px] font-bold text-brand-secondary uppercase tracking-wider mt-1">Jornales</p>
                    </div>
                    <div className="text-center border-x border-gray-200">
                      <p className="text-2xl font-heading font-extrabold text-brand-primary">{m.totalB > 0 ? m.totalB.toLocaleString('es-AR') : '—'}</p>
                      <p className="text-[10px] font-bold text-brand-secondary uppercase tracking-wider mt-1">Bins</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-heading font-extrabold text-brand-primary">{m.avgRend}</p>
                      <p className="text-[10px] font-bold text-brand-secondary uppercase tracking-wider mt-1">Rend.</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {companyMetrics.every((m) => m.totalB > 0) && (
            <div className="h-[160px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={[
                    { metric: 'Jornales', ...Object.fromEntries(companyMetrics.map((m) => [m.company, m.totalW])) },
                    { metric: 'Bins', ...Object.fromEntries(companyMetrics.map((m) => [m.company, m.totalB])) },
                  ]}
                  margin={{ top: 5, right: 5, left: -20, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                  <XAxis dataKey="metric" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#4A5568', fontFamily: 'Inter', fontWeight: 600 }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#4A5568' }} dx={-5} />
                  <Tooltip
                    contentStyle={{ borderRadius: '12px', border: '1px solid #E2E8F0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                    formatter={((value: ValueType | undefined, name: string) => [Number(value ?? 0).toLocaleString('es-AR'), String(name ?? '')]) as any}
                  />
                  {companyMetrics.map((m, i) => {
                    const clr = COMPANY_COLORS[m.company]?.primary ?? fallbackColor.primary;
                    return (
                      <Bar key={m.company} dataKey={m.company} fill={clr} radius={[4, 4, 0, 0]} barSize={28} opacity={i === 0 ? 1 : 0.7} />
                    );
                  })}
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
