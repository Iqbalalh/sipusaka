import LetterTypesForm from "@/modules/letterTypes/letterTypes.form";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Tambah Template Surat",
};

export default function LetterTypeCreatePage() {
  return <LetterTypesForm mode="create" />;
}
