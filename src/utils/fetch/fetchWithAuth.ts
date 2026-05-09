import { getSession } from "next-auth/react";
import snakecaseKeys from "snakecase-keys";

export async function fetchWithAuth(
  url: string,
  options: RequestInit = {}
): Promise<Response> {
  const session = await getSession();
  if (!session) throw new Error("No active session");

  const token = session.user?.token;
  if (!token) throw new Error("No token provider");

  const headers = new Headers(options.headers);
  headers.set("Authorization", `Bearer ${token}`);

  let body = options.body as any;

  // =====================================
  // AUTO-CONVERT BODY
  // =====================================

  if (body && typeof body === "object" && !(body instanceof FormData)) {
    const hasFile = Object.values(body).some((v) => v instanceof File);

    if (hasFile) {
      const fd = new FormData();
      const snake = snakecaseKeys(body, { deep: false });

      Object.entries(snake).forEach(([key, value]) => {
        if (value === null || value === undefined) return;

        if (value instanceof File) {
          fd.append(key, value);
        } else {
          fd.append(key, value.toString());
        }
      });

      body = fd;
      headers.delete("Content-Type");
    } else {
      const snakeBody = snakecaseKeys(body, { deep: true });
      body = JSON.stringify(snakeBody);
      headers.set("Content-Type", "application/json");
    }
  } else if (body instanceof FormData) {
    headers.delete("Content-Type");
  }

  const res = await fetch(url, {
    ...options,
    headers,
    body,
    cache: "no-store",
  });

  // Dispatch session expired event so the UI can show a non-closeable logout modal
  if ((res.status === 401 || res.status === 403) && typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("session_expired"));
  }

  return res;
}
