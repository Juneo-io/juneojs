export class TimeUtils {
  private static INSTANCE: TimeUtils | undefined
  private readonly provider: TimeProvider

  private constructor (provider: TimeProvider) {
    this.provider = provider
  }

  static getSingleton (): TimeUtils {
    if (TimeUtils.INSTANCE === undefined) {
      TimeUtils.INSTANCE = new TimeUtils(new TimeProvider())
    }
    return TimeUtils.INSTANCE
  }

  // TODO get time from an external service to avoid using local machine timestamp
  static now (): bigint {
    return TimeUtils.getSingleton().provider.getCurrentClientTimeSeconds()
  }

  static async sleep (milliseconds: number): Promise<void> {
    await new Promise((resolve) => setTimeout(resolve, milliseconds))
  }
}

class TimeProvider {
  getCurrentClientTimeSeconds (): bigint {
    return BigInt(Math.round(new Date().getTime() / 1000))
  }

  // TODO add and use if available getCurrentServerTimeSeconds()
}
