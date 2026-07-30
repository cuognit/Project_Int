import assert from "node:assert/strict";
import test from "node:test";
import {
  getSwipeDirection,
  wrapCarouselIndex,
} from "../src/utils/carousel.js";

test("wrapCarouselIndex loops in both directions", () => {
  assert.equal(wrapCarouselIndex(3, 3), 0);
  assert.equal(wrapCarouselIndex(-1, 3), 2);
});

test("getSwipeDirection ignores small gestures and detects swipes", () => {
  assert.equal(getSwipeDirection(100, 70), 0);
  assert.equal(getSwipeDirection(100, 20), 1);
  assert.equal(getSwipeDirection(20, 100), -1);
});
