import type { Metadata } from "next";
import PendingLettersTable from "@/modules/letters/letters.pending";

export const metadata: Metadata = {
  title: "Surat Menunggu Persetujuan",
};

export default function PendingLettersPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col space-y-2">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Surat Menunggu Persetujuan
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Daftar surat yang menunggu persetujuan Anda
        </p>
      </div>
      
      <PendingLettersTable />
    </div>
  );
}
