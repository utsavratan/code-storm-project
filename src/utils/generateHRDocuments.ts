/**
 * THRYLOS INDIA — Premium HR Document PDF Generator
 *
 * Documents:
 *  - Offer Letter
 *  - Joining Letter
 *  - Completion Letter
 *  - Salary Slip
 *  - Payslip
 *  - Employee ID Card
 *
 * Features:
 *  - Premium navy + orange Thrylos India branding
 *  - Logo, founder signature and company seal
 *  - Employee photograph support
 *  - Automatic page overflow handling
 *  - Better typography and spacing
 *  - Professional payroll layouts
 *  - Barcode employee verification
 *  - Safe image handling
 *  - PDF metadata
 */

import { jsPDF } from "jspdf";
import JsBarcode from "jsbarcode";
import QRCode from "qrcode";

/* ========================================================================== */
/*                                   TYPES                                    */
/* ========================================================================== */

export type HRDocumentType =
  | "offer_letter"
  | "joining_letter"
  | "completion_letter"
  | "salary_slip"
  | "payslip"
  | "id_card";

export interface HREmployee {
  full_name: string;
  email: string;
  phone?: string | null;
  designation: string;
  department?: string | null;
  employment_type: string;
  joining_date: string;
  end_date?: string | null;
  monthly_salary?: number | null;
  stipend?: number | null;
  address?: string | null;
  employee_code?: string | null;
  photo_url?: string | null;
  reporting_manager?: string | null;
  /** Registered UPI VPA used to generate the salary payment QR code. */
  upi_id?: string | null;
  work_location?: string | null;
  /** Optional gender used only for grammatically correct HR-document pronouns. */
  gender?: "male" | "female" | "other" | "Male" | "Female" | "Other" | string | null;
}

export interface HRDocInput {
  employee: HREmployee;
  documentNumber: string;

  issueDate?: string;
  periodLabel?: string;

  workingDays?: number;
  paidDays?: number;

  paymentDate?: string;
  paymentReference?: string;

  /** Extra note rendered in the notes block of payslip / salary slip only. */
  payrollNote?: string;

  earnings?: {
    label: string;
    amount: number;
  }[];

  deductions?: {
    label: string;
    amount: number;
  }[];

  completionRemarks?: string;

  offerRole?: string;
  reportingTo?: string;
  location?: string;
  responseByDate?: string;
  projectName?: string;

  brandLogoDataUrl?: string;
  signatureDataUrl?: string;
  sealDataUrl?: string;
  signatoryName?: string;

  /**
   * Loaded employee image.
   * generateHRDocument() automatically attempts to populate this from
   * employee.photo_url when available.
   */
  employeePhotoDataUrl?: string;

  /**
   * Pre-rendered PNG data URL of the public verification QR code.
   * Populated automatically by prepareInput() from documentNumber.
   */
  verifyQrDataUrl?: string;

  /* ---------------------- UPI SALARY PAYMENT (payroll) ---------------------- */

  /** Unique payroll reference, e.g. THR-PAY-202608-000154. */
  payrollReference?: string;
  /** Unique internal payroll transaction id linked to the payroll record. */
  payrollTransactionId?: string;
  /** Explicit UPI transaction note override. */
  upiNote?: string;
  /** Built automatically by prepareInput() — official UPI deep-link URI. */
  upiUri?: string;
  /** Pre-rendered PNG data URL of the UPI salary payment QR. */
  upiQrDataUrl?: string;
}

/* ========================================================================== */
/*                                  BRAND                                     */
/* ========================================================================== */

const COMPANY = {
  name: "THRYLOS INDIA",
  website: "www.thrylosindia.in",
  email: "hr@thrylosindia.in",
  supportEmail: "support@thrylosindia.in",
  phone: "9871831555",
  location: "New Delhi, India",
  udyam: "UDYAM-DL-10-0112736",

  founder: "UTSAV RATAN",
  founderTitle: "Founder",
};

/* ========================================================================== */
/*                                  COLORS                                    */
/* ========================================================================== */

const NAVY = [24, 52, 93] as const;
const NAVY_DARK = [14, 35, 67] as const;
const NAVY_LIGHT = [236, 242, 249] as const;

const ORANGE = [255, 122, 0] as const;
const ORANGE_LIGHT = [255, 246, 235] as const;

const DARK = [24, 31, 43] as const;
const TEXT = [48, 56, 68] as const;
const MUTED = [105, 114, 128] as const;

const LINE = [222, 227, 234] as const;
const SOFT = [247, 249, 252] as const;
const WHITE = [255, 255, 255] as const;

const GREEN = [22, 126, 78] as const;
const GREEN_SOFT = [235, 248, 241] as const;

/* ========================================================================== */
/*                                  CONSTANTS                                 */
/* ========================================================================== */

const PAGE = {
  margin: 18,
  topContent: 48,
  footerSafe: 274.5,
};

const FONT = "helvetica";

/*
 * MANUAL LETTER BODY SIZE:
 * Completion Letter body size is set directly in renderCompletionLetter()
 * as size: 10.25 and lineHeight: 5.45.
 *
 * Increase 10.25 -> 10.5 if you want it slightly larger.
 * Do NOT reduce it to 5.5; 5.5 is much smaller than 10.25.
 */

/* ========================================================================== */
/*                                  HELPERS                                   */
/* ========================================================================== */

