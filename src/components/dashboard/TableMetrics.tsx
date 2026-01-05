"use client";
import { useEffect, useState } from "react";
import Badge from "../ui/badge/Badge";
import { BoxIconLine, GroupIcon } from "@/icons";
import { API_DASHBOARD } from "@/constants/endpoint";
import { ApiResponseSingle } from "@/types/generic/api-response";
import camelcaseKeys from "camelcase-keys";
import { message } from "antd";
import { fetchWithAuth } from "@/utils/fetch/fetchWithAuth";

interface Dashboard {
  children: {
    count: number;
  };
  childrenAbk: {
    count: number;
  };
  family: {
    count: number;
  };
  umkm: {
    count: number;
  };
}

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
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 md:gap-6">
      {/* <!-- Metric Item Start --> */}
      {contextHolder}
      <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6">
        <div className="flex items-center justify-center w-12 h-12 bg-gray-100 rounded-xl dark:bg-gray-800">
          <GroupIcon className="text-gray-800 size-6 dark:text-white/90" />
        </div>

        <div className="flex items-end justify-between mt-5">
          <div>
            <span className="text-sm text-gray-500 dark:text-gray-400">
              Keluarga
            </span>
            <h4 className="mt-2 font-bold text-gray-800 text-title-sm dark:text-white/90">
              {dashboardData?.family.count}
            </h4>
          </div>
        </div>
      </div>
      {/* <!-- Metric Item End --> */}

      {/* <!-- Metric Item Start --> */}
      <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6">
        <div className="flex items-center justify-center w-12 h-12 bg-gray-100 rounded-xl dark:bg-gray-800">
          <BoxIconLine className="text-gray-800 dark:text-white/90" />
        </div>
        <div className="flex items-end justify-between mt-5">
          <div>
            <span className="text-sm text-gray-500 dark:text-gray-400">
              Anak
            </span>
            <h4 className="mt-2 font-bold text-gray-800 text-title-sm dark:text-white/90">
              {dashboardData?.children.count}
            </h4>
          </div>

          <Badge color="warning">
            ABK ({dashboardData?.childrenAbk.count})
          </Badge>
        </div>
      </div>
      {/* <!-- Metric Item End --> */}

      {/* <!-- Metric Item Start --> */}
      <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6">
        <div className="flex items-center justify-center w-12 h-12 bg-gray-100 rounded-xl dark:bg-gray-800">
          <BoxIconLine className="text-gray-800 dark:text-white/90" />
        </div>
        <div className="flex items-end justify-between mt-5">
          <div>
            <span className="text-sm text-gray-500 dark:text-gray-400">
              UMKM
            </span>
            <h4 className="mt-2 font-bold text-gray-800 text-title-sm dark:text-white/90">
              {dashboardData?.umkm.count}
            </h4>
          </div>
        </div>
      </div>
      {/* <!-- Metric Item End --> */}
    </div>
  );
};
