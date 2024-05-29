import * as dotenv from 'dotenv'
import { GenesisNetwork, MCNAccount, MCNProvider, MCNWallet } from '../../src'
dotenv.config()

export const PROVIDER: MCNProvider = new MCNProvider(GenesisNetwork)
const WALLET = MCNWallet.recover(process.env.MNEMONIC ?? '', PROVIDER.mcn.hrp)
export const ACCOUNT: MCNAccount = new MCNAccount(PROVIDER, WALLET)

export const EXCESSIVE_AMOUNT = BigInt('100000000000000000000000000000000000000000000000')
export const DONE_STATUS = 'Done'
export const DEFAULT_TIMEOUT: number = 120_000
