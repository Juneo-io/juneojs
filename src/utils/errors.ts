
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

export class JuneoError extends Error {
  private readonly code: string

  protected constructor (message: string, code: string) {
    super(message)
    this.code = code
  }

  getCode (): string {
    return this.code
  }
}

export class NetworkError extends JuneoError {
  constructor (message: string) {
    super(message, NETWORK_CODE)
  }
}

export class HttpError extends JuneoError {
  constructor (message: string) {
    super(message, HTTP_CODE)
  }
}

export class JsonRpcError extends JuneoError {
  constructor (message: string) {
    super(message, JSON_RPC_CODE)
  }
}

export class TimeoutError extends JuneoError {
  constructor (message: string) {
    super(message, TIMEOUT_CODE)
  }
}

export class NotImplementedError extends JuneoError {
  constructor (message: string) {
    super(message, NOT_IMPLEMENTED_CODE)
  }
}

export class ProtocolError extends JuneoError {
  constructor (message: string) {
    super(message, PROTOCOL_CODE)
  }
}

export class DecodingError extends JuneoError {
  constructor (message: string) {
    super(message, DECODING_CODE)
  }
}

export class EncodingError extends JuneoError {
  constructor (message: string) {
    super(message, ENCODING_CODE)
  }
}

export class WalletError extends JuneoError {
  constructor (message: string) {
    super(message, WALLET_CODE)
  }
}

export class CryptoError extends JuneoError {
  constructor (message: string) {
    super(message, CRYPTO_CODE)
  }
}

export class TypeError extends JuneoError {
  constructor (message: string) {
    super(message, TYPE_CODE)
  }
}

export class ParsingError extends JuneoError {
  constructor (message: string) {
    super(message, PARSING_CODE)
  }
}

export class TransactionError extends JuneoError {
  constructor (message: string) {
    super(message, TRANSACTION_CODE)
  }
}

export class InputError extends JuneoError {
  constructor (message: string) {
    super(message, INPUT_CODE)
  }
}

export class OutputError extends JuneoError {
  constructor (message: string) {
    super(message, OUTPUT_CODE)
  }
}

export class TransferError extends JuneoError {
  constructor (message: string) {
    super(message, TRANSFER_CODE)
  }
}

export class IntraChainTransferError extends JuneoError {
  constructor (message: string) {
    super(message, INTRA_TRANSFER_CODE)
  }
}

export class InterChainTransferError extends JuneoError {
  constructor (message: string) {
    super(message, INTER_TRANSFER_CODE)
  }
}
