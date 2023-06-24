import { ethers } from 'ethers'
import { GenesisError } from '../../utils'

export const EVMFeeConfigDefaultGasLimit: number = 15_000_000
export const EVMFeeConfigDefaultTargetBlockRate: number = 2
export const EVMFeeConfigDefaultMinBaseFee: number = 25_000_000_000
export const EVMFeeConfigDefaultTargetGas: number = 15_000_000
export const EVMFeeConfigDefaultBaseFeeChangeDenominator: number = 36
export const EVMFeeConfigDefaultMinBlockGasCost: number = 0
export const EVMFeeConfigDefaultMaxBlockGasCost: number = 1_000_000
export const EVMFeeConfigDefaultBlockGasCostStep: number = 200_000

class EVMGenesis {
  chainId: number
  allocations: EVMAllocation[]

  constructor (chainId: number, allocations: EVMAllocation[] = []) {
    this.chainId = chainId
    this.allocations = allocations
  }

  generate (): string {
    const alloc: any = {}
    this.allocations.forEach(allocation => {
      let address: string = allocation.address
      try {
        address = ethers.getAddress(address).substring(2)
      } catch {
        throw new GenesisError(`invalid address: ${allocation.address}`)
      }
      alloc[address] = {
        balance: `0x${allocation.balance.toString(16).toUpperCase()}`
      }
    })
    const json: any = JSON.parse(`{
        "config": {
            "chainId": ${this.chainId},
            "homesteadBlock": 0,
            "eip150Block": 0,
            "eip150Hash": "0x2086799aeebeae135c246c65021c82b4e15a2c451340993aacfd2751886514f0",
            "eip155Block": 0,
            "eip158Block": 0,
            "byzantiumBlock": 0,
            "constantinopleBlock": 0,
            "petersburgBlock": 0,
            "istanbulBlock": 0,
            "muirGlacierBlock": 0
        },
        "alloc": ${JSON.stringify(alloc)},
        "nonce": "0x0",
        "timestamp": "0x0",
        "extraData": "0x00",
        "gasLimit": "0x7A1200",
        "difficulty": "0x0",
        "mixHash": "0x0000000000000000000000000000000000000000000000000000000000000000",
        "coinbase": "0x0000000000000000000000000000000000000000",
        "number": "0x0",
        "gasUsed": "0x0",
        "parentHash": "0x0000000000000000000000000000000000000000000000000000000000000000"
    }`)
    return JSON.stringify(json)
  }
}

export class EVMAllocation {
  address: string
  balance: bigint

  constructor (address: string, balance: number | bigint) {
    this.address = address
    this.balance = typeof balance === 'number' ? BigInt(balance) : balance
  }
}

export class SupernetEVMGenesis extends EVMGenesis {
  allowFeeRecipients: boolean
  feeConfig: SupernetEVMFeeConfig

  constructor (chainId: number, allocations: EVMAllocation[] = [], allowFeeRecipients: boolean = true,
    feeConfig: SupernetEVMFeeConfig = new SupernetEVMFeeConfig()) {
    super(chainId, allocations)
    this.allowFeeRecipients = allowFeeRecipients
    this.feeConfig = feeConfig
  }

  override generate (): string {
    const genesis: string = super.generate()
    const json: any = JSON.parse(genesis)
    json.config.supernetEVMTimestamp = 0
    json.gasLimit = `0x${BigInt(this.feeConfig.gasLimit).toString(16).toUpperCase()}`
    json.config.feeConfig = this.feeConfig
    json.config.allowFeeRecipients = this.allowFeeRecipients
    return JSON.stringify(json)
  }
}

export class SupernetEVMFeeConfig {
  gasLimit: number
  targetBlockRate: number
  minBaseFee: number
  targetGas: number
  baseFeeChangeDenominator: number
  minBlockGasCost: number
  maxBlockGasCost: number
  blockGasCostStep: number

  constructor (gasLimit: number = EVMFeeConfigDefaultGasLimit, targetBlockRate: number = EVMFeeConfigDefaultTargetBlockRate,
    minBaseFee: number = EVMFeeConfigDefaultMinBaseFee, targetGas: number = EVMFeeConfigDefaultTargetGas,
    baseFeeChangeDenominator: number = EVMFeeConfigDefaultBaseFeeChangeDenominator, minBlockGasCost: number = EVMFeeConfigDefaultMinBlockGasCost,
    maxBlockGasCost: number = EVMFeeConfigDefaultMaxBlockGasCost, blockGasCostStep: number = EVMFeeConfigDefaultBlockGasCostStep) {
    this.gasLimit = gasLimit
    this.targetBlockRate = targetBlockRate
    this.minBaseFee = minBaseFee
    this.targetGas = targetGas
    this.baseFeeChangeDenominator = baseFeeChangeDenominator
    this.minBlockGasCost = minBlockGasCost
    this.maxBlockGasCost = maxBlockGasCost
    this.blockGasCostStep = blockGasCostStep
  }
}
