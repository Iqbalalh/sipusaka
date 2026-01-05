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
        <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex flex-col items-center w-full gap-6 xl:flex-row">
            <div className="w-20 h-20 overflow-hidden border border-gray-200 rounded-full dark:border-gray-800">
              <Image
                width={80}
                height={80}
                src={data?.waliPict || "/images/user/alt-user.png"}
                alt={"Profile"}
              />
            </div>

            <div>
              <h4 className="mb-2 text-lg font-semibold text-center text-gray-800 dark:text-white/90 xl:text-left">
                {data?.waliName}
              </h4>
              <div className="flex flex-col items-center gap-1 text-center xl:flex-row xl:gap-3 xl:text-left">
                <p className="text-md text-gray-500 dark:text-gray-400">
                  {data?.nik || "-"}
                </p>
                <div className="hidden h-3.5 w-px bg-gray-300 dark:bg-gray-700 xl:block"></div>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {data?.waliJob || "-"}
                </p>
              </div>
            </div>

            <div className="flex items-center order-2 gap-2 grow xl:order-3 xl:justify-end">
              <Link href={`/wali/edit/${data?.id}`}>
                <Button variant="outline">Edit</Button>
              </Link>
            </div>
          </div>
        </div>

        {/* ====== Detail Info ====== */}
        <div className="mt-6">
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 lg:gap-6">
            <InfoItem
              label="Nama Wali"
              value={data?.waliName || "-"}
            />
            <InfoItem
              label="NIK"
              value={data?.nik || "-"}
            />
            <InfoItem
              label="Hubungan"
              value={data?.relation || "-"}
            />
            <InfoItem
              label="Pekerjaan"
              value={data?.waliJob || "-"}
            />
            <InfoItem
              label="Nomor Telepon"
              value={data?.waliPhone || "-"}
            />
            <InfoItem
              label="Nama Karyawan"
              value={data?.employeeName || "-"}
            />
            <InfoItem
              label="Alamat"
              value={data?.waliAddress || "-"}
            />
            <InfoItem
              label="Koordinat Alamat"
              value={data?.addressCoordinate || "-"}
            />
            <InfoItem
              label="Dibuat Pada"
              value={
                data?.createdAt
                  ? new Date(data.createdAt).toLocaleString()
                  : "-"
              }
            />
            <InfoItem
              label="Diperbarui Pada"
              value={
                data?.updatedAt
                  ? new Date(data.updatedAt).toLocaleString()
                  : "-"
              }
            />
          </div>
        </div>
      </div>
    </>
  );
}