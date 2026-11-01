export function getPostAuthDestination(search: string): string {
  const requestedDestination = new URLSearchParams(search).get('returnTo')
  if (!requestedDestination) return '/'

  try {
    const destination = new URL(requestedDestination, window.location.origin)
    if (destination.origin !== window.location.origin) return '/'
    return `${destination.pathname}${destination.search}${destination.hash}`
  } catch {
    return '/'
  }
}
