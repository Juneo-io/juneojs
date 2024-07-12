import { GenesisNetwork, MainNetwork, type MCN, SocotraNetwork } from '../network'

export class NetworkUtils {
  private static INSTANCE: NetworkUtils | undefined

  private constructor () {}

  static getSingleton (): NetworkUtils {
    if (NetworkUtils.INSTANCE === undefined) {
      NetworkUtils.INSTANCE = new NetworkUtils()
    }
    return NetworkUtils.INSTANCE
  }

  static getNetworkFromId (id: number): MCN {
    switch (id) {
      case MainNetwork.id: {
        return MainNetwork
      }
      case SocotraNetwork.id: {
        return SocotraNetwork
      }
      case GenesisNetwork.id: {
        return GenesisNetwork
      }
      default: {
        throw new Error(`unsupported network id: ${id}`)
      }
    }
  }

  static getNetworkFromHrp (hrp: string): MCN {
    switch (hrp) {
      case MainNetwork.hrp: {
        return MainNetwork
      }
      case SocotraNetwork.hrp: {
        return SocotraNetwork
      }
      default: {
        throw new Error(`unsupported network hrp: ${hrp}`)
      }
    }
  }
}
