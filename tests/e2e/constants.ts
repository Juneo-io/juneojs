import * as dotenv from 'dotenv'
import { JuneoClient, MCNAccount, MCNProvider, MCNWallet, SocotraNetwork } from '../../src'
dotenv.config()

export const PROVIDER: MCNProvider = new MCNProvider(
  SocotraNetwork,
  JuneoClient.parse('https://api1.socotra-testnet.network')
)
const WALLET = MCNWallet.recover(process.env.MNEMONIC ?? '', PROVIDER.mcn.hrp)
export const ACCOUNT: MCNAccount = new MCNAccount(PROVIDER, WALLET)

export const EXCESSIVE_AMOUNT = BigInt('100000000000000000000000000000000000000000000000')
export const DONE_STATUS = 'Done'
export const DEFAULT_TIMEOUT: number = 60_000
