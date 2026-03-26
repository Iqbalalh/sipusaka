import LetterView from "@/modules/letters/letters.view";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";

export default function LetterArchiveViewPage() {
  return (
    <div>
      <PageBreadcrumb pageTitle="Detail Surat" />
      <LetterView />
    </div>
  );
}
