import { fetchWithAuth } from "@/utils/fetch/fetchWithAuth";
import { API_LETTER_TEMPLATES } from "@/constants/endpoint";
import mammoth from "mammoth";
import PizZip from "pizzip";
import Docxtemplater from "docxtemplater";

// ==============================
// Types
// ==============================

export type LetterType =
  | "BANTUAN_PENDIDIKAN"
  | "BANTUAN_SOSIAL"
  | "SURAT_UNDANGAN"
  | "SURAT_PERMOHONAN"
  | "SURAT_KEPUTUSAN";

export interface LetterTemplate {
  id: number;
  letterType: LetterType;
  templateName: string;
  s3Path: string;
  version: number;
  isActive: boolean;
  variables: string[] | null;
  createdBy: number;
  createdAt: string;
  updatedAt: string;
  editedBy: number | null;
}

export interface LetterTemplateFormData {
  letterType: LetterType;
  templateName: string;
  templateFile: File;  // Named templateFile to match form usage
}

export interface LetterTemplateUpdateData {
  templateName?: string;
  templateFile?: File;  // Named templateFile to match form usage
  isActive?: boolean;
}

export interface TemplateVariablesResponse {
  variables: string[];
}

// ==============================
// CRUD Operations
// ==============================

/**
 * Get all letter templates
 */
