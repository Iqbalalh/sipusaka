"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Table, Modal, Input, Popconfirm, Button as AntButton, message } from "antd";
import { PlusOutlined, EditOutlined, DeleteOutlined } from "@ant-design/icons";
import type { ColumnsType } from "antd/es/table";

import { Region } from "@/types/models/region";
import {
  getRegions,
  createRegion,
  updateRegion,
  deleteRegion,
} from "@/utils/services/region.service";
import { useNotify } from "@/context/NotificationContext";
import { notifyFromResult } from "@/utils/fetch/notify";
import { formatDate } from "@/utils/formatter/formatDate";

export default function RegionsTable() {
  const { notify } = useNotify();
  const [messageApi, contextHolder] = message.useMessage();

  const [data, setData] = useState<Region[]>([]);
  const [loading, setLoading] = useState(true);

  // Create/edit modal
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Region | null>(null);
  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);

  const [deletingId, setDeletingId] = useState<number | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const rows = await getRegions();
      setData([...rows].sort((a, b) => a.regionId - b.regionId));
    } catch (err) {
      notifyFromResult(notify, { error: err });
      setData([]);
    } finally {
      setLoading(false);
    }
  }, [notify]);

  useEffect(() => {
    load();
  }, [load]);

  const openCreate = () => {
    setEditing(null);
    setName("");
    setModalOpen(true);
  };

  const openEdit = (region: Region) => {
    setEditing(region);
    setName(region.regionName);
    setModalOpen(true);
  };

  const handleSave = async () => {
    const trimmed = name.trim();
    if (!trimmed) {
      messageApi.warning("Nama wilayah wajib diisi");
      return;
    }
    setSaving(true);
    try {
      if (editing) {
        await updateRegion(editing.regionId, trimmed);
        messageApi.success("Wilayah berhasil diperbarui");
      } else {
        await createRegion(trimmed);
        messageApi.success("Wilayah berhasil ditambahkan");
      }
      setModalOpen(false);
      await load();
    } catch (err) {
      notifyFromResult(notify, { error: err });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (region: Region) => {
    setDeletingId(region.regionId);
    try {
      await deleteRegion(region.regionId);
      messageApi.success("Wilayah berhasil dihapus");
      await load();
    } catch (err) {
      notifyFromResult(notify, { error: err });
    } finally {
      setDeletingId(null);
    }
  };

  const columns: ColumnsType<Region> = useMemo(
    () => [
      { title: "ID", dataIndex: "regionId", key: "regionId", width: 80 },
      { title: "Nama Wilayah", dataIndex: "regionName", key: "regionName" },
      {
        title: "Dibuat Pada",
        dataIndex: "createdAt",
        key: "createdAt",
        width: 180,
        render: (v) => (v ? formatDate(v) : "-"),
      },
      {
        title: "Aksi",
        key: "actions",
        width: 130,
        render: (_, region) => (
          <div className="flex gap-2">
            <AntButton size="small" icon={<EditOutlined />} onClick={() => openEdit(region)} />
            <Popconfirm
              title="Hapus wilayah ini?"
              description="Wilayah yang masih dipakai data lain tidak dapat dihapus."
              okText="Hapus"
              cancelText="Batal"
              okButtonProps={{ danger: true }}
              onConfirm={() => handleDelete(region)}
            >
              <AntButton size="small" danger icon={<DeleteOutlined />} loading={deletingId === region.regionId} />
            </Popconfirm>
          </div>
        ),
      },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [deletingId],
  );

  return (
    <>
      {contextHolder}

      <div className="flex justify-between items-center gap-3 mb-5">
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Total: <span className="font-semibold text-gray-800 dark:text-white">{data.length}</span> wilayah
        </p>
        <AntButton type="primary" icon={<PlusOutlined />} onClick={openCreate}>
          Tambah Wilayah
        </AntButton>
      </div>

      <Table
        columns={columns}
        dataSource={data}
        rowKey="regionId"
        bordered
        loading={loading}
        pagination={{ pageSize: 20, showSizeChanger: false, hideOnSinglePage: true }}
        scroll={{ x: "max-content" }}
      />

      <Modal
        title={editing ? "Edit Wilayah" : "Tambah Wilayah"}
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        onOk={handleSave}
        okText="Simpan"
        cancelText="Batal"
        confirmLoading={saving}
      >
        <div className="py-2">
          <label className="block text-sm text-gray-500 dark:text-gray-400 mb-1">Nama Wilayah</label>
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            onPressEnter={handleSave}
            placeholder="Contoh: DAOP 1"
            autoFocus
          />
        </div>
      </Modal>
    </>
  );
}
