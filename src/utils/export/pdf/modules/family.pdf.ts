import jsPDF from "jspdf";
import { Home } from "@/types/models/home";

/* ---------------- HELPERS ---------------- */
const textOrDash = (value: unknown): string => {
  if (value === null || value === undefined) return "-";
  const text = String(value).trim();
  return text === "" ? "-" : text;
};

const loadImageAsBase64 = (url?: string | null): Promise<string | null> =>
  new Promise((resolve) => {
    if (!url) return resolve(null);

    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = url;

    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext("2d");
      ctx?.drawImage(img, 0, 0);
      resolve(canvas.toDataURL("image/jpeg"));
    };

    img.onerror = () => resolve(null);
  });

/* ---------------- MAIN ---------------- */
export const handlePrintFamily = async (
  data: Home | null,
  employeeImage?: string | null,
  partnerImage?: string | null,
  waliImage?: string | null,
  childrenImages?: (string | null)[]
) => {
  if (!data) return;

  const doc = new jsPDF();

  /* ===== MARGIN CONFIG ===== */
  const marginLeft = 15;
  const marginRight = 15;
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const marginBottom = 15;

  const labelX = marginLeft;
  const colonX = marginLeft + 45;
  const valueX = marginLeft + 50;
  const maxValueWidth = pageWidth - valueX - marginRight;

  let y = 15;

  /* ===== HELPER: CHECK AND ADD PAGE ===== */
  const checkPageBreak = (requiredSpace: number) => {
    if (y + requiredSpace > pageHeight - marginBottom) {
      doc.addPage();
      y = 15;
    }
  };

  /* ===== HELPER: ADD TEXT WITH WRAP ===== */
  const addField = (label: string, value: string | null | undefined) => {
    checkPageBreak(10);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.text(label, labelX, y);
    doc.text(":", colonX, y);
    const wrapped = doc.splitTextToSize(textOrDash(value), maxValueWidth);
    doc.text(wrapped, valueX, y);
    y += wrapped.length * 6 + 3;
  };

  /* ===== HEADER WITH PARTNER IMAGE ===== */
  const imgSize = 28;
  const partnerImg = await loadImageAsBase64(
    partnerImage || "/images/user/alt-user.png"
  );

  checkPageBreak(40);
  if (partnerImg) {
    doc.addImage(partnerImg, "JPEG", marginLeft, y, imgSize, imgSize);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.text(textOrDash(data.partner.partnerName), marginLeft + imgSize + 8, y + 10);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(
      `NIP/NIPP: ${textOrDash(data.employee.nipNipp)}`,
      marginLeft + imgSize + 8,
      y + 20
    );
    doc.setTextColor(0);

    y += imgSize + 8;
  } else {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.text(textOrDash(data.partner.partnerName), marginLeft, y + 10);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.text(`NIP/NIPP: ${textOrDash(data.employee.nipNipp)}`, marginLeft, y + 20);

    y += 30;
  }

  /* ===== TITLE ===== */
  checkPageBreak(15);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  y += 0;

  doc.setLineWidth(0.3);
  doc.line(marginLeft, y, pageWidth - marginRight, y);
  y += 5;

  /* ===== WILAYAH ===== */
  checkPageBreak(15);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text("Wilayah", labelX, y);
  y += 6;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.text(textOrDash(data.selectedRegionName), labelX, y);
  y += 10;

  /* ===== EMPLOYEE SECTION ===== */
  checkPageBreak(20);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text("Data Pegawai", labelX, y);
  y += 6;

  // Employee image
  const empImg = await loadImageAsBase64(
    employeeImage || "/images/user/alt-user.png"
  );
  if (empImg) {
    doc.addImage(empImg, "JPEG", pageWidth - marginRight - 20, y - 2, 18, 18);
  }

  const employeeFields = [
    { label: "Nama", value: data.employee.employeeName },
    { label: "Jenis Kelamin", value: data.employee.employeeGender === "M" ? "Laki-laki" : "Perempuan" },
    { label: "Status", value: data.employee.isAccident ? "Kecelakaan" : "Meninggal" },
    { label: "Penyebab", value: data.employee.deathCause },
    { label: "Posisi Terakhir", value: data.employee.lastPosition },
    { label: "Catatan", value: data.employee.notes },
  ];

  employeeFields.forEach((field) => {
    addField(field.label, field.value);
  });

  y += 5;

  /* ===== PARTNER SECTION ===== */
  checkPageBreak(20);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text("Data Pasangan", labelX, y);
  y += 6;

  const partnerFields = [
    { label: "Nama", value: (data.partner.isAlive == false ? "Alm. " : "") + data.partner.partnerName },
    { label: "Pekerjaan", value: data.partner.partnerJob || "Tidak Bekerja" },
    { label: "Status", value: data.partner.isActive ? "Aktif" : "Tidak Aktif" },
    { label: "UMKM", value: data.partner.isUmkm ? "Ya" : "Tidak" },
    { label: "Status Hidup", value: data.partner.isAlive ? "Hidup" : "Meninggal" },
    { label: "NIK", value: data.partner.partnerNik },
    { label: "Alamat", value: data.partner.address },
    { label: "Nomor Telp", value: data.partner.phoneNumber },
    { label: "Nomor Telp Alt", value: data.partner.phoneNumberAlt },
    { label: "Koordinat Rumah", value: data.partner.homeCoordinate },
  ];

  partnerFields.forEach((field) => {
    addField(field.label, field.value);
  });

  y += 5;

  /* ===== WALI SECTION ===== */
  if (data.waliId) {
    checkPageBreak(20);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.text("Data Wali", labelX, y);
    y += 6;

    // Wali image
    const waliImg = await loadImageAsBase64(
      waliImage || "/images/user/alt-user.png"
    );
    if (waliImg) {
      doc.addImage(waliImg, "JPEG", pageWidth - marginRight - 20, y - 2, 18, 18);
    }

    const waliFields = [
      { label: "Nama", value: data.wali.waliName },
      { label: "Hubungan", value: data.wali.relation },
      { label: "Nomor Telp", value: data.wali.waliPhone },
      { label: "Alamat", value: data.wali.waliAddress },
      { label: "Koordinat Alamat", value: data.wali.addressCoordinate },
    ];

    waliFields.forEach((field) => {
      addField(field.label, field.value);
    });

    y += 5;
  }

  /* ===== CHILDREN SECTION ===== */
  checkPageBreak(20);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text(`Data Anak (${data.childrens?.length || 0})`, labelX, y);
  y += 6;

  if (data.childrens && data.childrens.length > 0) {
    for (let i = 0; i < data.childrens.length; i++) {
      const child = data.childrens[i];
      
      // Check if we need a new page before starting a new child
      checkPageBreak(80);

      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      doc.text(`${i + 1}. ${child.childrenName}`, labelX, y);
      y += 5;

      // Child image
      const childImg = await loadImageAsBase64(
        childrenImages?.[i] || child.childrenPict || "/images/user/alt-user.png"
      );
      if (childImg) {
        doc.addImage(childImg, "JPEG", pageWidth - marginRight - 15, y - 3, 12, 12);
      }

      const childFields = [
        { label: "Jenis Kelamin", value: child.childrenGender === "M" ? "Laki-laki" : "Perempuan" },
        { label: "Status", value: child.isActive ? "Aktif" : "Tidak Aktif" },
        { label: "ABK", value: !child.isCondition ? "Ya" : "Tidak" },
        { label: "Tanggal Lahir", value: child.childrenBirthdate },
        { label: "NIK", value: child.nik },
        { label: "Jenjang Pendidikan", value: child.educationLevel },
        { label: "Tingkat Pendidikan", value: child.educationGrade },
        { label: "Nama Sekolah", value: child.schoolName },
        { label: "Pekerjaan", value: child.childrenJob },
        { label: "Alamat", value: child.childrenAddress },
        { label: "Nomor Telp", value: child.childrenPhone },
        { label: "Anak Ke", value: child.index?.toString() },
        { label: "Ayah Hidup", value: child.isFatherAlive ? "Ya" : "Tidak" },
        { label: "Ibu Hidup", value: child.isMotherAlive ? "Ya" : "Tidak" },
        { label: "Catatan", value: child.notes },
      ];

      childFields.forEach((field) => {
        addField(field.label, field.value);
      });

      y += 5;
    }
  } else {
    checkPageBreak(10);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.text("Tidak ada data anak", labelX, y);
    y += 8;
  }

  doc.save(`Data Keluarga - ${data.partner.partnerName}.pdf`);
};