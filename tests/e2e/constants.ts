import * as dotenv from 'dotenv'
import { GenesisNetwork, MCNAccount, MCNProvider, MCNWallet } from '../../src'
dotenv.config()

const WALLET = MCNWallet.recover(process.env.MNEMONIC ?? '')
export const PROVIDER: MCNProvider = new MCNProvider(GenesisNetwork)
export const ACCOUNT: MCNAccount = new MCNAccount(PROVIDER, WALLET)
