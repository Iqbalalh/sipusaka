"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { Input, Select, Button, Spin, Modal } from "antd";
import { LoadingOutlined } from "@ant-design/icons";
import { useNotify } from "@/context/NotificationContext";
import { notifyFromResult } from "@/utils/fetch/notify";
import {
  Letter,
  LetterFormData,
  LetterType,
  createLetter,
  updateLetter,
  getLetterById,
  submitLetter,
} from "@/utils/services/letter.service";
import {
  getTemplateAsHtml,
  getTemplateVariables,
  populateTemplate,
} from "@/utils/services/letter-template.service";
import { getSigners, Signer } from "@/utils/services/user.service";
import { LETTER_TYPE_OPTIONS } from "./letters.constants";
import RichTextEditor from "@/components/editor/RichTextEditor";
import { renderAsync } from "docx-preview";

const { TextArea } = Input;
const { Option } = Select;

interface LetterFormProps {
  id?: string | null;
}

export default function LetterForm({ id }: LetterFormProps) {
  const { notify } = useNotify();
  const router = useRouter();
  const isEditMode = !!id;

  // Form State
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(isEditMode);
  const [showPreview, setShowPreview] = useState(false);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [templateLoading, setTemplateLoading] = useState(false);
  const [templateVariables, setTemplateVariables] = useState<string[]>([]);
  
  // Signers State
  const [signers, setSigners] = useState<Signer[]>([]);
  const [signersLoading, setSignersLoading] = useState(true);
  
  // Preview container ref for docx-preview
  const previewContainerRef = useRef<HTMLDivElement>(null);

  // Form Fields
  const [letterType, setLetterType] = useState<LetterType | null>(null);
  const [letterNumber, setLetterNumber] = useState("");
  const [subject, setSubject] = useState("");
  const [destination, setDestination] = useState("");
  const [tembusan, setTembusan] = useState("");
  const [content, setContent] = useState("");
  const [signer1Id, setSigner1Id] = useState<number | null>(null);
  const [signer2Id, setSigner2Id] = useState<number | null>(null);
  const [signer3Id, setSigner3Id] = useState<number | null>(null);

  // Submit state
  const [submitLoading, setSubmitLoading] = useState(false);

  // ==========================
  // FETCH SIGNERS
  // ==========================
  useEffect(() => {
    const fetchSigners = async () => {
      try {
        const data = await getSigners();
        setSigners(data);
      } catch (error) {
        console.error("Failed to fetch signers:", error);
        notify("error", "Gagal memuat daftar penandatangan");
      } finally {
        setSignersLoading(false);
      }
    };

    fetchSigners();
  }, [notify]);

  // ==========================
  // FETCH INITIAL DATA
  // ==========================
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        if (isEditMode && id) {
          const data = await getLetterById(id);
          setLetterType(data.letterType as LetterType);
          setLetterNumber(data.letterNumber || "");
          setSubject(data.subject);
          setDestination(data.destination);
          setTembusan(data.tembusan || "");
          setContent(data.content || "");
          setSigner1Id(data.signer1Id);
          setSigner2Id(data.signer2Id);
          setSigner3Id(data.signer3Id);
        }
      } catch (err) {
        notifyFromResult(notify, { error: err });
      } finally {
        setInitialLoading(false);
      }
    };

    fetchInitialData();
  }, [id, isEditMode, notify]);

  // ==========================
  // LOAD TEMPLATE FROM S3
  // ==========================
  const handleLetterTypeChange = async (value: LetterType) => {
    setLetterType(value);
    setTemplateLoading(true);
    
    try {
      // Try to load template from S3
      const html = await getTemplateAsHtml(value);
      setContent(html);
      
      // Also get template variables if available
      try {
        const variables = await getTemplateVariables(value);
        setTemplateVariables(variables);
        if (variables.length > 0) {
          notify("info", `Template dimuat. Variabel: ${variables.join(", ")}`);
        }
      } catch {
        // Variables not available, that's okay
        setTemplateVariables([]);
      }
    } catch (error) {
      // Template not found or error - silently fail, user can use manual input
      console.log("No template found for this letter type, using empty editor");
      setTemplateVariables([]);
    } finally {
      setTemplateLoading(false);
    }
  };

  // ==========================
  // GENERATE TEMPLATE PREVIEW
  // ==========================
  const generateTemplatePreview = async () => {
    if (!letterType || !subject || !destination) {
      notify("warning", "Harap isi jenis surat, perihal, dan tujuan terlebih dahulu");
      return;
    }

    setPreviewLoading(true);
    setShowPreview(true);

    try {
      // Prepare form data for template population
      const formData = {
        letterNumber: letterNumber || "........",
        subject,
        destination,
        tembusan: tembusan || "",
        date: new Date().toLocaleDateString("id-ID", {
          day: "numeric",
          month: "long",
          year: "numeric",
        }),
      };

      // Generate docx from template using populateTemplate
      const docxBlob = await populateTemplate(letterType, formData);

      // Wait for modal to be visible before rendering
      await new Promise((resolve) => setTimeout(resolve, 100));

      // Render the docx in the preview container
      if (previewContainerRef.current) {
        // Clear previous content
        previewContainerRef.current.innerHTML = "";
        
        await renderAsync(docxBlob, previewContainerRef.current, undefined, {
          className: "docx-preview-wrapper",
          inWrapper: true,
          ignoreWidth: false,
          ignoreHeight: false,
          ignoreFonts: false,
          breakPages: true,
          ignoreLastRenderedPageBreak: true,
          experimental: false,
          trimXmlDeclaration: true,
          useBase64URL: true,
          renderHeaders: true,
          renderFooters: true,
          renderFootnotes: true,
          renderEndnotes: true,
        });
      }

      // Also generate HTML fallback for the editor
      const templateContent = generateLetterTemplate(letterType, {
        letterNumber,
        subject,
        destination,
        tembusan,
      });
      setContent(templateContent);

    } catch (error) {
      console.error("Error generating preview:", error);
      notify("error", "Gagal membuat preview dokumen. Pastikan template tersedia.");
      setShowPreview(false);
    } finally {
      setPreviewLoading(false);
    }
  };

  // ==========================
  // FORM SUBMIT (SAVE DRAFT)
  // ==========================
  const handleSaveDraft = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const formData: LetterFormData = {
        letterType: letterType!,
        letterNumber: letterNumber || null,
        subject,
        destination,
        tembusan: tembusan || null,
        content: content || null,
        signer1Id,
        signer2Id,
        signer3Id,
      };

      if (isEditMode && id) {
        await updateLetter(id, formData);
        notifyFromResult(notify, {
          successMessage: "Surat berhasil diperbarui",
        });
      } else {
        await createLetter(formData);
        notifyFromResult(notify, {
          successMessage: "Surat berhasil dibuat",
        });
      }

      router.push("/letters/drafts");
    } catch (err) {
      notifyFromResult(notify, { error: err });
    } finally {
      setLoading(false);
    }
  };

  // ==========================
  // SUBMIT FOR APPROVAL
  // ==========================
  const handleSubmitForApproval = async () => {
    if (!signer1Id) {
      notify("warning", "Harap pilih minimal satu penandatangan");
      return;
    }

    setSubmitLoading(true);
    try {
      // First save the letter
      const formData: LetterFormData = {
        letterType: letterType!,
        letterNumber: letterNumber || null,
        subject,
        destination,
        tembusan: tembusan || null,
        content: content || null,
        signer1Id,
        signer2Id,
        signer3Id,
      };

      let letterId = id;
      if (isEditMode && id) {
        await updateLetter(id, formData);
      } else {
        const response = await createLetter(formData);
        // Extract ID from response if needed
        letterId = null; // Will need to handle this based on actual response
      }

      // Then submit for approval
      if (letterId) {
        await submitLetter(letterId);
      }

      notifyFromResult(notify, {
        successMessage: "Surat berhasil diajukan untuk persetujuan",
      });

      router.push("/letters/drafts");
    } catch (err) {
      notifyFromResult(notify, { error: err });
    } finally {
      setSubmitLoading(false);
    }
  };

  // ==========================
  // LOADING STATE
  // ==========================
  if (initialLoading) {
    return (
      <div className="flex justify-center items-center gap-4 h-40 text-gray-500">
        <Spin indicator={<LoadingOutlined spin />} size="large" />
        Memuat data...
      </div>
    );
  }

  // ==========================
  // RENDER
  // ==========================
  return (
    <>
    <form onSubmit={handleSaveDraft} className="space-y-6">
      {/* Letter Type */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Jenis Surat <span className="text-red-500">*</span>
          {templateLoading && (
            <Spin indicator={<LoadingOutlined spin />} size="small" className="ml-2" />
          )}
        </label>
        <Select
          value={letterType}
          onChange={handleLetterTypeChange}
          className="w-full"
          placeholder="Pilih jenis surat"
          loading={templateLoading}
          disabled={templateLoading}
        >
          {LETTER_TYPE_OPTIONS.map((option) => (
            <Option key={option.value} value={option.value}>
              {option.label}
            </Option>
          ))}
        </Select>
        {templateVariables.length > 0 && (
          <p className="text-xs text-gray-500 mt-1">
            Variabel template: {templateVariables.join(", ")}
          </p>
        )}
      </div>

      {/* Letter Number */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Nomor Surat
        </label>
        <Input
          value={letterNumber}
          onChange={(e) => setLetterNumber(e.target.value)}
          placeholder="Masukkan nomor surat (opsional)"
          className="w-full"
        />
      </div>

      {/* Subject */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Perihal <span className="text-red-500">*</span>
        </label>
        <Input
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          placeholder="Masukkan perihal surat"
          className="w-full"
        />
      </div>

      {/* Destination */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Tujuan Surat <span className="text-red-500">*</span>
        </label>
        <TextArea
          value={destination}
          onChange={(e) => setDestination(e.target.value)}
          placeholder="Masukkan tujuan surat"
          rows={3}
          className="w-full"
        />
      </div>

      {/* Tembusan */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Tembusan
        </label>
        <TextArea
          value={tembusan}
          onChange={(e) => setTembusan(e.target.value)}
          placeholder="Masukkan tembusan (pisahkan dengan koma)"
          rows={2}
          className="w-full"
        />
      </div>

      {/* Signers */}
      <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg space-y-4">
        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">
          Penandatangan <span className="text-red-500">*</span> (Min. 1, Max. 3)
        </h4>

        {/* Signer 1 */}
        <div>
          <label className="block text-xs text-gray-500 mb-1">Penandatangan 1 (Wajib)</label>
          <Select
            value={signer1Id}
            onChange={(value) => setSigner1Id(value)}
            className="w-full"
            placeholder="Pilih penandatangan pertama"
            allowClear
            loading={signersLoading}
            disabled={signersLoading}
          >
            {signers.map((signer) => (
              <Option key={signer.id} value={signer.id}>
                {signer.staffName ? `${signer.staffName}` : signer.username}
                {signer.staffPosition ? ` (${signer.staffPosition})` : ""}
              </Option>
            ))}
          </Select>
        </div>

        {/* Signer 2 */}
        <div>
          <label className="block text-xs text-gray-500 mb-1">Penandatangan 2 (Opsional)</label>
          <Select
            value={signer2Id}
            onChange={(value) => setSigner2Id(value)}
            className="w-full"
            placeholder="Pilih penandatangan kedua"
            allowClear
            loading={signersLoading}
            disabled={signersLoading}
          >
            {signers.filter((s) => s.id !== signer1Id).map((signer) => (
              <Option key={signer.id} value={signer.id}>
                {signer.staffName ? `${signer.staffName}` : signer.username}
                {signer.staffPosition ? ` (${signer.staffPosition})` : ""}
              </Option>
            ))}
          </Select>
        </div>

        {/* Signer 3 */}
        <div>
          <label className="block text-xs text-gray-500 mb-1">Penandatangan 3 (Opsional)</label>
          <Select
            value={signer3Id}
            onChange={(value) => setSigner3Id(value)}
            className="w-full"
            placeholder="Pilih penandatangan ketiga"
            allowClear
            loading={signersLoading}
            disabled={signersLoading}
          >
            {signers.filter((s) => s.id !== signer1Id && s.id !== signer2Id).map((signer) => (
              <Option key={signer.id} value={signer.id}>
                {signer.staffName ? `${signer.staffName}` : signer.username}
                {signer.staffPosition ? ` (${signer.staffPosition})` : ""}
              </Option>
            ))}
          </Select>
        </div>
      </div>

      {/* Generate Template Button */}
      <div className="flex gap-2">
        <Button
          type="default"
          onClick={generateTemplatePreview}
          disabled={!letterType || !subject || !destination}
        >
          Generate Template
        </Button>
      </div>

      {/* Content Editor */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Konten Surat
        </label>
        <div className="bg-white dark:bg-gray-800 rounded-lg">
          <RichTextEditor
            value={content}
            onChange={setContent}
            placeholder="Ketik konten surat di sini..."
            height="400px"
          />
        </div>
      </div>

      {/* Submit Buttons */}
      <div className="flex gap-4 justify-end">
        <Button
          type="default"
          onClick={() => router.push("/letters")}
          disabled={loading}
        >
          Batal
        </Button>
        <Button
          type="default"
          onClick={handleSaveDraft}
          loading={loading}
        >
          Simpan Draf
        </Button>
        <Button
          type="primary"
          onClick={handleSubmitForApproval}
          loading={submitLoading}
          className="bg-blue-600 hover:bg-blue-700"
          disabled={!signer1Id}
        >
          Ajukan Persetujuan
        </Button>
      </div>
    </form>

    {/* Document Preview Modal */}
    <Modal
      title="Preview Dokumen"
      open={showPreview}
      onCancel={() => setShowPreview(false)}
      width={900}
      footer={null}
      centered
    >
      {previewLoading && (
        <div className="flex justify-center items-center py-8">
          <Spin indicator={<LoadingOutlined spin />} size="large" />
          <span className="ml-2">Memuat preview...</span>
        </div>
      )}
      <div
        ref={previewContainerRef}
        className="docx-preview-container"
        style={{
          height: "70vh",
          overflow: "auto",
          display: previewLoading ? "none" : "block"
        }}
      />
    </Modal>
  </>
  );
}

// ==============================================
// LETTER TEMPLATE GENERATOR
// ==============================================
function generateLetterTemplate(
  type: LetterType,
  data: {
    letterNumber?: string;
    subject: string;
    destination: string;
    tembusan?: string;
  }
): string {
  const today = new Date().toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const templates: Record<LetterType, string> = {
    BANTUAN_PENDIDIKAN: `
      <h2 style="text-align: center;">SURAT KETERANGAN BANTUAN PENDIDIKAN</h2>
      <p style="text-align: center;">Nomor: ${data.letterNumber || "........"}</p>
      <br/>
      <p>Yang bertanda tangan di bawah ini menerangkan bahwa:</p>
      <br/>
      <table>
        <tr><td>Nama</td><td>: </td></tr>
        <tr><td>Tempat/Tgl Lahir</td><td>: </td></tr>
        <tr><td>Jenis Kelamin</td><td>: </td></tr>
        <tr><td>Alamat</td><td>: </td></tr>
        <tr><td>Sekolah/Universitas</td><td>: </td></tr>
        <tr><td>Kelas/Semester</td><td>: </td></tr>
      </table>
      <br/>
      <p>Adalah benar siswa/siswi/mahasiswa yang memerlukan bantuan pendidikan.</p>
      <br/>
      <p>Demikian surat keterangan ini dibuat untuk dapat dipergunakan sebagaimana mestinya.</p>
      <br/><br/>
      <p>Tanggal: ${today}</p>
      <br/><br/><br/>
      <p>Kepala Yayasan</p>
    `,
    BANTUAN_SOSIAL: `
      <h2 style="text-align: center;">SURAT KETERANGAN BANTUAN SOSIAL</h2>
      <p style="text-align: center;">Nomor: ${data.letterNumber || "........"}</p>
      <br/>
      <p>Yang bertanda tangan di bawah ini menerangkan bahwa:</p>
      <br/>
      <table>
        <tr><td>Nama</td><td>: </td></tr>
        <tr><td>NIK</td><td>: </td></tr>
        <tr><td>Tempat/Tgl Lahir</td><td>: </td></tr>
        <tr><td>Jenis Kelamin</td><td>: </td></tr>
        <tr><td>Alamat</td><td>: </td></tr>
        <tr><td>Pekerjaan</td><td>: </td></tr>
      </table>
      <br/>
      <p>Adalah benar warga yang memerlukan bantuan sosial.</p>
      <br/>
      <p>Demikian surat keterangan ini dibuat untuk dapat dipergunakan sebagaimana mestinya.</p>
      <br/><br/>
      <p>Tanggal: ${today}</p>
      <br/><br/><br/>
      <p>Kepala Yayasan</p>
    `,
    SURAT_UNDANGAN: `
      <h2 style="text-align: center;">SURAT UNDANGAN</h2>
      <p style="text-align: center;">Nomor: ${data.letterNumber || "........"}</p>
      <br/>
      <p>Kepada Yth.</p>
      <p>${data.destination}</p>
      <p>di Tempat</p>
      <br/>
      <p>Dengan hormat,</p>
      <p>Dengan ini kami mengundang Bapak/Ibu/Saudara/i untuk menghadiri acara:</p>
      <br/>
      <table>
        <tr><td>Hari/Tanggal</td><td>: </td></tr>
        <tr><td>Waktu</td><td>: </td></tr>
        <tr><td>Tempat</td><td>: </td></tr>
        <tr><td>Acara</td><td>: </td></tr>
      </table>
      <br/>
      <p>Demikian surat undangan ini kami sampaikan. Atas perhatian dan kehadirannya, kami ucapkan terima kasih.</p>
      <br/><br/>
      <p>Tanggal: ${today}</p>
      <br/><br/><br/>
      <p>Kepala Yayasan</p>
    `,
    SURAT_PERMOHONAN: `
      <h2 style="text-align: center;">SURAT PERMOHONAN</h2>
      <p style="text-align: center;">Nomor: ${data.letterNumber || "........"}</p>
      <br/>
      <p>Kepada Yth.</p>
      <p>${data.destination}</p>
      <p>di Tempat</p>
      <br/>
      <p>Dengan hormat,</p>
      <p>Dengan ini kami mengajukan permohonan:</p>
      <br/>
      <table>
        <tr><td>Perihal</td><td>: ${data.subject}</td></tr>
      </table>
      <br/>
      <p>Sebagai bahan pertimbangan, bersama ini kami lampirkan:</p>
      <ol>
        <li>........</li>
        <li>........</li>
      </ol>
      <br/>
      <p>Demikian surat permohonan ini kami ajukan. Atas perhatian dan kerjasamanya, kami ucapkan terima kasih.</p>
      <br/><br/>
      <p>Tanggal: ${today}</p>
      <br/><br/><br/>
      <p>Kepala Yayasan</p>
    `,
    SURAT_KEPUTUSAN: `
      <h2 style="text-align: center;">SURAT KEPUTUSAN</h2>
      <p style="text-align: center;">Nomor: ${data.letterNumber || "........"}</p>
      <br/>
      <p style="text-align: center;">TENTANG</p>
      <p style="text-align: center;"><strong>${data.subject.toUpperCase()}</strong></p>
      <br/>
      <p>Kepala Yayasan Pusaka Kai,</p>
      <p>Menimbang :</p>
      <ol type="a">
        <li>........</li>
        <li>........</li>
      </ol>
      <p>Mengingat :</p>
      <ol type="a">
        <li>........</li>
        <li>........</li>
      </ol>
      <p>Memperhatikan :</p>
      <ol type="a">
        <li>........</li>
      </ol>
      <br/>
      <p><strong>MEMUTUSKAN</strong></p>
      <br/>
      <p>Menetapkan :</p>
      <ol type="1">
        <li>........</li>
        <li>........</li>
        <li>Surat keputusan ini berlaku sejak tanggal ditetapkan.</li>
      </ol>
      <br/><br/>
      <p>Ditetapkan di : ........</p>
      <p>Pada tanggal : ${today}</p>
      <br/><br/><br/>
      <p>Kepala Yayasan</p>
    `,
  };

  return templates[type] || "";
}
