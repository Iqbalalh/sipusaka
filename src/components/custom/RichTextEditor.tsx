"use client";

import { useEffect, useRef } from "react";

interface RichTextEditorProps {
  value: string;
  onChange: (html: string) => void;
  minHeight?: number;
  placeholder?: string;
}

const TOOLBAR = [
  [{ font: [] }],
  [{ size: ["small", false, "large", "huge"] }],
  ["bold", "italic", "underline"],
  [{ color: [] }],
  [{ align: [] }],
  [{ list: "ordered" }, { list: "bullet" }],
  [{ indent: "-1" }, { indent: "+1" }],
  ["clean"],
];

export default function RichTextEditor({
  value,
  onChange,
  minHeight = 400,
  placeholder,
}: RichTextEditorProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const quillRef = useRef<any>(null);
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  useEffect(() => {
    if (quillRef.current || !containerRef.current) return;

    import("quill").then(({ default: Quill }) => {
      if (!containerRef.current || quillRef.current) return;

      const quill = new Quill(containerRef.current, {
        theme: "snow",
        placeholder:
          placeholder ??
          "Tulis konten template surat. Gunakan {nomorSurat}, {tanggalSurat}, {namaField} sebagai variabel.",
        modules: { toolbar: TOOLBAR },
      });

      if (value) quill.root.innerHTML = value;

      quill.on("text-change", () => {
        const html = quill.root.innerHTML;
        onChangeRef.current(html === "<p><br></p>" ? "" : html);
      });

      quillRef.current = quill;
    });

    return () => {
      quillRef.current = null;
    };
  }, []);

  // Sync external value changes (e.g. loading from existing template)
  useEffect(() => {
    if (!quillRef.current) return;
    const current: string = quillRef.current.root.innerHTML;
    if (current !== value && value !== undefined) {
      quillRef.current.root.innerHTML = value || "";
    }
  }, [value]);

  return (
    <div
      className="rounded-lg border border-gray-200 overflow-hidden bg-white"
      style={{ minHeight: minHeight + 42 }}
    >
      <div ref={containerRef} style={{ minHeight }} />
    </div>
  );
}
