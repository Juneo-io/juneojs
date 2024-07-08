import { TokenType } from '../asset'

export const PLATFORMVM_ID: string = '11111111111111111111111111111111LpoYY'
export const JVM_ID: string = 'otSmSxFRBqdRX7kestRW732n3WS2MrLAoWwHZxHnmMGMuLYX8'
export const JEVM_ID: string = 'orkbbNQVf27TiBe6GqN5dm8d8Lo3rutEov8DUWZaKNUjckwSk'
export const EVM_ID: string = 'mgj786NP7uDwBCcq6YwThhaN8FLyybkCa4zBWTQbNgmK6k9A6'

export const JVM_HD_PATH = 9000
export const EVM_HD_PATH = 60

export const BaseShare: number = 100_0000 // 100%

export const NativeAssetBalanceContract: string = '0x0100000000000000000000000000000000000001'
export const NativeAssetCallContract: string = '0x0100000000000000000000000000000000000002'

export const SendEtherGasLimit = BigInt(21_000)
export const EmptyCallData = '0x'
export const EVMTransferables: TokenType[] = [TokenType.ERC20, TokenType.JRC20, TokenType.Wrapped]
