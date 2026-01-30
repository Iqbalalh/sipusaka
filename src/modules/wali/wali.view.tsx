"use client";

// Hooks
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

// Components
import { Image, Spin } from "antd";
import Button from "@/components/ui/button/Button";
import { InfoItem } from "@/components/ui/field/InfoItem";

// Libs
import Link from "next/link";

// Icons
import { LoadingOutlined } from "@ant-design/icons";

// Type
import { Wali } from "@/types/models/wali";

// Utils
import { getWali } from "@/utils/services/wali.service";
import { notifyFromResult } from "@/utils/fetch/notify";
import { useNotify } from "@/context/NotificationContext";

export default function WaliView() {
  // Data state
  const [data, setData] = useState<Wali | null>(null);
  const { id } = useParams<{ id: string }>();

  // Page State
  const [loading, setLoading] = useState(true);
  const { notify } = useNotify();

  // ==========================
  // FETCH INITIAL DATA
  // ==========================
  useEffect(() => {
    const init = async () => {
      try {
        setLoading(true);

        const wali = await getWali(id);

        setData(wali);
      } catch (err) {
        notifyFromResult(notify, {
          error: err,
        });
      } finally {
        setLoading(false);
      }
    };

    init();
  }, [id, notify]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-40">
        <Spin indicator={<LoadingOutlined spin />} size="large" />
      </div>
    );
  }

  return (
    <>
      <div className="p-5 border border-gray-200 rounded-2xl dark:border-gray-800 lg:p-6">
        {/* Header Section */}
        <div className="flex flex-col gap-4 mb-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="w-16 h-16 overflow-hidden border border-gray-200 rounded-full dark:border-gray-800 shrink-0">
              <Image
                width={64}
                height={64}
                src={data?.waliPict || "/images/user/alt-user.png"}
                alt={"Profile"}
              />
            </div>

            <div className="min-w-0">
              <h4 className="text-lg font-semibold text-gray-800 dark:text-white/90 truncate">
                {data?.waliName}
              </h4>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  {data?.nik || "-"}
                </span>
                <span className="text-gray-300 dark:text-gray-700">•</span>
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  {data?.waliJob || "-"}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:justify-end">
            <Link href={`/wali/edit/${data?.id}`}>
              <Button variant="outline" size="sm">
                Edit
              </Button>
            </Link>
          </div>
        </div>

        {/* Detail Info Grid - Block Design */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          <div className="p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
            <span className="text-xs text-gray-500 dark:text-gray-400 block mb-1">
              Nama Wali
            </span>
            <span className="text-sm font-medium text-gray-800 dark:text-white/90 wrap-break-word">
              {data?.waliName || "-"}
            </span>
          </div>
          <div className="p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
            <span className="text-xs text-gray-500 dark:text-gray-400 block mb-1">
              NIK
            </span>
            <span className="text-sm font-medium text-gray-800 dark:text-white/90 wrap-break-word">
              {data?.nik || "-"}
            </span>
          </div>
          <div className="p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
            <span className="text-xs text-gray-500 dark:text-gray-400 block mb-1">
              Hubungan
            </span>
            <span className="text-sm font-medium text-gray-800 dark:text-white/90 wrap-break-word">
              {data?.relation || "-"}
            </span>
          </div>
          <div className="p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
            <span className="text-xs text-gray-500 dark:text-gray-400 block mb-1">
              Pekerjaan
            </span>
            <span className="text-sm font-medium text-gray-800 dark:text-white/90 wrap-break-word">
              {data?.waliJob || "-"}
            </span>
          </div>
          <div className="p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
            <span className="text-xs text-gray-500 dark:text-gray-400 block mb-1">
              Nomor Telepon
            </span>
            <span className="text-sm font-medium text-gray-800 dark:text-white/90 wrap-break-word">
              {data?.waliPhone || "-"}
            </span>
          </div>
          <div className="p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
            <span className="text-xs text-gray-500 dark:text-gray-400 block mb-1">
              Nama Karyawan
            </span>
            <span className="text-sm font-medium text-gray-800 dark:text-white/90 wrap-break-word">
              {data?.employeeName || "-"}
            </span>
          </div>
          <div className="p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg md:col-span-2">
            <span className="text-xs text-gray-500 dark:text-gray-400 block mb-1">
              Alamat
            </span>
            <span className="text-sm font-medium text-gray-800 dark:text-white/90 wrap-break-word">
              {data?.waliAddress || "-"}
            </span>
          </div>
          <div className="p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
            <span className="text-xs text-gray-500 dark:text-gray-400 block mb-1">
              Koordinat Alamat
            </span>
            <span className="text-sm font-medium text-gray-800 dark:text-white/90 wrap-break-word">
              {data?.addressCoordinate || "-"}
            </span>
          </div>
          <div className="p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
            <span className="text-xs text-gray-500 dark:text-gray-400 block mb-1">
              Dibuat Pada
            </span>
            <span className="text-sm font-medium text-gray-800 dark:text-white/90 wrap-break-word">
              {data?.createdAt
                ? new Date(data.createdAt).toLocaleString()
                : "-"}
            </span>
          </div>
          <div className="p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
            <span className="text-xs text-gray-500 dark:text-gray-400 block mb-1">
              Diperbarui Pada
            </span>
            <span className="text-sm font-medium text-gray-800 dark:text-white/90 wrap-break-word">
              {data?.updatedAt
                ? new Date(data.updatedAt).toLocaleString()
                : "-"}
            </span>
          </div>
          <div className="p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
            <span className="text-xs text-gray-500 dark:text-gray-400 block mb-1">
              Dibuat Oleh
            </span>
            <span className="text-sm font-medium text-gray-800 dark:text-white/90 wrap-break-word">
              {data?.createdBy || "-"}
            </span>
          </div>
          <div className="p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
            <span className="text-xs text-gray-500 dark:text-gray-400 block mb-1">
              Diedit Oleh
            </span>
            <span className="text-sm font-medium text-gray-800 dark:text-white/90 wrap-break-word">
              {data?.editedBy || "-"}
            </span>
          </div>
        </div>
      </div>
    </>
  );
}