import assert from "node:assert/strict";
import test from "node:test";
import {
  ADMIN_ORDER_QUEUE_EVENT,
  emitAdminOrderQueueChanged,
} from "../src/utils/adminOrderQueueEvents.js";

test("emitAdminOrderQueueChanged - Bắn custom event lên window nếu window tồn tại", () => {
  let dispatchedEvent = null;
  globalThis.window = {
    dispatchEvent: (evt) => {
      dispatchedEvent = evt;
    },
  };
  globalThis.CustomEvent = class CustomEvent {
    constructor(type, options) {
      this.type = type;
      this.detail = options.detail;
    }
  };

  try {
    emitAdminOrderQueueChanged({ orderId: 123 });
    assert.equal(dispatchedEvent.type, ADMIN_ORDER_QUEUE_EVENT);
    assert.deepEqual(dispatchedEvent.detail, { orderId: 123 });
  } finally {
    delete globalThis.window;
    delete globalThis.CustomEvent;
  }
});
