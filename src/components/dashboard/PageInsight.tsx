"use client";

import { useEffect, useState } from "react";
import { Skeleton } from "antd";
import { FaUsers, FaChild, FaDollarSign, FaHandHoldingHeart } from "react-icons/fa6";
import { fetchWithAuth } from "@/utils/fetch/fetchWithAuth";
import { API_DASHBOARD } from "@/constants/endpoint";
import camelcaseKeys from "camelcase-keys";

const formatCurrency = (v: number) =>
  new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(v);

interface InsightCard {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  sub?: string;
  color: string;
}

function InsightTile({ icon, label, value, sub, color }: InsightCard) {
  return (
    <div className="flex items-center gap-4 rounded-xl border border-gray-100 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-white/[0.03]">
      <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-white shadow-md ${color}`}>
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide font-medium">{label}</p>
        <p className="mt-0.5 text-xl font-bold text-gray-900 dark:text-white truncate">{value}</p>
        {sub && <p className="text-xs text-gray-400 dark:text-gray-500 truncate">{sub}</p>}
      </div>
    </div>
  );
}

// ==============================================
// FAMILY PAGE INSIGHT
// ==============================================
export function FamilyInsight() {
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    fetchWithAuth(API_DASHBOARD)
      .then((r) => r.json())
      .then((json) => setData(camelcaseKeys(json.data, { deep: true })))
      .catch(() => {});
  }, []);

  if (!data) {
    return (
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 mb-5">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="rounded-xl border border-gray-100 bg-white p-4 dark:border-gray-800 dark:bg-white/[0.03]">
            <Skeleton active paragraph={{ rows: 1 }} />
          </div>
        ))}
      </div>
    );
  }

  const familyActive = data?.family?.active?.count ?? 0;
  const familyTotal = data?.family?.total?.count ?? 0;
  const childActive = data?.children?.active?.count ?? 0;
  const assistanceCount = data?.childAssistance?.count ?? 0;
  const assistanceTotal = data?.childAssistance?.totalAmount ?? 0;

  const cards: InsightCard[] = [
    {
      icon: <FaUsers />,
      label: "Keluarga Aktif",
      value: familyActive,
      sub: `dari ${familyTotal} total`,
      color: "bg-blue-500",
    },
    {
      icon: <FaChild />,
      label: "Anak Aktif",
      value: childActive,
      sub: `dari ${data?.children?.total?.count ?? 0} total`,
      color: "bg-indigo-500",
    },
    {
      icon: <FaHandHoldingHeart />,
      label: "Total Bantuan",
      value: assistanceCount,
      sub: "rekam bantuan anak",
      color: "bg-emerald-500",
    },
    {
      icon: <FaDollarSign />,
      label: "Total Dana",
      value: formatCurrency(assistanceTotal),
      sub: "seluruh bantuan anak",
      color: "bg-rose-500",
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 mb-5">
      {cards.map((c) => (
        <InsightTile key={c.label} {...c} />
      ))}
    </div>
  );
}

// ==============================================
// CHILDREN PAGE INSIGHT
// ==============================================
export function ChildrenInsight() {
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    fetchWithAuth(API_DASHBOARD)
      .then((r) => r.json())
      .then((json) => setData(camelcaseKeys(json.data, { deep: true })))
      .catch(() => {});
  }, []);

  if (!data) {
    return (
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 mb-5">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="rounded-xl border border-gray-100 bg-white p-4 dark:border-gray-800 dark:bg-white/[0.03]">
            <Skeleton active paragraph={{ rows: 1 }} />
          </div>
        ))}
      </div>
    );
  }

  const childActive = data?.children?.active?.count ?? 0;
  const childTotal = data?.children?.total?.count ?? 0;
  const yatim = data?.children?.yatim?.count ?? 0;
  const piatu = data?.children?.piatu?.count ?? 0;
  const yatimPiatu = data?.children?.yatimPiatu?.count ?? 0;
  const abk = data?.children?.abk?.count ?? 0;
  const assistanceCount = data?.childAssistance?.count ?? 0;
  const assistanceTotal = data?.childAssistance?.totalAmount ?? 0;

  const cards: InsightCard[] = [
    {
      icon: <FaChild />,
      label: "Anak Aktif",
      value: childActive,
      sub: `dari ${childTotal} total`,
      color: "bg-emerald-500",
    },
    {
      icon: <FaChild />,
      label: "Yatim / Piatu",
      value: yatim + piatu + yatimPiatu,
      sub: `${yatim} yatim · ${piatu} piatu · ${yatimPiatu} keduanya`,
      color: "bg-amber-500",
    },
    {
      icon: <FaHandHoldingHeart />,
      label: "Jml. Bantuan",
      value: assistanceCount,
      sub: `ABK: ${abk} anak`,
      color: "bg-indigo-500",
    },
    {
      icon: <FaDollarSign />,
      label: "Total Dana",
      value: formatCurrency(assistanceTotal),
      sub: "seluruh bantuan anak",
      color: "bg-rose-500",
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 mb-5">
      {cards.map((c) => (
        <InsightTile key={c.label} {...c} />
      ))}
    </div>
  );
}
