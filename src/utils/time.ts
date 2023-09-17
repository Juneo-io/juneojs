// TODO get time from the platform to avoid using local machine timestamp
export function now (): bigint {
  return BigInt(Math.round(new Date().getTime() / 1000))
}

export async function sleep (milliseconds: number): Promise<void> {
  await new Promise(resolve => setTimeout(resolve, milliseconds))
}
