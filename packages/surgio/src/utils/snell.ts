export const SNELL_V6_PSK_MIN_BYTES = 12
export const SNELL_V6_PSK_MAX_BYTES = 255

export const isValidSnellV6Psk = (psk: string): boolean => {
  const pskBytes = new TextEncoder().encode(psk).length
  return (
    pskBytes >= SNELL_V6_PSK_MIN_BYTES && pskBytes <= SNELL_V6_PSK_MAX_BYTES
  )
}
