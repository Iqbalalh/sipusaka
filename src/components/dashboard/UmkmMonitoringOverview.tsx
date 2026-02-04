"use client";
import { useEffect, useState } from "react";
import { Spin } from "antd";
import {
  FaStore,
  FaChartLine,
  FaUsers,
  FaIndustry,
} from "react-icons/fa6";
import { API_UMKM_MONITORING } from "@/constants/endpoint";
import { ApiResponseSingle } from "@/types/generic/api-response";
import camelcaseKeys from "camelcase-keys";
import { message } from "antd";
import { fetchWithAuth } from "@/utils/fetch/fetchWithAuth";

interface UmkmMonitoring {
  id: number;
  umkmId: number;
  visitNumber: number;
  monitoringDate: string;
  surveyor: string;
  turnoverBefore?: number | null;
  turnoverAfter?: number | null;
  workersBefore?: number | null;
  workersAfter?: number | null;
  productionBefore?: number | null;
  productionAfter?: number | null;
  customersBefore?: number | null;
  customersAfter?: number | null;
  benefitLevel?: string | null;
  challenges?: string | null;
  developmentNeeds?: string | null;
  umkm?: {
    id: number;
    businessName: string;
    ownerName: string;
    businessType: string | null;
  };
}

interface MonitoringStats {
  count: number;
  totalAmount?: number;
  averageAmount?: number;
  minAmount?: number;
  maxAmount?: number;
}

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

const formatNumber = (num: number) => {
  return new Intl.NumberFormat("id-ID").format(num);
};

export default function UmkmMonitoringOverview() {
  const [messageApi, contextHolder] = message.useMessage();
  const [monitoringData, setMonitoringData] = useState<UmkmMonitoring[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMonitoringData = async () => {
      try {
        setLoading(true);
        const res = await fetchWithAuth(API_UMKM_MONITORING);
        if (!res.ok) throw new Error("Failed to fetch monitoring data");

        const json: ApiResponseSingle<UmkmMonitoring[]> = await res.json();
        const monitoring = camelcaseKeys(json.data, { deep: true }) as UmkmMonitoring[];
        setMonitoringData(monitoring);
      } catch (error) {
        console.error("Error fetching monitoring data:", error);
        messageApi.error({
          content: "Gagal mengambil data monitoring UMKM.",
          key: "monitoring",
          duration: 2,
        });
      } finally {
        setLoading(false);
      }
    };
    fetchMonitoringData();
  }, [messageApi]);

  // Calculate statistics
  const stats: MonitoringStats = {
    count: monitoringData.length,
    totalAmount: monitoringData.reduce((sum, m) => sum + (m.turnoverAfter || 0), 0),
    averageAmount: monitoringData.length > 0 
      ? monitoringData.reduce((sum, m) => sum + (m.turnoverAfter || 0), 0) / monitoringData.length 
      : 0,
    minAmount: Math.min(...monitoringData.map(m => m.turnoverAfter || 0).filter(v => v > 0)),
    maxAmount: Math.max(...monitoringData.map(m => m.turnoverAfter || 0)),
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {contextHolder}

      {/* Section Title */}
      <div className="relative">
        <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-600 rounded-full"></div>
        <div className="pl-4">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            Overview Monitoring Umkm
          </h2>
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            Overview monitoring Umkm keseluruhan
          </p>
        </div>
      </div>

      {/* Main Metrics Cards */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {/* Total Monitoring */}
        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm hover:shadow-md transition-shadow dark:border-gray-800 dark:bg-white/3">
          <div className="flex items-center justify-center w-14 h-14 bg-linear-to-br from-purple-500 to-purple-600 rounded-xl shadow-lg shadow-purple-500/30">
            <FaStore className="text-white text-2xl" />
          </div>
          <div className="mt-5">
            <h3 className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Total Monitoring
            </h3>
            <p className="mt-2 text-2xl font-semibold text-gray-900 dark:text-white">
              {stats.count}
            </p>
          </div>
        </div>

        {/* Total Turnover */}
        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm hover:shadow-md transition-shadow dark:border-gray-800 dark:bg-white/3">
          <div className="flex items-center justify-center w-14 h-14 bg-linear-to-br from-emerald-500 to-emerald-600 rounded-xl shadow-lg shadow-emerald-500/30">
            <FaChartLine className="text-white text-2xl" />
          </div>
          <div className="mt-5">
            <h3 className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Total Omset
            </h3>
            <p className="mt-2 text-2xl font-semibold text-gray-900 dark:text-white">
              {formatCurrency(stats.totalAmount || 0)}
            </p>
          </div>
        </div>

        {/* Average Turnover */}
        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm hover:shadow-md transition-shadow dark:border-gray-800 dark:bg-white/3">
          <div className="flex items-center justify-center w-14 h-14 bg-linear-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg shadow-blue-500/30">
            <FaIndustry className="text-white text-2xl" />
          </div>
          <div className="mt-5">
            <h3 className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Rata-rata Omset
            </h3>
            <p className="mt-2 text-2xl font-semibold text-gray-900 dark:text-white">
              {formatCurrency(stats.averageAmount || 0)}
            </p>
          </div>
        </div>

        {/* Total Workers */}
        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm hover:shadow-md transition-shadow dark:border-gray-800 dark:bg-white/3">
          <div className="flex items-center justify-center w-14 h-14 bg-linear-to-br from-amber-500 to-amber-600 rounded-xl shadow-lg shadow-amber-500/30">
            <FaUsers className="text-white text-2xl" />
          </div>
          <div className="mt-5">
            <h3 className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Rata-rata Tenaga Kerja
            </h3>
            <p className="mt-2 text-2xl font-semibold text-gray-900 dark:text-white">
              {formatNumber(
                monitoringData.length > 0
                  ? monitoringData.reduce((sum, m) => sum + (m.workersAfter || 0), 0) / monitoringData.length
                  : 0
              )}{" "}
              orang
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}