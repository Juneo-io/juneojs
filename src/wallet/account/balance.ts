
export enum BalanceStatus {
  Initializing = 'Initializing',
  Updating = 'Updating',
  Done = 'Done',
}

export class Balance {
  private status: BalanceStatus = BalanceStatus.Initializing
  private value: bigint = BigInt(0)

  update (value: bigint): void {
    if (this.status === BalanceStatus.Updating) {
      return
    }
    this.value = value
  }

  async updateAsync (fetch: Promise<bigint>): Promise<void> {
    if (this.status === BalanceStatus.Updating) {
      return
    }
    this.status = BalanceStatus.Updating
    this.value = await fetch
    this.status = BalanceStatus.Done
  }

  getStatus (): BalanceStatus {
    return this.status
  }

  getValue (): bigint {
    return this.value
  }

  spend (value: bigint): void {
    this.value -= value
  }
}
