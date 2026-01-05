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
import { Home } from "@/types/models/home";

// Utils
import { getHomeDetail } from "@/utils/services/home.service";
import { notifyFromResult } from "@/utils/fetch/notify";
import { useNotify } from "@/context/NotificationContext";
import { extractKeyFromPresignedUrl } from "@/utils/formatter/extractKeyFromPresignedUrl";
import { handlePrintFamily } from "@/utils/export/pdf/modules/family.pdf";
import { API_IMAGE } from "@/constants/endpoint";

export default function FamilyView() {
  // Data state
  const [data, setData] = useState<Home | null>(null);
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

        const home = await getHomeDetail(id);

        setData(home);
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
        {/* Home Info */}
        <div className="p-5 border border-gray-200 rounded-2xl dark:border-gray-800 lg:p-6 mb-6">
          <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
            <h4 className="text-2xl gap-4 flex font-semibold text-gray-800 dark:text-white/90">
              Data Keluarga{" "}
              <div>
                <Badge>{data?.regions?.regionName || "Tidak ada data"}</Badge>
              </div>
            </h4>
            <Button
              variant="outline"
              onClick={() =>
                handlePrintFamily(
                  data,
                  `${API_IMAGE}/?keyObject=${extractKeyFromPresignedUrl(
                    data?.employee?.employeePict
                  )}`,
                  `${API_IMAGE}/?keyObject=${extractKeyFromPresignedUrl(
                    data?.partner?.partnerPict
                  )}`,
                  data?.waliId && data?.wali
                    ? `${API_IMAGE}/?keyObject=${extractKeyFromPresignedUrl(
                        data.wali.waliPict
                      )}`
                    : undefined,
                  data?.childrens?.map(
                    (child) =>
                      `${API_IMAGE}/?keyObject=${extractKeyFromPresignedUrl(
                        child.childrenPict
                      )}`
                  )
                )
              }
            >
              Print
            </Button>
          </div>
        </div>

        {/* Employee */}
        <div className="p-5 mb-6 border border-gray-200 rounded-2xl dark:border-gray-800 lg:p-6">
          <h4 className="text-2xl font-semibold text-gray-800 dark:text-white/90 mb-4">
            Pegawai
          </h4>
          <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
            <div className="flex flex-col items-center w-full gap-6 xl:flex-row">
              <div className="w-20 h-20 overflow-hidden border border-gray-200 rounded-full dark:border-gray-800">
                <Image
                  width={80}
                  height={80}
                  src={
                    data?.employee?.employeePict || "/images/user/alt-user.png"
                  }
                  alt={"Profile"}
                />
              </div>

              <div>
                <h4 className="mb-2 text-lg font-semibold text-center text-gray-800 dark:text-white/90 xl:text-left">
                  {data?.employee?.employeeName} ({data?.employee?.nipNipp})
                </h4>
                <div className="flex flex-col items-center gap-1 text-center xl:flex-row xl:gap-3 xl:text-left">
                  <p className="text-md text-gray-500 dark:text-gray-400">
                    {data?.employee?.employeeGender === "M"
                      ? "Laki-laki"
                      : "Perempuan"}
                  </p>
                  <div className="hidden h-3.5 w-px bg-gray-300 dark:bg-gray-700 xl:block"></div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    <Badge>
                      {data?.employee?.isAccident ? "PLH" : "Non-PLH"}
                    </Badge>
                  </p>
                </div>
              </div>

              <div className="flex items-center order-2 gap-2 grow xl:order-3 xl:justify-end">
                <Link href={`/employee/edit/${data?.employeeId}`}>
                  <Button variant="outline">Edit</Button>
                </Link>
              </div>
            </div>
          </div>

          {/* ====== Detail Info ====== */}
          <div className="mt-6">
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 lg:gap-6">
              <InfoItem
                label="Kecelakaan/Meninggal"
                value={data?.employee?.isAccident ? "Kecelakaan" : "Meninggal"}
              />
              <InfoItem
                label="Penyebab Kematian"
                value={data?.employee?.deathCause || "-"}
              />
              <InfoItem
                label="Posisi Terakhir"
                value={data?.employee?.lastPosition || "-"}
              />
              <InfoItem label="Catatan" value={data?.employee?.notes || "-"} />
              <InfoItem
                label="Dibuat Pada"
                value={
                  data?.employee?.createdAt
                    ? new Date(data.employee.createdAt).toLocaleString()
                    : "-"
                }
              />
              <InfoItem
                label="Diperbarui Pada"
                value={
                  data?.employee?.updatedAt
                    ? new Date(data.employee.updatedAt).toLocaleString()
                    : "-"
                }
              />
            </div>
          </div>
        </div>

        {/* Partner */}
        <div className="p-5 border border-gray-200 rounded-2xl dark:border-gray-800 lg:p-6">
          <h4 className="text-2xl font-semibold flex text-gray-800 dark:text-white/90 mb-4 gap-4">
            Pasangan{" "}
            <div>
              {data?.partner?.isUmkm ? <Badge color="info">UMKM</Badge> : ""}
            </div>
          </h4>
          <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
            <div className="flex flex-col items-center w-full gap-6 xl:flex-row">
              <div className="w-20 h-20 overflow-hidden border border-gray-200 rounded-full dark:border-gray-800">
                <Image
                  width={80}
                  height={80}
                  src={data?.partner?.partnerPict || "/images/user/alt-user.png"}
                  alt={"Profile"}
                />
              </div>

              <div>
                <h4 className="mb-2 text-lg font-semibold text-center text-gray-800 dark:text-white/90 xl:text-left">
                  {data?.partner?.isAlive == false ? "Alm. " : ""}
                  {data?.partner?.partnerName}
                </h4>
                <div className="flex flex-col items-center gap-1 text-center xl:flex-row xl:gap-3 xl:text-left">
                  <p className="text-md text-gray-500 dark:text-gray-400">
                    {data?.partner?.partnerJob || "Tidak Bekerja"}
                  </p>
                  <div className="hidden h-3.5 w-px bg-gray-300 dark:bg-gray-700 xl:block"></div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    <Badge color={data?.partner?.isActive ? "success" : "error"}>
                      {data?.partner?.isActive ? "Aktif" : "Tidak Aktif"}
                    </Badge>
                  </p>
                </div>
              </div>

              <div className="flex items-center order-2 gap-2 grow xl:order-3 xl:justify-end">
                <Link href={`/partner/edit/${data?.partnerId}`}>
                  <Button variant="outline">Edit</Button>
                </Link>
              </div>
            </div>
          </div>

          {/* ====== Detail Info ====== */}
          <div className="mt-6">
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 lg:gap-6">
              <InfoItem label="Alamat" value={data?.partner?.address || ""} />
              <InfoItem label="NIK" value={data?.partner?.partnerNik || "-"} />
              <InfoItem
                label="Nomor Telp"
                value={
                  data?.partner?.phoneNumber ? (
                    <a
                      href={`https://wa.me/${
                        data?.partner?.phoneNumber
                          ?.replace(/^\+?62/, "") // hapus +62 atau 62 di depan jika ada
                          ?.replace(/^0/, "") // hapus 0 di depan
                          ?.replace(/\D/g, "") // hapus karakter non-angka
                          ? `62${data.partner.phoneNumber
                              .replace(/^\+?62/, "")
                              .replace(/^0/, "")
                              .replace(/\D/g, "")}`
                          : ""
                      }`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline"
                    >
                      {data?.partner?.phoneNumber}
                    </a>
                  ) : (
                    "-"
                  )
                }
              />
              <InfoItem
                label="Nomor Telp Alt"
                value={data?.partner?.phoneNumberAlt || "-"}
              />
              <InfoItem
                label="Status Hidup"
                value={data?.partner?.isAlive ? "Hidup" : "Meninggal"}
              />
              <InfoItem
                label="Koordinat Rumah"
                value={
                  <a
                    href={`https://www.google.com/maps?q=${encodeURIComponent(
                      String(data?.partner?.homeCoordinate || "-")
                    )}`}
                    target="_blank"
                    rel="noreferrer"
                    className="text-blue-600 hover:underline"
                  >
                    {data?.partner?.homeCoordinate || "-"}
                  </a>
                }
              />
              <InfoItem
                label="Dibuat Pada"
                value={
                  data?.partner?.createdAt
                    ? new Date(data.partner.createdAt).toLocaleString()
                    : "-"
                }
              />
              <InfoItem
                label="Diperbarui Pada"
                value={
                  data?.partner?.updatedAt
                    ? new Date(data.partner.updatedAt).toLocaleString()
                    : "-"
                }
              />
            </div>
          </div>
        </div>

        {/* Wali */}
        {data?.waliId && (
          <div className="p-5 border border-gray-200 rounded-2xl dark:border-gray-800 lg:p-6 mt-6">
            <h4 className="text-lg font-semibold text-gray-800 dark:text-white/90 mb-4">
              Wali
            </h4>

            <>
              <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
                <div className="flex flex-col items-center w-full gap-6 xl:flex-row">
                  <div className="w-20 h-20 overflow-hidden border border-gray-200 rounded-full dark:border-gray-800">
                    <Image
                      width={80}
                      height={80}
                      src={data.wali?.waliPict || "/images/user/alt-user.png"}
                      alt={`Profile Wali ${data.wali?.waliName || ""}`}
                    />
                  </div>

                  <div>
                    <h4 className="mb-2 text-lg font-semibold text-center text-gray-800 dark:text-white/90 xl:text-left">
                      {data.wali?.waliName}
                    </h4>
                    <div className="flex flex-col items-center gap-1 text-center xl:flex-row xl:gap-3 xl:text-left">
                      <p className="text-md text-gray-500 dark:text-gray-400">
                        {data.wali?.relation || "Relasi tidak diketahui"}
                      </p>
                      <div className="hidden h-3.5 w-px bg-gray-300 dark:bg-gray-700 xl:block"></div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        <Badge>
                          {data?.regions?.regionName || "Region tidak ada"}
                        </Badge>
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center order-2 gap-2 grow xl:order-3 xl:justify-end">
                    <Link href={`/wali/edit/${data?.waliId}`}>
                      <Button variant="outline">Edit</Button>
                    </Link>
                  </div>
                </div>
              </div>

              {/* ====== Detail Info Wali ====== */}
              <div className="mt-6">
                <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 lg:gap-6">
                  <InfoItem
                    label="Nomor Telp"
                    value={data.wali?.waliPhone || "-"}
                  />
                  <InfoItem
                    label="Hubungan"
                    value={data.wali?.relation || "-"}
                  />
                  <InfoItem label="Alamat" value={data.wali?.waliAddress || "-"} />
                  <InfoItem
                    label="Koordinat Alamat"
                    value={data.wali?.addressCoordinate || "-"}
                  />
                  <InfoItem
                    label="Dibuat Pada"
                    value={
                      data.wali?.createdAt
                        ? new Date(data.wali.createdAt).toLocaleString()
                        : "-"
                    }
                  />
                  <InfoItem
                    label="Diperbarui Pada"
                    value={
                      data.wali?.updatedAt
                        ? new Date(data.wali.updatedAt).toLocaleString()
                        : "-"
                    }
                  />
                </div>
              </div>
            </>
          </div>
        )}

        {/* Children List */}
        <div className="p-5 border border-gray-200 rounded-2xl dark:border-gray-800 lg:p-6 mt-6">
          <h4 className="text-2xl font-semibold text-gray-800 dark:text-white/90 mb-4">
            Anak Tertanggung ({data?.childrens?.length || 0})
          </h4>
          {data?.childrens && data.childrens.length > 0 ? (
            data.childrens.map((child, index) => (
              <div
                key={child.id || index}
                className={`border-t border-gray-200 dark:border-gray-700 py-4 ${
                  index > 0 ? "mt-2" : ""
                }`}
              >
                <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
                  <div className="flex flex-col items-center w-full gap-6 xl:flex-row">
                    <div className="w-20 h-20 overflow-hidden border border-gray-200 rounded-full dark:border-gray-800">
                      <Image
                        width={80}
                        height={80}
                        src={child.childrenPict || "/images/user/alt-user.png"}
                        alt={`Profile ${child.childrenName}`}
                      />
                    </div>

                    <div>
                      <div className="flex">
                        <h5 className="text-lg flex font-semibold text-gray-800 dark:text-white/90 mb-3">
                          {child.childrenName}
                        </h5>
                      </div>

                      <div className="flex flex-col items-center gap-1 text-center xl:flex-row xl:gap-3 xl:text-left">
                        <p className="text-md text-gray-500 dark:text-gray-400">
                          {child.childrenGender === "M"
                            ? "Laki-laki"
                            : child.childrenGender === "F"
                            ? "Perempuan"
                            : "-"}
                        </p>
                        <div className="hidden h-3.5 w-px bg-gray-300 dark:bg-gray-700 xl:block"></div>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          <Badge color={child.isActive ? "success" : "error"}>
                            {child.isActive ? "Aktif" : "Tidak Aktif"}
                          </Badge>
                        </p>

                        {!child.isCondition ? (
                          <>
                            <div className="hidden h-3.5 w-px bg-gray-300 dark:bg-gray-700 xl:block"></div>
                            <Badge size="sm" color="warning">
                              ABK
                            </Badge>
                          </>
                        ) : null}
                      </div>
                    </div>

                    <div className="flex items-center order-2 gap-2 grow xl:order-3 xl:justify-end">
                      <Link href={`/children/edit/${child.id}`}>
                        <Button variant="outline">Edit</Button>
                      </Link>
                    </div>
                  </div>
                </div>

                {/* ====== Detail Info Anak ====== */}
                <div className="mt-2">
                  <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 lg:gap-6">
                    <InfoItem
                      label="Tanggal Lahir"
                      value={child?.childrenBirthdate || "-"}
                    />
                    <InfoItem label="NIK" value={child?.nik || "-"} />
                    <InfoItem
                      label="Pekerjaan"
                      value={child?.childrenJob || "-"}
                    />
                    <InfoItem
                      label="Alamat"
                      value={child?.childrenAddress || "-"}
                    />
                    <InfoItem
                      label="Nomor Telp"
                      value={child?.childrenPhone || "-"}
                    />
                    <InfoItem
                      label="Anak Ke"
                      value={child?.index?.toString() || "-"}
                    />
                    <InfoItem
                      label="Dibuat Pada"
                      value={
                        child?.createdAt
                          ? new Date(child.createdAt).toLocaleString()
                          : "-"
                      }
                    />
                    <InfoItem
                      label="Diperbarui Pada"
                      value={
                        child?.updatedAt
                          ? new Date(child.updatedAt).toLocaleString()
                          : "-"
                      }
                    />

                    <InfoItem label="Catatan" value={child?.notes || "-"} />
                  </div>
                </div>
              </div>
            ))
          ) : (
            <p className="text-gray-500 dark:text-gray-400">
              Tidak ada data anak yang tercatat.
            </p>
          )}
        </div>
      </div>
    </>
  );
}
