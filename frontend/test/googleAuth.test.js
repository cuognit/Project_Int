import assert from "node:assert/strict";
import test from "node:test";

const importGoogleAuth = () =>
  import(`../src/utils/googleAuth.js?test=${Date.now()}-${Math.random()}`);

const createContainer = () => ({
  innerHTML: "",
});

test("Google Identity initializes once and dispatches to the latest handler", async () => {
  let initializeCount = 0;
  let googleCallback;
  globalThis.window = {
    google: {
      accounts: {
        id: {
          initialize: (config) => {
            initializeCount += 1;
            googleCallback = config.callback;
          },
          renderButton: () => {},
        },
      },
    },
  };
  globalThis.document = {
    getElementById: () => null,
  };

  const { renderGoogleButton } = await importGoogleAuth();
  const received = [];
  await renderGoogleButton({
    clientId: "client-id",
    container: createContainer(),
    onCredential: () => received.push("first"),
    options: {},
  });
  await renderGoogleButton({
    clientId: "client-id",
    container: createContainer(),
    onCredential: () => received.push("latest"),
    options: {},
  });

  googleCallback({ credential: "token" });
  assert.equal(initializeCount, 1);
  assert.deepEqual(received, ["latest"]);
});

test("stale Strict Mode cleanup does not remove the latest rendered button", async () => {
  globalThis.window = {
    google: {
      accounts: {
        id: {
          initialize: () => {},
          renderButton: (container) => {
            container.innerHTML = "<iframe>Google</iframe>";
          },
        },
      },
    },
  };
  globalThis.document = {
    getElementById: () => null,
  };

  const { renderGoogleButton } = await importGoogleAuth();
  const container = createContainer();
  const disposeStale = await renderGoogleButton({
    clientId: "client-id",
    container,
    onCredential: () => {},
    options: {},
  });
  await renderGoogleButton({
    clientId: "client-id",
    container,
    onCredential: () => {},
    options: {},
  });

  disposeStale();
  assert.equal(container.innerHTML, "<iframe>Google</iframe>");
});

test("a failed Google script load can be retried", async () => {
  const scripts = new Map();
  let appendCount = 0;
  globalThis.window = {};
  globalThis.document = {
    getElementById: (id) => scripts.get(id) || null,
    createElement: () => ({
      remove() {
        scripts.delete(this.id);
      },
    }),
    head: {
      appendChild(script) {
        appendCount += 1;
        scripts.set(script.id, script);
        if (appendCount === 1) {
          script.onerror();
          return;
        }
        window.google = {
          accounts: {
            id: {
              initialize: () => {},
              renderButton: () => {},
            },
          },
        };
        script.onload();
      },
    },
  };

  const { loadGoogleScript } = await importGoogleAuth();
  await assert.rejects(loadGoogleScript());
  const google = await loadGoogleScript();

  assert.equal(appendCount, 2);
  assert.equal(google, window.google);
});
