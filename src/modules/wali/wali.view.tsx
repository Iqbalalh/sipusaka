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

// Action Buttons
import { WhatsAppButton, GoogleMapsButton } from "@/components/ui/action-buttons/ActionButtons";

// Type
import { Wali } from "@/types/models/wali";
import { BaseChildren } from "@/types/models/children";

// Utils
import { getWali } from "@/utils/services/wali.service";
import { notifyFromResult } from "@/utils/fetch/notify";
import { useNotify } from "@/context/NotificationContext";
import { formatDate } from "@/utils/formatter/formatDate";

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
                {data?.regionName && (
                  <>
                    <span className="text-gray-300 dark:text-gray-700">•</span>
                    <span className="text-sm text-primary-600 dark:text-primary-400">
                      {data.regionName}
                    </span>
                  </>
                )}
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
              Wilayah
            </span>
            <span className="text-sm font-medium text-gray-800 dark:text-white/90 wrap-break-word">
              {data?.regionName || "-"}
            </span>
          </div>
          <div className="p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
            <span className="text-xs text-gray-500 dark:text-gray-400 block mb-1">
              Nomor Telepon
            </span>
            <div className="flex items-center justify-between gap-2">
              <span className="text-sm font-medium text-gray-800 dark:text-white/90 wrap-break-word flex-1">
                {data?.waliPhone || "-"}
              </span>
              {data?.waliPhone && <WhatsAppButton phoneNumber={data.waliPhone} />}
            </div>
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
            <div className="flex items-center justify-between gap-2">
              <span className="text-sm font-medium text-gray-800 dark:text-white/90 wrap-break-word flex-1">
                {data?.addressCoordinate || "-"}
              </span>
              {data?.addressCoordinate && <GoogleMapsButton coordinate={data.addressCoordinate} />}
            </div>
          </div>
          <div className="p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
            <span className="text-xs text-gray-500 dark:text-gray-400 block mb-1">
              Dibuat Pada
            </span>
            <span className="text-sm font-medium text-gray-800 dark:text-white/90 wrap-break-word">
              {data?.createdAt
                ? formatDate(data.createdAt)
                : "-"}
            </span>
          </div>
          <div className="p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
            <span className="text-xs text-gray-500 dark:text-gray-400 block mb-1">
              Diperbarui Pada
            </span>
            <span className="text-sm font-medium text-gray-800 dark:text-white/90 wrap-break-word">
              {data?.updatedAt
                ? formatDate(data.updatedAt)
                : "-"}
            </span>
          </div>
          <div className="p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
            <span className="text-xs text-gray-500 dark:text-gray-400 block mb-1">
              Dibuat Oleh
            </span>
            <span className="text-sm font-medium text-gray-800 dark:text-white/90 wrap-break-word">
              {(data as any)?.createdByStaffName || (data as any)?.createdBy || "-"}
            </span>
          </div>
          <div className="p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
            <span className="text-xs text-gray-500 dark:text-gray-400 block mb-1">
              Diedit Oleh
            </span>
            <span className="text-sm font-medium text-gray-800 dark:text-white/90 wrap-break-word">
              {(data as any)?.editedByStaffName || (data as any)?.editedBy || "-"}
            </span>
          </div>
        </div>

        {/* Home Data Section */}
        {(data?.partner || data?.employee || data?.childrens) && (
          <div className="mt-6">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90 mb-4">
              Data Keluarga
            </h3>

            {/* Employee Info */}
            {data?.employee && (
              <div className="mb-4 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  <div>
                    <span className="text-xs text-gray-500 dark:text-gray-400 block mb-1">
                      Nama Karyawan
                    </span>
                    <span className="text-sm font-medium text-gray-800 dark:text-white/90">
                      {data.employee.employeeName || "-"}
                    </span>
                  </div>
                  <div>
                    <span className="text-xs text-gray-500 dark:text-gray-400 block mb-1">
                      NIP/NIPP
                    </span>
                    <span className="text-sm font-medium text-gray-800 dark:text-white/90">
                      {data.employee.nipNipp || "-"}
                    </span>
                  </div>
                  <div>
                    <span className="text-xs text-gray-500 dark:text-gray-400 block mb-1">
                      Jabatan Terakhir
                    </span>
                    <span className="text-sm font-medium text-gray-800 dark:text-white/90">
                      {data.employee.lastPosition || "-"}
                    </span>
                  </div>
                  <div>
                    <span className="text-xs text-gray-500 dark:text-gray-400 block mb-1">
                      Jenis Kelamin
                    </span>
                    <span className="text-sm font-medium text-gray-800 dark:text-white/90">
                      {data.employee.employeeGender === "M" ? "Laki-laki" : "Perempuan"}
                    </span>
                  </div>
                  {data.employee.deathCause && (
                    <div className="md:col-span-2 lg:col-span-1">
                      <span className="text-xs text-gray-500 dark:text-gray-400 block mb-1">
                        Penyebab Kematian
                      </span>
                      <span className="text-sm font-medium text-gray-800 dark:text-white/90">
                        {data.employee.deathCause}
                      </span>
                    </div>
                  )}
                  {data.employee.notes && (
                    <div className="md:col-span-2">
                      <span className="text-xs text-gray-500 dark:text-gray-400 block mb-1">
                        Catatan
                      </span>
                      <span className="text-sm font-medium text-gray-800 dark:text-white/90">
                        {data.employee.notes}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Partner Info */}
            {data?.partner && (
              <div className="mb-4 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  <div>
                    <span className="text-xs text-gray-500 dark:text-gray-400 block mb-1">
                      Nama Pasangan
                    </span>
                    <span className="text-sm font-medium text-gray-800 dark:text-white/90">
                      {data.partner.partnerName || "-"}
                    </span>
                  </div>
                  <div>
                    <span className="text-xs text-gray-500 dark:text-gray-400 block mb-1">
                      NIK
                    </span>
                    <span className="text-sm font-medium text-gray-800 dark:text-white/90">
                      {data.partner.partnerNik || "-"}
                    </span>
                  </div>
                  <div>
                    <span className="text-xs text-gray-500 dark:text-gray-400 block mb-1">
                      Pekerjaan
                    </span>
                    <span className="text-sm font-medium text-gray-800 dark:text-white/90">
                      {data.partner.partnerJob || "-"}
                    </span>
                  </div>
                  <div>
                    <span className="text-xs text-gray-500 dark:text-gray-400 block mb-1">
                      Nomor Telepon
                    </span>
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm font-medium text-gray-800 dark:text-white/90 flex-1">
                        {data.partner.phoneNumber || "-"}
                      </span>
                      {data.partner.phoneNumber && <WhatsAppButton phoneNumber={data.partner.phoneNumber} />}
                    </div>
                  </div>
                  <div className="md:col-span-2">
                    <span className="text-xs text-gray-500 dark:text-gray-400 block mb-1">
                      Alamat
                    </span>
                    <span className="text-sm font-medium text-gray-800 dark:text-white/90">
                      {data.partner.address || "-"}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Children Info */}
            {data?.childrens && data.childrens.length > 0 && (
              <div className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                  Anak ({data.childrens.length})
                </h4>
                <div className="space-y-3">
                  {data.childrens.map((child: BaseChildren, index: number) => (
                    <div
                      key={child.id || index}
                      className="p-3 bg-white dark:bg-gray-700/50 rounded-lg border border-gray-200 dark:border-gray-600"
                    >
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                        <div>
                          <span className="text-xs text-gray-500 dark:text-gray-400 block mb-1">
                            Nama Anak
                          </span>
                          <span className="text-sm font-medium text-gray-800 dark:text-white/90">
                            {child.childrenName || "-"}
                          </span>
                        </div>
                        <div>
                          <span className="text-xs text-gray-500 dark:text-gray-400 block mb-1">
                            NIK
                          </span>
                          <span className="text-sm font-medium text-gray-800 dark:text-white/90">
                            {child.nik || "-"}
                          </span>
                        </div>
                        <div>
                          <span className="text-xs text-gray-500 dark:text-gray-400 block mb-1">
                            Jenis Kelamin
                          </span>
                          <span className="text-sm font-medium text-gray-800 dark:text-white/90">
                            {child.childrenGender === "M" ? "Laki-laki" : "Perempuan"}
                          </span>
                        </div>
                        <div>
                          <span className="text-xs text-gray-500 dark:text-gray-400 block mb-1">
                            Umur
                          </span>
                          <span className="text-sm font-medium text-gray-800 dark:text-white/90">
                            {child.age ? `${child.age} tahun` : "-"}
                          </span>
                        </div>
                        <div>
                          <span className="text-xs text-gray-500 dark:text-gray-400 block mb-1">
                            Pendidikan
                          </span>
                          <span className="text-sm font-medium text-gray-800 dark:text-white/90">
                            {child.educationLevel || "-"}
                          </span>
                        </div>
                        {child.schoolName && (
                          <div>
                            <span className="text-xs text-gray-500 dark:text-gray-400 block mb-1">
                              Nama Sekolah
                            </span>
                            <span className="text-sm font-medium text-gray-800 dark:text-white/90">
                              {child.schoolName}
                            </span>
                          </div>
                        )}
                        {child.childrenPhone && (
                          <div>
                            <span className="text-xs text-gray-500 dark:text-gray-400 block mb-1">
                              Nomor Telepon
                            </span>
                            <div className="flex items-center justify-between gap-2">
                              <span className="text-sm font-medium text-gray-800 dark:text-white/90 flex-1">
                                {child.childrenPhone}
                              </span>
                              <WhatsAppButton phoneNumber={child.childrenPhone} />
                            </div>
                          </div>
                        )}
                        {child.childrenJob && (
                          <div>
                            <span className="text-xs text-gray-500 dark:text-gray-400 block mb-1">
                              Pekerjaan
                            </span>
                            <span className="text-sm font-medium text-gray-800 dark:text-white/90">
                              {child.childrenJob}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
}
