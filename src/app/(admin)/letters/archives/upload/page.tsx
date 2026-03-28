import ArchiveUpload from "@/modules/letters/letters.archive-upload";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import ComponentCard from "@/components/common/ComponentCard";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Upload Arsip Surat",
};

export default function ArchiveUploadPage() {
  return (
    <div>
      <PageBreadcrumb pageTitle="Upload Arsip Surat" />
      <div className="space-y-6">
        <ComponentCard title="Upload Arsip Surat" header={false}>
          <ArchiveUpload />
        </ComponentCard>
      </div>
    </div>
  );
}
