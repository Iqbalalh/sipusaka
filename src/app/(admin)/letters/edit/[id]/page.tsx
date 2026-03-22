import type { Metadata } from "next";
import LetterForm from "@/modules/letters/letters.form";

export const metadata: Metadata = {
  title: "Edit Surat",
};

interface EditLetterPageProps {
  params: {
    id: string;
  };
}

export default function EditLetterPage({ params }: EditLetterPageProps) {
  return (
    <div className="space-y-6">
      <div className="flex flex-col space-y-2">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Edit Surat
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Edit surat dan ajukan kembali untuk persetujuan
        </p>
      </div>
      
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <LetterForm id={params.id} />
      </div>
    </div>
  );
}
