
// TODO get time from the platform to avoid using local machine timestamp
export function now (): bigint {
  return BigInt(Math.round(new Date().getTime() / 1000))
}
