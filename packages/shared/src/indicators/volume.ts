export function isVolumeSurge(volumes: readonly number[], latestVolume: number, factor = 2): boolean {
  if (!Number.isFinite(latestVolume) || latestVolume < 0 || !Number.isFinite(factor) || factor <= 0) return false
  if (volumes.length < 20) return false
  const baseline = volumes.slice(-20)
  const averageVolume = baseline.reduce((sum, volume) => sum + volume, 0) / baseline.length
  return averageVolume > 0 && latestVolume > averageVolume * factor
}
