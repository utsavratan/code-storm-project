import { expect, test } from "bun:test";
import { CAROUSEL_INTERVAL_MS, nextIndex, queueIndices } from "../src/lib/carouselQueue";
test("showcases advance every five seconds", () => expect(CAROUSEL_INTERVAL_MS).toBe(5000));
test("second project becomes featured and the old featured project goes last", () => {
  expect(nextIndex(4, 0)).toBe(1);
  expect(queueIndices(4, 1)).toEqual([2, 3, 0]);
});
test("last project wraps to the first without duplicating the queue", () => {
  expect(nextIndex(4, 3)).toBe(0);
  expect(queueIndices(4, 0)).toEqual([1, 2, 3]);
  expect(queueIndices(1, 0)).toEqual([]);
});