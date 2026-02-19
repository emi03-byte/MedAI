export function normalizeName(s) {
  if (!s) return ''
  return s
    .toString()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .replace(/[^a-zA-Z0-9\s]/g, '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim()
}

export default normalizeName
