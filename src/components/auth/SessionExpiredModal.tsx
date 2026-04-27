"use client";

import { useEffect, useState } from "react";
import { Modal, Button } from "antd";
import { signOut } from "next-auth/react";

export const SESSION_EXPIRED_EVENT = "session_expired";

export function SessionExpiredModal() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const handler = () => setVisible(true);
    window.addEventListener(SESSION_EXPIRED_EVENT, handler);
    return () => window.removeEventListener(SESSION_EXPIRED_EVENT, handler);
  }, []);

  return (
    <Modal
      open={visible}
      title="Sesi Berakhir"
      closable={false}
      maskClosable={false}
      keyboard={false}
      footer={null}
      centered
      width={400}
    >
      <p className="text-gray-600 mb-6 mt-2">
        Sesi Anda telah berakhir atau akun Anda telah dinonaktifkan. Silakan login kembali untuk melanjutkan.
      </p>
      <Button
        type="primary"
        danger
        block
        size="large"
        onClick={() => signOut({ callbackUrl: "/signin" })}
      >
        Logout dan Login Ulang
      </Button>
    </Modal>
  );
}
