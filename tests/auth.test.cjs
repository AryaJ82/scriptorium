const ACCESS_SECRET = "test-access-secret-with-enough-randomness";
const REFRESH_SECRET = "test-refresh-secret-with-different-randomness";

function configureSecrets() {
  process.env.JWT_ACCESS_SECRET = ACCESS_SECRET;
  process.env.JWT_REFRESH_SECRET = REFRESH_SECRET;
}

function createRequest(role = "USER") {
  const { NextRequest } = jest.requireActual("next/server");
  const jwt = jest.requireActual("jsonwebtoken");
  const token = jwt.sign(
    { user_id: "user-1", user_role: role },
    ACCESS_SECRET,
  );
  return new NextRequest("http://localhost/api/private", {
    headers: { cookie: `accessToken=${token}` },
  });
}

function loadMiddleware(prisma) {
  jest.resetModules();
  configureSecrets();
  jest.doMock("@/utils/client", () => ({
    __esModule: true,
    default: prisma,
  }));
  return jest.requireActual("@/utils/middlewareAuth");
}

describe("authentication and permissions", () => {
  beforeEach(() => {
    configureSecrets();
  });

  test("requires explicit JWT secrets instead of using built-in defaults", () => {
    jest.resetModules();
    delete process.env.JWT_ACCESS_SECRET;
    delete process.env.JWT_REFRESH_SECRET;

    expect(() => jest.requireActual("@/utils/tokenAuth")).toThrow(
      "JWT_REFRESH_SECRET must be set",
    );
  });

  test("rejects requests without an access token", async () => {
    const prisma = { user: { findUnique: jest.fn() } };
    const { withAuth } = loadMiddleware(prisma);
    const { NextRequest } = jest.requireActual("next/server");
    const handler = withAuth(async () => Response.json({ ok: true }));

    const response = await handler(
      new NextRequest("http://localhost/api/private"),
    );

    expect(response.status).toBe(401);
    expect(prisma.user.findUnique).not.toHaveBeenCalled();
  });

  test("allows admins and denies authenticated non-admin users", async () => {
    const user = { id: "user-1", role: "USER" };
    const prisma = { user: { findUnique: jest.fn().mockResolvedValue(user) } };
    const { withAdmin } = loadMiddleware(prisma);
    const handler = withAdmin(async () => Response.json({ ok: true }));

    const userResponse = await handler(createRequest("USER"));
    expect(userResponse.status).toBe(401);

    prisma.user.findUnique.mockResolvedValue({ ...user, role: "ADMIN" });
    const adminResponse = await handler(createRequest("ADMIN"));

    expect(adminResponse.status).toBe(200);
    expect(await adminResponse.json()).toEqual({ ok: true });
  });
});
