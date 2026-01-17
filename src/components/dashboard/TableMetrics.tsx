"use client";
import { useEffect, useState } from "react";
import Badge from "../ui/badge/Badge";
import {
  GroupIcon,
  UserIcon,
  DollarLineIcon,
  DocsIcon,
  PieChartIcon,
  TimeIcon,
} from "@/icons";
import { API_DASHBOARD } from "@/constants/endpoint";
import { ApiResponseSingle } from "@/types/generic/api-response";
import camelcaseKeys from "camelcase-keys";
import { message } from "antd";
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
  childAssistance?: { count: number };
  umkmMonitoring?: { count: number };
  umkmVisit?: { count: number };
}

const getCount = (value?: { count: number }) => value?.count ?? 0;

export const TableMetrics = () => {
  const [messageApi, contextHolder] = message.useMessage();
  const [dashboardData, setDashboardData] = useState<Dashboard | null>(null);

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

  return (
    <div className="space-y-8">
      {contextHolder}
      
      {/* Section Title */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
          Ringkasan Statistik
        </h2>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Overview data keluarga, anak, UMKM, dan aktivitas
        </p>
      </div>

      {/* Main Metrics Cards */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {/* Family Card */}
        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm hover:shadow-md transition-shadow dark:border-gray-800 dark:bg-white/[0.03]">
          <div className="flex items-start justify-between">
            <div className="flex items-center justify-center w-14 h-14 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg shadow-blue-500/30">
              <GroupIcon className="text-white size-7" />
            </div>
            <Badge color="success" size="sm">
              {getCount(dashboardData?.family?.active)} Aktif
            </Badge>
          </div>

          <div className="mt-5">
            <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Keluarga
            </h3>
            <p className="mt-2 text-3xl font-bold text-gray-900 dark:text-white">
              {getCount(dashboardData?.family?.total)}
            </p>
            <div className="mt-4 grid grid-cols-2 gap-3">
              <div className="rounded-lg bg-gray-50 p-3 dark:bg-gray-800/50">
                <p className="text-xs text-gray-500 dark:text-gray-400">Non-Aktif</p>
                <p className="mt-1 text-lg font-semibold text-gray-900 dark:text-white">
                  {getCount(dashboardData?.family?.inactive)}
                </p>
              </div>
              <div className="rounded-lg bg-gray-50 p-3 dark:bg-gray-800/50">
                <p className="text-xs text-gray-500 dark:text-gray-400">Di Peta</p>
                <p className="mt-1 text-lg font-semibold text-gray-900 dark:text-white">
                  {getCount(dashboardData?.family?.onMap)}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Children Card */}
        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm hover:shadow-md transition-shadow dark:border-gray-800 dark:bg-white/[0.03]">
          <div className="flex items-start justify-between">
            <div className="flex items-center justify-center w-14 h-14 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl shadow-lg shadow-emerald-500/30">
              <UserIcon className="text-white size-7" />
            </div>
            <Badge color="success" size="sm">
              {getCount(dashboardData?.children?.active)} Aktif
            </Badge>
          </div>

          <div className="mt-5">
            <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Anak
            </h3>
            <p className="mt-2 text-3xl font-bold text-gray-900 dark:text-white">
              {getCount(dashboardData?.children?.total)}
            </p>
            <div className="mt-4 space-y-2">
              <div className="flex items-center justify-between rounded-lg bg-gray-50 px-3 py-2 dark:bg-gray-800/50">
                <span className="text-xs text-gray-500 dark:text-gray-400">Non-Aktif</span>
                <span className="text-sm font-semibold text-gray-900 dark:text-white">
                  {getCount(dashboardData?.children?.inactive)}
                </span>
              </div>
              <div className="flex items-center justify-between rounded-lg bg-gray-50 px-3 py-2 dark:bg-gray-800/50">
                <span className="text-xs text-gray-500 dark:text-gray-400">ABK</span>
                <span className="text-sm font-semibold text-gray-900 dark:text-white">
                  {getCount(dashboardData?.children?.abk)}
                </span>
              </div>
              <div className="flex items-center justify-between rounded-lg bg-gray-50 px-3 py-2 dark:bg-gray-800/50">
                <span className="text-xs text-gray-500 dark:text-gray-400">Yatim</span>
                <span className="text-sm font-semibold text-gray-900 dark:text-white">
                  {getCount(dashboardData?.children?.yatim)}
                </span>
              </div>
              <div className="flex items-center justify-between rounded-lg bg-gray-50 px-3 py-2 dark:bg-gray-800/50">
                <span className="text-xs text-gray-500 dark:text-gray-400">Piatu</span>
                <span className="text-sm font-semibold text-gray-900 dark:text-white">
                  {getCount(dashboardData?.children?.piatu)}
                </span>
              </div>
              <div className="flex items-center justify-between rounded-lg bg-gray-50 px-3 py-2 dark:bg-gray-800/50">
                <span className="text-xs text-gray-500 dark:text-gray-400">Yatim Piatu</span>
                <span className="text-sm font-semibold text-gray-900 dark:text-white">
                  {getCount(dashboardData?.children?.yatimPiatu)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* UMKM Card */}
        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm hover:shadow-md transition-shadow dark:border-gray-800 dark:bg-white/[0.03]">
          <div className="flex items-start justify-between">
            <div className="flex items-center justify-center w-14 h-14 bg-gradient-to-br from-amber-500 to-amber-600 rounded-xl shadow-lg shadow-amber-500/30">
              <DollarLineIcon className="text-white size-7" />
            </div>
            <Badge color="success" size="sm">
              {getCount(dashboardData?.umkm?.active)} Aktif
            </Badge>
          </div>

          <div className="mt-5">
            <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              UMKM
            </h3>
            <p className="mt-2 text-3xl font-bold text-gray-900 dark:text-white">
              {getCount(dashboardData?.umkm?.total)}
            </p>
            <div className="mt-4 rounded-lg bg-gray-50 p-3 dark:bg-gray-800/50">
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-500 dark:text-gray-400">Non-Aktif</span>
                <span className="text-lg font-semibold text-gray-900 dark:text-white">
                  {getCount(dashboardData?.umkm?.inactive)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Activity Summary Section */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Aktivitas & Monitoring
        </h3>
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
          {/* Child Assistance Card */}
          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm hover:shadow-md transition-shadow dark:border-gray-800 dark:bg-white/[0.03]">
            <div className="flex items-center justify-center w-14 h-14 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-xl shadow-lg shadow-indigo-500/30">
              <DocsIcon className="text-white size-7" />
            </div>

            <div className="mt-5">
              <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Bantuan Anak
              </h3>
              <p className="mt-2 text-3xl font-bold text-gray-900 dark:text-white">
                {getCount(dashboardData?.childAssistance)}
              </p>
              <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                Total bantuan yang diberikan
              </p>
            </div>
          </div>

          {/* UMKM Monitoring Card */}
          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm hover:shadow-md transition-shadow dark:border-gray-800 dark:bg-white/[0.03]">
            <div className="flex items-center justify-center w-14 h-14 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl shadow-lg shadow-purple-500/30">
              <PieChartIcon className="text-white size-7" />
            </div>

            <div className="mt-5">
              <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Monitoring UMKM
              </h3>
              <p className="mt-2 text-3xl font-bold text-gray-900 dark:text-white">
                {getCount(dashboardData?.umkmMonitoring)}
              </p>
              <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                Total monitoring yang dilakukan
              </p>
            </div>
          </div>

          {/* UMKM Visit Card */}
          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm hover:shadow-md transition-shadow dark:border-gray-800 dark:bg-white/[0.03]">
            <div className="flex items-center justify-center w-14 h-14 bg-gradient-to-br from-rose-500 to-rose-600 rounded-xl shadow-lg shadow-rose-500/30">
              <TimeIcon className="text-white size-7" />
            </div>

            <div className="mt-5">
              <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Kunjungan UMKM
              </h3>
              <p className="mt-2 text-3xl font-bold text-gray-900 dark:text-white">
                {getCount(dashboardData?.umkmVisit)}
              </p>
              <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                Total kunjungan yang dilakukan
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
