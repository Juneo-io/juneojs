import { JuneoWallet, JEVMWallet, VMWallet, SocotraJVMChain, SocotraJUNEChain } from '../dist';

async function main() {
    // generating new master wallet
    let masterWallet: JuneoWallet = JuneoWallet.generate()
    // generated mnemonic
    console.log(masterWallet.mnemonic)
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
