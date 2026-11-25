import { describe, expect, test } from "bun:test";
import { canShowTicket, isPaymentReturn, shouldRetryConfirmation, selectSavedRegistration } from "../src/lib/eventTicketState";

describe("event payment return", () => {
  test("multiple registrations restore the active ticket, while returns match the exact owned ticket", () => {
    const rows = [{ ticket_code: "TKT-OLD", status: "cancelled" }, { ticket_code: "TKT-NEW", status: "pending_payment" }];
    expect(selectSavedRegistration(rows, null)?.ticket_code).toBe("TKT-NEW");
    expect(selectSavedRegistration(rows, "TKT-OLD")?.ticket_code).toBe("TKT-OLD");
    expect(selectSavedRegistration(rows, "TKT-OTHER")).toBeNull();
  });
  test("ticket and order parameters start confirmation rather than registration", () => {
    expect(isPaymentReturn(new URLSearchParams("ticket=TKT-ABC123&order_id=evt_123"))).toBe(true);
    expect(isPaymentReturn(new URLSearchParams("ticket=TKT-ABC123"))).toBe(false);
  });
  test("unpaid registrations never unlock a QR or reference", () => {
    expect(canShowTicket({ code: "TKT-ABC123", status: "pending_payment" })).toBe(false);
    expect(canShowTicket({ code: "TKT-ABC123", status: "waitlist" })).toBe(false);
    expect(canShowTicket({ code: "TKT-ABC123", status: "confirmed" })).toBe(true);
  });
  test("confirmation retries processing orders but stops on terminal states", () => {
    expect(shouldRetryConfirmation("pending_payment", "ACTIVE")).toBe(true);
    expect(shouldRetryConfirmation("pending_payment", "EXPIRED")).toBe(false);
    expect(shouldRetryConfirmation("confirmed", "PAID")).toBe(false);
  });
});