import { type Blockchain } from '../chain'
import { type Utxo, Secp256k1OutputTypeId, type Secp256k1Output, UserInput } from '../transaction'
import { type Spending, BaseSpending } from '../wallet'

export function sortSpendings (spendings: Spending[]): Map<string, Spending> {
  const values = new Map<string, Spending>()
  spendings.forEach(spending => {
    const key: string = `${spending.chain.id}_${spending.assetId}`
    if (!values.has(key)) {
      values.set(key, new BaseSpending(spending.chain, spending.amount, spending.assetId))
    } else {
      (values.get(key) as Spending).amount += spending.amount
    }
  })
  return values
}

export function getAmountValues (utxoSet: Utxo[]): Map<string, bigint> {
  const values = new Map<string, bigint>()
  for (const utxo of utxoSet) {
    if (utxo.output.typeId !== Secp256k1OutputTypeId) {
      continue
    }
    let value: bigint = (utxo.output as Secp256k1Output).amount
    const assetId: string = utxo.assetId.assetId
    if (values.has(assetId)) {
      value += values.get(assetId) as bigint
    }
    values.set(assetId, value)
  }
  return values
}

export function getUserInputs (
  values: Map<string, bigint>, feeAssetId: string, feeAmount: bigint, source: Blockchain, destination: Blockchain, address: string
): UserInput[] {
  const inputs: UserInput[] = []
  for (const [key, value] of values) {
    const amount: bigint = key === feeAssetId ? value - feeAmount : value
    inputs.push(new UserInput(key, source, amount, address, destination))
  }
  return inputs
}
