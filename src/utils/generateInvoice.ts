import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import QRCode from "qrcode";
import JsBarcode from "jsbarcode";

import { buildInvoiceDoc as drawInvoiceDoc, type InvoicePDFData, type InvoiceLineItem, type InvoicePageFormat } from "../../supabase/functions/_shared/invoiceLayout";
export type { InvoicePDFData, InvoiceLineItem, InvoicePageFormat };
export const buildInvoiceDoc = (data: InvoicePDFData, type: "invoice" | "receipt" = "invoice", format: InvoicePageFormat = "a4") => drawInvoiceDoc(data, type, format, jsPDF);

export const THRYLOS_UPI = "thrylosindia@slc";
export const THRYLOS_PAYEE_NAME = "THRYLOS INDIA";
export const THRYLOS_SIGNATORY_NAME = "UTSAV RATAN";
export const THRYLOS_SIGNATORY_TITLE = "Founder | THRYLOS INDIA";

const BRAND_LOGO_URL = "/brand/thrylos-logo.png";
const BRAND_SIGNATURE_URL = "/brand/founder-signature.png";
const BRAND_SEAL_URL = "/brand/company-seal.png";

/* ================================================================
   TEXT SAFETY
================================================================ */

const safe = (s: string | undefined | null): string =>
  (s ?? "")
    .replace(/[\u{1F000}-\u{1FFFF}\u{2600}-\u{27BF}\u{2300}-\u{23FF}\u{2000}-\u{206F}]/gu, "")
    .replace(/[^\x20-\x7E\n\r\t]/g, "")
    .replace(/\s+/g, " ")
    .trim();

/* ================================================================
   IMAGE LOADER
================================================================ */

const imageDataUrlCache = new Map<string, string>();

export const loadImageAsDataUrl = async (url: string): Promise<string | undefined> => {
  if (imageDataUrlCache.has(url)) {
    return imageDataUrlCache.get(url);
  }

  try {
    const res = await fetch(url);

    if (!res.ok) {
      return undefined;
    }

    const blob = await res.blob();

    const dataUrl = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = () => resolve(String(reader.result));
      reader.onerror = () => reject(reader.error);

      reader.readAsDataURL(blob);
    });

    imageDataUrlCache.set(url, dataUrl);

    return dataUrl;
  } catch {
    return undefined;
  }
};

export interface BrandAssets {
  brandLogoDataUrl?: string;
  signatureDataUrl?: string;
  sealDataUrl?: string;
}

/**
 * Loads the founder signature, company seal and brand logo as data URLs
 * in parallel. Backed by the same cache as loadImageAsDataUrl, so calling
 * this repeatedly (e.g. once per preview open) is cheap after the first
 * fetch. This is the ONLY place these three assets should be loaded from —
 * every invoice/receipt builder in the app must call this instead of
 * fetching the images individually.
 */
export const loadBrandAssets = async (): Promise<BrandAssets> => {
  const [brandLogoDataUrl, signatureDataUrl, sealDataUrl] = await Promise.all([
    loadImageAsDataUrl(BRAND_LOGO_URL),
    loadImageAsDataUrl(BRAND_SIGNATURE_URL),
    loadImageAsDataUrl(BRAND_SEAL_URL),
  ]);

  return { brandLogoDataUrl, signatureDataUrl, sealDataUrl };
};

/* ================================================================
   UPI QR
================================================================ */

export const buildUpiQrDataUrl = async (
  upiId: string,
  amount: number,
  payeeName = "THRYLOS INDIA",
  note = "",
): Promise<string> => {
  const params = new URLSearchParams({
    pa: upiId,
    pn: payeeName,
    am: Number(amount).toFixed(2),
    cu: "INR",
  });

  if (note) {
    params.set("tn", note.slice(0, 50));
  }

  const upiUrl = `upi://pay?${params.toString()}`;

  return QRCode.toDataURL(upiUrl, {
    margin: 1,
    width: 400,
    color: {
      dark: "#071f46",
      light: "#ffffff",
    },
  });
};

/* ================================================================
   BARCODE
================================================================ */

export const VERIFY_BASE_URL = "https://thrylosindia.in/verify";

export const buildVerifyUrl = (invoiceNumber: string): string =>
  `${VERIFY_BASE_URL}?inv=${encodeURIComponent((invoiceNumber || "").trim())}`;

export const buildBarcodeDataUrl = (invoiceNumber: string): string | undefined => {
  try {
    const canvas = document.createElement("canvas");
    // Keep Code 128 short enough to retain readable narrow bars on A4 printouts.
    // The adjacent QR carries the clickable verification URL.
    const payload = (invoiceNumber || "INVOICE").trim();
    JsBarcode(canvas, payload, {
      format: "CODE128",
      displayValue: false,
      margin: 12,
      height: 70,
      width: 2,
      background: "#ffffff",
      lineColor: "#071f46",
    });
    return canvas.toDataURL("image/png");
  } catch {
    return undefined;
  }
};

/**
 * Fills in any missing brand assets (logo, founder signature, company seal),
 * verification barcode and signatory so every invoice/receipt in the app
 * renders exactly like a manual bill, regardless of which screen built it.
 */
export const enrichInvoiceData = async (data: InvoicePDFData): Promise<InvoicePDFData> => {
  const brand = await loadBrandAssets();
  return {
    ...data,
    brandLogoDataUrl: data.brandLogoDataUrl || brand.brandLogoDataUrl,
    signatureDataUrl: data.signatureDataUrl || brand.signatureDataUrl,
    sealDataUrl: data.sealDataUrl || brand.sealDataUrl,
    barcodeDataUrl: data.barcodeDataUrl || buildBarcodeDataUrl(data.invoiceNo),
    signatoryName: data.signatoryName || THRYLOS_SIGNATORY_NAME,
    signatoryTitle: data.signatoryTitle || THRYLOS_SIGNATORY_TITLE,
  };
};

/* ================================================================
   PNG EXPORT
================================================================ */

export const generateInvoicePNG = async (element: HTMLElement, filename: string): Promise<void> => {
  const canvas = await html2canvas(element, {
    scale: 3,
    backgroundColor: "#ffffff",
    useCORS: true,
    logging: false,
  });

  const link = document.createElement("a");

  link.download = `${filename}.png`;
  link.href = canvas.toDataURL("image/png");

  link.click();
};

/* ================================================================
   BLOB
================================================================ */

export const buildInvoiceBlob = (
  data: InvoicePDFData,
  type: "invoice" | "receipt" = "invoice",
  format: InvoicePageFormat = "a4",
) => buildInvoiceDoc(data, type, format).output("blob");

/* ================================================================
   BLOB URL
================================================================ */

export const buildInvoiceBlobUrl = (
  data: InvoicePDFData,
  type: "invoice" | "receipt" = "invoice",
  format: InvoicePageFormat = "a4",
) => URL.createObjectURL(buildInvoiceBlob(data, type, format));

/* ================================================================
   DOWNLOAD PDF
================================================================ */

export const generateInvoicePDF = async (
  data: InvoicePDFData,
  type: "invoice" | "receipt" = "invoice",
  filename?: string,
  format: InvoicePageFormat = "a4",
): Promise<void> => {
  const doc = buildInvoiceDoc(await enrichInvoiceData(data), type, format);

  doc.save(`${filename || data.invoiceNo || "thrylos-invoice"}.pdf`);
};
