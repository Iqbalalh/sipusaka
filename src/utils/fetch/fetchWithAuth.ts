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
      // Convert to snake case
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
      body = JSON.stringify(snakecaseKeys(body, { deep: true }));
      headers.set("Content-Type", "application/json");
    }
  }

  const res = await fetch(url, {
    ...options,
    headers,
    body,
  });

  return res;
}
