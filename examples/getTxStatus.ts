import { MCNProvider } from "../dist";

async function main(){
    const provider: MCNProvider = new MCNProvider()
    const txID: string = '9Km2dM9UgJAcXVMeLZrpBMXAbaRW1x2zNmErgpe4yXpdAtjoS'
    const tx: string | object = await provider.relay.getTxStatus(txID)
    console.log(tx)
}

main()