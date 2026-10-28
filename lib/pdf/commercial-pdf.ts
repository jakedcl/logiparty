import { PDFDocument, StandardFonts, rgb } from "pdf-lib";

export type PdfLine = {
  description: string;
  quantity: string;
  unit: string;
  unitPrice: string;
  lineTotal: string;
};

export type CommercialPdfInput = {
  orgName: string;
  orgPrimaryColor?: string;
  documentLabel: string;
  documentNumber: string;
  clientName: string;
  issueDate: string;
  validUntil?: string;
  dueDate?: string;
  lines: PdfLine[];
  subtotal: string;
  taxLabel: string;
  taxAmount: string;
  total: string;
  deposit?: string;
  notesClient?: string;
  footer?: string;
};

function hexToRgb(hex: string) {
  const h = hex.replace("#", "");
  if (h.length !== 6) return rgb(0.1, 0.35, 0.6);
  const r = parseInt(h.slice(0, 2), 16) / 255;
  const g = parseInt(h.slice(2, 4), 16) / 255;
  const b = parseInt(h.slice(4, 6), 16) / 255;
  return rgb(r, g, b);
}

export async function buildCommercialPdf(
  input: CommercialPdfInput
): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  const page = doc.addPage([612, 792]);
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);
  const accent = hexToRgb(input.orgPrimaryColor ?? "#1e3a5f");

  let y = 740;
  const left = 50;

  page.drawText(input.orgName, { x: left, y, size: 18, font: bold, color: accent });
  y -= 22;
  page.drawText(`${input.documentLabel} ${input.documentNumber}`, {
    x: left,
    y,
    size: 12,
    font: bold,
  });
  y -= 18;
  page.drawText(`Prepared for ${input.clientName}`, {
    x: left,
    y,
    size: 10,
    font,
  });
  y -= 14;
  page.drawText(`Date: ${input.issueDate}`, { x: left, y, size: 10, font });
  if (input.validUntil) {
    y -= 14;
    page.drawText(`Valid until: ${input.validUntil}`, {
      x: left,
      y,
      size: 10,
      font,
    });
  }
  if (input.dueDate) {
    y -= 14;
    page.drawText(`Due: ${input.dueDate}`, { x: left, y, size: 10, font });
  }

  y -= 28;
  const cols = [left, 280, 340, 400, 480];
  page.drawText("Description", { x: cols[0], y, size: 9, font: bold });
  page.drawText("Qty", { x: cols[1], y, size: 9, font: bold });
  page.drawText("Unit", { x: cols[2], y, size: 9, font: bold });
  page.drawText("Rate", { x: cols[3], y, size: 9, font: bold });
  page.drawText("Amount", { x: cols[4], y, size: 9, font: bold });
  y -= 12;
  page.drawLine({
    start: { x: left, y },
    end: { x: 562, y },
    thickness: 0.5,
    color: rgb(0.8, 0.8, 0.8),
  });
  y -= 14;

  for (const line of input.lines) {
    if (y < 120) break;
    const desc =
      line.description.length > 42
        ? `${line.description.slice(0, 41)}…`
        : line.description;
    page.drawText(desc, { x: cols[0], y, size: 9, font });
    page.drawText(line.quantity, { x: cols[1], y, size: 9, font });
    page.drawText(line.unit, { x: cols[2], y, size: 9, font });
    page.drawText(line.unitPrice, { x: cols[3], y, size: 9, font });
    page.drawText(line.lineTotal, { x: cols[4], y, size: 9, font });
    y -= 14;
  }

  y -= 8;
  page.drawText(`Subtotal: ${input.subtotal}`, {
    x: 400,
    y,
    size: 10,
    font,
  });
  y -= 14;
  page.drawText(`${input.taxLabel}: ${input.taxAmount}`, {
    x: 400,
    y,
    size: 10,
    font,
  });
  y -= 14;
  page.drawText(`Total: ${input.total}`, {
    x: 400,
    y,
    size: 11,
    font: bold,
    color: accent,
  });
  if (input.deposit) {
    y -= 14;
    page.drawText(`Deposit due: ${input.deposit}`, {
      x: 400,
      y,
      size: 10,
      font,
    });
  }

  if (input.notesClient?.trim()) {
    y -= 24;
    page.drawText("Notes", { x: left, y, size: 10, font: bold });
    y -= 14;
    const note = input.notesClient.trim().slice(0, 400);
    page.drawText(note, { x: left, y, size: 9, font, maxWidth: 500 });
  }

  if (input.footer?.trim()) {
    page.drawText(input.footer.trim().slice(0, 200), {
      x: left,
      y: 40,
      size: 8,
      font,
      color: rgb(0.4, 0.4, 0.4),
      maxWidth: 500,
    });
  }

  return doc.save();
}
