import { MCNProvider } from "../dist";

async function main(){
    const provider: MCNProvider = new MCNProvider()
    const tx = await provider.relay.getPendingValidators()
    console.log(tx)
}

main()