const sanitize = (value?: string | null) =>
  (value ?? "")
    .replace(/[\u0000-\u001F\u007F]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const fmtINR = (value: number) =>
  `Rs. ${Number(value || 0).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

const fmtDate = (iso?: string | null) => {
  if (!iso) return "—";

  const d = new Date(iso);

  if (Number.isNaN(d.getTime())) return "—";

  return d.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
};

const firstName = (name: string) => sanitize(name).split(/\s+/)[0] || "the candidate";

const pronounsFor = (gender?: string | null) => {
  const g = sanitize(gender).toLowerCase();
  if (g === "male" || g === "m" || g === "man" || g === "boy") {
    return { subject: "he", object: "him", possessive: "his", reflexive: "himself" };
  }
  if (g === "female" || g === "f" || g === "woman" || g === "girl") {
    return { subject: "she", object: "her", possessive: "her", reflexive: "herself" };
  }
  return { subject: "they", object: "them", possessive: "their", reflexive: "themselves" };
};

const cap = (value: string) => value.charAt(0).toUpperCase() + value.slice(1);

const getPageWidth = (d: jsPDF) => d.internal.pageSize.getWidth();
const getPageHeight = (d: jsPDF) => d.internal.pageSize.getHeight();

/* ========================================================================== */
/*                              IMAGE UTILITIES                               */
/* ========================================================================== */

export const loadImageAsDataUrl = async (url?: string | null): Promise<string | undefined> => {
  if (!url) return undefined;

  try {
    const res = await fetch(url);

    if (!res.ok) return undefined;

    const blob = await res.blob();

    return await new Promise<string | undefined>((resolve) => {
      const reader = new FileReader();

      reader.onloadend = () => resolve(typeof reader.result === "string" ? reader.result : undefined);

      reader.onerror = () => resolve(undefined);

      reader.readAsDataURL(blob);
    });
  } catch {
    return undefined;
  }
};

function imageFormat(dataUrl?: string): "PNG" | "JPEG" | "WEBP" {
  if (!dataUrl) return "PNG";

  const lower = dataUrl.toLowerCase();

  if (lower.startsWith("data:image/jpeg") || lower.startsWith("data:image/jpg")) {
    return "JPEG";
  }

  if (lower.startsWith("data:image/webp")) {
    return "WEBP";
  }

  return "PNG";
}

function safeAddImage(d: jsPDF, dataUrl: string | undefined, x: number, y: number, w: number, h: number) {
  if (!dataUrl) return false;

  try {
    d.addImage(dataUrl, imageFormat(dataUrl), x, y, w, h, undefined, "FAST");

    return true;
  } catch {
    return false;
  }
}

/* ========================================================================== */
/*                              PDF METADATA                                  */
/* ========================================================================== */

function setMetadata(d: jsPDF, type: HRDocumentType, input: HRDocInput) {
  d.setProperties({
    title: `${documentTypeLabel[type]} — ${sanitize(input.employee.full_name)}`,
    subject: `${documentTypeLabel[type]} issued by ${COMPANY.name}`,
    author: COMPANY.name,
    creator: `${COMPANY.name} HR Portal`,
    keywords: [
      COMPANY.name,
      documentTypeLabel[type],
      sanitize(input.employee.full_name),
      sanitize(input.employee.employee_code),
    ]
      .filter(Boolean)
      .join(", "),
  });
}

/* ========================================================================== */
/*                    PREMIUM CORPORATE COMMON LETTERHEAD                     */
/* ========================================================================== */

function drawLetterhead(d: jsPDF, input: HRDocInput) {
  const W = getPageWidth(d);
  const M = PAGE.margin;

  /* ------------------------------------------------------------------------
     TOP ACCENT
  ------------------------------------------------------------------------ */

  // Thin navy line across full page.
  d.setFillColor(...NAVY_DARK);
  d.rect(0, 0, W, 1.6, "F");

  // Orange accent at top-left.
  d.setFillColor(...ORANGE);
  d.rect(0, 1.6, 44, 0.9, "F");

  /* ------------------------------------------------------------------------
     LEFT BRAND AREA
  ------------------------------------------------------------------------ */

  if (input.brandLogoDataUrl) {
    safeAddImage(d, input.brandLogoDataUrl, M - 4, 13.3, 72, 17.5);
  } else {
    d.setFont(FONT, "bold");
    d.setFontSize(18);
    d.setTextColor(...NAVY_DARK);
    d.text(COMPANY.name, M + 1, 25);
  }

  /*
   * Supporting identity text.
   * Kept understated so the THRYLOS logo remains dominant.
   */
  d.setFont(FONT, "bold");
  d.setFontSize(5.4);
  d.setTextColor(...MUTED);

  d.text("TECHNOLOGY  •  INNOVATION  •  DIGITAL SOLUTIONS", M + 1, 34.3);

  /* ------------------------------------------------------------------------
     RIGHT CORPORATE INFORMATION CARD
  ------------------------------------------------------------------------ */

  const panelW = 58;
  const panelH = 28.5;

  const panelX = W - M - panelW;
  const panelY = 8.5;

  d.setFillColor(248, 249, 250);

  d.roundedRect(panelX, panelY, panelW, panelH, 2.6, 2.6, "F");

  /*
   * Single orange vertical identity rail.
   */
  d.setFillColor(...ORANGE);

  d.roundedRect(panelX, panelY, 1.35, panelH, 0.65, 0.65, "F");

  const tx = panelX + 5.2;

  /* Corporate Office */

  d.setFont(FONT, "bold");
  d.setFontSize(5.3);
  d.setTextColor(...ORANGE);

  d.text("CORPORATE OFFICE", tx, panelY + 5.2);

  /* Website */

  d.setFont(FONT, "bold");
  d.setFontSize(7.1);
  d.setTextColor(...NAVY_DARK);

  d.text(COMPANY.website, tx, panelY + 9.6);

  /* Email */

  d.setFont(FONT, "normal");
  d.setFontSize(6.05);
  d.setTextColor(...TEXT);

  d.text(COMPANY.email, tx, panelY + 13.8);

  /* Phone */

  d.text(COMPANY.phone, tx, panelY + 17.8);

  /* Location */

  d.text(COMPANY.location, tx, panelY + 21.8);

  /* UDYAM */

  d.setFont(FONT, "bold");
  d.setFontSize(5.7);
  d.setTextColor(...NAVY_DARK);

  d.text(COMPANY.udyam, tx, panelY + 25.9);

  /*
   * IMPORTANT:
   * No orange dot.
   * Nothing decorative floating inside the information card.
   */

  /* ------------------------------------------------------------------------
     CLEAN 50 / 50 HEADER DIVIDER
  ------------------------------------------------------------------------ */

  const ruleY = 42.8;

  const ruleStart = M;
  const ruleEnd = W - M;

  const totalRuleWidth = ruleEnd - ruleStart;

  /*
   * Exact same width:
   *
   * ORANGE = 50%
   * NAVY   = 50%
   */

  const halfWidth = totalRuleWidth / 2;

  d.setDrawColor(...ORANGE);
  d.setLineWidth(1.05);

  d.line(ruleStart, ruleY, ruleStart + halfWidth, ruleY);

  d.setDrawColor(...NAVY_DARK);
  d.setLineWidth(1.05);

  d.line(ruleStart + halfWidth, ruleY, ruleEnd, ruleY);
}

/* ========================================================================== */
/*                      PREMIUM EXECUTIVE COMMON FOOTER                       */
/* ========================================================================== */

function drawLetterFooterBar(d: jsPDF) {
  const W = getPageWidth(d);
  const H = getPageHeight(d);
  const M = PAGE.margin;

  /*
   * More compact than previous footer.
   * Keeps maximum usable space for letters.
   */
  const footerH = 12.8;
  const footerY = H - footerH;

  /* ------------------------------------------------------------------------
     ORANGE TOP ACCENT
  ------------------------------------------------------------------------ */

  d.setFillColor(...ORANGE);

  d.rect(0, footerY - 1.15, W, 1.15, "F");

  /* ------------------------------------------------------------------------
     MAIN NAVY FOOTER
  ------------------------------------------------------------------------ */

  d.setFillColor(...NAVY_DARK);

  d.rect(0, footerY, W, footerH, "F");

  /* ------------------------------------------------------------------------
     LEFT — COMPANY
  ------------------------------------------------------------------------ */

  const leftX = M;

  d.setFont(FONT, "bold");
  d.setFontSize(6.5);
  d.setTextColor(...WHITE);

  d.text(COMPANY.name, leftX, footerY + 5.1);

  d.setFont(FONT, "normal");
  d.setFontSize(4.45);
  d.setTextColor(190, 201, 215);

  d.text("TECHNOLOGY • INNOVATION • DIGITAL SOLUTIONS", leftX, footerY + 8.5);

  /* ------------------------------------------------------------------------
     LEFT/CENTRE SEPARATOR
  ------------------------------------------------------------------------ */

  const separator1X = W * 0.34;

  d.setDrawColor(88, 108, 132);
  d.setLineWidth(0.18);

  d.line(separator1X, footerY + 3, separator1X, footerY + 9.8);

  /* ------------------------------------------------------------------------
     CENTRE — REGISTERED INFORMATION
  ------------------------------------------------------------------------ */

  const centerX = W / 2;

  d.setFont(FONT, "bold");
  d.setFontSize(4.35);
  d.setTextColor(164, 180, 199);

  d.text("REGISTERED OFFICE", centerX, footerY + 4.3, {
    align: "center",
  });

  d.setFont(FONT, "normal");
  d.setFontSize(5.05);
  d.setTextColor(...WHITE);

  d.text(COMPANY.location, centerX, footerY + 7.0, {
    align: "center",
  });

  d.setFontSize(4.4);
  d.setTextColor(190, 201, 215);

  d.text(COMPANY.udyam, centerX, footerY + 9.6, {
    align: "center",
  });

  /* ------------------------------------------------------------------------
     CENTRE/RIGHT SEPARATOR
  ------------------------------------------------------------------------ */

  const separator2X = W * 0.66;

  d.setDrawColor(88, 108, 132);
  d.setLineWidth(0.18);

  d.line(separator2X, footerY + 3, separator2X, footerY + 9.8);

  /* ------------------------------------------------------------------------
     RIGHT — CONTACT
  ------------------------------------------------------------------------ */

  const rightX = W - M;

  d.setFont(FONT, "bold");
  d.setFontSize(4.35);
  d.setTextColor(164, 180, 199);

  d.text("CORPORATE CONTACT", rightX, footerY + 4.3, {
    align: "right",
  });

  d.setFont(FONT, "normal");
  d.setFontSize(5.05);
  d.setTextColor(...WHITE);

  d.text(COMPANY.website, rightX, footerY + 7.0, {
    align: "right",
  });

  d.setFontSize(4.4);
  d.setTextColor(190, 201, 215);

  d.text(COMPANY.email, rightX, footerY + 9.6, {
    align: "right",
  });
}
/* ========================================================================== */
/*                           PAGE OVERFLOW HANDLING                           */
/* ========================================================================== */

function newLetterPage(d: jsPDF, input: HRDocInput) {
  drawLetterFooterBar(d);

  d.addPage();

  drawLetterhead(d, input);

  return PAGE.topContent;
}

function ensureSpace(d: jsPDF, input: HRDocInput, y: number, required: number) {
  if (y + required < PAGE.footerSafe) {
    return y;
  }

  return newLetterPage(d, input);
}

/* ========================================================================== */
/*                              TEXT UTILITIES                                */
/* ========================================================================== */

function paragraph(
  d: jsPDF,
  input: HRDocInput,
  text: string,
  y: number,
  options?: {
    x?: number;
    width?: number;
    lineHeight?: number;
    gap?: number;
    fontSize?: number;
  },
) {
  const M = PAGE.margin;
  const W = getPageWidth(d);

  const x = options?.x ?? M;
  const width = options?.width ?? W - M * 2;
  const lineHeight = options?.lineHeight ?? 5.4;
  const gap = options?.gap ?? 4;
  const fontSize = options?.fontSize ?? 10;

  d.setFont(FONT, "normal");
  d.setFontSize(fontSize);
  d.setTextColor(...TEXT);

  const lines = d.splitTextToSize(sanitize(text), width);

  const required = lines.length * lineHeight + gap;

  y = ensureSpace(d, input, y, required);

  d.text(lines, x, y);

  return y + lines.length * lineHeight + gap;
}

function documentMeta(d: jsPDF, input: HRDocInput, subject: string) {
  const M = PAGE.margin;
  const W = getPageWidth(d);

  let y = 46;

  d.setFont(FONT, "normal");
  d.setFontSize(8.5);
  d.setTextColor(...MUTED);

  d.text(`Date: ${fmtDate(input.issueDate)}`, M, y);

  d.text(`Ref. No.: ${sanitize(input.documentNumber)}`, W - M, y, { align: "right" });

  y += 11;

  d.setFont(FONT, "bold");
  d.setFontSize(10);
  d.setTextColor(...NAVY);

  d.text("Subject:", M, y);

  const sw = d.getTextWidth("Subject:");

  d.setFont(FONT, "normal");
  d.setTextColor(...DARK);

  const lines = d.splitTextToSize(subject, W - M * 2 - sw - 3);

  d.text(lines, M + sw + 3, y);

  return y + Math.max(10, lines.length * 5 + 5);
}

function greeting(d: jsPDF, input: HRDocInput, y: number) {
  const M = PAGE.margin;

  d.setFontSize(10);
  d.setTextColor(...DARK);

  d.setFont(FONT, "normal");
  d.text("Dear", M, y);

  const width = d.getTextWidth("Dear ");

  d.setFont(FONT, "bold");

  d.text(`${sanitize(input.employee.full_name)},`, M + width, y);

  return y + 9;
}
/* ========================================================================== */
/*                       UPI SALARY PAYMENT (REUSABLE)                        */
/* ========================================================================== */

/** Basic VPA validation — name@bank */
export function isValidUpiId(value?: string | null): boolean {
  if (!value) return false;
  return /^[a-zA-Z0-9.\-_]{2,256}@[a-zA-Z][a-zA-Z0-9.\-_]{1,64}$/.test(value.trim());
}

/** THR-PAY-YYYYMM-###### unique payroll reference. */
export function makePayrollReference(date: Date = new Date(), seq?: number): string {
  const ym = `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, "0")}`;
  const n = seq ?? Math.floor(Math.random() * 999999);
  return `THR-PAY-${ym}-${String(n).padStart(6, "0")}`;
}

/** THR-TXN-<time36>-<rand> internal payroll transaction id. */
export function makePayrollTransactionId(date: Date = new Date()): string {
  return `THR-TXN-${date.getTime().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
}

