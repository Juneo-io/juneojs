import { JuneoWallet, JEVMWallet, VMWallet, SocotraJVMChain, SocotraJUNEChain } from '../../src'

async function main() {
    // recovering wallet from mnemonic
    const masterWallet: JuneoWallet = JuneoWallet.recover('raven whip pave toy benefit moment twin acid wasp satisfy crash april')
    const jvmChainAddress: string = masterWallet.getAddress(SocotraJVMChain)
    console.log(jvmChainAddress)
    const juneChainWallet: VMWallet = masterWallet.getWallet(SocotraJUNEChain)
    // june chain jeth address
    console.log(juneChainWallet.getAddress())
    const juneEVMChainWallet: JEVMWallet = juneChainWallet as JEVMWallet
    // june chain evm hex address
    console.log(juneEVMChainWallet.getHexAddress())
}

main().catch((error) => {
    console.error(error)
    process.exitCode = 1
})
