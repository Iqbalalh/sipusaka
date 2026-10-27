"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { ApexOptions } from "apexcharts";
import { Skeleton } from "antd";
import { getRegionStats, RegionStat } from "@/utils/services/region.service";
import { fetchWithAuth } from "@/utils/fetch/fetchWithAuth";
import { API_DASHBOARD } from "@/constants/endpoint";
import {
  FaHouseChimney,
  FaChildReaching,
  FaShop,
  FaGraduationCap,
  FaUserXmark,
} from "react-icons/fa6";

const ReactApexChart = dynamic(() => import("react-apexcharts"), { ssr: false });


const EDU_DYNAMIC_COLORS = [
  "#f43f5e", "#3b82f6", "#6366f1", "#8b5cf6",
  "#22c55e", "#0ea5e9", "#f97316", "#ef4444",
  "#ec4899", "#14b8a6",
];

const CANONICAL_EDU_ORDER = [
  "Pra Sekolah - TK", "SD", "SMP", "SMA",
  "D1", "D2", "D3", "D4 - S1", "Kursus", "ABK",
];

const sortEduEntries = (entries: [string, number][]): [string, number][] => {
  return [...entries].sort(([a], [b]) => {
    const ia = CANONICAL_EDU_ORDER.indexOf(a);
    const ib = CANONICAL_EDU_ORDER.indexOf(b);
    if (ia === -1 && ib === -1) return a.localeCompare(b);
    if (ia === -1) return 1;
    if (ib === -1) return -1;
    return ia - ib;
  });
};

const CHILDREN_BREAKDOWN = [
  { key: "active" as const, label: "Aktif", color: "#22c55e" },
  { key: "inactive" as const, label: "Tidak Aktif", color: "#9ca3af" },
  { key: "yatim" as const, label: "Yatim", color: "#f59e0b" },
  { key: "piatu" as const, label: "Piatu", color: "#f97316" },
  { key: "yatimPiatu" as const, label: "Yatim Piatu", color: "#ef4444" },
  { key: "abk" as const, label: "ABK", color: "#a855f7" },
];

// ==============================================
// STAT CARD
// ==============================================
interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: number | string;
  sub?: string;
  color: string;
}

