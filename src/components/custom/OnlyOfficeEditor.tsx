"use client";

import { useEffect, useId, useRef, useState } from "react";
import { useSession } from "next-auth/react";
import { Spin } from "antd";
import { LoadingOutlined } from "@ant-design/icons";

declare global {
  interface Window {
    DocsAPI?: any;
  }
}

interface OnlyOfficeEditorProps {
  /** URL of the backend endpoint that returns `{ data: <DocsAPI config> }` */
  configUrl: string;
  height?: string;
  className?: string;
}

const OO_SERVER = process.env.NEXT_PUBLIC_ONLYOFFICE_SERVER_URL;

export default function OnlyOfficeEditor({ configUrl, height = "600px", className }: OnlyOfficeEditorProps) {
  const uid = useId().replace(/:/g, "");
  const editorId = `oo-editor-${uid}`;
  const editorRef = useRef<any>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [errorMsg, setErrorMsg] = useState("");
  const { data: session } = useSession();

  useEffect(() => {
    if (!OO_SERVER) {
      setErrorMsg("NEXT_PUBLIC_ONLYOFFICE_SERVER_URL belum dikonfigurasi.");
      setStatus("error");
      return;
    }

    let destroyed = false;

    const init = async () => {
      try {
        const token = (session?.user as any)?.token;
        const res = await fetch(configUrl, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        if (!res.ok) throw new Error("Gagal memuat konfigurasi editor");
        const { data: docConfig } = await res.json();

        if (destroyed) return;

        const editorConfig = { ...docConfig, height, width: "100%" };

        const launch = () => {
          if (destroyed || !window.DocsAPI) return;
          editorRef.current = new window.DocsAPI.DocEditor(editorId, editorConfig);
          setStatus("ready");
        };

        if (window.DocsAPI) {
          launch();
          return;
        }

        // Load the OnlyOffice API script once
        const existing = document.getElementById("oo-api-script");
        if (existing) {
          existing.addEventListener("load", launch);
          return;
        }

        const script = document.createElement("script");
        script.id = "oo-api-script";
        script.src = `${OO_SERVER}/web-apps/apps/api/documents/api.js`;
        script.onload = launch;
        script.onerror = () => {
          setErrorMsg("Gagal memuat OnlyOffice editor. Pastikan server OnlyOffice aktif.");
          setStatus("error");
        };
        document.head.appendChild(script);
      } catch (err: any) {
        if (!destroyed) {
          setErrorMsg(err.message || "Gagal membuka editor");
          setStatus("error");
        }
      }
    };

    init();

    return () => {
      destroyed = true;
      try { editorRef.current?.destroyEditor?.(); } catch { /* ignore */ }
      editorRef.current = null;
    };
  }, [configUrl, height, session, editorId]);

  if (!OO_SERVER) return null;

  return (
    <div className={className} style={{ position: "relative", minHeight: height }}>
      {status === "loading" && (
        <div className="absolute inset-0 flex items-center justify-center bg-white/80 dark:bg-gray-900/80 z-10 rounded-lg">
          <Spin indicator={<LoadingOutlined spin />} size="large" />
          <span className="ml-3 text-sm text-gray-500">Memuat editor...</span>
        </div>
      )}
      {status === "error" && (
        <div className="p-4 text-red-500 border border-red-200 rounded-lg text-sm bg-red-50">
          {errorMsg}
        </div>
      )}
      <div id={editorId} style={{ height, width: "100%", display: status === "error" ? "none" : undefined }} />
    </div>
  );
}
