"use client";

import { useState, useCallback, useMemo } from "react";
import { useSession } from "next-auth/react";
import { Modal } from "antd";
import DataTable from "@/components/custom/table/DataTable";
import { Letter } from "@/types/models/letter";
import { getDraftLetters, deleteLetter, submitLetter } from "@/utils/services/letter.service";
import { getDraftColumns } from "./letters.columns";
import { useNotify } from "@/context/NotificationContext";

export default function DraftsTable() {
  const { data: session } = useSession();
  const isAdmin = session?.user?.role === "admin" || session?.user?.role === "superadmin";

  const { notify } = useNotify();
  const [refreshKey, setRefreshKey] = useState(0);
  const [submitModalOpen, setSubmitModalOpen] = useState(false);
  const [submitId, setSubmitId] = useState<number | null>(null);
  const [submitLoading, setSubmitLoading] = useState(false);

  const openSubmitModal = useCallback((id: number) => {
    setSubmitId(id);
    setSubmitModalOpen(true);
  }, []);

  const handleSubmit = async () => {
    if (submitId === null) return;
    try {
      setSubmitLoading(true);
      const res = await submitLetter(submitId);
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || "Gagal mengajukan surat");
      }
      notify("success", "Surat berhasil diajukan untuk persetujuan!");
      setSubmitModalOpen(false);
      setRefreshKey((prev) => prev + 1);
    } catch (err: any) {
      notify("error", err.message || "Gagal mengajukan surat");
    } finally {
      setSubmitLoading(false);
    }
  };

  const columns = useMemo(() => getDraftColumns(openSubmitModal, session?.user?.role), [openSubmitModal, session?.user?.role]);

  return (
    <>
      <DataTable<Letter>
        key={refreshKey}
        fetchData={getDraftLetters}
        deleteItem={deleteLetter}
        columns={columns}
        rowKey="id"
        title="Draft Surat"
        createPath="/letters/drafts/create"
        deleteConfirmTitle="Hapus Surat"
        deleteConfirmMessage="Apakah Anda yakin ingin menghapus surat ini?"
        deleteSuccessMessage="Surat berhasil dihapus"
      />

      <Modal
        title="Ajukan Surat"
        open={submitModalOpen}
        onOk={handleSubmit}
        onCancel={() => setSubmitModalOpen(false)}
        okText={submitLoading ? "Memproses..." : "Ajukan"}
        cancelText="Batal"
        confirmLoading={submitLoading}
      >
        <p>Apakah Anda yakin ingin mengajukan surat ini untuk persetujuan?</p>
      </Modal>
    </>
  );
}
