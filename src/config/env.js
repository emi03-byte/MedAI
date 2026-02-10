// În production (Azure), lasă gol ca să folosească același domeniu (/api/...). La dev folosește backend local.
export const API_BASE_URL =
  import.meta.env.VITE_API_BASE !== undefined && import.meta.env.VITE_API_BASE !== ''
    ? import.meta.env.VITE_API_BASE
    : import.meta.env.DEV
      ? 'http://localhost:3001'
      : ''

export const IS_DEV = !!import.meta.env.DEV

