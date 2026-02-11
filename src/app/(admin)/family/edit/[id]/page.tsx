"use client";

import { useEffect, useState, use } from "react";
import FamilyForm from "@/components/custom/form/FamilyForm";
import { getHomeDetail } from "@/utils/services/home.service";
import { Home } from "@/types/models/home";

export default function EditFamilyPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);
  const [homeData, setHomeData] = useState<Home | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        console.log("Fetching home detail for ID:", resolvedParams.id);
        const data = await getHomeDetail(resolvedParams.id);
        console.log("Home data fetched:", data);
        setHomeData(data);
      } catch (err) {
        console.error("Error fetching home data:", err);
        setError("Failed to load family data");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [resolvedParams.id]);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }

  if (error || !homeData) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="text-red-500">{error || "Data not found"}</div>
      </div>
    );
  }

  return <FamilyForm mode="edit" familyId={resolvedParams.id} homeData={homeData} />;
}
