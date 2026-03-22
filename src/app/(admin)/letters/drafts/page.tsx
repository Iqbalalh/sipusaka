import type { Metadata } from "next";
import DraftLettersTable from "@/modules/letters/letters.drafts";

export const metadata: Metadata = {
  title: "Draf Surat",
};

export default function DraftLettersPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col space-y-2">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Draf Surat
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Daftar surat yang masih dalam status draf
        </p>
      </div>
      
      <DraftLettersTable />
    </div>
  );
}