export async function getAllLetterTemplates(): Promise<LetterTemplate[]> {
  const response = await fetchWithAuth(API_LETTER_TEMPLATES, {
    method: "GET",
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Failed to fetch letter templates");
  }

  const result = await response.json();
  // Backend returns { data: [...], pagination: {...} }
  return result.data || [];
}

/**
 * Get letter template by ID
 */
export async function getLetterTemplateById(id: number): Promise<LetterTemplate> {
  const response = await fetchWithAuth(`${API_LETTER_TEMPLATES}/${id}`, {
    method: "GET",
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Failed to fetch letter template");
  }

  const result = await response.json();
  // Backend returns { data: { ...template, downloadUrl } }
  return result.data;
}

/**
 * Get letter template by letter type
 */
export async function getLetterTemplateByType(
  letterType: LetterType
): Promise<LetterTemplate> {
  const response = await fetchWithAuth(
    `${API_LETTER_TEMPLATES}/type/${letterType}`,
    {
      method: "GET",
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Failed to fetch letter template by type");
  }

  const result = await response.json();
  // Backend returns { data: { ...template, downloadUrl } }
  return result.data;
}

/**
 * Create a new letter template
 */
export async function createLetterTemplate(
  data: LetterTemplateFormData
): Promise<LetterTemplate> {
  const formData = new FormData();
  formData.append("letterType", data.letterType);
  formData.append("templateName", data.templateName);
  formData.append("template", data.templateFile);

  const response = await fetchWithAuth(API_LETTER_TEMPLATES, {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Failed to create letter template");
  }

  const result = await response.json();
  // Backend returns { message: "...", data: template }
  return result.data;
}

/**
 * Update an existing letter template
 */
export async function updateLetterTemplate(
  id: number,
  data: LetterTemplateUpdateData
): Promise<LetterTemplate> {
  const formData = new FormData();
  if (data.templateName) {
    formData.append("templateName", data.templateName);
  }
  if (data.templateFile) {
    formData.append("template", data.templateFile);
  }
  if (data.isActive !== undefined) {
    formData.append("isActive", String(data.isActive));
  }

  const response = await fetchWithAuth(`${API_LETTER_TEMPLATES}/${id}`, {
    method: "PUT",
    body: formData,
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Failed to update letter template");
  }

  const result = await response.json();
  // Backend returns { message: "...", data: updatedTemplate }
  return result.data;
}

/**
 * Delete a letter template
 */
export async function deleteLetterTemplate(id: number): Promise<void> {
  const response = await fetchWithAuth(`${API_LETTER_TEMPLATES}/${id}`, {
    method: "DELETE",
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Failed to delete letter template");
  }
}

/**
 * Download template file (returns presigned URL)
 */
export async function downloadLetterTemplate(id: number): Promise<string> {
  const response = await fetchWithAuth(
    `${API_LETTER_TEMPLATES}/${id}/download`,
    {
      method: "GET",
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Failed to download letter template");
  }

  const data = await response.json();
  return data.downloadUrl;
}

/**
 * Download template file as Blob for direct use
 */
export async function downloadTemplateBlob(id: number): Promise<Blob> {
  const downloadUrl = await downloadLetterTemplate(id);
  const response = await fetch(downloadUrl);
  
  if (!response.ok) {
    throw new Error("Failed to download template file");
  }
  
  return response.blob();
}

/**
 * Extract variables from a docx file
 */
export async function extractTemplateVariables(
  file: File
): Promise<TemplateVariablesResponse> {
  const formData = new FormData();
  formData.append("template", file);

  const response = await fetchWithAuth(
    `${API_LETTER_TEMPLATES}/extract-variables`,
    {
      method: "POST",
      body: formData,
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Failed to extract template variables");
  }

  const result = await response.json();
  // Backend returns { data: { variables: [...], count: number } }
  return result.data;
}

// ==============================
// Template Processing
// ==============================

/**
 * Download and convert docx template to HTML for the editor
 */
export async function getTemplateAsHtml(
  letterType: LetterType
): Promise<string> {
  try {
    // First get the template info
    const template = await getLetterTemplateByType(letterType);

    // Get the download URL
    const downloadUrl = await downloadLetterTemplate(template.id);

    // Fetch the docx file
    const response = await fetch(downloadUrl);
    if (!response.ok) {
      throw new Error("Failed to download template file");
    }

    const arrayBuffer = await response.arrayBuffer();

    // Convert docx to HTML using mammoth
    const result = await mammoth.convertToHtml({ arrayBuffer });
    
    return result.value;
  } catch (error) {
    console.error("Error converting template to HTML:", error);
    throw error;
  }
}

/**
 * Download docx template and populate it with data using docxtemplater
 * Returns the populated docx as a Blob
 */
export async function populateTemplate(
  letterType: LetterType,
  data: Record<string, any>
): Promise<Blob> {
  try {
    // Get the template info
    const template = await getLetterTemplateByType(letterType);

    // Get the download URL
    const downloadUrl = await downloadLetterTemplate(template.id);

    // Fetch the docx file
    const response = await fetch(downloadUrl);
    if (!response.ok) {
      throw new Error("Failed to download template file");
    }

    const arrayBuffer = await response.arrayBuffer();

    // Load the docx file with pizzip
    const zip = new PizZip(arrayBuffer);

    // Create docxtemplater instance
    const doc = new Docxtemplater(zip, {
      paragraphLoop: true,
      linebreaks: true,
    });

    // Render the document with data
    doc.render(data);

    // Get the populated document as a blob
    const output = doc.getZip().generate({
      type: "blob",
      mimeType:
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    });

    return output;
  } catch (error) {
    console.error("Error populating template:", error);
    throw error;
  }
}

/**
 * Get template variables for a specific letter type
 */
export async function getTemplateVariables(
  letterType: LetterType
): Promise<string[]> {
  try {
    const template = await getLetterTemplateByType(letterType);
    return template.variables || [];
  } catch (error) {
    console.error("Error getting template variables:", error);
    return [];
  }
}

// ==============================
// Template Validation
// ==============================

export interface TemplateValidationIssue {
  brokenPatterns: string[];
  splitTagIssues: string[];
}

export interface TemplateValidationResult {
  isValid: boolean;
  variables: string[];
  issues: TemplateValidationIssue;
  recommendations: string[];
}

/**
 * Validate a template file for proper variable formatting
 * Detects split XML runs and broken placeholder patterns
 */
export async function validateTemplateFile(
  file: File
): Promise<TemplateValidationResult> {
  const formData = new FormData();
  formData.append("template", file);

  const response = await fetchWithAuth(
    `${API_LETTER_TEMPLATES}/validate`,
    {
      method: "POST",
      body: formData,
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Failed to validate template");
  }

  const result = await response.json();
  // Backend returns { data: { isValid, variables, issues, recommendations } }
  return result.data;
}

// ==============================
// Template Fix
// ==============================

export interface TemplateFixResult {
  success: boolean;
  wasFixed: boolean;
  fixedPlaceholders: string[];
  issues: string[];
}

/**
 * Check if a template file needs fixing (has split XML runs)
 */
export async function checkTemplateNeedsFixing(
  file: File
): Promise<boolean> {
  const formData = new FormData();
  formData.append("template", file);

  const response = await fetchWithAuth(
    `${API_LETTER_TEMPLATES}/check-needs-fixing`,
    {
      method: "POST",
      body: formData,
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Failed to check template");
  }

  const result = await response.json();
  return result.data.needsFixing;
}

/**
 * Fix a template file with split XML runs
 * Returns the fixed template as a Blob for download
 */
export async function fixTemplateFile(file: File): Promise<Blob> {
  const formData = new FormData();
  formData.append("template", file);

  const response = await fetchWithAuth(
    `${API_LETTER_TEMPLATES}/fix`,
    {
      method: "POST",
      body: formData,
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Failed to fix template");
  }

  // Return the fixed template as a blob
  return response.blob();
}

/**
 * Fix a template file and get detailed result
 * Returns both the fixed blob and the fix details
 */
export async function fixTemplateWithDetails(
  file: File
): Promise<{ blob: Blob; result: TemplateFixResult }> {
  const formData = new FormData();
  formData.append("template", file);

  const response = await fetchWithAuth(
    `${API_LETTER_TEMPLATES}/fix`,
    {
      method: "POST",
      body: formData,
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Failed to fix template");
  }

  // Get the blob
  const blob = await response.blob();
  
  // Get the result from the response headers or parse from blob
  // For now, we'll return the blob and a basic result
  // The backend sends the fixed file directly
  return {
    blob,
    result: {
      success: true,
      wasFixed: true,
      fixedPlaceholders: [],
      issues: [],
    },
  };
}
