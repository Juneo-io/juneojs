import { MCNProvider } from '../../src'

async function main(){
    const provider: MCNProvider = new MCNProvider()
    const tx = await provider.platform.getPendingValidators()
    console.log(tx)
}

main()