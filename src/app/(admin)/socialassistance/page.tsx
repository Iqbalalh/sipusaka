"use client";

import { useState, useEffect } from "react";
import { Input } from "antd";
import { SearchOutlined, PlusOutlined } from "@ant-design/icons";
import Link from "next/link";
import Button from "@/components/ui/button/Button";
import SocialAssistanceTableWrapper from "@/modules/socialassistance/socialassistance.table";

export default function SocialAssistancePage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [total, setTotal] = useState(0);
  const [debouncedSearch, setDebouncedSearch] = useState("");

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 500);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  return (
    <div className="flex flex-col h-full">
      {/* HEADER - Fixed */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div className="flex flex-col gap-4 w-full sm:w-auto">
          <h3 className="text-base font-medium text-gray-800 dark:text-white/90 whitespace-nowrap">
            Jumlah Data Bantuan Sosial: {total}
          </h3>
          <div className="w-full sm:w-80">
            <Input
              placeholder="Cari data..."
              prefix={<SearchOutlined />}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              allowClear
              className="w-full"
            />
          </div>
        </div>
        <Link href="/socialassistance/create">
          <Button variant="primary" size="sm" className="bg-blue-600 hover:bg-blue-700">
            <PlusOutlined className="mr-2" />
            Tambah Data
          </Button>
        </Link>
      </div>

      {/* TABLE - Scrollable */}
      <div className="flex-1 overflow-hidden">
        <SocialAssistanceTableWrapper 
          searchQuery={debouncedSearch}
          onTotalChange={setTotal}
        />
      </div>
    </div>
  );
}
