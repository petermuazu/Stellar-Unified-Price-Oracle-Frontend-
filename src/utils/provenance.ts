/** Accepts only credential-free HTTPS URLs for links to source-tick records. */
export function isSecureProvenanceUrl(value: string): boolean {
  try {
    const url = new URL(value)
    return url.protocol === 'https:' && url.hostname.length > 0 && !url.username && !url.password
  } catch {
    return false
  }
}
