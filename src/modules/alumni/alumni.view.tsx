"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { Image, Spin } from "antd";
import { LoadingOutlined } from "@ant-design/icons";
import Link from "next/link";

import Button from "@/components/ui/button/Button";
import Badge from "@/components/ui/badge/Badge";
import { WhatsAppButton } from "@/components/ui/action-buttons/ActionButtons";
import { Alumni, getAlumni } from "@/utils/services/alumni.service";
import { useNotify } from "@/context/NotificationContext";
import { notifyFromResult } from "@/utils/fetch/notify";
import { formatDate } from "@/utils/formatter/formatDate";
import { calculateAge } from "@/utils/formatter/calculateAge";

export default function AlumniView() {
  const { id } = useParams<{ id: string }>();
  const { data: session } = useSession();
  const isAdmin = session?.user?.role !== "staff";
  const { notify } = useNotify();

  const [data, setData] = useState<Alumni | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const init = async () => {
      try {
        setLoading(true);
        const alumni = await getAlumni(id);
        setData(alumni);
      } catch (err) {
        notifyFromResult(notify, { error: err });
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

  if (!data) {
    return <p className="text-gray-500 dark:text-gray-400 text-sm">Data alumni tidak ditemukan.</p>;
  }

  const age = calculateAge(data.alumniBirthdate ?? null);

  return (
    <div className="p-5 border border-gray-200 rounded-2xl dark:border-gray-800 lg:p-6">
      {/* Header */}
      <div className="p-4 border border-gray-200 rounded-2xl dark:border-gray-800 lg:p-5 mb-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <h4 className="text-xl font-semibold text-gray-800 dark:text-white/90">Data Alumni</h4>
          {isAdmin && (
            <Link href={`/alumni/edit/${id}`}>
              <Button variant="outline" size="sm">
                Edit
              </Button>
            </Link>
          )}
        </div>
      </div>

      {/* Profile */}
      <div className="p-4 mb-5 border border-gray-200 rounded-2xl dark:border-gray-800 lg:p-5">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-16 h-16 overflow-hidden border border-gray-200 rounded-full dark:border-gray-800 shrink-0">
            <Image
              width={64}
              height={64}
              src={data.alumniPict || "/images/user/alt-user.png"}
              alt="Profile"
            />
          </div>
          <div className="min-w-0">
            <h4 className="text-base font-semibold text-gray-800 dark:text-white/90 truncate">
              {data.alumniName}
            </h4>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-sm text-gray-500 dark:text-gray-400">
                {data.alumniGender === "M" ? "Laki-laki" : data.alumniGender === "F" ? "Perempuan" : "-"}
              </span>
              {data.educationLevel && (
                <>
                  <span className="text-gray-300 dark:text-gray-700">•</span>
                  <Badge variant="light" color="info">
                    {data.educationLevel}
                  </Badge>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Info grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          <div className="p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
            <span className="text-xs text-gray-500 dark:text-gray-400 block mb-1">NIK</span>
            <span className="text-sm font-medium text-gray-800 dark:text-white/90 wrap-break-word">{data.nik || "-"}</span>
          </div>
          <div className="p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
            <span className="text-xs text-gray-500 dark:text-gray-400 block mb-1">Tanggal Lahir</span>
            <span className="text-sm font-medium text-gray-800 dark:text-white/90">
              {data.alumniBirthdate ? formatDate(data.alumniBirthdate) : "-"}
            </span>
          </div>
          <div className="p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
            <span className="text-xs text-gray-500 dark:text-gray-400 block mb-1">Usia</span>
            <span className="text-sm font-medium text-gray-800 dark:text-white/90">
              {age !== null ? `${age} Tahun` : "-"}
            </span>
          </div>
          <div className="p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
            <span className="text-xs text-gray-500 dark:text-gray-400 block mb-1">Pendidikan Terakhir</span>
            <span className="text-sm font-medium text-gray-800 dark:text-white/90">{data.educationLevel || "-"}</span>
          </div>
          <div className="p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
            <span className="text-xs text-gray-500 dark:text-gray-400 block mb-1">Pekerjaan</span>
            <span className="text-sm font-medium text-gray-800 dark:text-white/90">{data.alumniJob || "-"}</span>
          </div>
          <div className="p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
            <span className="text-xs text-gray-500 dark:text-gray-400 block mb-1">Nomor Telepon</span>
            <div className="flex items-center justify-between gap-2">
              <span className="text-sm font-medium text-gray-800 dark:text-white/90 wrap-break-word flex-1">
                {data.alumniPhone || "-"}
              </span>
              {data.alumniPhone && <WhatsAppButton phoneNumber={data.alumniPhone} />}
            </div>
          </div>
          <div className="p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg md:col-span-2 lg:col-span-3">
            <span className="text-xs text-gray-500 dark:text-gray-400 block mb-1">Alamat</span>
            <span className="text-sm font-medium text-gray-800 dark:text-white/90 wrap-break-word">{data.alumniAddress || "-"}</span>
          </div>
          <div className="p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg md:col-span-2 lg:col-span-3">
            <span className="text-xs text-gray-500 dark:text-gray-400 block mb-1">Catatan</span>
            <span className="text-sm font-medium text-gray-800 dark:text-white/90 wrap-break-word">{data.notes || "-"}</span>
          </div>
          <div className="p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
            <span className="text-xs text-gray-500 dark:text-gray-400 block mb-1">Dibuat Pada</span>
            <span className="text-sm font-medium text-gray-800 dark:text-white/90">
              {data.createdAt ? formatDate(data.createdAt) : "-"}
            </span>
          </div>
          <div className="p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
            <span className="text-xs text-gray-500 dark:text-gray-400 block mb-1">Diperbarui Pada</span>
            <span className="text-sm font-medium text-gray-800 dark:text-white/90">
              {data.updatedAt ? formatDate(data.updatedAt) : "-"}
            </span>
          </div>
          <div className="p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
            <span className="text-xs text-gray-500 dark:text-gray-400 block mb-1">Dibuat Oleh</span>
            <span className="text-sm font-medium text-gray-800 dark:text-white/90">
              {data.createdByStaffName || data.createdBy || "-"}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
