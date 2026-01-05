"use client";
import { App } from "antd";
import { createContext, useContext } from "react";

export type NotifyType = "success" | "error" | "info" | "warning";

type NotifyContextType = {
  notify: (type: NotifyType, message: string) => void;
};

const NotifyContext = createContext<NotifyContextType | null>(null);

export const NotificationProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const { message } = App.useApp();

  const notify = (type: NotifyType, msg: string) => {
    switch (type) {
      case "success":
        message.success(msg);
        break;
      case "error":
        message.error(msg);
        break;
      case "info":
        message.info(msg);
        break;
      case "warning":
        message.warning(msg);
        break;
      default:
        message.info(msg);
    }
  };

  return (
    <NotifyContext.Provider value={{ notify }}>
      {children}
    </NotifyContext.Provider>
  );
};

export const useNotify = () => {
  const ctx = useContext(NotifyContext);
  if (!ctx) {
    throw new Error("useNotify must be used within NotificationProvider");
  }
  return ctx;
};
