import { TimeError } from './errors'

// TODO get time from an external service to avoid using local machine timestamp
export function now (): bigint {
  return BigInt(Math.round(new Date().getTime() / 1000))
}

export async function sleep (milliseconds: number): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, milliseconds))
}

export function verifyTimeRange (startTime: bigint, endTime: bigint, minPeriod: bigint): void {
  if (startTime < now()) {
    throw new TimeError('start time must be in the future')
  }
  if (endTime <= startTime) {
    throw new TimeError('end time must be after start time')
  }
  const period: bigint = endTime - startTime
  if (period < minPeriod) {
    throw new TimeError(`period must be at least ${minPeriod} seconds`)
  }
}
