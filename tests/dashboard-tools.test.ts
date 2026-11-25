import { expect, test } from "bun:test";
import { verificationPath } from "../src/components/dashboard/toolRules";

test("invoice tool opens the invoice lookup with the supplied reference", () => {
  expect(verificationPath(" THR-INV-2026-1 ")).toBe("/verify?inv=THR-INV-2026-1");
});
test("letter tool opens the document lookup", () => {
  expect(verificationPath("OFR-26-1234")).toBe("/verify?doc=OFR-26-1234");
});