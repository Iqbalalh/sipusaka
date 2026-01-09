import { Image } from "antd";
import { Umkm } from "@/types/models/umkm";

interface UmkmPhotosProps {
  data: Umkm | null;
}

export default function UmkmPhotos({ data }: UmkmPhotosProps) {
  return (
    <div className="p-5 border border-gray-200 rounded-2xl dark:border-gray-800 lg:p-6 mt-6">
      {/* <h4 className="text-lg font-semibold text-gray-800 dark:text-white/90 mb-4">
        Foto UMKM
      </h4> */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {[
          data?.umkmPict,
          data?.umkmPict2,
          data?.umkmPict3,
          data?.umkmPict4,
          data?.umkmPict5,
        ].map((photo, index) =>
          photo ? (
            <div key={index} className="relative group">
              <Image.PreviewGroup>
                <Image
                  src={photo}
                  alt={`Foto ${index + 1}`}
                  className="object-cover w-full h-40 rounded-lg border border-gray-200 dark:border-gray-700 cursor-pointer"
                  preview={{
                    cover: <div className="text-white">Lihat</div>,
                  }}
                />
              </Image.PreviewGroup>
            </div>
          ) : null
        )}
        {![data?.umkmPict, data?.umkmPict2, data?.umkmPict3, data?.umkmPict4, data?.umkmPict5].some(Boolean) && (
          <p className="text-gray-500 dark:text-gray-400 col-span-full text-center py-4">
            Belum ada foto yang diunggah.
          </p>
        )}
      </div>
    </div>
  );
}