function StatCard({ icon, label, value, sub, color }: StatCardProps) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/3 p-5 flex items-start gap-4">
      <div className={`shrink-0 w-12 h-12 rounded-xl flex items-center justify-center text-white text-xl ${color}`}>
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-xs text-gray-500 dark:text-gray-400 mb-0.5">{label}</p>
        <p className="text-2xl font-bold text-gray-800 dark:text-white/90">{value}</p>
        {sub && <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

// ==============================================
// CHART CARD
// ==============================================
interface ChartCardProps {
  title: string;
  categories: string[];
  series: ApexAxisChartSeries;
  colors?: string[];
  height?: number;
}

function ChartCard({ title, categories, series, colors, height = 280 }: ChartCardProps) {
  const options: ApexOptions = {
    chart: {
      fontFamily: "Outfit, sans-serif",
      type: "bar",
      toolbar: { show: false },
      stacked: false,
    },
    colors: colors ?? ["#465fff", "#22c55e", "#f97316", "#a855f7"],
    plotOptions: {
      bar: {
        horizontal: true,
        columnWidth: "55%",
        borderRadius: 4,
        borderRadiusApplication: "end",
      },
    },
    dataLabels: { enabled: true, style: { fontSize: "11px" } },
    xaxis: {
      categories,
      axisBorder: { show: false },
      axisTicks: { show: false },
      labels: { style: { fontSize: "11px" }, rotate: -30, hideOverlappingLabels: false },
    },
    yaxis: { labels: { style: { fontSize: "11px" } } },
    legend: { show: series.length > 1, position: "top", horizontalAlign: "left", fontFamily: "Outfit" },
    grid: { xaxis: { lines: { show: false } }, yaxis: { lines: { show: true } } },
    tooltip: { y: { formatter: (v) => `${v}` } },
  };

  return (
    <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/3 px-5 pt-5 pb-2">
      <h3 className="text-base font-semibold text-gray-800 dark:text-white/90 mb-1">{title}</h3>
      <div className="overflow-x-auto">
        <ReactApexChart options={options} series={series} type="bar" height={height} />
      </div>
    </div>
  );
}

// ==============================================
// EDU CARDS (reusable)
// Inactive children are NOT counted in edu levels — shown as separate card
// ==============================================
function EduCards({
  eduLevels,
  inactiveCount,
}: {
  eduLevels: Record<string, number>;
  inactiveCount: number;
}) {
  const entries = sortEduEntries(Object.entries(eduLevels));
  const grandTotal = entries.reduce((s, [, v]) => s + v, 0);
  const maxCount = Math.max(...entries.map(([, v]) => v), inactiveCount, 1);

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-5 gap-3">
      {/* Tidak Aktif card — shown first, styled differently */}
      <div className="flex flex-col gap-2 p-3 rounded-xl bg-gray-100 dark:bg-gray-800/70 border border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-1.5">
          <FaUserXmark className="text-gray-400 text-xs" />
          <span className="text-xs font-semibold text-gray-500 dark:text-gray-400">Tidak Aktif</span>
        </div>
        <p className="text-2xl font-bold text-gray-500 dark:text-gray-400">{inactiveCount}</p>
        <p className="text-xs text-gray-400">Inaktif</p>
        <div className="h-1.5 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden">
          <div
            className="h-full rounded-full"
            style={{ width: `${(inactiveCount / maxCount) * 100}%`, backgroundColor: "#9ca3af" }}
          />
        </div>
      </div>

      {/* Active children by education level */}
      {entries.map(([level, count], idx) => (
        <div key={level} className="flex flex-col gap-2 p-3 rounded-xl bg-gray-50 dark:bg-gray-800/50">
          <span
            className="self-start rounded-full px-2 py-0.5 text-xs font-semibold"
            style={{
              backgroundColor: EDU_DYNAMIC_COLORS[idx % EDU_DYNAMIC_COLORS.length] + "22",
              color: EDU_DYNAMIC_COLORS[idx % EDU_DYNAMIC_COLORS.length],
            }}
          >
            {level}
          </span>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{count}</p>
          <p className="text-xs text-gray-400 dark:text-gray-500">
            {grandTotal > 0 ? ((count / grandTotal) * 100).toFixed(1) : "0"}%
          </p>
          <div className="h-1.5 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden">
            <div
              className="h-full rounded-full"
              style={{
                width: `${(count / maxCount) * 100}%`,
                backgroundColor: EDU_DYNAMIC_COLORS[idx % EDU_DYNAMIC_COLORS.length],
              }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

// ==============================================
// REGION DETAIL CARD
// ==============================================
function RegionDetailCard({ stat, eduData, eduLoading }: {
  stat: RegionStat;
  eduData: Record<string, number>;
  eduLoading: boolean;
}) {
  const children = stat.children;
  const totalChildren = children.total || 1;
  const maxChildrenCount = Math.max(...CHILDREN_BREAKDOWN.map((b) => children[b.key] ?? 0), 1);

  const eduEntries = sortEduEntries(Object.entries(eduData).filter(([, v]) => v > 0));
  const eduPieSeries = eduEntries.map(([, v]) => v);
  const regionEduPieOptions: ApexOptions = {
    chart: { type: "donut", fontFamily: "Outfit, sans-serif", toolbar: { show: false } },
    labels: eduEntries.map(([k]) => k),
    colors: EDU_DYNAMIC_COLORS.slice(0, eduEntries.length),
    legend: { position: "bottom", fontFamily: "Outfit", fontSize: "12px" },
    dataLabels: {
      enabled: true,
      formatter: (v: number) => `${v.toFixed(1)}%`,
      style: { fontSize: "11px" },
    },
    tooltip: { y: { formatter: (v: number) => `${v} anak` } },
    plotOptions: { pie: { donut: { size: "60%" } } },
  };

  return (
    <div className="space-y-4">
      {/* Overview row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <StatCard icon={<FaHouseChimney />} label="Keluarga" value={stat.familiesActive ?? stat.families} sub={`dari ${stat.families} total`} color="bg-blue-500" />
        <StatCard icon={<FaChildReaching />} label="Anak Aktif" value={stat.children.active} color="bg-indigo-500" />
        <StatCard icon={<FaShop />} label="UMKM Aktif" value={stat.umkm.active} color="bg-orange-500" />
      </div>

      {/* Children breakdown — bar grid */}
      <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/3 p-5">
        <p className="text-sm font-semibold text-gray-700 dark:text-white/80 mb-3">Rincian Anak</p>
        <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-3">
          {CHILDREN_BREAKDOWN.map((item) => {
            const count = children[item.key] ?? 0;
            return (
              <div key={item.key} className="flex flex-col gap-2 p-3 rounded-xl bg-gray-50 dark:bg-gray-800/50">
                <p className="text-xs text-gray-500 dark:text-gray-400">{item.label}</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{count}</p>
                <p className="text-xs text-gray-400 dark:text-gray-500">
                  {totalChildren > 0 ? ((count / totalChildren) * 100).toFixed(1) : "0"}%
                </p>
                <div className="h-1.5 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden">
                  <div
                    className="h-full rounded-full"
                    style={{ width: `${(count / maxChildrenCount) * 100}%`, backgroundColor: item.color }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Education level breakdown (active children only, from bantuan terakhir) */}
      <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/3 p-5">
        <div className="flex items-center gap-2 mb-3">
          <FaGraduationCap className="text-blue-600" />
          <p className="text-sm font-semibold text-gray-700 dark:text-white/80">
            Jenjang Pendidikan Anak
          </p>
          <span className="ml-auto text-xs text-gray-400">hanya anak aktif · dari bantuan terakhir</span>
        </div>
        {eduLoading ? (
          <p className="text-sm text-gray-400 py-2">Memuat data...</p>
        ) : (
          <>
            <EduCards eduLevels={eduData} inactiveCount={stat.children.inactive} />
            {eduPieSeries.length > 0 && (
              <div className="rounded-xl bg-gray-50 dark:bg-gray-800/50 p-4 mt-4">
                <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-2 text-center uppercase tracking-wider">
                  Persentase Jenjang Pendidikan
                </p>
                <ReactApexChart
                  key="region-edu-donut"
                  options={regionEduPieOptions}
                  series={eduPieSeries}
                  type="donut"
                  height={300}
                />
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

// ==============================================
// SUMMARY TAB (ALL REGIONS)
// ==============================================
function SummaryView({ stats, globalEduData, globalEduLoading }: {
  stats: RegionStat[];
  globalEduData: Record<string, number>;
  globalEduLoading: boolean;
}) {
  const getRegionRank = (name: string) => {
    const n = name.toLowerCase();
    if (n.startsWith("daop")) return 0;
    if (n.startsWith("divre")) return 1;
    if (n.startsWith("by")) return 2;
    return 3;
  };
  const sortedStats = [...stats].sort((a, b) => {
    const rankDiff = getRegionRank(a.regionName) - getRegionRank(b.regionName);
    if (rankDiff !== 0) return rankDiff;
    return a.regionName.localeCompare(b.regionName);
  });
  const names = sortedStats.map((s) => s.regionName);
  const chartHeight = Math.max(300, sortedStats.length * 120);

  const totalInactive = stats.reduce((sum, s) => sum + s.children.inactive, 0);
  const eduEntries = sortEduEntries(Object.entries(globalEduData).filter(([, v]) => v > 0));
  const eduGrandTotal = eduEntries.reduce((s, [, v]) => s + v, 0);

  // Education pie chart options
  const eduPieOptions: ApexOptions = {
    chart: { type: "donut", fontFamily: "Outfit, sans-serif", toolbar: { show: false } },
    labels: eduEntries.map(([k]) => k),
    colors: EDU_DYNAMIC_COLORS.slice(0, eduEntries.length),
    legend: { position: "bottom", fontFamily: "Outfit", fontSize: "12px" },
    dataLabels: {
      enabled: true,
      formatter: (v: number) => `${v.toFixed(1)}%`,
      style: { fontSize: "11px" },
    },
    tooltip: { y: { formatter: (v: number) => `${v} anak` } },
    plotOptions: { pie: { donut: { size: "60%" } } },
  };
  const eduPieSeries = eduEntries.map(([, v]) => v);

  const BANTUAN_COLORS = ["#465fff", "#22c55e", "#f97316", "#a855f7", "#ec4899", "#0ea5e9"];
  const rupiahFormatter = (v: number) =>
    new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(v);

  // Unified years across both datasets — same year maps to same color in both charts
  const allYears = Array.from(
    new Set([
      ...stats.flatMap((s) => Object.keys(s.childAssistance.byYear ?? {})),
      ...stats.flatMap((s) => Object.keys(s.umkmVisits.byYear ?? {})),
    ])
  ).map(Number).sort();

  const bantuanSeries: ApexAxisChartSeries = allYears.map((year) => ({
    name: String(year),
    data: sortedStats.map((s) => Number(s.childAssistance.byYear?.[year] ?? 0)),
  }));

  const umkmBantuanSeries: ApexAxisChartSeries = allYears.map((year) => ({
    name: String(year),
    data: sortedStats.map((s) => Number(s.umkmVisits.byYear?.[year] ?? 0)),
  }));

  const sharedBantuanChartOptions: ApexOptions = {
    chart: { fontFamily: "Outfit, sans-serif", type: "bar", toolbar: { show: false }, stacked: false },
    colors: BANTUAN_COLORS,
    plotOptions: { bar: { horizontal: true, borderRadius: 4, borderRadiusApplication: "end", barHeight: "60%" } },
    dataLabels: { enabled: false },
    xaxis: {
      categories: names,
      axisBorder: { show: false },
      axisTicks: { show: false },
      labels: {
        style: { fontSize: "11px" },
        formatter: (v: string) => {
          const n = Number(v);
          if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}jt`;
          if (n >= 1_000) return `${(n / 1_000).toFixed(0)}rb`;
          return String(n);
        },
      },
    },
    yaxis: { labels: { style: { fontSize: "11px" } } },
    legend: { show: allYears.length > 1, position: "top", horizontalAlign: "left", fontFamily: "Outfit" },
    grid: { xaxis: { lines: { show: true } }, yaxis: { lines: { show: false } } },
    tooltip: { y: { formatter: rupiahFormatter } },
  };

  const bantuanOptions = sharedBantuanChartOptions;
  const umkmBantuanOptions = sharedBantuanChartOptions;

  return (
    <div className="space-y-5">
      {/* Jenjang Pendidikan Anak — aggregated across all regions */}
      <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/3 p-5">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-1 h-5 bg-blue-600 rounded-full" />
          <FaGraduationCap className="text-blue-600 text-lg" />
          <h3 className="text-base font-semibold text-gray-800 dark:text-white/90">
            Jenjang Pendidikan Anak
          </h3>
          <span className="ml-auto text-sm text-gray-400">
            Total aktif:{" "}
            <span className="font-bold text-gray-700 dark:text-white">{eduGrandTotal}</span>
            <span className="text-xs ml-1">anak · dari bantuan terakhir</span>
          </span>
        </div>
        {globalEduLoading ? (
          <p className="text-sm text-gray-400 py-2">Memuat data...</p>
        ) : (
          <div className="space-y-6">
            <EduCards eduLevels={globalEduData} inactiveCount={totalInactive} />
            {eduPieSeries.length > 0 && (
              <div className="rounded-xl bg-gray-50 dark:bg-gray-800/50 p-4">
                <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-2 text-center uppercase tracking-wider">
                  Persentase Jenjang Pendidikan
                </p>
                <ReactApexChart
                  key="edu-donut"
                  options={eduPieOptions}
                  series={eduPieSeries}
                  type="donut"
                  height={300}
                />
              </div>
            )}
          </div>
        )}
      </div>

      <ChartCard
        title="Keluarga & Anak Aktif per Wilayah"
        categories={names}
        height={chartHeight}
        series={[
          { name: "Keluarga Aktif", data: sortedStats.map((s) => s.familiesActive ?? s.families ?? 0) },
          { name: "Anak Aktif", data: sortedStats.map((s) => s.children.active ?? 0) },
        ]}
        colors={["#465fff", "#22c55e"]}
      />

      <ChartCard
        title="Kategori Anak per Wilayah (Aktif)"
        categories={names}
        height={chartHeight}
        series={[
          { name: "Yatim", data: sortedStats.map((s) => s.children.yatim) },
          { name: "Piatu", data: sortedStats.map((s) => s.children.piatu) },
          { name: "Yatim Piatu", data: sortedStats.map((s) => s.children.yatimPiatu) },
          { name: "ABK", data: sortedStats.map((s) => s.children.abk) },
        ]}
        colors={["#f59e0b", "#f97316", "#ef4444", "#a855f7"]}
      />

      <ChartCard
        title="UMKM per Wilayah"
        categories={names}
        height={chartHeight}
        series={[
          { name: "UMKM Aktif", data: sortedStats.map((s) => s.umkm.active) },
          { name: "UMKM Tidak Aktif", data: sortedStats.map((s) => s.umkm.inactive) },
        ]}
        colors={["#22c55e", "#d1d5db"]}
      />

      {/* Bantuan Anak per Wilayah per Tahun (nominal) */}
      {bantuanSeries.length > 0 && (
        <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/3 px-5 pt-5 pb-2">
          <h3 className="text-base font-semibold text-gray-800 dark:text-white/90 mb-1">
            Bantuan Anak per Wilayah per Tahun (Nominal)
          </h3>
          <div className="overflow-x-auto">
            <ReactApexChart options={bantuanOptions} series={bantuanSeries} type="bar" height={chartHeight} />
          </div>
        </div>
      )}

      {/* Bantuan UMKM per Wilayah per Tahun (nominal) */}
      {umkmBantuanSeries.length > 0 && (
        <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/3 px-5 pt-5 pb-2">
          <h3 className="text-base font-semibold text-gray-800 dark:text-white/90 mb-1">
            Bantuan UMKM per Wilayah per Tahun (Nominal)
          </h3>
          <div className="overflow-x-auto">
            <ReactApexChart options={umkmBantuanOptions} series={umkmBantuanSeries} type="bar" height={chartHeight} />
          </div>
        </div>
      )}
    </div>
  );
}

// ==============================================
// MAIN COMPONENT
// ==============================================
export default function WilayahPage() {
  const [stats, setStats] = useState<RegionStat[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRegionId, setSelectedRegionId] = useState<number | "all">("all");
  const [globalEduData, setGlobalEduData] = useState<Record<string, number>>({});
  const [globalEduLoading, setGlobalEduLoading] = useState(true);
  const [regionEduData, setRegionEduData] = useState<Record<string, number>>({});
  const [regionEduLoading, setRegionEduLoading] = useState(false);

  useEffect(() => {
    getRegionStats()
      .then(setStats)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    fetchWithAuth(`${API_DASHBOARD}/education-levels`)
      .then((res) => res.json())
      .then((json) => setGlobalEduData(json.data ?? {}))
      .catch(console.error)
      .finally(() => setGlobalEduLoading(false));
  }, []);

  useEffect(() => {
    if (selectedRegionId === "all") return;
    const fetchRegionEdu = async () => {
      setRegionEduLoading(true);
      try {
        const res = await fetchWithAuth(`${API_DASHBOARD}/education-levels?regionId=${selectedRegionId}`);
        const json = await res.json();
        setRegionEduData(json.data ?? {});
      } catch (err) {
        console.error(err);
      } finally {
        setRegionEduLoading(false);
      }
    };
    fetchRegionEdu();
  }, [selectedRegionId]);

  if (loading) {
    return (
      <div className="space-y-5">
        {/* Tab buttons skeleton */}
        <div className="flex flex-wrap gap-2">
          {[0, 1, 2, 3].map((i) => (
            <Skeleton.Button key={i} active size="small" shape="round" style={{ width: 90 }} />
          ))}
        </div>

        {/* Stat cards skeleton */}
        <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-3">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/3 p-5 flex items-start gap-4">
              <Skeleton.Avatar active size={48} shape="square" />
              <div className="flex-1">
                <Skeleton active title={{ width: "60%" }} paragraph={{ rows: 1, width: "40%" }} />
              </div>
            </div>
          ))}
        </div>

        {/* Chart skeleton */}
        <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/3 p-5">
          <Skeleton active title={{ width: "35%" }} paragraph={{ rows: 7 }} />
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/3 p-5">
          <Skeleton active title={{ width: "35%" }} paragraph={{ rows: 7 }} />
        </div>
      </div>
    );
  }

  const selectedStat = stats.find((s) => s.regionId === selectedRegionId);

  return (
    <div className="space-y-5">
      {/* Region tabs */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setSelectedRegionId("all")}
          className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
            selectedRegionId === "all"
              ? "bg-blue-600 text-white"
              : "bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
          }`}
        >
          Semua Wilayah
        </button>
        {stats.map((s) => (
          <button
            key={s.regionId}
            onClick={() => setSelectedRegionId(s.regionId)}
            className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
              selectedRegionId === s.regionId
                ? "bg-blue-600 text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
            }`}
          >
            {s.regionName}
          </button>
        ))}
      </div>

      {/* Content */}
      {selectedRegionId === "all" ? (
        <SummaryView stats={stats} globalEduData={globalEduData} globalEduLoading={globalEduLoading} />
      ) : selectedStat ? (
        <RegionDetailCard stat={selectedStat} eduData={regionEduData} eduLoading={regionEduLoading} />
      ) : null}
    </div>
  );
}
