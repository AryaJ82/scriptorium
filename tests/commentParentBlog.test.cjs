const { NextRequest } = jest.requireActual("next/server");
const jwt = jest.requireActual("jsonwebtoken");

const ACCESS_SECRET = "test-access-secret-with-enough-randomness";
const REFRESH_SECRET = "test-refresh-secret-with-different-randomness";
const user = { id: "user-1", role: "USER" };

function createRequest() {
  const token = jwt.sign(
    { user_id: user.id, user_role: user.role },
    ACCESS_SECRET,
  );
  return new NextRequest("http://localhost/api/blogs/8/comments", {
    method: "POST",
    headers: {
      cookie: `accessToken=${token}`,
      "content-type": "application/json",
    },
    body: JSON.stringify({ content: "Reply", parent_comment_id: "12" }),
  });
}

describe("comment parent blog validation", () => {
  let prisma;
  let POST;

  beforeEach(() => {
    jest.resetModules();
    process.env.JWT_ACCESS_SECRET = ACCESS_SECRET;
    process.env.JWT_REFRESH_SECRET = REFRESH_SECRET;

    prisma = {
      user: { findUnique: jest.fn().mockResolvedValue(user) },
      comment: {
        findUnique: jest.fn(),
        create: jest.fn().mockResolvedValue({ id: 13 }),
      },
      blogPost: {
        findUnique: jest.fn().mockResolvedValue({ id: 8 }),
      },
    };
    jest.doMock("@/utils/client", () => ({
      __esModule: true,
      default: prisma,
    }));
    POST = jest.requireActual("@/app/api/blogs/[id]/comments/route").POST;
  });

  test("rejects a parent comment from a different blog", async () => {
    prisma.comment.findUnique.mockResolvedValue({ blogPostId: 7 });

    const response = await POST(createRequest(), {
      params: Promise.resolve({ id: "8" }),
    });

    expect(response.status).toBe(400);
    expect(prisma.blogPost.findUnique).not.toHaveBeenCalled();
    expect(prisma.comment.create).not.toHaveBeenCalled();
  });

  test("allows a parent comment from the requested blog", async () => {
    prisma.comment.findUnique.mockResolvedValue({ blogPostId: 8 });

    const response = await POST(createRequest(), {
      params: Promise.resolve({ id: "8" }),
    });

    expect(response.status).toBe(200);
    expect(prisma.comment.create).toHaveBeenCalled();
  });
});
