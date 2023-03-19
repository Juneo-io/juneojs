import { juneojs, JuneoWallet } from '../dist';
import { JEVMWallet, VMWallet } from '../dist/wallet';

async function main() {
    const belgradeHrp: string = juneojs.Belgrade.hrp
    // generating new wallet
    const masterWallet: JuneoWallet = juneojs.JuneoWallet.generate(belgradeHrp)
    // generated mnemonic
    console.log(masterWallet.mnemonic)
    const jvmChainAddress: string = masterWallet.getAddress(juneojs.JVMChain)
    console.log(jvmChainAddress)
    const juneChainWallet: VMWallet = masterWallet.getWallet(juneojs.JUNEChain)
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
