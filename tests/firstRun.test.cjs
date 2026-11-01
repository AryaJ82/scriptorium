describe('first-run auth return and draft validation', () => {
  beforeEach(() => {
    global.window = { location: { origin: 'https://scriptorium.example' } };
  });

  afterEach(() => {
    delete global.window;
  });

  test('returns to an internal path after authentication', () => {
    const { getPostAuthDestination } = jest.requireActual('@/lib/authRedirect');

    expect(
      getPostAuthDestination('?returnTo=%2Fplayground%3FsaveTemplate%3D1'),
    ).toBe('/playground?saveTemplate=1');
  });

  test('rejects external return destinations', () => {
    const { getPostAuthDestination } = jest.requireActual('@/lib/authRedirect');

    expect(
      getPostAuthDestination('?returnTo=https%3A%2F%2Fexample.org%2F'),
    ).toBe('/');
    expect(getPostAuthDestination('?returnTo=%2F%2Fevil.example')).toBe('/');
  });

  test('validates restored playground drafts before applying them', () => {
    const { isPlaygroundTemplateDraft } = jest.requireActual(
      '@/app/playground/page.tsx',
    );

    expect(
      isPlaygroundTemplateDraft({
        code: 'print("hello")',
        stdin: '',
        language: 'PYTHON',
      }),
    ).toBe(true);
    expect(
      isPlaygroundTemplateDraft({
        code: 'print("hello")',
        stdin: '',
        language: 'RUBY',
      }),
    ).toBe(false);
  });
});
