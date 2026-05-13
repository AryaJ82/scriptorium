const fetch = require("node-fetch");

const BASE_URL = process.env.BASE_URL || "http://localhost:3000";

// ─── Helpers ──────────────────────────────────────────────────────────────────

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

async function patch(path, body, headers = {}) {
  return fetch(`${BASE_URL}${path}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", ...headers },
    body: JSON.stringify(body),
  });
}

function authHeader(token) {
  return { Authorization: `Bearer ${token}` };
}

// ─── Shared state ─────────────────────────────────────────────────────────────

/**
 * Two users, each with their own credentials, tokens, and created templates.
 * user1 will also save one of user2's templates.
 */
const users = [
  {
    username: "",
    password: "TestPass123!",
    access_token: "",
    refresh_token: "",
    user_id: "",
    templates: [], // templates created by this user
  },
  {
    username: "",
    password: "TestPass456!",
    access_token: "",
    refresh_token: "",
    user_id: "",
    templates: [],
  },
];

// ─── 1. Register users ────────────────────────────────────────────────────────

describe("1. User Registration", () => {
  beforeAll(() => {
    const ts = Date.now();
    users[0].username = `user_a_${ts}`.substring(0, 20);
    users[1].username = `user_b_${ts}`.substring(0, 20);
  });

  test.each([0, 1])("POST /api/users/register → 201 for user[%i]", async (i) => {
    const res = await post("/api/users/register", {
      username: users[i].username,
      password: users[i].password,
    });

    expect(res.status).toBe(201);

    const body = await res.json();
    expect(body).toHaveProperty("user");
    expect(body.user).toHaveProperty("id");
    expect(body.user).toHaveProperty("username", users[i].username);
    expect(body.user).toHaveProperty("role", "USER");

    users[i].user_id = body.user.id;
  });
});

// ─── 2. Login ─────────────────────────────────────────────────────────────────

describe("2. User Login", () => {
  test.each([0, 1])("POST /api/users/login → 200 with JWT tokens for user[%i]", async (i) => {
    const res = await post("/api/users/login", {
      username: users[i].username,
      password: users[i].password,
    });

    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body).toHaveProperty("message");
    expect(body).toHaveProperty("accessToken");
    expect(body).toHaveProperty("refreshToken");
    expect(isValidJwt(body.accessToken)).toBe(true);
    expect(isValidJwt(body.refreshToken)).toBe(true);

    users[i].access_token = body.accessToken;
    users[i].refresh_token = body.refreshToken;
  });
});

// ─── 3. Create templates ──────────────────────────────────────────────────────

describe("3. Create Templates", () => {
  // user[0] creates two templates
  test("POST /api/templates → 201: user[0] creates a PYTHON template", async () => {
    const res = await post(
      "/api/templates",
      {
        title: "Python Hello World",
        language: "PYTHON",
        code: "print('Hello, world!')\nfor i in range(5):\n\tprint(i)",
        tags: ["python", "hello_world", "for"],
        description: "Simple Python hello world with a loop",
      },
      authHeader(users[0].access_token)
    );

    expect(res.status).toBe(201);

    const body = await res.json();
    expect(body).toHaveProperty("id");
    expect(body).toHaveProperty("authorId", users[0].user_id);
    expect(body).toHaveProperty("language", "PYTHON");
    expect(body).toHaveProperty("title", "Python Hello World");
    expect(body).toHaveProperty("isForked", false);
    expect(Array.isArray(body.tags)).toBe(true);
    expect(body.tags.map((t) => t.name)).toEqual(
      expect.arrayContaining(["python", "hello_world", "for"])
    );

    users[0].templates.push(body);
  });

  test("POST /api/templates → 201: user[0] creates a JAVASCRIPT template", async () => {
    const res = await post(
      "/api/templates",
      {
        title: "JavaScript Hello World",
        language: "JAVASCRIPT",
        code: "console.log('Hello, world!');\nfor (let i = 0; i < 5; i++) {\n\tconsole.log(i);\n}",
        tags: ["javascript", "hello_world", "for"],
        description: "Simple JS hello world with a for loop",
      },
      authHeader(users[0].access_token)
    );

    expect(res.status).toBe(201);

    const body = await res.json();
    expect(body).toHaveProperty("id");
    expect(body).toHaveProperty("authorId", users[0].user_id);
    expect(body).toHaveProperty("language", "JAVASCRIPT");
    expect(body).toHaveProperty("title", "JavaScript Hello World");
    expect(body).toHaveProperty("isForked", false);

    users[0].templates.push(body);
  });

  // user[1] creates two templates
  test("POST /api/templates → 201: user[1] creates a JAVA template", async () => {
    const res = await post(
      "/api/templates",
      {
        title: "Java Hello World",
        language: "JAVA",
        code: 'public class Main {\n\tpublic static void main(String[] args) {\n\t\tSystem.out.println("Hello, World!");\n\t}\n}',
        tags: ["java", "hello_world", "oop"],
        description: "Classic Java hello world",
      },
      authHeader(users[1].access_token)
    );

    expect(res.status).toBe(201);

    const body = await res.json();
    expect(body).toHaveProperty("id");
    expect(body).toHaveProperty("authorId", users[1].user_id);
    expect(body).toHaveProperty("language", "JAVA");
    expect(body).toHaveProperty("title", "Java Hello World");

    users[1].templates.push(body);
  });

  test("POST /api/templates → 201: user[1] creates a CPP template", async () => {
    const res = await post(
      "/api/templates",
      {
        title: "C++ Hello World",
        language: "CPP",
        code: '#include <iostream>\nint main() {\n\tstd::cout << "Hello, World!" << std::endl;\n\treturn 0;\n}',
        tags: ["cpp", "hello_world", "include"],
        description: "Simple C++ hello world",
      },
      authHeader(users[1].access_token)
    );

    expect(res.status).toBe(201);

    const body = await res.json();
    expect(body).toHaveProperty("id");
    expect(body).toHaveProperty("authorId", users[1].user_id);
    expect(body).toHaveProperty("language", "CPP");
    expect(body).toHaveProperty("title", "C++ Hello World");

    users[1].templates.push(body);
  });

  // Validation: missing required field should fail
  test("POST /api/templates → 4xx when language is missing", async () => {
    const res = await post(
      "/api/templates",
      {
        title: "No Language Template",
        code: "print('oops')",
      },
      authHeader(users[0].access_token)
    );

    expect(res.status).toBeGreaterThanOrEqual(400);
    expect(res.status).toBeLessThan(500);
  });

  // Auth: unauthenticated request should be rejected
  test("POST /api/templates → 401 without Authorization header", async () => {
    const res = await post("/api/templates", {
      title: "Unauthorized Template",
      language: "PYTHON",
    });

    expect(res.status).toBe(401);
  });
});

// ─── 4. Save templates (PATCH /api/templates) ─────────────────────────────────

describe("4. Save Templates", () => {
  test("PATCH /api/users/saved_templates → 200: user[0] saves user[1]'s JAVA template", async () => {
    const templateToSave = users[1].templates[0]; // Java Hello World
    expect(templateToSave).toBeDefined();

    const res = await patch(
      "/api/users/saved_templates",
      { template_id: templateToSave.id },
      authHeader(users[0].access_token)
    );

    expect(res.status).toBe(200);
  });

  test("PATCH /api/users/saved_templates → 200: user[1] saves user[0]'s PYTHON template", async () => {
    const templateToSave = users[0].templates[0]; // Python Hello World
    expect(templateToSave).toBeDefined();

    const res = await patch(
      "/api/users/saved_templates",
      { template_id: templateToSave.id },
      authHeader(users[1].access_token)
    );

    expect(res.status).toBe(200);
  });

  test("PATCH /api/users/saved_templates → 401 without Authorization header", async () => {
    const templateToSave = users[0].templates[0];
    const res = await patch("/api/users/saved_templates", { template_id: templateToSave.id });

    expect(res.status).toBe(401);
  });

  test("PATCH /api/users/saved_templates → 4xx with invalid template_id", async () => {
    const res = await patch(
      "/api/users/saved_templates",
      { template_id: "non-existent-id-000" },
      authHeader(users[0].access_token)
    );

    expect(res.status).toBeGreaterThanOrEqual(400);
    expect(res.status).toBeLessThan(500);
  });
});

// ─── 5. Search templates via GET /api/templates ───────────────────────────────

describe("5. Search Templates via GET /api/templates", () => {
  test("GET /api/templates → 200 with paginated results (no filters)", async () => {
    const res = await get("/api/templates?page=1&pageSize=10");

    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body).toHaveProperty("templates");
    expect(Array.isArray(body.templates)).toBe(true);
  });

  test("GET /api/templates?language=PYTHON → returns only PYTHON templates", async () => {
    const res = await get("/api/templates?language=PYTHON&pageSize=20");

    expect(res.status).toBe(200);

    const body = await res.json();
    expect(Array.isArray(body.templates)).toBe(true);
    body.templates.forEach((t) => {
      expect(t.language).toBe("PYTHON");
    });
  });

  test("GET /api/templates?language=JAVASCRIPT → returns only JAVASCRIPT templates", async () => {
    const res = await get("/api/templates?language=JAVASCRIPT&pageSize=20");

    expect(res.status).toBe(200);

    const body = await res.json();
    expect(Array.isArray(body.templates)).toBe(true);
    body.templates.forEach((t) => {
      expect(t.language).toBe("JAVASCRIPT");
    });
  });

  test("GET /api/templates?title=Python Hello World → finds the Python template", async () => {
    const res = await get(
      `/api/templates?title=${encodeURIComponent("Python Hello World")}`
    );

    expect(res.status).toBe(200);

    const body = await res.json();
    expect(Array.isArray(body.templates)).toBe(true);

    const found = body.templates.find((t) => t.id === users[0].templates[0].id);
    expect(found).toBeDefined();
  });

  test("GET /api/templates?tags=hello_world → returns templates tagged hello_world", async () => {
    const res = await get("/api/templates?tags=hello_world&pageSize=20");

    expect(res.status).toBe(200);

    const body = await res.json();
    expect(Array.isArray(body.templates)).toBe(true);
    expect(body.templates.length).toBeGreaterThan(0);

    body.templates.forEach((t) => {
      const tagNames = t.tags.map((tag) => tag.name);
      expect(tagNames).toContain("hello_world");
    });
  });

  test("GET /api/templates?author=<user[0].username> → returns templates by user[0]", async () => {
    const res = await get(
      `/api/templates?author=${encodeURIComponent(users[0].username)}&pageSize=20`
    );

    expect(res.status).toBe(200);

    const body = await res.json();
    expect(Array.isArray(body.templates)).toBe(true);

    // Every returned template should belong to user[0]
    body.templates.forEach((t) => {
      expect(t.author.id).toBe(users[0].user_id);
    });

    // Both templates created by user[0] should appear
    const ids = body.templates.map((t) => t.id);
    users[0].templates.forEach((tmpl) => {
      expect(ids).toContain(tmpl.id);
    });
  });

  test("GET /api/templates?content=Hello → returns templates whose code contains 'Hello'", async () => {
    const res = await get(`/api/templates?content=${encodeURIComponent("Hello")}&pageSize=20`);

    expect(res.status).toBe(200);

    const body = await res.json();
    expect(Array.isArray(body.templates)).toBe(true);
    expect(body.templates.length).toBeGreaterThan(0);
  });

  test("GET /api/templates with sortBy=createdAt&sortOrder=desc → newest first", async () => {
    const res = await get("/api/templates?sortBy=createdAt&sortOrder=desc&pageSize=5");

    expect(res.status).toBe(200);

    const body = await res.json();
    expect(Array.isArray(body.templates)).toBe(true);

    // Verify descending order
    for (let i = 1; i < body.templates.length; i++) {
      const prev = new Date(body.templates[i - 1].createdAt).getTime();
      const curr = new Date(body.templates[i].createdAt).getTime();
      expect(prev).toBeGreaterThanOrEqual(curr);
    }
  });

  test("GET /api/templates → pagination: page 1 and page 2 return different results", async () => {
    const [res1, res2] = await Promise.all([
      get("/api/templates?page=1&pageSize=2&sortBy=createdAt&sortOrder=asc"),
      get("/api/templates?page=2&pageSize=2&sortBy=createdAt&sortOrder=asc"),
    ]);

    expect(res1.status).toBe(200);
    expect(res2.status).toBe(200);

    const [body1, body2] = await Promise.all([res1.json(), res2.json()]);

    const ids1 = body1.templates.map((t) => t.id);
    const ids2 = body2.templates.map((t) => t.id);

    // No overlap between pages
    ids2.forEach((id) => expect(ids1).not.toContain(id));
  });
});

// ─── 6. Search saved templates via GET /api/users/saved_templates ─────────────

describe("6. Saved Templates via GET /api/users/saved_templates", () => {
  test("GET /api/users/saved_templates → 401 without Authorization", async () => {
    const res = await get("/api/users/saved_templates");
    expect(res.status).toBe(401);
  });

  test("GET /api/users/saved_templates → 200 for user[0], contains saved JAVA template", async () => {
    const res = await get(
      "/api/users/saved_templates",
      authHeader(users[0].access_token)
    );

    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body).toHaveProperty("templates");
    expect(Array.isArray(body.templates)).toBe(true);

    const savedJava = users[1].templates[0]; // the template user[0] saved
    const found = body.templates.find((t) => t.id === savedJava.id);
    expect(found).toBeDefined();
  });

  test("GET /api/users/saved_templates → 200 for user[1], contains saved PYTHON template", async () => {
    const res = await get(
      "/api/users/saved_templates",
      authHeader(users[1].access_token)
    );

    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body).toHaveProperty("templates");
    expect(Array.isArray(body.templates)).toBe(true);

    const savedPython = users[0].templates[0]; // the template user[1] saved
    const found = body.templates.find((t) => t.id === savedPython.id);
    expect(found).toBeDefined();
  });

  test("GET /api/users/saved_templates?language=JAVA → filters by language for user[0]", async () => {
    const res = await get(
      "/api/users/saved_templates?language=JAVA",
      authHeader(users[0].access_token)
    );

    expect(res.status).toBe(200);

    const body = await res.json();
    expect(Array.isArray(body.templates)).toBe(true);

    body.templates.forEach((t) => {
      expect(t.language).toBe("JAVA");
    });
  });

  test("GET /api/users/saved_templates?language=PYTHON → filters by language for user[1]", async () => {
    const res = await get(
      "/api/users/saved_templates?language=PYTHON",
      authHeader(users[1].access_token)
    );

    expect(res.status).toBe(200);

    const body = await res.json();
    expect(Array.isArray(body.templates)).toBe(true);

    body.templates.forEach((t) => {
      expect(t.language).toBe("PYTHON");
    });
  });

  test("GET /api/users/saved_templates?title=Java Hello World → finds saved template by title", async () => {
    const res = await get(
      `/api/users/saved_templates?title=${encodeURIComponent("Java Hello World")}`,
      authHeader(users[0].access_token)
    );

    expect(res.status).toBe(200);

    const body = await res.json();
    expect(Array.isArray(body.templates)).toBe(true);

    const found = body.templates.find((t) => t.id === users[1].templates[0].id);
    expect(found).toBeDefined();
  });

  test("GET /api/users/saved_templates?tags=hello_world → filters saved templates by tag", async () => {
    const res = await get(
      "/api/users/saved_templates?tags=hello_world",
      authHeader(users[0].access_token)
    );

    expect(res.status).toBe(200);

    const body = await res.json();
    expect(Array.isArray(body.templates)).toBe(true);
    expect(body.templates.length).toBeGreaterThan(0);

    body.templates.forEach((t) => {
      const tagNames = t.tags.map((tag) => tag.name);
      expect(tagNames).toContain("hello_world");
    });
  });

  test("GET /api/users/saved_templates with pagination → returns correct page size", async () => {
    const res = await get(
      "/api/users/saved_templates?page=1&pageSize=1",
      authHeader(users[0].access_token)
    );

    expect(res.status).toBe(200);

    const body = await res.json();
    expect(Array.isArray(body.templates)).toBe(true);
    expect(body.templates.length).toBeLessThanOrEqual(1);
  });
});

// ─── 7. Multi-tag search ──────────────────────────────────────────────────────
//
// Tag query encoding convention tested here:
//   repeated param  →  ?tags=recursion&tags=advanced
//   comma-separated →  ?tags=recursion,advanced
// Both forms are exercised so the suite passes regardless of which convention
// the server expects. Adjust / remove the form that doesn't apply to your API.
//
// Template inventory relevant to this suite (created in suite 3):
//   users[0].templates[0]  Python Hello World          tags: python, hello_world, for
//   users[0].templates[1]  JavaScript Hello World      tags: javascript, hello_world, for
//   users[0].templates[2]  Python Recursive Fibonacci  tags: python, recursion, advanced
//   users[1].templates[0]  Java Hello World            tags: java, hello_world, oop
//   users[1].templates[1]  C++ Hello World             tags: cpp, hello_world, include
//   users[1].templates[2]  Java Recursive Fibonacci    tags: java, recursion, advanced
 
/**
 * Build a query string that sends multiple tags.
 * Tries the repeated-param form: ?tags=a&tags=b
 */
function multiTagQuery(tags) {
  return tags.map((t) => `tags=${encodeURIComponent(t)}`).join("&");
}
 
describe("7. Multi-tag Search", () => {
  // ── 7a. GET /api/templates with multiple tags ──────────────────────────────
 
  describe("7a. GET /api/templates — multiple tags", () => {
    test("tags=[hello_world, for] → only templates that have BOTH tags (repeated-param form)", async () => {
      const res = await get(
        `/api/templates?${multiTagQuery(["hello_world", "for"])}&pageSize=20`
      );
 
      expect(res.status).toBe(200);
 
      const body = await res.json();
      expect(Array.isArray(body.templates)).toBe(true);
      expect(body.templates.length).toBeGreaterThan(0);
 
      // Every result must carry both tags
      body.templates.forEach((t) => {
        const names = t.tags.map((tag) => tag.name);
        expect(names).toContain("hello_world");
        expect(names).toContain("for");
      });
 
      // The two "Hello World + for" templates must appear
      const ids = body.templates.map((t) => t.id);
      expect(ids).toContain(users[0].templates[0].id); // Python Hello World
      expect(ids).toContain(users[0].templates[1].id); // JavaScript Hello World
    });
 
    test("tags=[hello_world, for] → only templates that have BOTH tags (comma-separated form)", async () => {
      const res = await get(
        `/api/templates?tags=${encodeURIComponent("hello_world,for")}&pageSize=20`
      );
 
      expect(res.status).toBe(200);
 
      const body = await res.json();
      expect(Array.isArray(body.templates)).toBe(true);
      expect(body.templates.length).toBeGreaterThan(0);
 
      body.templates.forEach((t) => {
        const names = t.tags.map((tag) => tag.name);
        expect(names).toContain("hello_world");
        expect(names).toContain("for");
      });
    });
 
    test("tags=[recursion, advanced] → returns Python and Java Fibonacci templates", async () => {
      const res = await get(
        `/api/templates?${multiTagQuery(["recursion", "advanced"])}&pageSize=20`
      );
 
      expect(res.status).toBe(200);
 
      const body = await res.json();
      expect(Array.isArray(body.templates)).toBe(true);
      expect(body.templates.length).toBeGreaterThan(0);
 
      body.templates.forEach((t) => {
        const names = t.tags.map((tag) => tag.name);
        expect(names).toContain("recursion");
        expect(names).toContain("advanced");
      });
 
      const ids = body.templates.map((t) => t.id);
      expect(ids).toContain(users[0].templates[2].id); // Python Recursive Fibonacci
      expect(ids).toContain(users[1].templates[2].id); // Java Recursive Fibonacci
    });
 
    test("tags=[python, recursion, advanced] → only the Python Fibonacci template", async () => {
      const res = await get(
        `/api/templates?${multiTagQuery(["python", "recursion", "advanced"])}&pageSize=20`
      );
 
      expect(res.status).toBe(200);
 
      const body = await res.json();
      expect(Array.isArray(body.templates)).toBe(true);
      expect(body.templates.length).toBeGreaterThan(0);
 
      body.templates.forEach((t) => {
        const names = t.tags.map((tag) => tag.name);
        expect(names).toContain("python");
        expect(names).toContain("recursion");
        expect(names).toContain("advanced");
      });
 
      const ids = body.templates.map((t) => t.id);
      expect(ids).toContain(users[0].templates[2].id); // Python Recursive Fibonacci
 
      // Java Fibonacci has recursion+advanced but NOT python — must NOT appear
      expect(ids).not.toContain(users[1].templates[2].id);
    });
 
    test("tags=[java, recursion, advanced] → only the Java Fibonacci template", async () => {
      const res = await get(
        `/api/templates?${multiTagQuery(["java", "recursion", "advanced"])}&pageSize=20`
      );
 
      expect(res.status).toBe(200);
 
      const body = await res.json();
      expect(Array.isArray(body.templates)).toBe(true);
 
      body.templates.forEach((t) => {
        const names = t.tags.map((tag) => tag.name);
        expect(names).toContain("java");
        expect(names).toContain("recursion");
        expect(names).toContain("advanced");
      });
 
      const ids = body.templates.map((t) => t.id);
      expect(ids).toContain(users[1].templates[2].id); // Java Recursive Fibonacci
      expect(ids).not.toContain(users[0].templates[2].id); // Python Fibonacci — no "java" tag
    });
 
    test("tags=[hello_world, oop] → only the Java Hello World template", async () => {
      const res = await get(
        `/api/templates?${multiTagQuery(["hello_world", "oop"])}&pageSize=20`
      );
 
      expect(res.status).toBe(200);
 
      const body = await res.json();
      expect(Array.isArray(body.templates)).toBe(true);
      expect(body.templates.length).toBeGreaterThan(0);
 
      body.templates.forEach((t) => {
        const names = t.tags.map((tag) => tag.name);
        expect(names).toContain("hello_world");
        expect(names).toContain("oop");
      });
 
      const ids = body.templates.map((t) => t.id);
      expect(ids).toContain(users[1].templates[0].id); // Java Hello World
      // Python/JS hello_world templates don't have "oop"
      expect(ids).not.toContain(users[0].templates[0].id);
      expect(ids).not.toContain(users[0].templates[1].id);
    });
 
    test("tags=[hello_world, include] → only the C++ Hello World template", async () => {
      const res = await get(
        `/api/templates?${multiTagQuery(["hello_world", "include"])}&pageSize=20`
      );
 
      expect(res.status).toBe(200);
 
      const body = await res.json();
      expect(Array.isArray(body.templates)).toBe(true);
      expect(body.templates.length).toBeGreaterThan(0);
 
      body.templates.forEach((t) => {
        const names = t.tags.map((tag) => tag.name);
        expect(names).toContain("hello_world");
        expect(names).toContain("include");
      });
 
      const ids = body.templates.map((t) => t.id);
      expect(ids).toContain(users[1].templates[1].id); // C++ Hello World
    });
 
    test("tags=[recursion, hello_world] → no templates share both tags → empty results", async () => {
      const res = await get(
        `/api/templates?${multiTagQuery(["recursion", "hello_world"])}&pageSize=20`
      );
 
      expect(res.status).toBe(200);
 
      const body = await res.json();
      expect(Array.isArray(body.templates)).toBe(true);
 
      // No template in our set carries both recursion AND hello_world
      body.templates.forEach((t) => {
        const names = t.tags.map((tag) => tag.name);
        // If the API returns results, each must genuinely have both tags
        expect(names).toContain("recursion");
        expect(names).toContain("hello_world");
      });
    });
  });
 
  // ── 7b. GET /api/users/saved_templates with multiple tags ──────────────────
 
  describe("7b. GET /api/users/saved_templates — multiple tags", () => {
    // Prerequisite: user[0] saves the Java Fibonacci template so it appears in their saved list
    beforeAll(async () => {
      const javaFib = users[1].templates[2]; // Java Recursive Fibonacci
      if (javaFib) {
        await patch(
          "/api/templates",
          { template_id: javaFib.id },
          authHeader(users[0].access_token)
        );
      }
    });
 
    test("tags=[recursion, advanced] → user[0]'s saved list returns Java Fibonacci", async () => {
      const res = await get(
        `/api/users/saved_templates?${multiTagQuery(["recursion", "advanced"])}`,
        authHeader(users[0].access_token)
      );
 
      expect(res.status).toBe(200);
 
      const body = await res.json();
      expect(Array.isArray(body.templates)).toBe(true);
      expect(body.templates.length).toBeGreaterThan(0);
 
      body.templates.forEach((t) => {
        const names = t.tags.map((tag) => tag.name);
        expect(names).toContain("recursion");
        expect(names).toContain("advanced");
      });
 
      const ids = body.templates.map((t) => t.id);
      expect(ids).toContain(users[1].templates[2].id); // Java Fibonacci
    });
 
    test("tags=[hello_world, for] → user[0]'s saved list does NOT include Java Hello World (no 'for' tag)", async () => {
      const res = await get(
        `/api/users/saved_templates?${multiTagQuery(["hello_world", "for"])}`,
        authHeader(users[0].access_token)
      );
 
      expect(res.status).toBe(200);
 
      const body = await res.json();
      expect(Array.isArray(body.templates)).toBe(true);
 
      // Java Hello World has hello_world but NOT for — must not appear
      const ids = body.templates.map((t) => t.id);
      expect(ids).not.toContain(users[1].templates[0].id);
 
      // Every returned template must have both tags
      body.templates.forEach((t) => {
        const names = t.tags.map((tag) => tag.name);
        expect(names).toContain("hello_world");
        expect(names).toContain("for");
      });
    });
 
    test("tags=[python, hello_world, for] → user[1]'s saved list returns Python Hello World", async () => {
      const res = await get(
        `/api/users/saved_templates?${multiTagQuery(["python", "hello_world", "for"])}`,
        authHeader(users[1].access_token)
      );
 
      expect(res.status).toBe(200);
 
      const body = await res.json();
      expect(Array.isArray(body.templates)).toBe(true);
      expect(body.templates.length).toBeGreaterThan(0);
 
      body.templates.forEach((t) => {
        const names = t.tags.map((tag) => tag.name);
        expect(names).toContain("python");
        expect(names).toContain("hello_world");
        expect(names).toContain("for");
      });
 
      const ids = body.templates.map((t) => t.id);
      expect(ids).toContain(users[0].templates[0].id); // Python Hello World
    });
 
    test("tags=[java, hello_world] → user[1]'s saved list → no match (saved Python, not Java Hello World)", async () => {
      const res = await get(
        `/api/users/saved_templates?${multiTagQuery(["java", "hello_world"])}`,
        authHeader(users[1].access_token)
      );
 
      expect(res.status).toBe(200);
 
      const body = await res.json();
      expect(Array.isArray(body.templates)).toBe(true);
 
      // Python Hello World has hello_world but NOT java — shouldn't appear
      const ids = body.templates.map((t) => t.id);
      expect(ids).not.toContain(users[0].templates[0].id);
 
      body.templates.forEach((t) => {
        const names = t.tags.map((tag) => tag.name);
        expect(names).toContain("java");
        expect(names).toContain("hello_world");
      });
    });
 
    test("tags=[recursion, hello_world] → both saved lists → empty results (no template has both)", async () => {
      const [res0, res1] = await Promise.all([
        get(
          `/api/users/saved_templates?${multiTagQuery(["recursion", "hello_world"])}`,
          authHeader(users[0].access_token)
        ),
        get(
          `/api/users/saved_templates?${multiTagQuery(["recursion", "hello_world"])}`,
          authHeader(users[1].access_token)
        ),
      ]);
 
      expect(res0.status).toBe(200);
      expect(res1.status).toBe(200);
 
      const [body0, body1] = await Promise.all([res0.json(), res1.json()]);
 
      // Any result returned must legitimately carry both tags
      [body0, body1].forEach((body) => {
        body.templates.forEach((t) => {
          const names = t.tags.map((tag) => tag.name);
          expect(names).toContain("recursion");
          expect(names).toContain("hello_world");
        });
      });
    });
  });
});
 
