/** Pure logic for tracking professional certifications and their expiry. */

export type Cert = {
  id: string;
  name: string;
  issuer: string;
  issuedOn: string; // YYYY-MM-DD
  expiresOn?: string; // YYYY-MM-DD, omitted for lifetime certs
  credentialId?: string;
};

export type CertStatus = "valid" | "expiring" | "expired" | "lifetime";

const DAY = 86_400_000;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

function parseDate(key: string): number {
  if (!DATE_RE.test(key)) return NaN;
  const [y, m, d] = key.split("-").map(Number);
  const t = Date.UTC(y, m - 1, d);
  const back = new Date(t);
  // Reject impossible dates like 2025-02-30.
  return back.getUTCFullYear() === y && back.getUTCMonth() === m - 1 && back.getUTCDate() === d ? t : NaN;
}

export function isValidDate(key: string): boolean {
  return !Number.isNaN(parseDate(key));
}

/** Whole days from `today` to `target` (negative when in the past). */
export function daysBetween(today: string, target: string): number {
  return Math.round((parseDate(target) - parseDate(today)) / DAY);
}

export function certStatus(cert: Cert, today: string, warnDays = 60): CertStatus {
  if (!cert.expiresOn) return "lifetime";
  const left = daysBetween(today, cert.expiresOn);
  if (left < 0) return "expired";
  return left <= warnDays ? "expiring" : "valid";
}

const STATUS_ORDER: Record<CertStatus, number> = { expired: 0, expiring: 1, valid: 2, lifetime: 3 };

/** Most urgent first: expired, expiring, valid (soonest expiry first), lifetime. */
export function sortByUrgency(certs: Cert[], today: string): Cert[] {
  return [...certs].sort(
    (a, b) =>
      STATUS_ORDER[certStatus(a, today)] - STATUS_ORDER[certStatus(b, today)] ||
      (a.expiresOn ?? "9999").localeCompare(b.expiresOn ?? "9999") ||
      a.name.localeCompare(b.name),
  );
}

export function statusSummary(certs: Cert[], today: string): Record<CertStatus, number> {
  const out: Record<CertStatus, number> = { valid: 0, expiring: 0, expired: 0, lifetime: 0 };
  for (const c of certs) out[certStatus(c, today)]++;
  return out;
}

export function describeExpiry(cert: Cert, today: string): string {
  if (!cert.expiresOn) return "No expiry";
  const left = daysBetween(today, cert.expiresOn);
  if (left < 0) return `Expired ${-left} day(s) ago`;
  if (left === 0) return "Expires today";
  return `Expires in ${left} day(s)`;
}

export type NewCertInput = { name: string; issuer: string; issuedOn: string; expiresOn?: string };

export function validateCert(input: NewCertInput): string | null {
  if (!input.name.trim()) return "Name is required";
  if (!input.issuer.trim()) return "Issuer is required";
  if (!isValidDate(input.issuedOn)) return "Issued date must be a real date (YYYY-MM-DD)";
  if (input.expiresOn) {
    if (!isValidDate(input.expiresOn)) return "Expiry date must be a real date (YYYY-MM-DD)";
    if (input.expiresOn <= input.issuedOn) return "Expiry must be after the issue date";
  }
  return null;
}

export const SAMPLE_CERTS: Cert[] = [
  { id: "c1", name: "AWS Certified Solutions Architect – Associate", issuer: "Amazon Web Services", issuedOn: "2023-03-10", expiresOn: "2026-03-10" },
  { id: "c2", name: "Certified Kubernetes Application Developer", issuer: "CNCF", issuedOn: "2022-11-01", expiresOn: "2025-11-01" },
  { id: "c3", name: "Professional Scrum Master I", issuer: "Scrum.org", issuedOn: "2021-06-15" },
  { id: "c4", name: "Google Cloud Associate Cloud Engineer", issuer: "Google Cloud", issuedOn: "2022-01-20", expiresOn: "2025-01-20" },
];
