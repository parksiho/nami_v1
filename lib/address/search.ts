export function searchAddresses(query: string, corpus: string[]): string[] {
  const keyword = query.trim().toLocaleLowerCase()

  if (!keyword) return []

  return corpus
    .filter((address) => address.toLocaleLowerCase().includes(keyword))
    .slice(0, 10)
}
