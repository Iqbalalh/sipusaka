"use client";

import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from "react";
import { Spin, Flex } from "antd";
import { LoadingOutlined } from "@ant-design/icons";
import { DocxEditor, type DocxEditorRef } from "@eigenpal/docx-js-editor";
import "@eigenpal/docx-js-editor/styles.css";

export interface DocxJsEditorHandle {
  save: () => Promise<ArrayBuffer | null>;
}

interface DocxJsEditorProps {
  url: string;
  height?: string;
  className?: string;
}

const DocxJsEditor = forwardRef<DocxJsEditorHandle, DocxJsEditorProps>(
  ({ url, height = "600px", className }, ref) => {
    const [buffer, setBuffer] = useState<ArrayBuffer | null>(null);
    const [loadError, setLoadError] = useState<string | null>(null);
    const editorRef = useRef<DocxEditorRef>(null);

    useImperativeHandle(ref, () => ({
      save: async () => {
        if (!editorRef.current) return null;
        return (await editorRef.current.save()) ?? null;
      },
    }));

    useEffect(() => {
      let cancelled = false;
      setBuffer(null);
      setLoadError(null);
      fetch(url)
        .then((r) => {
          if (!r.ok) throw new Error("Gagal mengunduh dokumen");
          return r.arrayBuffer();
        })
        .then((buf) => { if (!cancelled) setBuffer(buf); })
        .catch((err) => { if (!cancelled) setLoadError(err.message); });
      return () => { cancelled = true; };
    }, [url]);

    if (loadError) {
      return (
        <div className="p-4 text-sm text-red-500 border border-dashed border-red-300 rounded-lg">
          {loadError}
        </div>
      );
    }

    if (!buffer) {
      return (
        <Flex align="center" justify="center" style={{ height }}>
          <Spin indicator={<LoadingOutlined spin />} />
        </Flex>
      );
    }

    return (
      <DocxEditor
        ref={editorRef}
        documentBuffer={buffer}
        mode="editing"
        style={{ height, width: "100%" }}
        className={className}
      />
    );
  }
);

DocxJsEditor.displayName = "DocxJsEditor";
export default DocxJsEditor;
