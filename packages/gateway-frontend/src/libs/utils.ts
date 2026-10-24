import client, { SuccessResponse } from './http'

export const defaultFetcher = <T>(url: string): Promise<T> =>
  client.get<SuccessResponse<T>>(url).then((res) => res.data.data)

export const getDownloadUrl = (
  artifactName: string,
  inline = true,
  accessToken?: string | null,
  artifactParams?: URLSearchParams
): string => {
  const urlObject = new URL(
    `/get-artifact/${artifactName}`,
    window.location.origin
  )
  if (accessToken) {
    urlObject.searchParams.set('access_token', accessToken)
  }
  if (!inline) {
    urlObject.searchParams.set('dl', '1')
  }
  if (artifactParams) {
    for (const [key, value] of artifactParams.entries()) {
      urlObject.searchParams.set(key, value)
    }
  }
  return urlObject.toString()
}

export const getExportProviderUrl = (
  providers: string,
  format: string,
  inline = true,
  accessToken?: string | null
): string => {
  const urlObject = new URL(`/export-providers`, window.location.origin)

  urlObject.searchParams.set('providers', providers)
  urlObject.searchParams.set('format', format)

  if (accessToken) {
    urlObject.searchParams.set('access_token', accessToken)
  }
  if (!inline) {
    urlObject.searchParams.set('dl', '1')
  }
  return urlObject.toString()
}
