import type { Metadata } from "next";
import RichTextEditor from "@/components/editor/RichTextEditor";

export const metadata: Metadata = {
  title: "Document Editor",
};

export default function EditorPage() {
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col space-y-2">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Document Editor
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Create, edit, and export documents with rich text formatting
        </p>
      </div>

      {/* Editor Card */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
        <RichTextEditor
          placeholder="Start typing your document here..."
          height="500px"
        />
      </div>

      {/* Instructions */}
      <div className="bg-blue-50 dark:bg-gray-700 rounded-lg p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
          Features
        </h2>
        <ul className="space-y-2 text-gray-700 dark:text-gray-300">
          <li className="flex items-start">
            <svg className="w-5 h-5 mr-2 text-blue-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <span><strong>Import .docx:</strong> Click the `&quot;`Import .docx`&quot;` button to upload and edit existing Word documents</span>
          </li>
          <li className="flex items-start">
            <svg className="w-5 h-5 mr-2 text-blue-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <span><strong>Export .docx:</strong> Download your document as a Microsoft Word file</span>
          </li>
          <li className="flex items-start">
            <svg className="w-5 h-5 mr-2 text-blue-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <span><strong>Export PDF:</strong> Generate a PDF file of your document with proper formatting</span>
          </li>
          <li className="flex items-start">
            <svg className="w-5 h-5 mr-2 text-blue-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <span><strong>Rich Text Formatting:</strong> Use the toolbar to format text with headers, bold, italic, lists, colors, and more</span>
          </li>
        </ul>
      </div>
    </div>
  );
}