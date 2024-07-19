import * as dotenv from 'dotenv'
import { MCNAccount, MCNProvider, SocotraNetwork } from '../../src'
dotenv.config()

export const PROVIDER = new MCNProvider(SocotraNetwork)
const WALLET = PROVIDER.mcn.recoverWallet(process.env.MNEMONIC!)
export const ACCOUNT = new MCNAccount(PROVIDER, WALLET)

export const EXCESSIVE_AMOUNT = BigInt('100000000000000000000000000000000000000000000000')
export const DONE_STATUS = 'Done'
export const DEFAULT_TIMEOUT: number = 120_000
