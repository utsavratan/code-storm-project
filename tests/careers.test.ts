import { expect, test } from "bun:test";
import { CAREERS_URL, openCareers } from "../src/lib/careers";

test("careers redirects to the requested official HTTPS destination", () => {
  let destination = "";
  const previous = Object.getOwnPropertyDescriptor(globalThis, "window");
  Object.defineProperty(globalThis, "window", { configurable: true, value: { location: { replace: (url: string) => { destination = url; } } } });
  try {
    openCareers();
    expect(destination).toBe("https://careers.thrylos.in");
    expect(CAREERS_URL).toBe(destination);
  } finally {
    if (previous) Object.defineProperty(globalThis, "window", previous);
    else Reflect.deleteProperty(globalThis, "window");
  }
});