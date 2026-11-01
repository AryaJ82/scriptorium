const { NextRequest } = jest.requireActual("next/server");
const jwt = jest.requireActual("jsonwebtoken");

const ACCESS_SECRET = "test-access-secret-with-enough-randomness";
const REFRESH_SECRET = "test-refresh-secret-with-different-randomness";
const TEMPLATE_ID = `c${"a".repeat(24)}`;
const user = { id: "owner-1", role: "USER" };

function createRequest(method, body) {
  const token = jwt.sign(
    { user_id: user.id, user_role: user.role },
    ACCESS_SECRET,
  );
  return new NextRequest(`http://localhost/api/templates/${TEMPLATE_ID}`, {
    method,
    headers: {
      cookie: `accessToken=${token}`,
      "content-type": "application/json",
    },
    body: JSON.stringify(body),
  });
}

describe("template create and update flows", () => {
  let prisma;
  let route;

  beforeEach(() => {
    jest.resetModules();
    process.env.JWT_ACCESS_SECRET = ACCESS_SECRET;
    process.env.JWT_REFRESH_SECRET = REFRESH_SECRET;

    prisma = {
      user: { findUnique: jest.fn().mockResolvedValue(user) },
      template: {
        create: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn(),
      },
    };
    jest.doMock("@/utils/client", () => ({
      __esModule: true,
      default: prisma,
    }));

    route = jest.requireActual("@/app/api/templates/[id]/route");
  });

  test("creates a validated template for the authenticated owner", async () => {
    prisma.template.create.mockResolvedValue({
      id: TEMPLATE_ID,
      title: "Loops",
      authorId: user.id,
    });
    const { POST } = jest.requireActual("@/app/api/templates/route");
    const request = createRequest("POST", {
      title: " Loops ",
      language: "PYTHON",
      code: "print('hello')",
      tags: ["loops"],
    });

    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(201);
    expect(body.data.title).toBe("Loops");
    expect(prisma.template.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          title: "Loops",
          author: { connect: { id: user.id } },
          language: "PYTHON",
        }),
      }),
    );
  });

  test("persists empty fields so an owner can clear template content", async () => {
    prisma.template.findUnique.mockResolvedValue({
      id: TEMPLATE_ID,
      authorId: user.id,
    });
    prisma.template.update.mockResolvedValue({
      id: TEMPLATE_ID,
      code: "",
      stdin: "",
      description: "",
    });
    const request = createRequest("PATCH", {
      code: "",
      stdin: "",
      description: "",
      tags: [],
    });

    const response = await route.PATCH(request, {
      params: Promise.resolve({ id: TEMPLATE_ID }),
    });

    expect(response.status).toBe(200);
    expect(prisma.template.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          code: "",
          stdin: "",
          description: "",
          tags: { set: [], connectOrCreate: [] },
        }),
      }),
    );
  });

  test("does not allow a different user to update a template", async () => {
    prisma.template.findUnique.mockResolvedValue({
      id: TEMPLATE_ID,
      authorId: "another-user",
    });
    const response = await route.PATCH(
      createRequest("PATCH", { title: "Not mine" }),
      { params: Promise.resolve({ id: TEMPLATE_ID }) },
    );

    expect(response.status).toBe(401);
    expect(prisma.template.update).not.toHaveBeenCalled();
  });
});