/** Net payable used for the UPI amount (earnings − deductions). */
export function payrollNetAmount(input: HRDocInput): number {
  const emp = input.employee;
  const earnings = input.earnings?.length
    ? input.earnings
    : [
        {
          label: "Salary",
          amount: (emp.employment_type === "intern" ? emp.stipend : emp.monthly_salary) || 0,
        },
      ];
  const totalEarnings = earnings.reduce((s, i) => s + Number(i.amount || 0), 0);
  const totalDeductions = (input.deductions || []).reduce((s, i) => s + Number(i.amount || 0), 0);
  return Math.max(0, Math.round((totalEarnings - totalDeductions) * 100) / 100);
}

/** Transaction note per employment type. */
export function payrollTransactionNote(input: HRDocInput): string {
  if (input.upiNote?.trim()) return sanitize(input.upiNote.trim());
  const period = input.periodLabel || fmtDate(input.issueDate);
  const kind = input.employee.employment_type === "intern" ? "Internship Stipend" : "Monthly Salary";
  return `THRYLOS INDIA - ${kind} - ${period}`;
}

/** Official UPI URI (upi://pay?...) — returns null when no valid VPA. */
export function buildUpiUri(input: HRDocInput): string | null {
  const vpa = input.employee.upi_id?.trim();
  if (!isValidUpiId(vpa)) return null;

  const amount = payrollNetAmount(input);
  if (!amount || amount <= 0) return null;

  // Keep the intent deliberately limited to NPCI's widely supported payment
  // fields. In particular, `tid` is PSP-owned and causes strict UPI apps to
  // reject a payer-generated request. Our internal transaction ID remains in
  // the payroll record while `tr` carries the auditable document reference.
  const cleanName = sanitize(input.employee.full_name).replace(/[^a-zA-Z0-9 .'-]/g, "").slice(0, 50);
  const cleanNote = payrollTransactionNote(input).replace(/[^a-zA-Z0-9 .'-]/g, " ").replace(/\s+/g, " ").trim().slice(0, 70);
  const reference = sanitize(input.payrollReference || input.documentNumber).replace(/[^a-zA-Z0-9-]/g, "").slice(0, 35);
  const fields: Array<[string, string]> = [
    ["pa", vpa],
    ["pn", cleanName || "THRYLOS Employee"],
    ["am", amount.toFixed(2)],
    ["cu", "INR"],
    ["tn", cleanNote || "THRYLOS INDIA Salary"],
  ];
  if (reference) fields.push(["tr", reference]);

  return `upi://pay?${fields.map(([key, value]) => `${key}=${encodeURIComponent(value)}`).join("&")}`;
}

/* ========================================================================== */
/*                       PUBLIC VERIFICATION QR (REUSABLE)                    */
/* ========================================================================== */

/**
 * Renders the public document verification QR block.
 * Position is fully manual (x, y in mm) so it never interferes with the
 * signature, seal, authorization line, signatory details, body, or footer.
 * Renders nothing if a QR data URL is unavailable.
 */
function drawVerificationQR(d: jsPDF, input: HRDocInput, x: number, y: number) {
  if (!input.verifyQrDataUrl) return;

  const size = 25; // mm — approx 25mm QR
  const centerX = x + size / 2;

  const ok = safeAddImage(d, input.verifyQrDataUrl, x, y, size, size);
  if (!ok) return;

  // "VERIFY DOCUMENT" — ~7pt bold
  d.setFont(FONT, "bold");
  d.setFontSize(7);
  d.setTextColor(...DARK);
  d.text("VERIFY DOCUMENT", centerX, y + size + 3.2, { align: "center" });

  // Subtitle — muted ~6pt
  d.setFont(FONT, "normal");
  d.setFontSize(6);
  d.setTextColor(...MUTED);
  d.text("Scan to verify authenticity", centerX, y + size + 6.2, { align: "center" });

  // Reference — muted ~5.5pt
  if (input.documentNumber) {
    d.setFontSize(5.5);
    d.text(`Ref: ${input.documentNumber}`, centerX, y + size + 9, { align: "center" });
  }
}

/* ========================================================================== */
/*                          SIGNATURE + COMPANY SEAL                          */
/* ========================================================================== */

function drawFormalSignature(d: jsPDF, input: HRDocInput, y: number) {
  const M = PAGE.margin;

  /* SINCERELY */
  d.setFont(FONT, "normal");
  d.setFontSize(10.2);
  d.setTextColor(...TEXT);
  d.text("Sincerely,", M, y);

  /* Verification QR — right-hand blank area beside signature block.
     Positioned independently; does NOT affect signature/seal/authorization. */
  drawVerificationQR(d, input, 210 - PAGE.margin - 26, y + 2);

  /* ==========================================================================
     SIGNATURE — ONLY THIS MOVES DOWN
  ========================================================================== */

  const signatureX = M - 1.5;

  // Increase ONLY this value to move handwritten signature DOWN.
  const signatureY = y + 14;

  const signatureW = 64;
  const signatureH = 21;

  if (input.signatureDataUrl) {
    safeAddImage(d, input.signatureDataUrl, signatureX, signatureY, signatureW, signatureH);
  }

  /* ==========================================================================
     COMPANY SEAL — FIXED POSITION
     IMPORTANT: NOT calculated from signatureY
  ========================================================================== */

  const sealSize = 36;
  const sealX = M + 23.5;

  // Fixed relative to original function Y.
  const sealY = y + 8;

  if (input.sealDataUrl) {
    safeAddImage(d, input.sealDataUrl, sealX, sealY, sealSize, sealSize);
  }

  /* ==========================================================================
     AUTHORIZATION LINE — FIXED POSITION
  ========================================================================== */

  // Based ONLY on seal position, not signature.
  const lineY = sealY + sealSize * 0.7;

  const lineStartX = M;
  const lineWidth = 62;
  const centerX = lineStartX + lineWidth / 2;

  d.setDrawColor(...DARK);
  d.setLineWidth(0.3);

  d.line(lineStartX, lineY, lineStartX + lineWidth, lineY);

  /* ==========================================================================
     SIGNATORY DETAILS — FIXED POSITION
  ========================================================================== */

  const nameY = lineY + 5.5;

  d.setFont(FONT, "bold");
  d.setFontSize(9.2);
  d.setTextColor(...DARK);

  d.text(input.signatoryName || COMPANY.founder, centerX, nameY, { align: "center" });

  d.setFont(FONT, "normal");
  d.setFontSize(7.3);
  d.setTextColor(...MUTED);

  d.text("Founder | Authorised Signatory", centerX, nameY + 4.8, { align: "center" });

  d.setFontSize(6.7);

  d.text(COMPANY.name, centerX, nameY + 8.8, { align: "center" });

  return nameY + 9.5;
}

/* ========================================================================== */
/*                              ACCEPTANCE BOX                                */
/* ========================================================================== */

function drawAcceptance(d: jsPDF, input: HRDocInput, title: string, y: number) {
  const M = PAGE.margin;
  const W = getPageWidth(d);
  d.setDrawColor(...LINE);
  d.setLineWidth(0.3);
  d.line(M, y, W - M, y);

  d.setFont(FONT, "bold");
  d.setFontSize(8.3);
  d.setTextColor(...NAVY);
  d.text(title, M, y + 7);

  d.setFont(FONT, "normal");
  d.setFontSize(8.2);
  d.setTextColor(...TEXT);
  const label = title.toLowerCase().includes("offer") ? "Offer Letter" : "Joining Letter";
  const statement = `I, ${sanitize(input.employee.full_name)}, acknowledge that I have read, understood and accept the terms stated in this ${label}.`;
  d.text(d.splitTextToSize(statement, W - M * 2), M, y + 14);

  const lineY = y + 29;
  d.setDrawColor(...MUTED);
  d.setLineWidth(0.25);
  d.line(M, lineY, M + 70, lineY);
  d.line(W - M - 52, lineY, W - M, lineY);

  d.setFontSize(7);
  d.setTextColor(...MUTED);
  d.text("Candidate Signature", M, lineY + 4);
  d.text("Date", W - M - 52, lineY + 4);

  return y + 36;
}
/* ========================================================================== */
/*                               OFFER LETTER                                 */
/* ========================================================================== */

function richParagraph(
  d: jsPDF,
  input: HRDocInput,
  segments: Array<{ text: string; bold?: boolean }>,
  y: number,
  opts: { gap?: number; size?: number; lineHeight?: number } = {},
) {
  const M = PAGE.margin;
  const W = getPageWidth(d);
  const maxW = W - M * 2;
  const fontSize = opts.size ?? 10.1;
  const lineHeight = opts.lineHeight ?? 5.35;
  const gap = opts.gap ?? 7;

  /*
   * IMPORTANT:
   * Letter paragraphs are rendered continuously on the same page.
   * We do not call ensureSpace() here, because that was the source of
   * unexpected page jumps and large blank areas.
   */
  const words: Array<{ text: string; bold: boolean }> = [];

  segments.forEach((seg) => {
    String(seg.text)
      .split(/(\s+)/)
      .forEach((part) => {
        if (part) words.push({ text: part, bold: !!seg.bold });
      });
  });

  let x = M;
  let lineY = y;

  d.setFontSize(fontSize);
  d.setTextColor(...TEXT);

  for (const word of words) {
    d.setFont(FONT, word.bold ? "bold" : "normal");
    const width = d.getTextWidth(word.text);

    if (x > M && x + width > M + maxW && word.text.trim()) {
      x = M;
      lineY += lineHeight;
    }

    // Avoid a leading whitespace character after a wrapped line.
    if (x === M && !word.text.trim()) continue;

    d.text(word.text, x, lineY);
    x += width;
  }

  return lineY + gap;
}

function renderOfferLetter(d: jsPDF, input: HRDocInput) {
  const emp = input.employee;
  const M = PAGE.margin;
  const W = getPageWidth(d);
  const role = sanitize(emp.designation);
  const division = sanitize(emp.department || "IT");
  const reportingTo = sanitize(input.reportingTo || COMPANY.founderTitle);
  const location = sanitize(emp.work_location || "Remote · India");

  drawLetterhead(d, input);

  let y = 48.2;

  d.setFont(FONT, "normal");
  d.setFontSize(8.4);
  d.setTextColor(...MUTED);
  d.text(`Date: ${fmtDate(input.issueDate)}`, M, y);
  d.text(`Ref. No.: ${sanitize(input.documentNumber)}`, W - M, y, { align: "right" });
  y += 10.8;

  y = richParagraph(d, input, [{ text: "Subject: ", bold: true }, { text: `Offer of Internship — ${role}` }], y, {
    gap: 9.0,
    size: 11.8,
    lineHeight: 6.15,
  });

  y = richParagraph(d, input, [{ text: "Dear " }, { text: `${sanitize(emp.full_name)},`, bold: true }], y, {
    gap: 9.0,
    size: 11.8,
    lineHeight: 6.15,
  });

  y = richParagraph(
    d,
    input,
    [
      { text: "We are pleased to offer you the position of " },
      { text: role, bold: true },
      { text: " at " },
      { text: COMPANY.name, bold: true },
      {
        text: " under our Internship Program. This letter constitutes our formal offer and records the principal terms of your proposed engagement. Your internship is scheduled to commence on ",
      },
      { text: fmtDate(emp.joining_date), bold: true },
      { text: " and continue until " },
      { text: fmtDate(emp.end_date), bold: true },
      { text: ". You will be associated with the " },
      { text: `${division} division`, bold: true },
      { text: ", report to " },
      { text: reportingTo, bold: true },
      { text: " and your designated work location will be " },
      { text: location, bold: true },
      {
        text: ". The engagement is intended to provide structured professional exposure while enabling you to contribute meaningfully to live organisational work.",
      },
    ],
    y,
    { gap: 9.0, size: 11.8, lineHeight: 6.15 },
  );

  y = richParagraph(
    d,
    input,
    [
      {
        text: "During the internship, you will undertake responsibilities associated with your assigned role, including development, implementation, testing, debugging, technical documentation, coordination, project support and discussions, maintenance of appropriate work records and other activities reasonably connected with your role.",
      },
    ],
    y,
    { gap: 9.0, size: 11.8, lineHeight: 6.15 },
  );

  y = richParagraph(
    d,
    input,
    [
      { text: "Throughout your association with " },
      { text: COMPANY.name, bold: true },
      {
        text: ", you are expected to maintain professionalism, integrity, discipline, confidentiality and accountability. You must comply with the organisation's code of conduct, information-security requirements, work policies, reporting procedures and other guidelines applicable to your engagement. We believe this internship will strengthen your practical capabilities and provide valuable professional exposure, and we look forward to a productive and professionally rewarding association.",
      },
    ],
    y,
    { gap: 9.0, size: 11.8, lineHeight: 6.15 },
  );

  y = drawFormalSignature(d, input, y + 0.6);
  drawAcceptance(d, input, "ACCEPTANCE OF OFFER", y + 0.4);
  drawLetterFooterBar(d);
}

/* ========================================================================== */
/*                              JOINING LETTER                                */
/* ========================================================================== */

function renderJoiningLetter(d: jsPDF, input: HRDocInput) {
  const emp = input.employee;
  const M = PAGE.margin;
  const W = getPageWidth(d);
  const role = sanitize(emp.designation);
  const division = sanitize(emp.department || "IT");
  const reportingTo = sanitize(input.reportingTo || COMPANY.founderTitle);

  drawLetterhead(d, input);

  let y = 48.2;

  d.setFont(FONT, "normal");
  d.setFontSize(8.4);
  d.setTextColor(...MUTED);
  d.text(`Date: ${fmtDate(input.issueDate)}`, M, y);
  d.text(`Ref. No.: ${sanitize(input.documentNumber)}`, W - M, y, { align: "right" });
  y += 10.8;

  y = richParagraph(
    d,
    input,
    [{ text: "Subject: ", bold: true }, { text: "Joining Letter for Internship Program" }],
    y,
    { gap: 9.0, size: 11.8, lineHeight: 6.15 },
  );

  y = richParagraph(d, input, [{ text: "Dear " }, { text: `${sanitize(emp.full_name)},`, bold: true }], y, {
    gap: 9.0,
    size: 11.8,
    lineHeight: 6.15,
  });

  y = richParagraph(
    d,
    input,
    [
      { text: "We are pleased to welcome you to " },
      { text: COMPANY.name, bold: true },
      { text: " as " },
      { text: role, bold: true },
      {
        text: " under our Internship Program. This letter serves as your official confirmation of joining the organisation and commencement of your association with us. Based on your academic background, technical capabilities and the requirements of your assigned role, you have been placed within the ",
      },
      { text: `${division} division`, bold: true },
      { text: ". Your internship commences on " },
      { text: fmtDate(emp.joining_date), bold: true },
      { text: " and is scheduled to continue until " },
      { text: fmtDate(emp.end_date), bold: true },
      { text: ". During this period, you will report to " },
      { text: reportingTo, bold: true },
      { text: " and undertake responsibilities associated with your assigned role." },
    ],
    y,
    { gap: 9.0, size: 11.8, lineHeight: 6.15 },
  );

  y = richParagraph(
    d,
    input,
    [
      {
        text: "Your responsibilities may include development, implementation, testing, debugging, documentation, coordination, project support, participation in internal reviews and discussions and other related professional activities. You are expected to understand assigned requirements, communicate responsibly, meet agreed timelines, maintain appropriate records of work and collaborate professionally with team members and stakeholders. The organisation may also assign reasonable learning objectives or project activities connected with your role and professional development.",
      },
    ],
    y,
    { gap: 9.0, size: 11.8, lineHeight: 6.15 },
  );

  y = richParagraph(
    d,
    input,
    [
      { text: "Throughout your association with " },
      { text: COMPANY.name, bold: true },
      {
        text: ", you are expected to maintain professionalism, confidentiality, integrity, accountability, discipline and responsible conduct. You must comply with the organisation's code of conduct, information-security requirements, work policies, reporting procedures and all other guidelines applicable to your engagement. We believe this internship will provide meaningful practical exposure, strengthen your professional capabilities and allow you to contribute effectively to live organisational work. We welcome you to ",
      },
      { text: COMPANY.name, bold: true },
      { text: " and look forward to a productive, disciplined and professionally rewarding association." },
    ],
    y,
    { gap: 9.0, size: 11.8, lineHeight: 6.15 },
  );

  drawFormalSignature(d, input, y + 0.6);
  drawLetterFooterBar(d);
}

/* ========================================================================== */
/*                            COMPLETION LETTER                               */
/* ========================================================================== */

function renderCompletionLetter(d: jsPDF, input: HRDocInput) {
  const emp = input.employee;
  const M = PAGE.margin;
  const W = getPageWidth(d);
  const isIntern = emp.employment_type === "intern";
  const role = sanitize(emp.designation);
  const division = sanitize(emp.department || "IT");
  const tenureEnd = fmtDate(emp.end_date || input.issueDate);
  const p = pronounsFor(emp.gender);

  drawLetterhead(d, input);

  let y = 48.2;

  d.setFont(FONT, "normal");
  d.setFontSize(8.4);
  d.setTextColor(...MUTED);
  d.text(`Date: ${fmtDate(input.issueDate)}`, M, y);
  d.text(`Ref. No.: ${sanitize(input.documentNumber)}`, W - M, y, { align: "right" });
  y += 11.4;

  d.setFont(FONT, "bold");
  d.setFontSize(14);
  d.setTextColor(...NAVY);
  d.text("TO WHOM IT MAY CONCERN", W / 2, y, { align: "center" });
  d.setDrawColor(...ORANGE);
  d.setLineWidth(0.75);
  d.line(W / 2 - 20, y + 4.2, W / 2 + 20, y + 4.2);
  y += 15.2;

  y = richParagraph(
    d,
    input,
    [
      { text: "This is to certify that " },
      { text: sanitize(emp.full_name), bold: true },
      {
        text: isIntern
          ? " has successfully completed the internship program at "
          : " was professionally associated with ",
      },
      { text: COMPANY.name, bold: true },
      { text: " in the capacity of " },
      { text: role, bold: true },
      { text: " within the " },
      { text: `${division} division`, bold: true },
      { text: " for the period from " },
      { text: fmtDate(emp.joining_date), bold: true },
      { text: " to " },
      { text: tenureEnd, bold: true },
      {
        text: `. During this tenure, ${p.subject} remained actively associated with responsibilities relevant to ${p.possessive} assigned role and the operational requirements of the organisation.`,
      },
    ],
    y,
    { gap: 9.0, size: 11.8, lineHeight: 6.15 },
  );

  y = richParagraph(
    d,
    input,
    [
      {
        text: `${cap(p.possessive)} responsibilities included software development, implementation, testing, debugging, technical documentation, coordination, project support, participation in internal discussions and reviews, problem-solving and other professional activities entrusted by the organisation. ${cap(p.subject)} demonstrated sincerity, technical aptitude, professionalism, discipline and a responsible approach towards assigned duties, while maintaining appropriate communication, documentation and accountability in carrying assigned work forward.`,
      },
    ],
    y,
    { gap: 9.0, size: 11.8, lineHeight: 6.15 },
  );

  y = richParagraph(
    d,
    input,
    [
      {
        text: `The ${isIntern ? "internship" : "association"} provided ${p.object} with practical exposure to structured professional workflows, real-world technical problem-solving, team coordination, implementation practices and organisational accountability. Through the responsibilities undertaken, ${p.subject} gained experience in applying technical concepts within a professional environment while further developing ${p.possessive} communication, documentation, execution, collaborative working and time-management practices.`,
      },
      ...(input.completionRemarks ? [{ text: ` ${sanitize(input.completionRemarks)}` }] : []),
    ],
    y,
    { gap: 9.0, size: 11.8, lineHeight: 6.15 },
  );

  y = richParagraph(
    d,
    input,
    [
      { text: "We appreciate " },
      { text: `${p.possessive} efforts and contribution`, bold: true },
      { text: " to " },
      { text: COMPANY.name, bold: true },
      {
        text: ` and wish ${p.object} continued success in ${p.possessive} future academic and professional endeavours. We trust that the practical experience and professional exposure gained during this period will contribute positively to ${p.possessive} future responsibilities and career development. This letter is issued as an official record of the above association and may be presented for academic, professional, employment-verification or other legitimate purposes wherever required.`,
      },
    ],
    y,
    { gap: 9.0, size: 11.8, lineHeight: 6.15 },
  );

  drawFormalSignature(d, input, y + 0.6);
  drawLetterFooterBar(d);
}

/* ========================================================================== */
/*                             PAYROLL HELPERS                                */
/* ========================================================================== */

function drawPayrollEmployeeCard(d: jsPDF, input: HRDocInput, y: number) {
  const M = PAGE.margin;
  const W = getPageWidth(d);
  const emp = input.employee;
  const cardW = W - M * 2;
  const H = 43;

  d.setFillColor(...WHITE);
  d.setDrawColor(...LINE);
  d.setLineWidth(0.28);
  d.roundedRect(M, y, cardW, H, 3.2, 3.2, "FD");

  // premium left identity rail
  d.setFillColor(...NAVY_LIGHT);
  d.roundedRect(M, y, 48, H, 3.2, 3.2, "F");
  d.rect(M + 44, y, 4, H, "F");
  d.setFillColor(...ORANGE);
  d.rect(M, y, 2.2, H, "F");

  d.setFont(FONT, "normal");
  d.setFontSize(6.4);
  d.setTextColor(...MUTED);
  d.text("EMPLOYEE", M + 7, y + 9);

  d.setFont(FONT, "bold");
  d.setFontSize(9.5);
  d.setTextColor(...NAVY);
  const name = sanitize(emp.full_name);
  d.text(d.splitTextToSize(name, 36).slice(0, 2), M + 7, y + 15);

  d.setFont(FONT, "normal");
  d.setFontSize(6.5);
  d.setTextColor(...MUTED);
  d.text(sanitize(emp.employee_code || "Employee ID —"), M + 7, y + 28);

  d.setFont(FONT, "bold");
  d.setFontSize(7.2);
  d.setTextColor(...TEXT);
  d.text(sanitize(emp.designation), M + 7, y + 34);

  const infoX = M + 55;
  const infoW = cardW - 62;
  const colW = infoW / 2;

  const cells = [
    ["DEPARTMENT", sanitize(emp.department || "—")],
    ["PAY PERIOD", input.periodLabel || fmtDate(input.issueDate)],
    ["WORKING DAYS", String(input.workingDays ?? "—")],
    ["PAID DAYS", String(input.paidDays ?? "—")],
    ["PAYMENT DATE", fmtDate(input.paymentDate || input.issueDate)],
    ["REFERENCE", sanitize(input.paymentReference || input.documentNumber)],
  ];

  cells.forEach(([label, value], i) => {
    const col = i % 2;
    const row = Math.floor(i / 2);
    const cx = infoX + col * colW;
    const cy = y + 8 + row * 11;

    d.setFont(FONT, "normal");
    d.setFontSize(5.8);
    d.setTextColor(...MUTED);
    d.text(label, cx, cy);

    d.setFont(FONT, "bold");
    d.setFontSize(7.5);
    d.setTextColor(...DARK);
    d.text(String(value).slice(0, 30), cx, cy + 4.2);
  });

  return y + H;
}

function drawPayrollTable(
  d: jsPDF,
  x: number,
  y: number,
  width: number,
  title: string,
  rows: {
    label: string;
    amount: number;
  }[],
  total: number,
) {
  const safeRows = rows.length > 0 ? rows : [{ label: "—", amount: 0 }];

  const headerH = 9;
  const rowH = 8;
  const totalH = 10;

  /* header */

  d.setFillColor(...NAVY);

  d.roundedRect(x, y, width, headerH, 2, 2, "F");

  d.rect(x, y + 4, width, headerH - 4, "F");

  d.setFont(FONT, "bold");
  d.setFontSize(8);
  d.setTextColor(...WHITE);

  d.text(title.toUpperCase(), x + 4, y + 6);

  d.text("AMOUNT", x + width - 4, y + 6, { align: "right" });

  let yy = y + headerH;

  safeRows.forEach((row, index) => {
    if (index % 2 === 1) {
      d.setFillColor(...SOFT);
      d.rect(x, yy, width, rowH, "F");
    }

    d.setDrawColor(...LINE);
    d.setLineWidth(0.2);

    d.line(x, yy + rowH, x + width, yy + rowH);

    d.setFont(FONT, "normal");
    d.setFontSize(8.5);
    d.setTextColor(...TEXT);

    const label = sanitize(row.label);

    d.text(label.length > 32 ? `${label.slice(0, 29)}...` : label, x + 4, yy + 5.3);

    d.setFont(FONT, "bold");

    d.text(fmtINR(row.amount || 0), x + width - 4, yy + 5.3, { align: "right" });

    yy += rowH;
  });

  d.setFillColor(...NAVY_LIGHT);
  d.rect(x, yy, width, totalH, "F");

  d.setFont(FONT, "bold");
  d.setFontSize(8.7);
  d.setTextColor(...NAVY);

  d.text("TOTAL", x + 4, yy + 6.5);

  d.text(fmtINR(total), x + width - 4, yy + 6.5, { align: "right" });

  return yy + totalH;
}

/* ========================================================================== */
/*                            PAYSLIP / SALARY                                */
/* ========================================================================== */

function renderPayslip(d: jsPDF, input: HRDocInput, isSalarySlip: boolean) {
  const M = PAGE.margin;
  const W = getPageWidth(d);
  const emp = input.employee;

  drawLetterhead(d, input);

  let y = 51;

  // Title block
  d.setFont(FONT, "bold");
  d.setFontSize(15.5);
  d.setTextColor(...NAVY);
  d.text(isSalarySlip ? "SALARY SLIP" : "PAYSLIP", M, y);

  d.setFont(FONT, "normal");
  d.setFontSize(8.2);
  d.setTextColor(...MUTED);
  d.text(`Pay period: ${input.periodLabel || fmtDate(input.issueDate)}`, M, y + 6);
  d.text(`Document No.: ${sanitize(input.documentNumber)}`, W - M, y, { align: "right" });
  d.text(`Issued: ${fmtDate(input.issueDate)}`, W - M, y + 6, { align: "right" });

  y += 13;
  y = drawPayrollEmployeeCard(d, input, y);
  y += 7;

  const earnings = input.earnings?.length
    ? input.earnings
    : [
        {
          label: emp.employment_type === "intern" ? "Stipend" : "Basic Salary",
          amount: (emp.employment_type === "intern" ? emp.stipend : emp.monthly_salary) || 0,
        },
      ];

  const deductions = input.deductions || [];
  const totalEarnings = earnings.reduce((sum, item) => sum + Number(item.amount || 0), 0);
  const totalDeductions = deductions.reduce((sum, item) => sum + Number(item.amount || 0), 0);
  const netPay = totalEarnings - totalDeductions;

  const gap = 6;
  const colWidth = (W - M * 2 - gap) / 2;

  const earningsEnd = drawPayrollTable(d, M, y, colWidth, "Earnings", earnings, totalEarnings);
  const deductionsEnd = drawPayrollTable(d, M + colWidth + gap, y, colWidth, "Deductions", deductions, totalDeductions);
  y = Math.max(earningsEnd, deductionsEnd) + 7;

  // Summary strip
  const boxH = 34;
  d.setFillColor(...SOFT);
  d.setDrawColor(...LINE);
  d.roundedRect(M, y, W - M * 2, boxH, 3, 3, "FD");

  const summaryItems: Array<[string, number]> = [
    ["GROSS EARNINGS", totalEarnings],
    ["TOTAL DEDUCTIONS", totalDeductions],
  ];

  summaryItems.forEach(([label, amount], i) => {
    const sx = M + 7 + i * 55;
    d.setFont(FONT, "normal");
    d.setFontSize(6.2);
    d.setTextColor(...MUTED);
    d.text(label, sx, y + 9);

    d.setFont(FONT, "bold");
    d.setFontSize(9.5);
    d.setTextColor(...DARK);
    d.text(fmtINR(amount), sx, y + 16);
  });

  // Net pay hero on right
  const netW = 62;
  const netX = W - M - netW;
  d.setFillColor(...NAVY);
  d.roundedRect(netX, y, netW, boxH, 3, 3, "F");
  d.setFillColor(...ORANGE);
  d.roundedRect(netX, y, 3.2, boxH, 2, 2, "F");

  d.setFont(FONT, "bold");
  d.setFontSize(6.5);
  d.setTextColor(...WHITE);
  d.text("NET PAYABLE", netX + 8, y + 10);

  d.setFontSize(13.2);
  d.text(fmtINR(netPay), netX + 8, y + 20);

  d.setFont(FONT, "normal");
  d.setFontSize(5.8);
  d.text(totalDeductions > 0 ? "After applicable deductions" : "No deductions recorded", netX + 8, y + 27);

  y += boxH + 7;

  /* ---------------------------------------------------------------------- */
  /* PAYMENT INFORMATION + DOCUMENT VERIFICATION QR                          */
  /* ---------------------------------------------------------------------- */

  const bandH = 38;
  const verifyCardW = 36;
  const payW = W - M * 2 - verifyCardW - 5;

  d.setFillColor(...GREEN_SOFT);
  d.setDrawColor(198, 231, 214);
  d.roundedRect(M, y, payW, bandH, 2.5, 2.5, "FD");

  d.setFont(FONT, "bold");
  d.setFontSize(6.5);
  d.setTextColor(...GREEN);
  d.text(input.paymentDate ? "PAYMENT RECORDED" : "PAYMENT INFORMATION", M + 5, y + 6.5);

  const payCol2 = M + payW / 2 + 1;
  const payLine = (label: string, value: string, cx: number, cy: number) => {
    d.setFont(FONT, "normal");
    d.setFontSize(5.6);
    d.setTextColor(...MUTED);
    d.text(label, cx, cy);
    d.setFont(FONT, "bold");
    d.setFontSize(6.8);
    d.setTextColor(...DARK);
    d.text(String(value).slice(0, 34), cx, cy + 3.9);
  };

  payLine("PAYMENT DATE", input.paymentDate ? fmtDate(input.paymentDate) : fmtDate(input.issueDate), M + 5, y + 13);
  payLine("REFERENCE", sanitize(input.paymentReference || input.documentNumber), payCol2, y + 13);
  payLine("PAYROLL REF", sanitize(input.payrollReference || "—"), M + 5, y + 23);
  payLine("TRANSACTION ID", sanitize(input.payrollTransactionId || "—"), payCol2, y + 23);
  payLine("PAYMENT MODE", "UPI / Bank Transfer", M + 5, y + 32);
  payLine("CURRENCY", "INR (Indian Rupee)", payCol2, y + 32);

  drawVerificationQRCard(d, input, W - M - verifyCardW, y, verifyCardW, bandH);

  y += bandH + 6;

  /* ---------------------------------------------------------------------- */
  /* NOTES + AUTHORISED SIGNATURE (BOTTOM RIGHT)                            */
  /* ---------------------------------------------------------------------- */

  const noteColW = W - M * 2 - 72;

  d.setFont(FONT, "bold");
  d.setFontSize(6.5);
  d.setTextColor(...NAVY);
  d.text("NOTES & DECLARATION", M, y);

  const notes = [
    "Payroll has been processed in accordance with approved company policies.",
    "Net salary has been credited to the employee's registered payment account.",
    "Please report any payroll discrepancy to accounts@thrylosindia.in within 7 calendar days of issue.",
    "All amounts are stated in Indian Rupees (INR) and are subject to applicable regulations.",
    "This document is confidential and intended solely for official payroll purposes.",
  ];

  if (input.payrollNote?.trim()) {
    notes.push(sanitize(input.payrollNote.trim()));
  }

  let ny = y + 5.5;

  notes.forEach((line) => {
    // Orange bullet
    d.setFillColor(...ORANGE);
    d.circle(M + 1.5, ny - 1.2, 0.7, "F");

    // Note text
    d.setFont(FONT, "normal");
    d.setFontSize(6.9);
    d.setTextColor(...MUTED);

    const wrapped = d.splitTextToSize(line, noteColW - 5);
    d.text(wrapped, M + 5, ny);

    ny += wrapped.length * 3.8 + 1.6;
  });

  drawPayrollSignature(d, input, W - M - 62, y - 2);
  drawLetterFooterBar(d);
}

/**
 * Compact document-verification QR card for payroll documents.
 * Same verification payload as the letter documents, sized for the payment band.
 */
function drawVerificationQRCard(d: jsPDF, input: HRDocInput, x: number, y: number, w: number, h: number) {
  const centerX = x + w / 2;

  d.setFillColor(...WHITE);
  d.setDrawColor(...LINE);
  d.roundedRect(x, y, w, h, 2.5, 2.5, "FD");

  if (!input.verifyQrDataUrl) {
    d.setFont(FONT, "normal");
    d.setFontSize(6);
    d.setTextColor(...MUTED);
    d.text("Verification\nunavailable", centerX, y + h / 2, { align: "center" });
    return;
  }

  const size = 22;
  safeAddImage(d, input.verifyQrDataUrl, centerX - size / 2, y + 3.5, size, size);

  d.setFont(FONT, "bold");
  d.setFontSize(6.2);
  d.setTextColor(...NAVY);
  d.text("VERIFY DOCUMENT", centerX, y + size + 7, { align: "center" });

  d.setFont(FONT, "normal");
  d.setFontSize(5.2);
  d.setTextColor(...MUTED);
  d.text("Scan to verify authenticity", centerX, y + size + 10.4, { align: "center" });
}

/**
 * Compact authorised-signature block (signature + seal + signatory details)
 * styled identically to the letter documents, anchored bottom-right.
 */
function drawPayrollSignature(d: jsPDF, input: HRDocInput, x: number, y: number) {
  const blockW = 62;
  const centerX = x + blockW / 2;

  d.setFont(FONT, "normal");
  d.setFontSize(8);
  d.setTextColor(...MUTED);
  d.text("", centerX, y, { align: "center" });

  // Seal (behind/around signature, same visual language as letters)
  const sealSize = 30;
  if (input.sealDataUrl) {
    safeAddImage(d, input.sealDataUrl, centerX - sealSize / 2 + 8, y + 4, sealSize, sealSize);
  }

  // Handwritten signature
  if (input.signatureDataUrl) {
    safeAddImage(d, input.signatureDataUrl, centerX - 27, y + 8, 52, 18);
  }

  const lineY = y + 4 + sealSize * 0.72;

  d.setDrawColor(...DARK);
  d.setLineWidth(0.3);
  d.line(x, lineY, x + blockW, lineY);

  const nameY = lineY + 4.6;

  d.setFont(FONT, "bold");
  d.setFontSize(8.4);
  d.setTextColor(...DARK);
  d.text(input.signatoryName || COMPANY.founder, centerX, nameY, { align: "center" });

  d.setFont(FONT, "normal");
  d.setFontSize(6.6);
  d.setTextColor(...MUTED);
  d.text("Founder | Authorised Signatory", centerX, nameY + 4.2, { align: "center" });

  d.setFontSize(6.2);
  d.text(COMPANY.name, centerX, nameY + 7.8, { align: "center" });
}

/* ========================================================================== */
/*                         PREMIUM EMPLOYEE ID CARD                           */
/* ========================================================================== */

function renderIDCard(d: jsPDF, input: HRDocInput) {
  const emp = input.employee;
  const W = getPageWidth(d);
  const H = getPageHeight(d);

  /* ------------------------------------------------------------------------ */
  /* CARD GEOMETRY                                                            */
  /* ------------------------------------------------------------------------ */

  // Premium portrait credential proportion.
  const cardW = 88;
  const cardH = 139;

  const x = (W - cardW) / 2;
  const y = 24;

  const left = x + 8;
  const right = x + cardW - 8;
  const centerX = x + cardW / 2;

  const employeeCode = sanitize(emp.employee_code || input.documentNumber || "—");

  const employeeName = sanitize(emp.full_name || "Employee");
  const designation = sanitize(emp.designation || "Employee");
  const department = sanitize(emp.department || "THRYLOS INDIA");

  const verificationUrl = `https://www.thrylosindia.in/verify?emp=${encodeURIComponent(emp.employee_code || "")}`;

  /* ------------------------------------------------------------------------ */
  /* PAGE BACKGROUND                                                          */
  /* ------------------------------------------------------------------------ */

  d.setFillColor(243, 246, 250);
  d.rect(0, 0, W, H, "F");

  /* ------------------------------------------------------------------------ */
  /* SHADOW                                                                   */
  /* ------------------------------------------------------------------------ */

  d.setFillColor(216, 222, 230);

  d.roundedRect(x + 2, y + 2.5, cardW, cardH, 5.2, 5.2, "F");

  /* ------------------------------------------------------------------------ */
  /* MAIN CARD                                                                */
  /* ------------------------------------------------------------------------ */

  d.setFillColor(...WHITE);
  d.setDrawColor(215, 221, 229);
  d.setLineWidth(0.28);

  d.roundedRect(x, y, cardW, cardH, 5.2, 5.2, "FD");

  /* ------------------------------------------------------------------------ */
  /* PREMIUM TOP BRAND AREA                                                   */
  /* ------------------------------------------------------------------------ */

  const headerH = 31;

  d.setFillColor(...NAVY_DARK);

  d.roundedRect(x, y, cardW, headerH, 5.2, 5.2, "F");

  // Square lower portion so only top corners remain rounded.
  d.rect(x, y + 14, cardW, headerH - 14, "F");

  /* ------------------------------------------------------------------------ */
  /* TOP ACCENT                                                               */
  /* ------------------------------------------------------------------------ */

  d.setFillColor(...ORANGE);
  d.rect(x, y, cardW, 1.45, "F");

  /* ------------------------------------------------------------------------ */
  /* BRAND LOGO                                                               */
  /* ------------------------------------------------------------------------ */

  const logoW = 54;
  const logoH = 13.2;

  const logoAdded = safeAddImage(d, input.brandLogoDataUrl, centerX - logoW / 2, y + 5.2, logoW, logoH);

  if (!logoAdded) {
    d.setFont(FONT, "bold");
    d.setFontSize(12);
    d.setTextColor(...WHITE);

    d.text(COMPANY.name, centerX, y + 13, { align: "center" });
  }

  /* ------------------------------------------------------------------------ */
  /* BRAND SUBTITLE                                                           */
  /* ------------------------------------------------------------------------ */

  d.setFont(FONT, "bold");
  d.setFontSize(4.6);
  d.setTextColor(208, 217, 229);

  d.text("TECHNOLOGY  •  INNOVATION  •  DIGITAL SOLUTIONS", centerX, y + 22.2, { align: "center" });

  d.setFont(FONT, "bold");
  d.setFontSize(5.2);
  d.setTextColor(...WHITE);

  d.text("EMPLOYEE IDENTIFICATION", centerX, y + 27, { align: "center" });

  /* ------------------------------------------------------------------------ */
  /* PHOTO                                                                    */
  /* ------------------------------------------------------------------------ */

  const photoCY = y + 47;

  // Outer white halo
  d.setFillColor(...WHITE);
  d.circle(centerX, photoCY, 15.7, "F");

  // Navy outer ring
  d.setDrawColor(...NAVY);
  d.setLineWidth(0.85);
  d.circle(centerX, photoCY, 14.9);

  // Orange inner detail
  d.setDrawColor(...ORANGE);
  d.setLineWidth(0.35);
  d.circle(centerX, photoCY, 13.9);

  const photoAdded = safeAddImage(d, input.employeePhotoDataUrl, centerX - 12.7, photoCY - 12.7, 25.4, 25.4);

  if (!photoAdded) {
    d.setFillColor(...NAVY_LIGHT);
    d.circle(centerX, photoCY, 12.5, "F");

    d.setFont(FONT, "bold");
    d.setFontSize(19);
    d.setTextColor(...NAVY);

    d.text(employeeName.charAt(0).toUpperCase() || "?", centerX, photoCY + 5, { align: "center" });
  }

  /* ------------------------------------------------------------------------ */
  /* ACTIVE STATUS                                                            */
  /* ------------------------------------------------------------------------ */

  const statusY = y + 64.5;

  d.setFillColor(238, 248, 244);
  d.roundedRect(centerX - 11, statusY, 22, 5.2, 2.6, 2.6, "F");

  d.setFillColor(31, 157, 112);
  d.circle(centerX - 7.1, statusY + 2.6, 0.85, "F");

  d.setFont(FONT, "bold");
  d.setFontSize(4.3);
  d.setTextColor(31, 125, 91);

  d.text(emp.end_date ? "EMPLOYEE" : "ACTIVE EMPLOYEE", centerX + 1.4, statusY + 3.35, { align: "center" });

  /* ------------------------------------------------------------------------ */
  /* EMPLOYEE NAME                                                            */
  /* ------------------------------------------------------------------------ */

  let yy = y + 76;

  const upperName = employeeName.toUpperCase();

  d.setFont(FONT, "bold");

  let nameSize = 10.5;

  d.setFontSize(nameSize);

  while (nameSize > 7.8 && d.getTextWidth(upperName) > cardW - 15) {
    nameSize -= 0.35;
    d.setFontSize(nameSize);
  }

  d.setTextColor(...DARK);

  d.text(upperName, centerX, yy, { align: "center" });

  /* ------------------------------------------------------------------------ */
  /* DESIGNATION                                                              */
  /* ------------------------------------------------------------------------ */

  yy += 6;

  d.setFont(FONT, "bold");
  d.setFontSize(7);
  d.setTextColor(...NAVY);

  d.text(designation, centerX, yy, {
    align: "center",
    maxWidth: cardW - 14,
  });

  /* ------------------------------------------------------------------------ */
  /* DEPARTMENT                                                               */
  /* ------------------------------------------------------------------------ */

  yy += 5;

  d.setFont(FONT, "normal");
  d.setFontSize(5.4);
  d.setTextColor(...MUTED);

  d.text(department.toUpperCase(), centerX, yy, {
    align: "center",
    maxWidth: cardW - 16,
  });

  /* ------------------------------------------------------------------------ */
  /* ID NUMBER FEATURE BOX                                                    */
  /* ------------------------------------------------------------------------ */

  yy += 6;

  d.setFillColor(247, 249, 252);

  d.roundedRect(left, yy, cardW - 16, 13.5, 2.2, 2.2, "F");

  d.setFillColor(...ORANGE);

  d.roundedRect(left, yy, 1.4, 13.5, 0.7, 0.7, "F");

  d.setFont(FONT, "bold");
  d.setFontSize(4.4);
  d.setTextColor(...MUTED);

  d.text("EMPLOYEE ID", left + 5, yy + 4.5);

  d.setFont(FONT, "bold");
  d.setFontSize(6.8);
  d.setTextColor(...NAVY_DARK);

  d.text(employeeCode, left + 5, yy + 9.4, {
    maxWidth: cardW - 26,
  });

  /* ------------------------------------------------------------------------ */
  /* JOINING + VALIDITY                                                       */
  /* ------------------------------------------------------------------------ */

  yy += 17;

  const columnGap = 3;
  const infoW = (cardW - 16 - columnGap) / 2;

  // Joined box
  d.setFillColor(250, 251, 253);

  d.roundedRect(left, yy, infoW, 12, 2, 2, "F");

  d.setFont(FONT, "normal");
  d.setFontSize(4.1);
  d.setTextColor(...MUTED);

  d.text("DATE OF JOINING", left + 3.5, yy + 4);

  d.setFont(FONT, "bold");
  d.setFontSize(5.8);
  d.setTextColor(...DARK);

  d.text(fmtDate(emp.joining_date), left + 3.5, yy + 8.8);

  // Validity box
  const validityX = left + infoW + columnGap;

  d.setFillColor(250, 251, 253);

  d.roundedRect(validityX, yy, infoW, 12, 2, 2, "F");

  d.setFont(FONT, "normal");
  d.setFontSize(4.1);
  d.setTextColor(...MUTED);

  d.text("VALID THROUGH", validityX + 3.5, yy + 4);

  d.setFont(FONT, "bold");
  d.setFontSize(5.8);
  d.setTextColor(...DARK);

  d.text(emp.end_date ? fmtDate(emp.end_date) : "ON ROLL", validityX + 3.5, yy + 8.8);

  /* ------------------------------------------------------------------------ */
  /* VERIFICATION AREA                                                        */
  /* ------------------------------------------------------------------------ */

  yy += 15.5;

  d.setDrawColor(226, 230, 236);
  d.setLineWidth(0.25);

  d.line(left, yy, right, yy);

  yy += 4;

  /* ------------------------------------------------------------------------ */
  /* BARCODE                                                                  */
  /* ------------------------------------------------------------------------ */

  try {
    const canvas = document.createElement("canvas");

    JsBarcode(canvas, emp.employee_code || input.documentNumber, {
      format: "CODE128",
      displayValue: false,
      height: 28,
      width: 1.8,
      margin: 0,
    });

    d.addImage(canvas.toDataURL("image/png"), "PNG", left + 5, yy, cardW - 26, 6);
  } catch {
    // Barcode is optional.
  }

  yy += 8;

  d.setFont(FONT, "bold");
  d.setFontSize(4.5);
  d.setTextColor(...NAVY);

  d.text(employeeCode, centerX, yy, { align: "center" });

  /* ------------------------------------------------------------------------ */
  /* BOTTOM SECURITY STRIP                                                    */
  /* ------------------------------------------------------------------------ */

  const bottomH = 10.5;
  const bottomY = y + cardH - bottomH;

  d.setFillColor(...NAVY_DARK);

  // Bottom corners visually remain within main shell.
  d.roundedRect(x, bottomY, cardW, bottomH, 5.2, 5.2, "F");

  // Square off top of strip.
  d.rect(x, bottomY, cardW, 5.5, "F");

  d.setFillColor(...ORANGE);

  d.rect(x, bottomY, cardW, 1.15, "F");

  d.setFont(FONT, "bold");
  d.setFontSize(4.5);
  d.setTextColor(...WHITE);

  d.text("THRYLOS INDIA", left, bottomY + 6.4);

  d.setFont(FONT, "normal");
  d.setFontSize(4.1);

  d.text("OFFICIAL EMPLOYEE CREDENTIAL", right, bottomY + 6.4, { align: "right" });

  /* ------------------------------------------------------------------------ */
  /* PAGE CAPTION                                                             */
  /* ------------------------------------------------------------------------ */

  d.setFont(FONT, "bold");
  d.setFontSize(7);
  d.setTextColor(...NAVY_DARK);

  d.text("EMPLOYEE IDENTIFICATION CREDENTIAL", W / 2, y + cardH + 13, { align: "center" });

  d.setFont(FONT, "normal");
  d.setFontSize(6.1);
  d.setTextColor(...MUTED);

  d.text(`Issued by ${COMPANY.name} • ${COMPANY.location}`, W / 2, y + cardH + 18, { align: "center" });

  d.setFont(FONT, "bold");
  d.setFontSize(5.8);
  d.setTextColor(...NAVY);

  d.text(verificationUrl, W / 2, y + cardH + 23, {
    align: "center",
    maxWidth: W - 40,
  });
}
/* ========================================================================== */
/*                            DOCUMENT LABELS                                 */
/* ========================================================================== */

export const documentTypeLabel: Record<HRDocumentType, string> = {
  offer_letter: "Offer Letter",
  joining_letter: "Joining Letter",
  completion_letter: "Completion Letter",
  salary_slip: "Salary Slip",
  payslip: "Payslip",
  id_card: "Employee ID Card",
};

/* ========================================================================== */
/*                           INTERNAL RENDERER                                */
/* ========================================================================== */

function createDocument(type: HRDocumentType, input: HRDocInput) {
  const d = new jsPDF({
    unit: "mm",
    format: "a4",
    orientation: "portrait",
    compress: true,
    putOnlyUsedFonts: true,
  });

  setMetadata(d, type, input);

  switch (type) {
    case "offer_letter":
      renderOfferLetter(d, input);
      break;

    case "joining_letter":
      renderJoiningLetter(d, input);
      break;

    case "completion_letter":
      renderCompletionLetter(d, input);
      break;

    case "payslip":
      renderPayslip(d, input, false);
      break;

    case "salary_slip":
      renderPayslip(d, input, true);
      break;

    case "id_card":
      renderIDCard(d, input);
      break;
  }

  return d;
}

/* ========================================================================== */
/*                         BACKWARD-COMPATIBLE API                            */
/* ========================================================================== */

/**
 * Synchronous builder.
 *
 * This remains compatible with your existing implementation.
 *
 * IMPORTANT:
 * Remote employee.photo_url cannot be fetched synchronously.
 * Use buildHRDocumentBlobAsync() / generateHRDocument() when you want
 * the employee photo to be automatically loaded.
 */
export function buildHRDocumentBlob(type: HRDocumentType, input: HRDocInput): Blob {
  const d = createDocument(type, input);

  return d.output("blob");
}

/* ========================================================================== */
/*                           ASYNC INPUT PREPARATION                          */
/* ========================================================================== */

async function prepareInput(input: HRDocInput): Promise<HRDocInput> {
  let employeePhotoDataUrl = input.employeePhotoDataUrl;

  if (!employeePhotoDataUrl && input.employee.photo_url) {
    employeePhotoDataUrl = await loadImageAsDataUrl(input.employee.photo_url);
  }

  let verifyQrDataUrl = input.verifyQrDataUrl;
  if (!verifyQrDataUrl && input.documentNumber) {
    try {
      const verifyUrl = `https://thrylosindia.in/verify?doc=${encodeURIComponent(input.documentNumber)}`;
      verifyQrDataUrl = await QRCode.toDataURL(verifyUrl, {
        errorCorrectionLevel: "M",
        margin: 1,
        scale: 6,
        color: { dark: "#0E2343", light: "#FFFFFF" },
      });
    } catch {
      verifyQrDataUrl = undefined;
    }
  }

  const upiUri = input.upiUri || buildUpiUri(input) || undefined;
  let upiQrDataUrl = input.upiQrDataUrl;
  if (!upiQrDataUrl && upiUri) {
    try {
      upiQrDataUrl = await QRCode.toDataURL(upiUri, {
        errorCorrectionLevel: "M",
        margin: 1,
        scale: 8,
        color: { dark: "#0E2343", light: "#FFFFFF" },
      });
    } catch {
      upiQrDataUrl = undefined;
    }
  }

  return {
    ...input,
    employeePhotoDataUrl,
    verifyQrDataUrl,
    upiUri,
    upiQrDataUrl,
  };
}

/**
 * Preferred builder.
 *
 * Unlike the original synchronous builder, this can fetch the employee
 * photograph before generating the PDF.
 */
export async function buildHRDocumentBlobAsync(type: HRDocumentType, input: HRDocInput): Promise<Blob> {
  const prepared = await prepareInput(input);

  return buildHRDocumentBlob(type, prepared);
}

/* ========================================================================== */
/*                              DOWNLOAD PDF                                 */
/* ========================================================================== */

export async function generateHRDocument(type: HRDocumentType, input: HRDocInput, filename?: string) {
  const prepared = await prepareInput(input);

  const blob = buildHRDocumentBlob(type, prepared);

  const url = URL.createObjectURL(blob);

  const anchor = document.createElement("a");

  anchor.href = url;

  anchor.download = `${filename || input.documentNumber}.pdf`;

  anchor.style.display = "none";

  document.body.appendChild(anchor);

  anchor.click();

  anchor.remove();

  setTimeout(() => {
    URL.revokeObjectURL(url);
  }, 1500);
}

/* ========================================================================== */
/*                                BASE64                                      */
/* ========================================================================== */

export async function hrDocumentBase64(type: HRDocumentType, input: HRDocInput): Promise<string> {
  const prepared = await prepareInput(input);

  const blob = buildHRDocumentBlob(type, prepared);

  const buffer = await blob.arrayBuffer();

  const bytes = new Uint8Array(buffer);

  /*
   * Avoid String.fromCharCode(...bytes) because large PDFs can exceed
   * the JS argument limit.
   */
  let binary = "";

  const chunkSize = 0x8000;

  for (let i = 0; i < bytes.length; i += chunkSize) {
    const chunk = bytes.subarray(i, Math.min(i + chunkSize, bytes.length));

    binary += String.fromCharCode(...chunk);
  }

  return btoa(binary);
}

/* ========================================================================== */
/*                              BRAND ASSETS                                  */
/* ========================================================================== */

/**
 * Loads the three permanent Thrylos India brand assets.
 *
 * Expected public directory:
 *
 * /public
 *   /brand
 *      thrylos-logo.png
 *      founder-signature.png
 *      company-seal.png
 */
export async function loadHRBrandAssets(): Promise<
  Pick<HRDocInput, "brandLogoDataUrl" | "signatureDataUrl" | "sealDataUrl">
> {
  const [brandLogoDataUrl, signatureDataUrl, sealDataUrl] = await Promise.all([
    loadImageAsDataUrl("/brand/thrylos-logo.png"),

    loadImageAsDataUrl("/brand/founder-signature.png"),

    loadImageAsDataUrl("/brand/company-seal.png"),
  ]);

  return {
    brandLogoDataUrl,
    signatureDataUrl,
    sealDataUrl,
  };
}

/* ========================================================================== */
/*                       COMPLETE ASSET PRELOADER                             */
/* ========================================================================== */

/**
 * Optional convenience helper.
 *
 * Use this if the portal wants to preload brand assets + employee photo
 * before previewing, emailing or generating a document.
 */
export async function loadHRDocumentAssets(
  employee?: HREmployee,
): Promise<Pick<HRDocInput, "brandLogoDataUrl" | "signatureDataUrl" | "sealDataUrl" | "employeePhotoDataUrl">> {
  const [brand, employeePhotoDataUrl] = await Promise.all([
    loadHRBrandAssets(),

    employee?.photo_url ? loadImageAsDataUrl(employee.photo_url) : Promise.resolve(undefined),
  ]);

  return {
    ...brand,
    employeePhotoDataUrl,
  };
}
