import type { Metadata } from "next";
import LetterForm from "@/modules/letters/letters.form";

export const metadata: Metadata = {
  title: "Buat Surat Baru",
};

export default function CreateLetterPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col space-y-2">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Buat Surat Baru
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Buat surat baru dan ajukan untuk persetujuan
        </p>
      </div>
      
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <LetterForm />
      </div>
    </div>
  );
}
