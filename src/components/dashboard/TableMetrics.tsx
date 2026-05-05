"use client";
import { useEffect, useState } from "react";
import Badge from "../ui/badge/Badge";
import {
  FaUsers,
  FaChild,
  FaDollarSign,
  FaStore,
  FaGraduationCap,
} from "react-icons/fa6";
import { API_DASHBOARD } from "@/constants/endpoint";
import { ApiResponseSingle } from "@/types/generic/api-response";
import camelcaseKeys from "camelcase-keys";
import { message, Spin } from "antd";
import { LoadingOutlined } from "@ant-design/icons";
import { fetchWithAuth } from "@/utils/fetch/fetchWithAuth";

interface Dashboard {
  family: {
    total?: { count: number };
    active?: { count: number };
    inactive?: { count: number };
    onMap?: { count: number };
  };
  children: {
    total?: { count: number };
    active?: { count: number };
    inactive?: { count: number };
    abk?: { count: number };
    yatim?: { count: number };
    piatu?: { count: number };
    yatimPiatu?: { count: number };
  };
  umkm: {
    total?: { count: number };
    active?: { count: number };
    inactive?: { count: number };
  };
  childAssistance?: {
    count: number;
    totalAmount?: number;
    averageAmount?: number;
    minAmount?: number;
    maxAmount?: number;
  };
  childAssistanceYearlyBreakdown?: Array<{
    year: number;
    count: number;
    totalAmount: number;
    averageAmount: number;
    minAmount: number;
    maxAmount: number;
  }>;
  umkmMonitoring?: {
    count: number;
    totalAmount?: number;
    averageAmount?: number;
    minAmount?: number;
    maxAmount?: number;
  };
  umkmVisit?: {
    count: number;
    totalAmount?: number;
    averageAmount?: number;
    minAmount?: number;
    maxAmount?: number;
  };
}

const getCount = (value?: { count: number }) => value?.count ?? 0;
const getAmount = (value?: { totalAmount?: number }) => value?.totalAmount ?? 0;
const getAverage = (value?: { averageAmount?: number }) => value?.averageAmount ?? 0;
const getMin = (value?: { minAmount?: number }) => value?.minAmount ?? 0;
const getMax = (value?: { maxAmount?: number }) => value?.maxAmount ?? 0;

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

// Color palette for dynamic education levels
const EDU_COLORS = [
  "bg-blue-100 text-blue-700 border-blue-200",
  "bg-emerald-100 text-emerald-700 border-emerald-200",
  "bg-amber-100 text-amber-700 border-amber-200",
  "bg-purple-100 text-purple-700 border-purple-200",
  "bg-rose-100 text-rose-700 border-rose-200",
  "bg-cyan-100 text-cyan-700 border-cyan-200",
  "bg-orange-100 text-orange-700 border-orange-200",
  "bg-teal-100 text-teal-700 border-teal-200",
];

