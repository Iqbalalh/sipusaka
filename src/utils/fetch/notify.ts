import { ApiError } from "@/types/generic/api-error";
import { NotifyType } from "@/context/NotificationContext";

export const notifyFromResult = (
  notify: (type: NotifyType, msg: string) => void,
  params: {
    successMessage?: string;
    error?: any;
  }
) => {
  if (params.error) {
    if (params.error instanceof ApiError) {
      notify("error", params.error.message);
    } else {
      notify("error", "Terjadi kesalahan tidak terduga");
    }
    return;
  }

  if (params.successMessage) {
    notify("success", params.successMessage);
  }
};
