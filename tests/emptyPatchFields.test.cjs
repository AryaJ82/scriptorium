const { NextRequest } = jest.requireActual("next/server");
const jwt = jest.requireActual("jsonwebtoken");

const ACCESS_SECRET = "test-access-secret-with-enough-randomness";
const REFRESH_SECRET = "test-refresh-secret-with-different-randomness";
const user = { id: "user-1", role: "USER" };

function createRequest(url, body) {
  const token = jwt.sign(
    { user_id: user.id, user_role: user.role },
    ACCESS_SECRET,
  );
  return new NextRequest(url, {
    method: "PATCH",
    headers: {
      cookie: `accessToken=${token}`,
      "content-type": "application/json",
    },
    body: JSON.stringify(body),
  });
}

describe("PATCH empty-string updates", () => {
  let prisma;

  beforeEach(() => {
    jest.resetModules();
    process.env.JWT_ACCESS_SECRET = ACCESS_SECRET;
    process.env.JWT_REFRESH_SECRET = REFRESH_SECRET;

    prisma = {
      user: {
        findUnique: jest.fn().mockResolvedValue(user),
        update: jest.fn().mockResolvedValue({ id: user.id }),
      },
      blogPost: {
        findFirst: jest.fn().mockResolvedValue({ id: 8, authorId: user.id }),
        update: jest.fn().mockResolvedValue({ id: 8, content: "" }),
      },
    };
    jest.doMock("@/utils/client", () => ({
      __esModule: true,
      default: prisma,
    }));
  });

  test("persists empty blog content", async () => {
    const { PATCH } = jest.requireActual("@/app/api/blogs/[id]/route");
    const response = await PATCH(
      createRequest("http://localhost/api/blogs/8", { content: "" }),
      { params: Promise.resolve({ id: "8" }) },
    );

    expect(response.status).toBe(200);
    expect(prisma.blogPost.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ content: "" }),
      }),
    );
  });

  test("persists empty profile fields", async () => {
    const { PATCH } = jest.requireActual("@/app/api/users/[id]/route");
    const response = await PATCH(
      createRequest(`http://localhost/api/users/${user.id}`, {
        email: "",
        firstName: "",
        lastName: "",
        avatarUrl: "",
        phoneNumber: "",
      }),
      { params: Promise.resolve({ id: user.id }) },
    );

    expect(response.status).toBe(200);
    expect(prisma.user.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: {
          email: "",
          firstName: "",
          lastName: "",
          avatarUrl: "",
          phoneNumber: "",
        },
      }),
    );
  });
});
