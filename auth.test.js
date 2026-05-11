/**
 * Authentication API Tests
 * Translated from Postman collection to Jest + node-fetch
 *
 * Setup:
 *   npm install --save-dev jest node-fetch@2
 *
 * Run:
 *   jest auth.test.js
 *
 * Environment variables (optional overrides):
 *   BASE_URL   - default: http://localhost:3000
 */

const fetch = require("node-fetch");

const BASE_URL = process.env.BASE_URL || "http://localhost:3000";

// Shared state passed between tests (mirrors Postman environment variables)
const env = {
  test_username: "UnitTestUser",
  test_password: "asdAs4$%asdvf",
  access_token: "",
  refresh_token: "",
  user_id: "",
  old_access_token: "",
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function isValidJwt(token) {
  return typeof token === "string" && token.split(".").length === 3;
}

async function post(path, body, headers = {}) {
  return fetch(`${BASE_URL}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...headers },
    body: JSON.stringify(body),
  });
}

async function get(path, headers = {}) {
  return fetch(`${BASE_URL}${path}`, { method: "GET", headers });
}

// ---------------------------------------------------------------------------
// Registration
// ---------------------------------------------------------------------------

describe("User Registration", () => {
  beforeAll(() => {
    env.test_username = `testuser_${Date.now()}`.substring(0, 20);
    env.test_password = "TestPass123!";
  });

  test("POST /api/users/register → 201 with user object", async () => {
    const res = await post("/api/users/register", {
      username: env.test_username,
      password: env.test_password,
    });

    expect(res.status).toBe(201);

    const body = await res.json();
    expect(body).toHaveProperty("user");
    expect(body.user).toHaveProperty("id");
    expect(body.user).toHaveProperty("username");
    expect(body.user).toHaveProperty("role");
    expect(body.user.role).toBe("USER");

    // Persist for later tests
    env.user_id = body.user.id;
  });

  test("POST /api/users/register → 400 for weak password", async () => {
    const res = await post("/api/users/register", {
      username: "validuser",
      password: "weak",
    });

    expect(res.status).toBe(400);

    const body = await res.json();
    expect(body).toHaveProperty("error");
    expect(body.error).toContain("Password must be");
  });

  test("POST /api/users/register → 400 for short username", async () => {
    const res = await post("/api/users/register", {
      username: "ab",
      password: "TestPass123!",
    });

    expect(res.status).toBe(400);

    const body = await res.json();
    expect(body).toHaveProperty("error");
    expect(body.error).toContain("Username");
  });

  test("POST /api/users/register → 400 when password is missing", async () => {
    const res = await post("/api/users/register", { username: "testuser" });

    expect(res.status).toBe(400);

    const body = await res.json();
    expect(body).toHaveProperty("error");
    expect(body.error).toContain("required");
  });
});

// ---------------------------------------------------------------------------
// Login
// ---------------------------------------------------------------------------

describe("User Login", () => {
  test("POST /api/users/login → 200 with JWT tokens", async () => {
    const res = await post("/api/users/login", {
      username: env.test_username,
      password: env.test_password,
    });

    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body).toHaveProperty("message");
    expect(body).toHaveProperty("accessToken");
    expect(body).toHaveProperty("refreshToken");

    expect(isValidJwt(body.accessToken)).toBe(true);
    expect(isValidJwt(body.refreshToken)).toBe(true);

    // Persist tokens
    env.access_token = body.accessToken;
    env.refresh_token = body.refreshToken;
  });

  test("POST /api/users/login → 401 for non-existent user", async () => {
    const res = await post("/api/users/login", {
      username: "nonexistentuser",
      password: "wrongpassword",
    });

    expect(res.status).toBe(401);

    const body = await res.json();
    expect(body).toHaveProperty("error");
    expect(body.error).toContain("Invalid username or password");
  });

  test("POST /api/users/login → 401 and does not leak user existence", async () => {
    const res = await post("/api/users/login", {
      username: env.test_username,
      password: "WrongPass123!",
    });

    expect(res.status).toBe(401);

    const body = await res.json();
    expect(body.error).toContain("Invalid username or password");
  });
});

// ---------------------------------------------------------------------------
// Token Refresh
// ---------------------------------------------------------------------------

describe("Refresh Token", () => {
  test("POST /api/users/refresh → 200 with new access token", async () => {
    env.old_access_token = env.access_token;

    const res = await post("/api/users/refresh", {
      refreshToken: env.refresh_token,
    });

    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body).toHaveProperty("accessToken");

    env.access_token = body.accessToken;
  });

  test("POST /api/users/refresh → 401 for invalid token", async () => {
    const res = await post("/api/users/refresh", {
      refreshToken: "invalid.token.here",
    });

    expect(res.status).toBe(401);

    const body = await res.json();
    expect(body).toHaveProperty("error");
  });

  test("POST /api/users/refresh → 400 when token is missing", async () => {
    const res = await post("/api/users/refresh", {});

    expect(res.status).toBe(400);

    const body = await res.json();
    expect(body).toHaveProperty("error");
    expect(body.error).toContain("required");
  });
});

// ---------------------------------------------------------------------------
// Logout
// ---------------------------------------------------------------------------

describe("Logout", () => {
  test("GET /api/users/logout → 200 with success message and Set-Cookie", async () => {
    const res = await get("/api/users/logout", {
      Authorization: `Bearer ${env.access_token}`,
    });

    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body).toHaveProperty("message");
    expect(body.message).toContain("successful");

    expect(res.headers.get("set-cookie")).toBeTruthy();
  });

  test("GET /api/users/logout → 401 when Authorization header is missing", async () => {
    const res = await get("/api/users/logout");

    expect(res.status).toBe(401);

    const body = await res.json();
    expect(body).toHaveProperty("error");
  });

  test("GET /api/users/logout → 401 for invalid token", async () => {
    const res = await get("/api/users/logout", {
      Authorization: "Bearer invalid.token.here",
    });

    expect(res.status).toBe(401);

    const body = await res.json();
    expect(body).toHaveProperty("error");
  });
});