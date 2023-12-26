import { now } from '../../utils'

export enum BalanceStatus {
  Updating = 'Updating',
  Done = 'Done',
}

export class BalanceUpdateEvent {
  previousValue: bigint
  value: bigint = BigInt(0)

  constructor (previousValue: bigint) {
    this.previousValue = previousValue
  }
}

export interface BalanceListener {
  onBalanceUpdateEvent: (event: BalanceUpdateEvent) => void
}

// 30 seconds between updates
const UpdateTimeValidity: bigint = BigInt(30)

export class Balance {
  private readonly listeners: BalanceListener[] = []
  private lastUpdate: bigint = BigInt(0)
  private status: BalanceStatus = BalanceStatus.Done
  private value: bigint = BigInt(0)

  registerEvents (listener: BalanceListener): void {
    this.listeners.push(listener)
  }

  update (value: bigint): void {
    if (this.status === BalanceStatus.Updating) {
      return
    }
    this.status = BalanceStatus.Updating
    const event: BalanceUpdateEvent = new BalanceUpdateEvent(this.value)
    this.value = value
    this.status = BalanceStatus.Done
    event.value = value
    this.callBalanceUpdateEvent(event)
  }

  async updateAsync (fetch: Promise<bigint>): Promise<void> {
    if (this.status === BalanceStatus.Updating) {
      return
    }
    this.status = BalanceStatus.Updating
    const event: BalanceUpdateEvent = new BalanceUpdateEvent(this.value)
    this.value = await fetch
    this.status = BalanceStatus.Done
    event.value = this.value
    this.callBalanceUpdateEvent(event)
  }

  shouldUpdate (): boolean {
    return now() < this.lastUpdate + UpdateTimeValidity
  }

  getStatus (): BalanceStatus {
    return this.status
  }

  getValue (): bigint {
    return this.value
  }

  spend (value: bigint): void {
    const event: BalanceUpdateEvent = new BalanceUpdateEvent(this.value)
    this.value -= value
    event.value = this.value
    this.callBalanceUpdateEvent(event)
  }

  private callBalanceUpdateEvent (event: BalanceUpdateEvent): void {
    this.lastUpdate = now()
    this.listeners.forEach((listener) => {
      listener.onBalanceUpdateEvent(event)
    })
  }
}
