import { TimeError } from './errors'

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

  static verifyLocktime (locktime: bigint): void {
    const now = TimeUtils.now()
    const minValue = BigInt(60)
    const maxValue = TimeUtils.year() * BigInt(3)
    if (locktime > now && locktime < now + minValue) {
      throw new TimeError(`locktime value ${locktime} below minimum of ${minValue}`)
    }
    if (locktime > now + maxValue) {
      throw new TimeError(`locktime value ${locktime} above maximum of ${maxValue}`)
    }
  }
}

class TimeProvider {
  getCurrentClientTimeSeconds (): bigint {
    return BigInt(Math.round(new Date().getTime() / 1000))
  }

  // TODO add and use if available getCurrentServerTimeSeconds()
}
