/* Token tiruan berbentuk `mock.<base64({ sub })>.tanda`, menyerupai JWT supaya
   handler mock bisa menentukan pemanggil dari token — sama seperti backend asli
   yang menyimpulkan cakupan dari token, bukan dari parameter frontend. */
export function subDariToken(otorisasi: string | null): number | null {
  const token = otorisasi?.replace('Bearer ', '')
  if (!token || !token.startsWith('mock.')) return null
  const bagian = token.split('.')
  try {
    const muatan = JSON.parse(atob(bagian[1])) as { sub?: unknown }
    return typeof muatan.sub === 'number' ? muatan.sub : null
  } catch {
    return null
  }
}
