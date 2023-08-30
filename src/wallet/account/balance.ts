
export enum BalanceStatus {
  Initializing = 'Initializing',
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

export class Balance {
  private readonly listeners: BalanceListener[] = []
  private status: BalanceStatus = BalanceStatus.Initializing
  private value: bigint = BigInt(0)

  registerEvents (listener: BalanceListener): void {
    this.listeners.push(listener)
  }

  update (value: bigint): void {
    if (this.status === BalanceStatus.Updating) {
      return
    }
    const event: BalanceUpdateEvent = new BalanceUpdateEvent(this.value)
    this.value = value
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
    this.listeners.forEach(listener => {
      listener.onBalanceUpdateEvent(event)
    })
  }
}
