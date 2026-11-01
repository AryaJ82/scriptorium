const { NextRequest } = jest.requireActual("next/server");
const jwt = jest.requireActual("jsonwebtoken");

const ACCESS_SECRET = "test-access-secret-with-enough-randomness";
const REFRESH_SECRET = "test-refresh-secret-with-different-randomness";
const user = { id: "user-1", role: "USER" };

function configureSecrets() {
  process.env.JWT_ACCESS_SECRET = ACCESS_SECRET;
  process.env.JWT_REFRESH_SECRET = REFRESH_SECRET;
}

function createAuthenticatedRequest(url, body) {
  const token = jwt.sign(
    { user_id: user.id, user_role: user.role },
    ACCESS_SECRET,
  );
  return new NextRequest(url, {
    method: "POST",
    headers: {
      cookie: `accessToken=${token}`,
      "content-type": "application/json",
    },
    body: JSON.stringify(body),
  });
}

function loadRoute(prisma) {
  jest.resetModules();
  configureSecrets();
  jest.doMock("@/utils/client", () => ({
    __esModule: true,
    default: prisma,
  }));
}

describe("public content visibility", () => {
  beforeEach(() => {
    configureSecrets();
  });

  test("does not return a hidden blog from its detail route", async () => {
    const prisma = {
      blogPost: { findFirst: jest.fn().mockResolvedValue(null) },
    };
    loadRoute(prisma);
    const { GET } = jest.requireActual("@/app/api/blogs/[id]/route");

    const response = await GET(
      new NextRequest("http://localhost/api/blogs/8"),
      { params: Promise.resolve({ id: "8" }) },
    );

    expect(response.status).toBe(404);
    expect(prisma.blogPost.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 8, isHidden: false },
      }),
    );
  });

  test("does not return a hidden comment or a comment on a hidden blog", async () => {
    const prisma = {
      comment: { findFirst: jest.fn().mockResolvedValue(null) },
    };
    loadRoute(prisma);
    const { GET } = jest.requireActual("@/app/api/comments/[id]/route");

    const response = await GET(
      new NextRequest("http://localhost/api/comments/12"),
      { params: Promise.resolve({ id: "12" }) },
    );

    expect(response.status).toBe(404);
    expect(prisma.comment.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          id: 12,
          isHidden: false,
          blogPost: { is: { isHidden: false } },
        },
      }),
    );
  });

  test("does not allow comments to be created on a hidden blog", async () => {
    const prisma = {
      user: { findUnique: jest.fn().mockResolvedValue(user) },
      blogPost: { findFirst: jest.fn().mockResolvedValue(null) },
      comment: { create: jest.fn() },
    };
    loadRoute(prisma);
    const { POST } = jest.requireActual("@/app/api/blogs/[id]/comments/route");

    const response = await POST(
      createAuthenticatedRequest(
        "http://localhost/api/blogs/8/comments",
        { content: "A reply" },
      ),
      { params: Promise.resolve({ id: "8" }) },
    );

    expect(response.status).toBe(404);
    expect(prisma.blogPost.findFirst).toHaveBeenCalledWith({
      where: { id: 8, isHidden: false },
    });
    expect(prisma.comment.create).not.toHaveBeenCalled();
  });
});
