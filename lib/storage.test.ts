import { describe, expect, it } from "vitest";
import { isCert, SAMPLE_CERTS } from "./certs";
import { encodeEnvelope, listCodec } from "./persist";

describe("certificate persistence", () => {
  const codec = listCodec(isCert);

  it("round-trips the sample certificates", () => {
    expect(codec.decode(codec.encode(SAMPLE_CERTS))).toEqual(SAMPLE_CERTS);
  });

  it("drops malformed entries", () => {
    const raw = encodeEnvelope([
      SAMPLE_CERTS[0],
      { ...SAMPLE_CERTS[0], id: "x", issuedOn: "2026-02-30" },
      { ...SAMPLE_CERTS[0], id: "y", expiresOn: 20260101 },
      { ...SAMPLE_CERTS[0], id: "z", name: " " },
    ]);
    expect(codec.decode(raw)?.map((c) => c.id)).toEqual([SAMPLE_CERTS[0].id]);
  });
});
