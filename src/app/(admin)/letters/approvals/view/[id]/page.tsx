import LetterApprovalView from "@/modules/letters/letters.approval-view";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";

export default function LetterApprovalViewPage() {
  return (
    <div>
      <PageBreadcrumb pageTitle="Persetujuan Surat" />
      <LetterApprovalView />
    </div>
  );
}
