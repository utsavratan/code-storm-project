import { expect, test } from "bun:test";
import { readSavedTickets, saveTickets, ticketCacheKey } from "../src/lib/offlineTickets";
const memory = () => {
  const data = new Map<string, string>();
  return { getItem: (key: string) => data.get(key) ?? null, setItem: (key: string, value: string) => { data.set(key, value); }, removeItem: (key: string) => { data.delete(key); } };
};
test("saved tickets belong only to the signed-in account", () => {
  const storage = memory();
  saveTickets(storage, "student-a", [{ status: "confirmed", ticket_code: "TKT-123" }]);
  expect(readSavedTickets(storage, "student-a")?.rows).toEqual([{ status: "confirmed", ticket_code: "TKT-123" }]);
  expect(readSavedTickets(storage, "student-b")).toBeNull();
});
test("legacy unscoped tickets and malformed saved data are not read", () => {
  const storage = memory();
  storage.setItem("thrylos-offline-tickets", '[{"ticket_code":"private"}]');
  expect(readSavedTickets(storage, "student-a")).toBeNull();
  storage.setItem(ticketCacheKey("student-a"), "bad json");
  expect(readSavedTickets(storage, "student-a")).toBeNull();
  saveTickets(storage, "student-a", []);
  expect(storage.getItem("thrylos-offline-tickets")).toBeNull();
});