const PAGE_SIZE = 20

export function getChangeLogListParams(input: { page?: string }) {
  const parsedPage = Number(input.page)
  const page = Number.isInteger(parsedPage) && parsedPage > 0 ? parsedPage : 1
  const from = (page - 1) * PAGE_SIZE

  return {
    page,
    pageSize: PAGE_SIZE,
    from,
    to: from + PAGE_SIZE - 1,
  }
}
