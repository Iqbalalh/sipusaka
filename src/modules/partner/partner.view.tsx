"use client";

// Hooks
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

// Components
import { Image, Spin } from "antd";
import Button from "@/components/ui/button/Button";
import Badge from "@/components/ui/badge/Badge";
import { InfoItem } from "@/components/ui/field/InfoItem";

// Libs
import Link from "next/link";

// Icons
import { LoadingOutlined } from "@ant-design/icons";

// Type
import { Partner } from "@/types/models/partner";

// Utils
import { extractKeyFromPresignedUrl } from "@/utils/formatter/extractKeyFromPresignedUrl";
import { getPartner } from "@/utils/services/partner.service";
import { notifyFromResult } from "@/utils/fetch/notify";
import { useNotify } from "@/context/NotificationContext";
import { API_IMAGE } from "@/constants/endpoint";
import { handlePrintPartner } from "@/utils/export/pdf/modules/partner.pdf";

export default function PartnerView() {
  // Data state
  const [data, setData] = useState<Partner | null>(null);
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

        const partner = await getPartner(id);

        setData(partner);
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
                src={data?.partnerPict || "/images/user/alt-user.png"}
                alt={"Profile"}
              />
            </div>

            <div className="min-w-0">
              <h4 className="text-lg font-semibold text-gray-800 dark:text-white/90 truncate">
                {data?.partnerName}
              </h4>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  {data?.partnerNik || "-"}
                </span>
                <span className="text-gray-300 dark:text-gray-700">•</span>
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  {data?.partnerJob || "-"}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:justify-end">
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                handlePrintPartner(
                  data,
                  `${API_IMAGE}/?keyObject=${extractKeyFromPresignedUrl(
                    data?.partnerPict
                  )}`
                )
              }
            >
              Print
            </Button>
            <Link href={`/partner/edit/${data?.id}`}>
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
              Nama Pasangan
            </span>
            <span className="text-sm font-medium text-gray-800 dark:text-white/90 warp-break-words">
              {data?.partnerName || "-"}
            </span>
          </div>
          <div className="p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
            <span className="text-xs text-gray-500 dark:text-gray-400 block mb-1">
              NIK
            </span>
            <span className="text-sm font-medium text-gray-800 dark:text-white/90 warp-break-words">
              {data?.partnerNik || "-"}
            </span>
          </div>
          <div className="p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
            <span className="text-xs text-gray-500 dark:text-gray-400 block mb-1">
              Pekerjaan
            </span>
            <span className="text-sm font-medium text-gray-800 dark:text-white/90 warp-break-words">
              {data?.partnerJob || "-"}
            </span>
          </div>
          <div className="p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
            <span className="text-xs text-gray-500 dark:text-gray-400 block mb-1">
              Kecamatan
            </span>
            <span className="text-sm font-medium text-gray-800 dark:text-white/90 warp-break-words">
              {data?.subdistrictName?.toString() || "-"}
            </span>
          </div>
          <div className="p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
            <span className="text-xs text-gray-500 dark:text-gray-400 block mb-1">
              Wilayah
            </span>
            <span className="text-sm font-medium text-gray-800 dark:text-white/90 warp-break-words">
              {data?.regionName?.toString() || "-"}
            </span>
          </div>
          <div className="p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
            <span className="text-xs text-gray-500 dark:text-gray-400 block mb-1">
              Nomor Telepon
            </span>
            <span className="text-sm font-medium text-gray-800 dark:text-white/90 warp-break-words">
              {data?.phoneNumber || "-"}
            </span>
          </div>
          <div className="p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
            <span className="text-xs text-gray-500 dark:text-gray-400 block mb-1">
              Nomor Telepon Alternatif
            </span>
            <span className="text-sm font-medium text-gray-800 dark:text-white/90 warp-break-words">
              {data?.phoneNumberAlt || "-"}
            </span>
          </div>
          <div className="p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
            <span className="text-xs text-gray-500 dark:text-gray-400 block mb-1">
              Alamat
            </span>
            <span className="text-sm font-medium text-gray-800 dark:text-white/90 warp-break-words">
              {data?.address || "-"}
            </span>
          </div>
          <div className="p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
            <span className="text-xs text-gray-500 dark:text-gray-400 block mb-1">
              Kode Pos
            </span>
            <span className="text-sm font-medium text-gray-800 dark:text-white/90 warp-break-words">
              {data?.postalCode || "-"}
            </span>
          </div>
          <div className="p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
            <span className="text-xs text-gray-500 dark:text-gray-400 block mb-1">
              Koordinat Rumah
            </span>
            <span className="text-sm font-medium text-gray-800 dark:text-white/90 warp-break-words">
              {data?.homeCoordinate || "-"}
            </span>
          </div>
          <div className="p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
            <span className="text-xs text-gray-500 dark:text-gray-400 block mb-1">
              Status Aktif
            </span>
            <span className="text-sm font-medium text-gray-800 dark:text-white/90 warp-break-words">
              <Badge variant={data?.isActive ? "solid" : "light"} color={data?.isActive ? "success" : "error"}>
                {data?.isActive ? "Aktif" : "Tidak Aktif"}
              </Badge>
            </span>
          </div>
          <div className="p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
            <span className="text-xs text-gray-500 dark:text-gray-400 block mb-1">
              Status Hidup
            </span>
            <span className="text-sm font-medium text-gray-800 dark:text-white/90 warp-break-words">
              <Badge variant={data?.isAlive ? "solid" : "light"} color={data?.isAlive ? "success" : "error"}>
                {data?.isAlive ? "Hidup" : "Meninggal"}
              </Badge>
            </span>
          </div>
          <div className="p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
            <span className="text-xs text-gray-500 dark:text-gray-400 block mb-1">
              Dibuat Pada
            </span>
            <span className="text-sm font-medium text-gray-800 dark:text-white/90 warp-break-words">
              {data?.createdAt
                ? new Date(data.createdAt).toLocaleString()
                : "-"}
            </span>
          </div>
          <div className="p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
            <span className="text-xs text-gray-500 dark:text-gray-400 block mb-1">
              Diperbarui Pada
            </span>
            <span className="text-sm font-medium text-gray-800 dark:text-white/90 warp-break-words">
              {data?.updatedAt
                ? new Date(data.updatedAt).toLocaleString()
                : "-"}
            </span>
          </div>
        </div>
      </div>
    </>
  );
}