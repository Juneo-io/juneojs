import { JuneoClient } from "../dist/api"
import { chain, MCNProvider } from "../dist/juneo"

async function main () {
    // the provider is used to interact with a mcn we can instantiate it this way
    // this will automatically connect it to the most relevant MCN (Juneo MCN Mainnet)
    const provider: MCNProvider = new MCNProvider()
    // if we want to instantiate it to interact with another specific MCN
    // we must either create a new MCN instance or we can use already existing values
    const otherProvider: MCNProvider = new MCNProvider(chain.SocotraNetwork)
    // the provider can also use another client by default the address
    // provided in the MCN values is used but if we want to use for example
    // our own local node to interact with the network we can do it
    const localProvider: MCNProvider = new MCNProvider(
        chain.SocotraNetwork, 
        JuneoClient.parse('http://127.0.0.1:9650')
    )
}

main().catch((error) => {
    console.error(error)
    process.exitCode = 1
})
