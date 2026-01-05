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
import { Children } from "@/types/models/children";

// Utils
import { extractKeyFromPresignedUrl } from "@/utils/formatter/extractKeyFromPresignedUrl";
import { getChildren } from "@/utils/services/children.service";
import { notifyFromResult } from "@/utils/fetch/notify";
import { useNotify } from "@/context/NotificationContext";
import { API_IMAGE } from "@/constants/endpoint";
import { handlePrintChildren } from "@/utils/export/pdf/modules/children.pdf";

export default function ChildrenView() {
  // Data state
  const [data, setData] = useState<Children | null>(null);
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

        const children = await getChildren(id);

        setData(children);
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
                src={data?.childrenPict || "/images/user/alt-user.png"}
                alt={"Profile"}
              />
            </div>

            <div>
              <h4 className="mb-2 text-lg font-semibold text-center text-gray-800 dark:text-white/90 xl:text-left">
                {data?.childrenName}
              </h4>
              <div className="flex flex-col items-center gap-1 text-center xl:flex-row xl:gap-3 xl:text-left">
                <p className="text-md text-gray-500 dark:text-gray-400">
                  {data?.childrenGender === "M" ? "Laki-laki" : "Perempuan"}
                </p>
                <div className="hidden h-3.5 w-px bg-gray-300 dark:bg-gray-700 xl:block"></div>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  <Badge>{data?.isActive ? "Aktif" : "Tidak Aktif"}</Badge>
                </p>
              </div>
            </div>

            <div className="flex items-center order-2 gap-2 grow xl:order-3 xl:justify-end">
              <Button
                variant="outline"
                onClick={() =>
                  handlePrintChildren(
                    data,
                    `${API_IMAGE}/?keyObject=${extractKeyFromPresignedUrl(
                      data?.childrenPict
                    )}`
                  )
                }
              >
                Print
              </Button>
              <Link href={`/children/edit/${data?.id}`}>
                <Button variant="outline">Edit</Button>
              </Link>
            </div>
          </div>
        </div>

        {/* ====== Detail Info ====== */}
        <div className="mt-6">
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 lg:gap-6">
            <InfoItem label="NIK" value={data?.nik || "-"} />
            <InfoItem
              label="Tanggal Lahir"
              value={
                data?.childrenBirthdate
                  ? new Date(data.childrenBirthdate).toLocaleDateString()
                  : "-"
              }
            />
            <InfoItem label="Pekerjaan" value={data?.childrenJob || "-"} />
            <InfoItem label="Alamat" value={data?.childrenAddress || "-"} />
            <InfoItem label="Nomor Telepon" value={data?.childrenPhone || "-"} />
            <InfoItem
              label="Status"
              value={data?.isActive ? "Aktif" : "Tidak Aktif"}
            />
            <InfoItem
              label="ABK"
              value={!data?.isCondition ? "Ya" : "Tidak"}
            />
            <InfoItem
              label="Ayah Masih Hidup"
              value={data?.isFatherAlive ? "Ya" : "Tidak"}
            />
            <InfoItem
              label="Ibu Masih Hidup"
              value={data?.isMotherAlive ? "Ya" : "Tidak"}
            />
            <InfoItem label="Nama Pegawai" value={data?.employeeName || "-"} />
            <InfoItem label="Nama Wali" value={data?.waliName || "-"} />
            <InfoItem label="Catatan" value={data?.notes || "-"} />
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