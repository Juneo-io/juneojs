
const NETWORK_CODE: string = 'Network error'
const HTTP_CODE: string = 'HTTP error'
const JSON_RPC_CODE: string = 'JsonRPC error'
const TIMEOUT_CODE: string = 'Timeout error'
const NOT_IMPLEMENTED_CODE: string = 'Not implemented'
const PROTOCOL_CODE: string = 'Protocol error'
const ENCODING_CODE: string = 'Encoding error'
const DECODING_CODE: string = 'Decoding error'
const WALLET_CODE: string = 'Wallet error'
const CRYPTO_CODE: string = 'Crypto error'
const TYPE_CODE: string = 'Type error'
const PARSING_CODE: string = 'Parsing error'
const TRANSACTION_CODE: string = 'Transaction error'
const INPUT_CODE: string = 'Input error'
const OUTPUT_CODE: string = 'Output error'
const TRANSFER_CODE: string = 'Transfer error'
const INTRA_TRANSFER_CODE: string = 'IntraChain transfer error'
const INTER_TRANSFER_CODE: string = 'InterChain transfer error'
const FEE_CODE: string = 'Fee error'
const SIGNATURE_CODE: string = 'Signature error'

export class JuneoError extends Error {
  private readonly code: string

  protected constructor (message: string, code: string) {
    super(message)
    Object.setPrototypeOf(this, JuneoError.prototype)
    this.code = code
  }

  getCode (): string {
    return this.code
  }
}

export class NetworkError extends JuneoError {
  constructor (message: string) {
    super(message, NETWORK_CODE)
    Object.setPrototypeOf(this, NetworkError.prototype)
  }
}

export class HttpError extends JuneoError {
  constructor (message: string) {
    super(message, HTTP_CODE)
    Object.setPrototypeOf(this, HttpError.prototype)
  }
}

export class JsonRpcError extends JuneoError {
  constructor (message: string) {
    super(message, JSON_RPC_CODE)
    Object.setPrototypeOf(this, JsonRpcError.prototype)
  }
}

export class TimeoutError extends JuneoError {
  constructor (message: string) {
    super(message, TIMEOUT_CODE)
    Object.setPrototypeOf(this, TimeoutError.prototype)
  }
}

export class NotImplementedError extends JuneoError {
  constructor (message: string) {
    super(message, NOT_IMPLEMENTED_CODE)
    Object.setPrototypeOf(this, NotImplementedError.prototype)
  }
}

export class ProtocolError extends JuneoError {
  constructor (message: string) {
    super(message, PROTOCOL_CODE)
    Object.setPrototypeOf(this, ProtocolError.prototype)
  }
}

export class DecodingError extends JuneoError {
  constructor (message: string) {
    super(message, DECODING_CODE)
    Object.setPrototypeOf(this, DecodingError.prototype)
  }
}

export class EncodingError extends JuneoError {
  constructor (message: string) {
    super(message, ENCODING_CODE)
    Object.setPrototypeOf(this, EncodingError.prototype)
  }
}

export class WalletError extends JuneoError {
  constructor (message: string) {
    super(message, WALLET_CODE)
    Object.setPrototypeOf(this, WalletError.prototype)
  }
}

export class CryptoError extends JuneoError {
  constructor (message: string) {
    super(message, CRYPTO_CODE)
    Object.setPrototypeOf(this, CryptoError.prototype)
  }
}

export class TypeError extends JuneoError {
  constructor (message: string) {
    super(message, TYPE_CODE)
    Object.setPrototypeOf(this, TypeError.prototype)
  }
}

export class ParsingError extends JuneoError {
  constructor (message: string) {
    super(message, PARSING_CODE)
    Object.setPrototypeOf(this, ParsingError.prototype)
  }
}

export class TransactionError extends JuneoError {
  constructor (message: string) {
    super(message, TRANSACTION_CODE)
    Object.setPrototypeOf(this, TransactionError.prototype)
  }
}

export class InputError extends JuneoError {
  constructor (message: string) {
    super(message, INPUT_CODE)
    Object.setPrototypeOf(this, InputError.prototype)
  }
}

export class OutputError extends JuneoError {
  constructor (message: string) {
    super(message, OUTPUT_CODE)
    Object.setPrototypeOf(this, OutputError.prototype)
  }
}

export class TransferError extends JuneoError {
  constructor (message: string) {
    super(message, TRANSFER_CODE)
    Object.setPrototypeOf(this, TransferError.prototype)
  }
}

export class IntraChainTransferError extends JuneoError {
  constructor (message: string) {
    super(message, INTRA_TRANSFER_CODE)
    Object.setPrototypeOf(this, IntraChainTransferError.prototype)
  }
}

export class InterChainTransferError extends JuneoError {
  constructor (message: string) {
    super(message, INTER_TRANSFER_CODE)
    Object.setPrototypeOf(this, InterChainTransferError.prototype)
  }
}

export class FeeError extends JuneoError {
  constructor (message: string) {
    super(message, FEE_CODE)
    Object.setPrototypeOf(this, FeeError.prototype)
  }
}

export class SignatureError extends JuneoError {
  constructor (message: string) {
    super(message, SIGNATURE_CODE)
    Object.setPrototypeOf(this, SignatureError.prototype)
  }
}
