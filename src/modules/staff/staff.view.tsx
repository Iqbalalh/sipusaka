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
import { Staff } from "@/utils/services/staff.service";

// Utils
import { extractKeyFromPresignedUrl } from "@/utils/formatter/extractKeyFromPresignedUrl";
import { getStaff } from "@/utils/services/staff.service";
import { notifyFromResult } from "@/utils/fetch/notify";
import { useNotify } from "@/context/NotificationContext";
import { API_IMAGE } from "@/constants/endpoint";

export default function StaffView() {
  // Data state
  const [data, setData] = useState<Staff | null>(null);
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

        const staff = await getStaff(id);

        setData(staff);
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
                src={data?.staffPict || "/images/user/alt-user.png"}
                alt={"Profile"}
              />
            </div>

            <div>
              <h4 className="mb-2 text-lg font-semibold text-center text-gray-800 dark:text-white/90 xl:text-left">
                {data?.staffName}
              </h4>
              <div className="flex flex-col items-center gap-1 text-center xl:flex-row xl:gap-3 xl:text-left">
                <p className="text-md text-gray-500 dark:text-gray-400">
                  {data?.gender === "M" ? "Laki-laki" : "Perempuan"}
                </p>
                <div className="hidden h-3.5 w-px bg-gray-300 dark:bg-gray-700 xl:block"></div>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  <Badge>{data?.roleName || "-"}</Badge>
                </p>
              </div>
            </div>

            <div className="flex items-center order-2 gap-2 grow xl:order-3 xl:justify-end">
              <Link href={`/staff/edit/${data?.id}`}>
                <Button variant="outline">Edit</Button>
              </Link>
            </div>
          </div>
        </div>

        {/* ====== Detail Info ====== */}
        <div className="mt-6">
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 lg:gap-6">
            <InfoItem label="NIK" value={data?.nik || "-"} />
            <InfoItem label="Email" value={data?.email || "-"} />
            <InfoItem label="Nomor Telepon" value={data?.phoneNumber || "-"} />
            <InfoItem label="Tempat Lahir" value={data?.birthplace || "-"} />
            <InfoItem
              label="Tanggal Lahir"
              value={
                data?.birthdate
                  ? new Date(data.birthdate).toLocaleDateString("id-ID")
                  : "-"
              }
            />
            <InfoItem label="Alamat" value={data?.address || "-"} />
          </div>
        </div>
      </div>
    </>
  );
}