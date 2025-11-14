const RAW_API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  process.env.API_BASE_URL ||
  "https://api.hellopassxyz.com/"

const normalizeBaseUrl = (url: string) =>
  url.endsWith("/") ? url : `${url}/`

export const API_BASE_URL = normalizeBaseUrl(RAW_API_BASE_URL)

export const apiUrl = (path: string) => {
  const normalizedPath = path.replace(/^\/+/, "")
  return `${API_BASE_URL}${normalizedPath}`
}

