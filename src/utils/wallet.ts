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
