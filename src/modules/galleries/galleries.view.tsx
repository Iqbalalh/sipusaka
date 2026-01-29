"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Image, Spin, Flex } from "antd";
import { LoadingOutlined } from "@ant-design/icons";
import Button from "@/components/ui/button/Button";
import Link from "next/link";
import { InfoItem } from "@/components/ui/field/InfoItem";
import { useNotify } from "@/context/NotificationContext";
import { notifyFromResult } from "@/utils/fetch/notify";
import { getGallery } from "@/utils/services/gallery.service";
import { Gallery } from "@/types/models/gallery";

export default function GalleryView() {
  const [data, setData] = useState<Gallery | null>(null);
  const { id } = useParams<{ id: string }>();
  const [loading, setLoading] = useState(true);
  const { notify } = useNotify();

  // ==========================
  // FETCH INITIAL DATA
  // ==========================
  useEffect(() => {
    const init = async () => {
      try {
        setLoading(true);
        const gallery = await getGallery(id);
        setData(gallery);
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
      <Flex align="center" justify="center" className="min-h-[400px]">
        <Spin indicator={<LoadingOutlined spin />} size="large" />
      </Flex>
    );
  }

  return (
    <div className="p-5 border border-gray-200 rounded-2xl dark:border-gray-800 lg:p-6">
      <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
        <div className="flex flex-col items-center w-full gap-6 xl:flex-row">
          <div className="w-48 h-48 overflow-hidden border border-gray-200 rounded-lg dark:border-gray-800">
            <Image
              width={192}
              height={192}
              src={data?.s3Path || "/images/user/alt-user.png"}
              alt={"Gallery Image"}
              className="object-cover w-full h-full"
            />
          </div>

          <div>
            <h4 className="mb-2 text-lg font-semibold text-center text-gray-800 dark:text-white/90 xl:text-left">
              Detail Galeri
            </h4>
            <div className="flex flex-col items-center gap-1 text-center xl:flex-row xl:gap-3 xl:text-left">
              <p className="text-md text-gray-500 dark:text-gray-400">
                ID: {data?.id}
              </p>
            </div>
          </div>

          <div className="flex items-center order-2 gap-2 grow xl:order-3 xl:justify-end">
            <Link href={`/galleries/edit/${data?.id}`}>
              <Button variant="outline">Edit</Button>
            </Link>
          </div>
        </div>
      </div>

      {/* ====== Detail Info ====== */}
      <div className="mt-6">
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 lg:gap-6">
          <InfoItem label="Keterangan" value={data?.caption || "-"} />
          <InfoItem
            label="Kategori"
            value={
              data?.categories && data.categories.length > 0
                ? data.categories.map((cat) => cat.name).join(", ")
                : "-"
            }
          />
          <InfoItem
            label="Wilayah"
            value={data?.regionName || "-"}
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
  );
}