export function formatDocumentNumber(
  prefix: string,
  seq: number,
  year = new Date().getFullYear()
): string {
  return `${prefix}-${year}-${String(seq).padStart(4, "0")}`;
}
