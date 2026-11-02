process.env.MAX_CODE_SIZE_KB = "1";
process.env.MAX_STDIN_SIZE_KB = "1";

const { validateExecutionPOSTBody } = jest.requireActual(
  "@/utils/inputValidation/executionValidation",
);
const { LANG_CONFIG } = jest.requireActual("@/utils/interfaces");

describe("code execution request limits", () => {
  test("Java source filename matches the case-sensitive compiler command", () => {
    expect(LANG_CONFIG.JAVA.cmd.join(" ")).toContain(
      `/code/${LANG_CONFIG.JAVA.fileName}`,
    );
    expect(LANG_CONFIG.JAVA.cmd.join(" ")).toContain("java -cp /tmp Main");
  });

  test("accepts code and stdin exactly at their configured byte limits", () => {
    expect(
      validateExecutionPOSTBody({
        language: "PYTHON",
        code: "x".repeat(1024),
        stdin: "y".repeat(1024),
      }),
    ).toMatchObject({
      success: true,
      data: {
        language: "PYTHON",
        code: "x".repeat(1024),
        stdin: "y".repeat(1024),
      },
    });
  });

  test("rejects code one byte over its configured limit", () => {
    const error = validateExecutionPOSTBody({
      language: "PYTHON",
      code: "x".repeat(1025),
    });

    expect(error).toMatchObject({
      success: false,
      error: {
        message: "Code exceeds maximum size",
        status: 400,
      },
    });
  });

  test("rejects stdin one byte over its configured limit", () => {
    const error = validateExecutionPOSTBody({
      language: "PYTHON",
      code: "print('ok')",
      stdin: "y".repeat(1025),
    });

    expect(error).toMatchObject({
      success: false,
      error: {
        message: "Stdin exceeds maximum size",
        status: 400,
      },
    });
  });
});
