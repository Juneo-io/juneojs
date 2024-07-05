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

  static minute (): bigint {
    return BigInt(60)
  }

  static hour (): bigint {
    return TimeUtils.minute() * BigInt(60)
  }

  static day (): bigint {
    return TimeUtils.hour() * BigInt(24)
  }

  static week (): bigint {
    return TimeUtils.day() * BigInt(7)
  }

  static year (): bigint {
    return TimeUtils.day() * BigInt(365)
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
