import type { Metadata } from "next";
import LettersTable from "@/modules/letters/letters.table";

export const metadata: Metadata = {
  title: "Arsip Surat",
};

export default function LettersArchivesPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col space-y-2">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Arsip Surat
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Daftar surat yang telah diarsipkan
        </p>
      </div>
      
      <LettersTable />
    </div>
  );
}
