/**
 * Simple test to verify leaves module endpoints exist
 * Run with: node tests/leaves.test.js
 */

import http from "http";

const PORT = process.env.PORT || 5000;
const BASE_URL = `http://localhost:${PORT}`;

async function makeRequest(path, method = "GET", headers = {}) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: "localhost",
      port: PORT,
      path,
      method,
      headers: {
        "Content-Type": "application/json",
        ...headers,
      },
    };

    const req = http.request(options, (res) => {
      let data = "";
      res.on("data", (chunk) => (data += chunk));
      res.on("end", () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(data) });
        } catch {
          resolve({ status: res.statusCode, data });
        }
      });
    });

    req.on("error", reject);
    req.end();
  });
}

async function runTests() {
  console.log("========================================");
  console.log("LEAVES MODULE ENDPOINT TESTS");
  console.log("========================================\n");

  let passed = 0;
  let failed = 0;

  async function test(name, fn) {
    try {
      await fn();
      console.log(`✅ ${name}`);
      passed++;
    } catch (error) {
      console.log(`❌ ${name}: ${error.message}`);
      failed++;
    }
  }

  // Test 1: Verify leaves routes exist (will return 401 without auth, which is expected)
  await test("POST /api/leaves/apply exists (returns 401/403 without auth)", async () => {
    const res = await makeRequest("/api/leaves/apply", "POST");
    if (res.status !== 401 && res.status !== 403) {
      throw new Error(`Expected 401 or 403, got ${res.status}`);
    }
  });

  await test("GET /api/leaves/my-leaves exists (returns 401/403 without auth)", async () => {
    const res = await makeRequest("/api/leaves/my-leaves");
    if (res.status !== 401 && res.status !== 403) {
      throw new Error(`Expected 401 or 403, got ${res.status}`);
    }
  });

  await test("GET /api/leaves/pending exists (returns 401/403 without auth)", async () => {
    const res = await makeRequest("/api/leaves/pending");
    if (res.status !== 401 && res.status !== 403) {
      throw new Error(`Expected 401 or 403, got ${res.status}`);
    }
  });

  await test("GET /api/leaves exists (returns 401/403 without auth)", async () => {
    const res = await makeRequest("/api/leaves");
    if (res.status !== 401 && res.status !== 403) {
      throw new Error(`Expected 401 or 403, got ${res.status}`);
    }
  });

  await test("PATCH /api/leaves/1/approve exists (returns 401/403 without auth)", async () => {
    const res = await makeRequest("/api/leaves/1/approve", "PATCH");
    if (res.status !== 401 && res.status !== 403) {
      throw new Error(`Expected 401 or 403, got ${res.status}`);
    }
  });

  await test("PATCH /api/leaves/1/reject exists (returns 401/403 without auth)", async () => {
    const res = await makeRequest("/api/leaves/1/reject", "PATCH");
    if (res.status !== 401 && res.status !== 403) {
      throw new Error(`Expected 401 or 403, got ${res.status}`);
    }
  });

  console.log("\n========================================");
  console.log("TEST SUMMARY");
  console.log("========================================");
  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`📊 Total: ${passed + failed}`);

  if (failed === 0) {
    console.log("\n🎉 All endpoint tests passed!");
    console.log("Note: 401/403 responses are expected without valid authentication.");
  } else {
    console.log("\n⚠️  Some tests failed.");
    process.exit(1);
  }
}

runTests().catch((error) => {
  console.error("Test runner error:", error);
  process.exit(1);
});
