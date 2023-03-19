
const NETWORK_CODE: string = 'Network error'
const HTTP_CODE: string = 'HTTP error'
const JSON_RPC_CODE: string = 'JsonRPC error'
const TIMEOUT_CODE: string = 'Timeout error'
const NOT_IMPLEMENTED_CODE: string = 'Not implemented'
const PROTOCOL_CODE: string = 'Protocol error'
const ENCODING_CODE: string = 'Encoding error'
const DECODING_CODE: string = 'Decoding error'
const WALLET_CODE: string = 'Wallet error'

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
