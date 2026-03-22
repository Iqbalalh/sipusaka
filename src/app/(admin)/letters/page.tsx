import type { Metadata } from "next";
import Link from "next/link";
import { 
  FaBoxArchive, 
  FaFileLines, 
  FaClock, 
  FaFileWord 
} from "react-icons/fa6";

export const metadata: Metadata = {
  title: "Manajemen Surat",
};

const menuItems = [
  {
    title: "Arsip Surat",
    description: "Daftar surat yang telah diarsipkan",
    icon: FaBoxArchive,
    href: "/letters/archives",
    color: "bg-blue-500",
  },
  {
    title: "Draf Surat",
    description: "Buat dan kelola draf surat",
    icon: FaFileLines,
    href: "/letters/drafts",
    color: "bg-yellow-500",
  },
  {
    title: "Menunggu Persetujuan",
    description: "Surat yang menunggu persetujuan",
    icon: FaClock,
    href: "/letters/pending",
    color: "bg-orange-500",
  },
  {
    title: "Template Surat",
    description: "Kelola template dokumen surat",
    icon: FaFileWord,
    href: "/letters/templates",
    color: "bg-purple-500",
  },
];

export default function LettersPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col space-y-2">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Manajemen Surat
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Kelola arsip, draf, dan template surat
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {menuItems.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className="group block p-6 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-all duration-200 hover:border-brand-500 dark:hover:border-brand-500"
            >
              <div className="flex items-center gap-4">
                <div className={`p-3 rounded-lg ${item.color} text-white`}>
                  <Icon className="w-6 h-6" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900 dark:text-white group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors">
                    {item.title}
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    {item.description}
                  </p>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
