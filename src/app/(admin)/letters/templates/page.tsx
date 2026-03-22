"use client";

import { Suspense } from "react";
import LetterTemplatesTable from "@/modules/letters/templates/letter-templates.table";

export default function LetterTemplatesPage() {
  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white">
          Template Surat
        </h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">
          Kelola template dokumen surat untuk setiap jenis surat
        </p>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <Suspense fallback={<div>Loading...</div>}>
          <LetterTemplatesTable />
        </Suspense>
      </div>
    </div>
  );
}
