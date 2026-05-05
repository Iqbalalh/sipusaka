"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { ApexOptions } from "apexcharts";
import { Spin, Flex } from "antd";
import { LoadingOutlined } from "@ant-design/icons";
import { getRegionStats, RegionStat } from "@/utils/services/region.service";
import { API_DASHBOARD } from "@/constants/endpoint";
import { fetchWithAuth } from "@/utils/fetch/fetchWithAuth";
import {
  FaHouseChimney,
  FaChildReaching,
  FaShop,
  FaHandHoldingHeart,
  FaUsers,
  FaGraduationCap,
} from "react-icons/fa6";

const ReactApexChart = dynamic(() => import("react-apexcharts"), { ssr: false });

const formatRupiah = (n: number) =>
  new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(n);

const EDU_LEVELS = ["TK", "SD", "SMP", "SMA", "Diploma", "Sarjana", "Magister", "Doktor"] as const;
type EduKey = typeof EDU_LEVELS[number];

const EDU_BADGE_COLORS: Record<EduKey, string> = {
  TK: "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400",
  SD: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  SMP: "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400",
  SMA: "bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400",
  Diploma: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  Sarjana: "bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-400",
  Magister: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
  Doktor: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
};

const EDU_DYNAMIC_COLORS = [
  "#f43f5e", "#3b82f6", "#6366f1", "#8b5cf6",
  "#22c55e", "#0ea5e9", "#f97316", "#ef4444",
  "#ec4899", "#14b8a6",
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
// BADGE ROW
// ==============================================
function BadgeRow({ items }: { items: { label: string; value: number; color: string }[] }) {
  return (
    <div className="flex flex-wrap gap-2 mt-3">
      {items.map((item) => (
        <span
          key={item.label}
          className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium ${item.color}`}
        >
          {item.label}: <span className="font-bold">{item.value}</span>
        </span>
      ))}
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
      labels: { style: { fontSize: "11px" }, rotate: -30 },
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
// REGION DETAIL CARD
// ==============================================
function RegionDetailCard({ stat }: { stat: RegionStat }) {
  const edu = stat.educationLevels ?? {};
  return (
    <div className="space-y-4">
      {/* Overview row */}
      <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-3">
        <StatCard icon={<FaHouseChimney />} label="Keluarga" value={stat.families} color="bg-blue-500" />
        <StatCard icon={<FaChildReaching />} label="Anak Asuh" value={stat.children.total} sub={`Aktif: ${stat.children.active}`} color="bg-indigo-500" />
        <StatCard icon={<FaShop />} label="UMKM" value={stat.umkm.total} sub={`Aktif: ${stat.umkm.active}`} color="bg-orange-500" />
        <StatCard icon={<FaHandHoldingHeart />} label="Bantuan Anak" value={stat.childAssistance.total} sub={formatRupiah(stat.childAssistance.totalAmount)} color="bg-green-500" />
        <StatCard icon={<FaHandHoldingHeart />} label="Bantuan UMKM" value={stat.umkmVisits.total} sub={formatRupiah(stat.umkmVisits.totalAmount)} color="bg-purple-500" />
        <StatCard icon={<FaUsers />} label="Bantuan Sosial" value={stat.socialAssistance.total} sub={formatRupiah(stat.socialAssistance.totalAmount)} color="bg-rose-500" />
      </div>

      {/* Children breakdown */}
      <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/3 p-5">
        <p className="text-sm font-semibold text-gray-700 dark:text-white/80 mb-1">Rincian Anak Asuh</p>
        <BadgeRow items={[
          { label: "Aktif", value: stat.children.active, color: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" },
          { label: "Tidak Aktif", value: stat.children.inactive, color: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400" },
          { label: "Yatim", value: stat.children.yatim, color: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400" },
          { label: "Piatu", value: stat.children.piatu, color: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400" },
          { label: "Yatim Piatu", value: stat.children.yatimPiatu, color: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400" },
          { label: "ABK", value: stat.children.abk, color: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400" },
        ]} />
      </div>

      {/* Education level breakdown */}
      <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/3 p-5">
        <p className="text-sm font-semibold text-gray-700 dark:text-white/80 mb-1">Tingkat Pendidikan</p>
        <BadgeRow items={EDU_LEVELS.map((k) => ({
          label: k,
          value: (edu as any)[k] ?? 0,
          color: EDU_BADGE_COLORS[k],
        }))} />
      </div>

      {/* UMKM breakdown */}
      <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/3 p-5">
        <p className="text-sm font-semibold text-gray-700 dark:text-white/80 mb-1">Rincian UMKM</p>
        <BadgeRow items={[
          { label: "Aktif", value: stat.umkm.active, color: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" },
          { label: "Tidak Aktif", value: stat.umkm.inactive, color: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400" },
        ]} />
      </div>
    </div>
  );
}

// ==============================================
// SUMMARY TAB (ALL REGIONS)
// ==============================================
interface SummaryViewProps {
  stats: RegionStat[];
  eduData: Record<string, number> | null;
  eduLoading: boolean;
}

function SummaryView({ stats, eduData, eduLoading }: SummaryViewProps) {
  const names = stats.map((s) => s.regionName);
  const chartHeight = Math.max(300, stats.length * 120);

  const eduEntries = eduData ? Object.entries(eduData) : [];
  const eduGrandTotal = eduEntries.reduce((s, [, v]) => s + v, 0);
  const eduMaxCount = Math.max(...eduEntries.map(([, v]) => v), 1);

  return (
    <div className="space-y-5">
      {/* Dynamic education level section */}
      <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/3 p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-1 h-5 bg-blue-600 rounded-full" />
            <FaGraduationCap className="text-blue-600 text-lg" />
            <h3 className="text-base font-semibold text-gray-800 dark:text-white/90">
              Jenjang Pendidikan Anak
            </h3>
          </div>
          {!eduLoading && eduData && (
            <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
              Total:{" "}
              <span className="text-gray-800 dark:text-white font-bold">{eduGrandTotal}</span> anak
            </span>
          )}
        </div>

        {eduLoading ? (
          <div className="flex justify-center py-8">
            <Spin indicator={<LoadingOutlined spin />} />
          </div>
        ) : eduEntries.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-4 xl:grid-cols-8 gap-3">
            {eduEntries.map(([level, count], idx) => (
              <div
                key={level}
                className="flex flex-col gap-2 p-3 rounded-xl bg-gray-50 dark:bg-gray-800/50"
              >
                <span className="self-start rounded-full px-2 py-0.5 text-xs font-semibold bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
                  {level}
                </span>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{count}</p>
                <p className="text-xs text-gray-400 dark:text-gray-500">
                  {eduGrandTotal > 0 ? ((count / eduGrandTotal) * 100).toFixed(1) : "0"}%
                </p>
                <div className="h-1.5 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{
                      width: `${(count / eduMaxCount) * 100}%`,
                      backgroundColor: EDU_DYNAMIC_COLORS[idx % EDU_DYNAMIC_COLORS.length],
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-center text-sm text-gray-400 dark:text-gray-500 py-4">
            Data tidak tersedia
          </p>
        )}
      </div>

      {/* Charts — one per row, vertical bars */}
      <ChartCard
        title="Keluarga & Anak per Wilayah"
        categories={names}
        height={chartHeight}
        series={[
          { name: "Keluarga", data: stats.map((s) => s.families) },
          { name: "Anak Asuh", data: stats.map((s) => s.children.total) },
        ]}
        colors={["#465fff", "#22c55e"]}
      />

      <ChartCard
        title="Kategori Anak per Wilayah"
        categories={names}
        height={chartHeight}
        series={[
          { name: "Yatim", data: stats.map((s) => s.children.yatim) },
          { name: "Piatu", data: stats.map((s) => s.children.piatu) },
          { name: "Yatim Piatu", data: stats.map((s) => s.children.yatimPiatu) },
          { name: "ABK", data: stats.map((s) => s.children.abk) },
        ]}
        colors={["#f59e0b", "#f97316", "#ef4444", "#a855f7"]}
      />

      <ChartCard
        title="UMKM per Wilayah"
        categories={names}
        height={chartHeight}
        series={[
          { name: "UMKM Aktif", data: stats.map((s) => s.umkm.active) },
          { name: "UMKM Tidak Aktif", data: stats.map((s) => s.umkm.inactive) },
        ]}
        colors={["#22c55e", "#d1d5db"]}
      />

      <ChartCard
        title="Bantuan per Wilayah"
        categories={names}
        height={chartHeight}
        series={[
          { name: "Bantuan Anak", data: stats.map((s) => s.childAssistance.total) },
          { name: "Bantuan UMKM", data: stats.map((s) => s.umkmVisits.total) },
          { name: "Bantuan Sosial", data: stats.map((s) => s.socialAssistance.total) },
        ]}
        colors={["#22c55e", "#f97316", "#ec4899"]}
      />
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
  const [eduData, setEduData] = useState<Record<string, number> | null>(null);
  const [eduLoading, setEduLoading] = useState(true);

  useEffect(() => {
    getRegionStats()
      .then(setStats)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    fetchWithAuth(`${API_DASHBOARD}/education-levels`)
      .then((res) => res.json())
      .then((json) => setEduData(json.data ?? null))
      .catch(console.error)
      .finally(() => setEduLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64 text-gray-500 gap-4">
        <Flex align="center" gap="middle">
          <Spin indicator={<LoadingOutlined spin />} size="large" />
        </Flex>
        Memuat data wilayah...
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
        <SummaryView stats={stats} eduData={eduData} eduLoading={eduLoading} />
      ) : selectedStat ? (
        <RegionDetailCard stat={selectedStat} />
      ) : null}
    </div>
  );
}