export const TableMetrics = () => {
  const [messageApi, contextHolder] = message.useMessage();
  const [dashboardData, setDashboardData] = useState<Dashboard | null>(null);

  // Education level: separate state + loading
  const [eduData, setEduData] = useState<Record<string, number> | null>(null);
  const [eduLoading, setEduLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const res = await fetchWithAuth(API_DASHBOARD);
        if (!res.ok) throw new Error("Failed to fetch dashboard");

        const json: ApiResponseSingle<Dashboard> = await res.json();
        const dashboard = camelcaseKeys(json.data, { deep: true }) as Dashboard;
        setDashboardData(dashboard);
      } catch (error) {
        console.error("Error fetching dashboard:", error);
        messageApi.error({
          content: "Gagal mengambil data.",
          key: "save",
          duration: 2,
        });
      }
    };
    fetchDashboardData();
  }, [messageApi]);

  // Separate fetch for education level stats
  useEffect(() => {
    const fetchEduStats = async () => {
      setEduLoading(true);
      try {
        const res = await fetchWithAuth(`${API_DASHBOARD}/education-levels`);
        if (!res.ok) throw new Error("Failed to fetch education levels");
        const json = await res.json();
        setEduData(json.data ?? {});
      } catch (error) {
        console.error("Error fetching education levels:", error);
      } finally {
        setEduLoading(false);
      }
    };
    fetchEduStats();
  }, []);

  return (
    <div className="space-y-8">
      {contextHolder}

      {/* Section Title */}
      <div className="relative">
        <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-600 rounded-full"></div>
        <div className="pl-4">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Ringkasan Statistik
          </h2>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Overview data keseluruhan
          </p>
        </div>
      </div>

      {/* Main Metrics Cards */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {/* Family Card */}
        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm hover:shadow-md transition-shadow dark:border-gray-800 dark:bg-white/3">
          <div className="flex items-center justify-between">
            <div className="flex items-center justify-center w-14 h-14 bg-linear-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg shadow-blue-500/30">
              <FaUsers className="text-white text-2xl" />
            </div>
            <div className="flex flex-col gap-2">
              <Badge color="success" size="md">
                {getCount(dashboardData?.family?.active)} Aktif
              </Badge>
              <Badge color="error" size="md">
                {getCount(dashboardData?.family?.inactive)} Non-aktif
              </Badge>
            </div>
          </div>

          <div className="mt-5">
            <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Keluarga
            </h3>
            <p className="mt-2 text-3xl font-bold text-gray-900 dark:text-white">
              {getCount(dashboardData?.family?.total)}
            </p>
            <div className="mt-4">
              <div className="rounded-lg bg-gray-50 p-3 dark:bg-gray-800/50">
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  GEOPUSAKA
                </p>
                <p className="mt-1 text-lg font-semibold text-gray-900 dark:text-white">
                  {getCount(dashboardData?.family?.onMap)}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Children Card */}
        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm hover:shadow-md transition-shadow dark:border-gray-800 dark:bg-white/3">
          <div className="flex items-center justify-between">
            <div className="flex items-center justify-center w-14 h-14 bg-linear-to-br from-emerald-500 to-emerald-600 rounded-xl shadow-lg shadow-emerald-500/30">
              <FaChild className="text-white text-2xl" />
            </div>
            <div className="flex flex-col gap-2">
              <div className="flex">
                <Badge color="success" size="md">
                  {getCount(dashboardData?.children?.active)} Aktif
                </Badge>
                <Badge color="error" size="md">
                  {getCount(dashboardData?.children?.inactive)} Non-Aktif
                </Badge>
              </div>

              <Badge color="warning" size="md">
                {getCount(dashboardData?.children?.abk)} ABK
              </Badge>
            </div>
          </div>

          <div className="mt-5">
            <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Anak
            </h3>
            <p className="mt-2 text-3xl font-bold text-gray-900 dark:text-white">
              {getCount(dashboardData?.children?.total)}
            </p>
            <div className="mt-4 grid grid-cols-1 lg:grid-cols-3 gap-2">
              <div className="rounded-lg bg-gray-50 p-3 dark:bg-gray-800/50">
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Yatim
                </p>
                <p className="mt-1 text-lg font-semibold text-gray-900 dark:text-white">
                  {getCount(dashboardData?.children?.yatim)}
                </p>
              </div>
              <div className="rounded-lg bg-gray-50 p-3 dark:bg-gray-800/50">
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Piatu
                </p>
                <p className="mt-1 text-lg font-semibold text-gray-900 dark:text-white">
                  {getCount(dashboardData?.children?.piatu)}
                </p>
              </div>
              <div className="rounded-lg bg-gray-50 p-3 dark:bg-gray-800/50">
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Yatim Piatu
                </p>
                <p className="mt-1 text-lg font-semibold text-gray-900 dark:text-white">
                  {getCount(dashboardData?.children?.yatimPiatu)}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* UMKM Card */}
        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm hover:shadow-md transition-shadow dark:border-gray-800 dark:bg-white/3">
          <div className="flex items-center justify-between">
            <div className="flex items-center justify-center w-14 h-14 bg-linear-to-br from-amber-500 to-amber-600 rounded-xl shadow-lg shadow-amber-500/30">
              <FaStore className="text-white text-2xl" />
            </div>
            <div className="flex flex-col gap-2">
              <Badge color="success" size="md">
                {getCount(dashboardData?.umkm?.active)} Aktif
              </Badge>
              <Badge color="error" size="md">
                {getCount(dashboardData?.umkm?.inactive)} Non-aktif
              </Badge>
            </div>
          </div>

          <div className="mt-5">
            <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              UMKM
            </h3>
            <p className="mt-2 text-3xl font-bold text-gray-900 dark:text-white">
              {getCount(dashboardData?.umkm?.total)}
            </p>
          </div>
        </div>
      </div>

      {/* Activity Summary Section */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <div className="w-1 h-6 bg-blue-600 rounded-full"></div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Aktivitas & Monitoring
          </h3>
        </div>
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          {/* Child Assistance Card */}
          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm hover:shadow-md transition-shadow dark:border-gray-800 dark:bg-white/3">
            <div className="flex items-center justify-between">
              <div className="flex items-center justify-center w-14 h-14 bg-linear-to-br from-indigo-500 to-indigo-600 rounded-xl shadow-lg shadow-indigo-500/30">
                <FaDollarSign className="text-white text-2xl" />
              </div>
              <p className="text-3xl font-bold text-gray-900 dark:text-white">
                {getCount(dashboardData?.childAssistance)}
              </p>
            </div>

            <div className="mt-5">
              <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Bantuan Anak
              </h3>
              {/* <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                Total bantuan yang diberikan
              </p> */}
              <div className="mt-4">
                <div className="rounded-lg bg-gray-50 p-3 dark:bg-gray-800/50">
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Total Dana
                  </p>
                  <p className="mt-1 text-2xl font-bold text-gray-900 dark:text-white">
                    {formatCurrency(getAmount(dashboardData?.childAssistance))}
                  </p>
                </div>
                <div className="mt-2 grid grid-cols-3 gap-2">
                  <div className="rounded-lg bg-blue-50 p-3 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800/30">
                    <p className="text-xs text-blue-600 dark:text-blue-400 font-medium">
                      Rata-rata
                    </p>
                    <p className="mt-1 text-sm font-semibold text-blue-700 dark:text-blue-300">
                      {formatCurrency(getAverage(dashboardData?.childAssistance))}
                    </p>
                  </div>
                  <div className="rounded-lg bg-orange-50 p-3 dark:bg-orange-900/20 border border-orange-100 dark:border-orange-800/30">
                    <p className="text-xs text-orange-600 dark:text-orange-400 font-medium">
                      Terendah
                    </p>
                    <p className="mt-1 text-sm font-semibold text-orange-700 dark:text-orange-300">
                      {formatCurrency(getMin(dashboardData?.childAssistance))}
                    </p>
                  </div>
                  <div className="rounded-lg bg-green-50 p-3 dark:bg-green-900/20 border border-green-100 dark:border-green-800/30">
                    <p className="text-xs text-green-600 dark:text-green-400 font-medium">
                      Tertinggi
                    </p>
                    <p className="mt-1 text-sm font-semibold text-green-700 dark:text-green-300">
                      {formatCurrency(getMax(dashboardData?.childAssistance))}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* UMKM Visit Card */}
          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm hover:shadow-md transition-shadow dark:border-gray-800 dark:bg-white/3">
            <div className="flex items-center justify-between">
              <div className="flex items-center justify-center w-14 h-14 bg-linear-to-br from-rose-500 to-rose-600 rounded-xl shadow-lg shadow-rose-500/30">
                <FaDollarSign className="text-white text-2xl" />
              </div>
              <p className="text-3xl font-bold text-gray-900 dark:text-white">
                {getCount(dashboardData?.umkmVisit)}
              </p>
            </div>

            <div className="mt-5">
              <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Kunjungan UMKM
              </h3>
              {/* <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                Total kunjungan yang dilakukan
              </p> */}
              <div className="mt-4">
                <div className="rounded-lg bg-gray-50 p-3 dark:bg-gray-800/50">
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Total Dana
                  </p>
                  <p className="mt-1 text-2xl font-bold text-gray-900 dark:text-white">
                    {formatCurrency(getAmount(dashboardData?.umkmVisit))}
                  </p>
                </div>
                <div className="mt-2 grid grid-cols-3 gap-2">
                  <div className="rounded-lg bg-blue-50 p-3 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800/30">
                    <p className="text-xs text-blue-600 dark:text-blue-400 font-medium">
                      Rata-rata
                    </p>
                    <p className="mt-1 text-sm font-semibold text-blue-700 dark:text-blue-300">
                      {formatCurrency(getAverage(dashboardData?.umkmVisit))}
                    </p>
                  </div>
                  <div className="rounded-lg bg-orange-50 p-3 dark:bg-orange-900/20 border border-orange-100 dark:border-orange-800/30">
                    <p className="text-xs text-orange-600 dark:text-orange-400 font-medium">
                      Terendah
                    </p>
                    <p className="mt-1 text-sm font-semibold text-orange-700 dark:text-orange-300">
                      {formatCurrency(getMin(dashboardData?.umkmVisit))}
                    </p>
                  </div>
                  <div className="rounded-lg bg-green-50 p-3 dark:bg-green-900/20 border border-green-100 dark:border-green-800/30">
                    <p className="text-xs text-green-600 dark:text-green-400 font-medium">
                      Tertinggi
                    </p>
                    <p className="mt-1 text-sm font-semibold text-green-700 dark:text-green-300">
                      {formatCurrency(getMax(dashboardData?.umkmVisit))}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Education Level Stats Section */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <div className="w-1 h-6 bg-indigo-600 rounded-full"></div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <FaGraduationCap className="text-indigo-500" />
            Jenjang Pendidikan Anak
          </h3>
          <span className="text-xs text-gray-400 font-normal">(data bantuan terakhir per anak)</span>
        </div>

        {eduLoading ? (
          <div className="flex justify-center py-8">
            <Spin indicator={<LoadingOutlined spin />} />
          </div>
        ) : eduData && Object.keys(eduData).length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {Object.entries(eduData)
              .sort(([, a], [, b]) => b - a)
              .map(([level, count], idx) => (
                <div
                  key={level}
                  className={`rounded-xl border p-4 flex flex-col gap-1 ${EDU_COLORS[idx % EDU_COLORS.length]}`}
                >
                  <p className="text-xs font-semibold uppercase tracking-wide truncate">{level}</p>
                  <p className="text-2xl font-bold">{count}</p>
                  <p className="text-xs opacity-70">anak</p>
                </div>
              ))}
          </div>
        ) : (
          <p className="text-sm text-gray-400">Belum ada data jenjang pendidikan.</p>
        )}
      </div>

      {/* Yearly Breakdown Section */}
      {dashboardData?.childAssistanceYearlyBreakdown && dashboardData.childAssistanceYearlyBreakdown.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-4">
            <div className="w-1 h-6 bg-blue-600 rounded-full"></div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Rincian Bantuan Anak
            </h3>
          </div>
          <div className="rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-white/3 overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-100 dark:bg-gray-700">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-200 uppercase tracking-wider">
                    Tahun
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-200 uppercase tracking-wider">
                    Jumlah Bantuan
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-200 uppercase tracking-wider">
                    Total Dana
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-200 uppercase tracking-wider">
                    Rata-rata
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-200 uppercase tracking-wider">
                    Terendah
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-200 uppercase tracking-wider">
                    Tertinggi
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                {dashboardData.childAssistanceYearlyBreakdown.map((yearData, index) => (
                  <tr
                    key={yearData.year}
                    className={`transition-colors duration-200 ${
                      index % 2 === 0
                        ? 'bg-white dark:bg-white/3 hover:bg-blue-50/50 dark:hover:bg-blue-950/30'
                        : 'bg-gray-50 dark:bg-gray-800/30 hover:bg-blue-100/50 dark:hover:bg-blue-900/30'
                    }`}
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-bold bg-blue-600 text-white shadow-md">
                        {yearData.year}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm font-semibold text-gray-900 dark:text-white">
                        {yearData.count}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm font-bold text-gray-900 dark:text-white">
                        {formatCurrency(yearData.totalAmount)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm font-medium text-blue-600 dark:text-blue-400">
                        {formatCurrency(yearData.averageAmount)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm font-medium text-orange-600 dark:text-orange-400">
                        {formatCurrency(yearData.minAmount)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm font-medium text-green-600 dark:text-green-400">
                        {formatCurrency(yearData.maxAmount)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
