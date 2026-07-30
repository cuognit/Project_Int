import assert from "node:assert/strict";
import test from "node:test";
import {
  isGoogleServiceUnavailableError,
  normalizeGoogleFullName,
  verifyGoogleToken,
} from "../src/services/googleAuth.service.js";

test("normalizeGoogleFullName trims and limits a Google name to 100 characters", () => {
  const result = normalizeGoogleFullName(`  ${"a".repeat(120)}  `, "user@example.com");
  assert.equal(result, "a".repeat(100));
});

test("normalizeGoogleFullName falls back to the email local part", () => {
  assert.equal(normalizeGoogleFullName("   ", "shopper@example.com"), "shopper");
});

test("isGoogleServiceUnavailableError recognizes network and upstream failures", () => {
  assert.equal(isGoogleServiceUnavailableError({ code: "ETIMEDOUT" }), true);
  assert.equal(isGoogleServiceUnavailableError({ response: { status: 503 } }), true);
  assert.equal(isGoogleServiceUnavailableError(new Error("invalid token")), false);
});

test("verifyGoogleToken maps invalid credentials to 401", async () => {
  const previousClientId = process.env.GOOGLE_CLIENT_ID;
  process.env.GOOGLE_CLIENT_ID = "test-client.apps.googleusercontent.com";
  const verifier = {
    verifyIdToken: async () => {
      throw new Error("Wrong number of segments in token");
    },
  };

  try {
    await assert.rejects(
      verifyGoogleToken("invalid", verifier),
      (error) => error.statusCode === 401,
    );
  } finally {
    if (previousClientId === undefined) delete process.env.GOOGLE_CLIENT_ID;
    else process.env.GOOGLE_CLIENT_ID = previousClientId;
  }
});

test("verifyGoogleToken maps Google network failures to 503", async () => {
  const previousClientId = process.env.GOOGLE_CLIENT_ID;
  process.env.GOOGLE_CLIENT_ID = "test-client.apps.googleusercontent.com";
  const verifier = {
    verifyIdToken: async () => {
      const error = new Error("timeout");
      error.code = "ETIMEDOUT";
      throw error;
    },
  };

  try {
    await assert.rejects(
      verifyGoogleToken("credential", verifier),
      (error) => error.statusCode === 503,
    );
  } finally {
    if (previousClientId === undefined) delete process.env.GOOGLE_CLIENT_ID;
    else process.env.GOOGLE_CLIENT_ID = previousClientId;
  }
});

test("verifyGoogleToken rejects an unverified Google email", async () => {
  const previousClientId = process.env.GOOGLE_CLIENT_ID;
  process.env.GOOGLE_CLIENT_ID = "test-client.apps.googleusercontent.com";
  const verifier = {
    verifyIdToken: async () => ({
      getPayload: () => ({
        sub: "google-user",
        email: "user@example.com",
        email_verified: false,
      }),
    }),
  };

  try {
    await assert.rejects(
      verifyGoogleToken("credential", verifier),
      (error) => error.statusCode === 401,
    );
  } finally {
    if (previousClientId === undefined) delete process.env.GOOGLE_CLIENT_ID;
    else process.env.GOOGLE_CLIENT_ID = previousClientId;
  }
});
