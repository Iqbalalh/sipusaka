"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Spin } from "antd";
import { LoadingOutlined, BellOutlined, EditOutlined, CheckCircleOutlined, CloseCircleOutlined } from "@ant-design/icons";
import { getPendingLetters, getDraftLetters } from "@/utils/services/letter.service";
import { Letter } from "@/types/models/letter";

interface NotificationItem {
  id: number;
  type: "approval" | "revision";
  subject: string;
  letterType: string;
  note?: string | null;
  letterId: number;
}

export const LetterNotifications = () => {
  const { data: session } = useSession();
  const router = useRouter();
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!session?.user) return;

    const fetchNotifications = async () => {
      try {
        setLoading(true);
        const currentUserId = Number((session.user as any)?.id);

        const [pendingLetters, draftLetters] = await Promise.all([
          getPendingLetters().catch(() => [] as Letter[]),
          getDraftLetters().catch(() => [] as Letter[]),
        ]);

        const notifications: NotificationItem[] = [];

        // Approval notifications: backend already filters to current user's pending letters
        for (const letter of pendingLetters) {
          notifications.push({
            id: letter.id,
            type: "approval",
            subject: letter.subject,
            letterType: letter.letterType,
            note: null,
            letterId: letter.id,
          });
        }

        // Revision notifications: user's draft letters that have a revisionNote
        for (const letter of draftLetters) {
          if (letter.revisionNote) {
            notifications.push({
              id: letter.id,
              type: "revision",
              subject: letter.subject,
              letterType: letter.letterType,
              note: letter.revisionNote,
              letterId: letter.id,
            });
          }
        }

        setItems(notifications);
      } catch (err) {
        console.error("Failed to fetch letter notifications:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchNotifications();
  }, [session]);

  const dismiss = (key: string) => {
    setDismissed((prev) => new Set(prev).add(key));
  };

  const visible = items.filter((item) => !dismissed.has(`${item.type}-${item.letterId}`));

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-sm text-gray-400 py-2">
        <Spin indicator={<LoadingOutlined spin />} size="small" />
        <span>Memuat notifikasi surat...</span>
      </div>
    );
  }

  if (visible.length === 0) return null;

  return (
    <div className="space-y-2">
      {visible.map((item) => {
        const key = `${item.type}-${item.letterId}`;
        const isApproval = item.type === "approval";

        return (
          <div
            key={key}
            className={`flex items-start gap-3 rounded-xl border px-4 py-3 shadow-sm transition-all ${
              isApproval
                ? "border-amber-200 bg-amber-50 dark:border-amber-700/50 dark:bg-amber-900/20"
                : "border-red-200 bg-red-50 dark:border-red-700/50 dark:bg-red-900/20"
            }`}
          >
            {/* Icon */}
            <div
              className={`mt-0.5 shrink-0 text-lg ${
                isApproval
                  ? "text-amber-500 dark:text-amber-400"
                  : "text-red-500 dark:text-red-400"
              }`}
            >
              {isApproval ? <BellOutlined /> : <CloseCircleOutlined />}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <p
                className={`text-sm font-semibold ${
                  isApproval
                    ? "text-amber-800 dark:text-amber-300"
                    : "text-red-800 dark:text-red-300"
                }`}
              >
                {isApproval
                  ? "Anda diminta untuk menandatangani surat"
                  : "Surat Anda perlu direvisi"}
              </p>
              <p className="mt-0.5 text-sm text-gray-700 dark:text-gray-300 truncate">
                <span className="font-medium">{item.letterType}</span>
                {" — "}
                {item.subject}
              </p>
              {!isApproval && item.note && (
                <p className="mt-1 text-xs text-red-600 dark:text-red-400 italic line-clamp-2">
                  Catatan: {item.note}
                </p>
              )}
            </div>

            {/* Action buttons */}
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() =>
                  isApproval
                    ? router.push(`/letters/approvals/view/${item.letterId}`)
                    : router.push(`/letters/drafts/edit/${item.letterId}`)
                }
                className={`inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                  isApproval
                    ? "bg-amber-500 text-white hover:bg-amber-600 dark:bg-amber-600 dark:hover:bg-amber-500"
                    : "bg-red-500 text-white hover:bg-red-600 dark:bg-red-600 dark:hover:bg-red-500"
                }`}
              >
                {isApproval ? (
                  <>
                    <CheckCircleOutlined />
                    Tinjau
                  </>
                ) : (
                  <>
                    <EditOutlined />
                    Perbaiki
                  </>
                )}
              </button>
              <button
                onClick={() => dismiss(key)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 text-lg leading-none"
                aria-label="Tutup"
              >
                ×
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
};
