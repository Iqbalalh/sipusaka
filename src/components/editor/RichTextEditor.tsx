"use client";

import React, { useRef, useState, useEffect } from "react";
import Quill from "quill";
import "quill/dist/quill.snow.css";
import mammoth from "mammoth";
import { saveAs } from "file-saver";
import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
  AlignmentType,
} from "docx";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

interface RichTextEditorProps {
  value?: string;
  onChange?: (content: string) => void;
  placeholder?: string;
  height?: string;
}

export default function RichTextEditor({
  value = "",
  onChange,
  placeholder = "Start typing your document...",
  height = "400px",
}: RichTextEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const quillInstanceRef = useRef<Quill | null>(null);
  const [loading, setLoading] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const handlerRef = useRef<(() => void) | null>(null);

  // Initialize Quill editor
  useEffect(() => {
    if (!editorRef.current || isInitialized) return;

    const toolbarOptions = [
      [{ header: [1, 2, 3, 4, 5, 6, false] }],
      ["bold", "italic", "underline", "strike"],
      [{ color: [] }, { background: [] }],
      [{ list: "ordered" }, { list: "bullet" }],
      [{ align: [] }],
      ["link", "image"],
      ["clean"],
    ];

    quillInstanceRef.current = new Quill(editorRef.current, {
      modules: {
        toolbar: toolbarOptions,
        clipboard: {
          matchVisual: true,
        },
      },
      placeholder,
      theme: "snow",
    });

    // Set initial content
    if (value) {
      quillInstanceRef.current.root.innerHTML = value;
    }

    // Handle text changes
    handlerRef.current = () => {
      if (onChange && quillInstanceRef.current) {
        onChange(quillInstanceRef.current.root.innerHTML);
      }
    };

    quillInstanceRef.current.on("text-change", handlerRef.current);

    setIsInitialized(true);

    return () => {
      if (quillInstanceRef.current && handlerRef.current) {
        quillInstanceRef.current.off("text-change", handlerRef.current);
        quillInstanceRef.current = null;
      }
    };
  }, [isInitialized, placeholder, onChange, value]);

  // Update content when value prop changes
  useEffect(() => {
    if (
      quillInstanceRef.current &&
      value !== quillInstanceRef.current.root.innerHTML
    ) {
      quillInstanceRef.current.root.innerHTML = value;
    }
  }, [value]);

  // Handle file import (.docx)
  const handleImportDocx = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setLoading(true);
    try {
      const arrayBuffer = await file.arrayBuffer();
      const result = await mammoth.convertToHtml({ arrayBuffer });

      if (quillInstanceRef.current) {
        quillInstanceRef.current.root.innerHTML = result.value;
        if (onChange) {
          onChange(result.value);
        }
      }
    } catch (error) {
      console.error("Error importing .docx file:", error);
      alert("Failed to import .docx file. Please try again.");
    } finally {
      setLoading(false);
      event.target.value = "";
    }
  };

  // Helper function to parse HTML and convert to docx elements
  const parseHtmlToDocx = (html: string): Paragraph[] => {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, "text/html");
    const paragraphs: Paragraph[] = [];

    interface FormatState {
      bold: boolean;
      italics: boolean;
      underline: boolean;
    }

    const processNode = (node: Node, format: FormatState): TextRun[] => {
      const runs: TextRun[] = [];

      if (node.nodeType === Node.TEXT_NODE) {
        runs.push(
          new TextRun({
            text: node.textContent || "",
            bold: format.bold,
            italics: format.italics,
            underline: format.underline ? {} : undefined,
          })
        );
      } else if (node.nodeType === Node.ELEMENT_NODE) {
        const element = node as Element;
        const tagName = element.tagName.toLowerCase();

        // Update format state based on tag
        const newFormat: FormatState = {
          bold: format.bold,
          italics: format.italics,
          underline: format.underline,
        };

        if (tagName === "strong" || tagName === "b") {
          newFormat.bold = true;
        } else if (tagName === "em" || tagName === "i") {
          newFormat.italics = true;
        } else if (tagName === "u") {
          newFormat.underline = true;
        }

        // Process child nodes with updated format
        for (const child of Array.from(element.childNodes)) {
          runs.push(...processNode(child, newFormat));
        }
      }

      return runs;
    };

    // Process top-level elements
    const processElement = (element: Element) => {
      const tagName = element.tagName.toLowerCase();

      if (tagName === "h1") {
        paragraphs.push(
          new Paragraph({
            children: processNode(element, { bold: false, italics: false, underline: false }),
            heading: HeadingLevel.HEADING_1,
          })
        );
      } else if (tagName === "h2") {
        paragraphs.push(
          new Paragraph({
            children: processNode(element, { bold: false, italics: false, underline: false }),
            heading: HeadingLevel.HEADING_2,
          })
        );
      } else if (tagName === "h3") {
        paragraphs.push(
          new Paragraph({
            children: processNode(element, { bold: false, italics: false, underline: false }),
            heading: HeadingLevel.HEADING_3,
          })
        );
      } else if (tagName === "ul" || tagName === "ol") {
        const listItems = element.querySelectorAll("li");
        listItems.forEach((li) => {
          paragraphs.push(
            new Paragraph({
              children: processNode(li, { bold: false, italics: false, underline: false }),
              bullet: tagName === "ul" ? { level: 0 } : undefined,
              numbering:
                tagName === "ol"
                  ? { reference: "my-numbering", level: 0 }
                  : undefined,
            })
          );
        });
      } else if (tagName === "p" || tagName === "div") {
        paragraphs.push(
          new Paragraph({
            children: processNode(element, { bold: false, italics: false, underline: false }),
          })
        );
      } else if (tagName === "br") {
        paragraphs.push(new Paragraph({ text: "" }));
      } else if (element.textContent && element.textContent.trim()) {
        // For other inline elements, add as paragraph
        paragraphs.push(
          new Paragraph({
            children: processNode(element, { bold: false, italics: false, underline: false }),
          })
        );
      }
    };

    // Process all direct children of body
    Array.from(doc.body.children).forEach((child) => {
      processElement(child);
    });

    // If no paragraphs were created but there's text content, add it
    if (paragraphs.length === 0 && doc.body.textContent) {
      paragraphs.push(new Paragraph({ text: doc.body.textContent }));
    }

    return paragraphs;
  };

  // Export to .docx
  const handleExportDocx = async () => {
    if (!quillInstanceRef.current) return;

    setLoading(true);
    try {
      const content = quillInstanceRef.current.root.innerHTML;

      // Parse HTML content and convert to docx structure
      const paragraphs = parseHtmlToDocx(content);

      // Create the document
      const doc = new Document({
        sections: [
          {
            properties: {},
            children: paragraphs,
          },
        ],
        numbering: {
          config: [
            {
              reference: "my-numbering",
              levels: [
                {
                  level: 0,
                  format: "decimal",
                  text: "%1.",
                  alignment: AlignmentType.LEFT,
                },
              ],
            },
          ],
        },
      });

      // Generate and download the document
      const blob = await Packer.toBlob(doc);
      saveAs(blob, "document.docx");
    } catch (error) {
      console.error("Error exporting to .docx:", error);
      alert("Failed to export to .docx. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Export to PDF
  const handleExportPdf = async () => {
    if (!quillInstanceRef.current) return;

    setLoading(true);
    try {
      const container = document.createElement("div");
      container.style.width = "210mm";
      container.style.padding = "20mm";
      container.style.background = "white";
      container.innerHTML = quillInstanceRef.current.root.innerHTML;

      document.body.appendChild(container);

      const canvas = await html2canvas(container, {
        scale: 2,
        useCORS: true,
        logging: false,
      });

      document.body.removeChild(container);

      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF("p", "mm", "a4");
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();

      const imgWidth = pdfWidth;
      const imgHeight = (canvas.height * pdfWidth) / canvas.width;

      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
      heightLeft -= pdfHeight;

      while (heightLeft > 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
        heightLeft -= pdfHeight;
      }

      pdf.save("document.pdf");
    } catch (error) {
      console.error("Error exporting to PDF:", error);
      alert("Failed to export to PDF. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full">
      {/* Toolbar with import/export buttons */}
      <div className="mb-4 flex flex-wrap gap-3 items-center">
        <label className="cursor-pointer inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
          <input
            type="file"
            accept=".docx"
            onChange={handleImportDocx}
            className="hidden"
            disabled={loading}
          />
          <svg
            className="w-5 h-5 mr-2"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
            />
          </svg>
          Import .docx
        </label>

        <button
          onClick={handleExportDocx}
          disabled={loading}
          className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <svg
            className="w-5 h-5 mr-2"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
            />
          </svg>
          Export .docx
        </button>

        <button
          onClick={handleExportPdf}
          disabled={loading}
          className="inline-flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <svg
            className="w-5 h-5 mr-2"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
            />
          </svg>
          Export PDF
        </button>

        {loading && (
          <span className="text-gray-600 flex items-center">
            <svg className="animate-spin h-5 w-5 mr-2" viewBox="0 0 24 24">
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
                fill="none"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            Processing...
          </span>
        )}
      </div>

      {/* Quill Editor */}
      <div className="border border-gray-300 rounded-lg overflow-hidden">
        <div ref={editorRef} style={{ height }} />
      </div>
    </div>
  );
}
