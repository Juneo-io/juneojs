import { juneojs, JuneoWallet } from '../dist';
import { JEVMWallet, VMWallet } from '../dist/wallet';

async function main() {
    // generating new master wallet
    let masterWallet: JuneoWallet = juneojs.JuneoWallet.generate()
    // generated mnemonic
    console.log(masterWallet.mnemonic)
    const jvmChainAddress: string = masterWallet.getAddress(juneojs.chain.SocotraJVMChain)
    console.log(jvmChainAddress)
    const juneChainWallet: VMWallet = masterWallet.getWallet(juneojs.chain.SocotraJUNEChain)
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
