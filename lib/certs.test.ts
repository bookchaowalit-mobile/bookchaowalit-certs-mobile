import { describe, expect, it } from "vitest";
import {
  certStatus,
  daysBetween,
  cleanCertInput,
  describeExpiry,
  isValidDate,
  SAMPLE_CERTS,
  sortByUrgency,
  statusSummary,
  validateCert,
  type Cert,
} from "./certs";

const TODAY = "2025-10-01";
const cert = (expiresOn?: string): Cert => ({ id: "x", name: "X", issuer: "Y", issuedOn: "2020-01-01", expiresOn });

describe("dates", () => {
  it("validates real calendar dates", () => {
    expect(isValidDate("2024-02-29")).toBe(true);
    expect(isValidDate("2025-02-29")).toBe(false);
    expect(isValidDate("2025-13-01")).toBe(false);
    expect(isValidDate("01/02/2025")).toBe(false);
  });
  it("counts days across DST-free UTC math", () => {
    expect(daysBetween("2025-01-01", "2025-12-31")).toBe(364);
    expect(daysBetween("2025-03-01", "2025-02-01")).toBe(-28);
  });
});

describe("certStatus", () => {
  it("classifies by remaining days", () => {
    expect(certStatus(cert(), TODAY)).toBe("lifetime");
    expect(certStatus(cert("2025-09-30"), TODAY)).toBe("expired");
    expect(certStatus(cert("2025-10-01"), TODAY)).toBe("expiring");
    expect(certStatus(cert("2025-11-30"), TODAY)).toBe("expiring");
    expect(certStatus(cert("2025-12-01"), TODAY)).toBe("valid");
    expect(certStatus(cert("2025-12-01"), TODAY, 90)).toBe("expiring");
  });
  it("describes expiry", () => {
    expect(describeExpiry(cert("2025-09-29"), TODAY)).toBe("Expired 2 days ago");
    expect(describeExpiry(cert("2025-10-01"), TODAY)).toBe("Expires today");
    expect(describeExpiry(cert("2025-10-11"), TODAY)).toBe("Expires in 10 days");
    expect(describeExpiry(cert(), TODAY)).toBe("No expiry");
  });
});

describe("lists", () => {
  it("sorts by urgency", () => {
    expect(sortByUrgency(SAMPLE_CERTS, TODAY).map((c) => c.id)).toEqual(["c4", "c2", "c1", "c3"]);
  });
  it("summarises statuses", () => {
    expect(statusSummary(SAMPLE_CERTS, TODAY)).toEqual({ valid: 1, expiring: 1, expired: 1, lifetime: 1 });
  });
});

describe("validateCert", () => {
  const ok = { name: "N", issuer: "I", issuedOn: "2025-01-01" };
  it("accepts valid input with or without expiry", () => {
    expect(validateCert(ok)).toBeNull();
    expect(validateCert({ ...ok, expiresOn: "2026-01-01" })).toBeNull();
  });
  it("rejects bad input", () => {
    expect(validateCert({ ...ok, name: " " })).toMatch(/Name/);
    expect(validateCert({ ...ok, issuer: "" })).toMatch(/Issuer/);
    expect(validateCert({ ...ok, issuedOn: "2025-02-30" })).toMatch(/Issued/);
    expect(validateCert({ ...ok, expiresOn: "2024-12-31" })).toMatch(/after/);
  });
});

describe("pass 3 edge cases", () => {
  it("uses singular day", () => {
    expect(describeExpiry(cert("2025-10-02"), TODAY)).toBe("Expires in 1 day");
    expect(describeExpiry(cert("2025-09-30"), TODAY)).toBe("Expired 1 day ago");
  });
  it("accepts dates with stray spaces or full-width digits", () => {
    const raw = { name: " AWS ", issuer: "Amazon", issuedOn: " 2024-01-01 ", expiresOn: "\uFF12\uFF10\uFF12\uFF17-01-01" };
    expect(validateCert(raw)).toBeNull();
    expect(cleanCertInput(raw)).toEqual({ name: "AWS", issuer: "Amazon", issuedOn: "2024-01-01", expiresOn: "2027-01-01" });
    expect(cleanCertInput({ ...raw, expiresOn: "  " }).expiresOn).toBeUndefined();
  });
  it("rejects an issue date in the future when today is known", () => {
    const input = { name: "X", issuer: "Y", issuedOn: "2025-10-02" };
    expect(validateCert(input, TODAY)).toBe("Issued date cannot be in the future");
    expect(validateCert(input)).toBeNull();
  });
});
