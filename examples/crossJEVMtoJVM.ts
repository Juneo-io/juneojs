import { MCNProvider } from "../dist"
import { Blockchain, SocotraJUNEChain, SocotraJVMChain } from "../dist/chain"
import { UserInput } from "../dist/transaction"
import { TransferHandler, TransferManager } from "../dist/wallet/transfer"
import { JuneoWallet } from "../dist/wallet/wallet"

async function main () {
    // provider to interact with the MCN
    const provider: MCNProvider = new MCNProvider()
    // recovering wallet used to sign transactions
    const wallet: JuneoWallet = JuneoWallet.recover('raven whip pave toy benefit moment twin acid wasp satisfy crash april')
    // transfer manager to handle user inputs
    const manager: TransferManager = new TransferManager(provider, wallet)
    // data used to create user inputs
    const assetId: string = SocotraJUNEChain.assetId
    // source chain of all inputs used in a transfer must be the same
    const sourceChain: Blockchain = SocotraJUNEChain
    const amount: bigint = BigInt(103 * (10**9)) // 103 JUNE
    const targetAddress1: string = 'Asset-june1klee0j2h6te65za6ncdln34an9ml2zg9v3n78u'
    // if destination is the same as source chain it will create an intra chain transaction
    // if it is different it will create an inter chain transaction
    const destinationChain: Blockchain = SocotraJVMChain
    // locktime value is optional it will default to 0
    const locktime: bigint = BigInt(0)
    // example user inputs
    const inputs: UserInput[] = [
        new UserInput(
            assetId,
            sourceChain,
            amount,
            targetAddress1,
            destinationChain,
            locktime
        )
    ]
    // starting the transfer returns the handlers that manage each chain of transaction
    // they can be used to retrieve informations while funds are moving towards their destination
    const handlers: TransferHandler[] = manager.transfer(inputs)
    handlers.forEach(handler => {
        // printing the current status of the handler
        // handler will update its status to TransferStatus.Done once the transfer ends
        // if the transfer does not complete it will be TransferStatus.Error or TransferStatus.Timeout
        console.log(handler.getStatus())
        // printing the transfer this handler is working on
        console.log(handler.getTransfer())
        // printing all the currently available receipts in the handler
        // this may not contain all the receipts that the handler will produce if
        // the status of the handler is not TransferStatus.Done this is also
        // the case for the content of the latest receipt in the receipts array
        console.log(handler.getCurrentReceipts())
    })
    // if the transfer is an inter chain transfer it will most likely do more than one transaction
    // this will then produce multiple receipts however for more simple transfer types
    // such as intra chain transfer it is possible that only one receipt is produced
    // those receipts can be useful to track the current state of the transfer
    handlers[0].getCurrentReceipts().forEach(receipt => {
        // chain id of receipt is always available
        console.log(receipt.chainId)
        // transaction id may be undefined if the transaction was not sent yet
        console.log(receipt.transactionId)
        // transaction status may already be set once transaction id is
        // but it can also change during the execution of the transfer
        // also note that if the transfer timed out and this status
        // is not a finalized status then it may be out of date
        console.log(receipt.transactionStatus)
    })
}

main().catch((error) => {
    console.error(error)
    process.exitCode = 1
})
