describe('comment page accumulation', () => {
  test('combines fetched pages in page order', () => {
    const { combineCommentPages } = jest.requireActual('@/lib/useCommentList');
    const first = [{ id: 1 }, { id: 2 }];
    const second = [{ id: 3 }];

    expect(combineCommentPages({ 2: second, 1: first })).toEqual([
      ...first,
      ...second,
    ]);
  });
});
