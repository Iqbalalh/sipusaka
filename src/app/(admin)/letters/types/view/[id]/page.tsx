import LetterTypesView from "@/modules/letterTypes/letterTypes.view";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Detail Template Surat",
};

export default async function LetterTypeViewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <LetterTypesView letterTypeId={id} />;
}
