import type { Metadata } from "next";
import LetterView from "@/modules/letters/letters.view";

export const metadata: Metadata = {
  title: "Detail Surat",
};

interface ViewLetterPageProps {
  params: {
    id: string;
  };
}

export default function ViewLetterPage({ params }: ViewLetterPageProps) {
  return <LetterView id={params.id} />;
}
