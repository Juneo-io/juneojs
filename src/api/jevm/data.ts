import { type GetTxResponse, type GetTxStatusResponse } from '../data'

export interface GetAtomicTxResponse extends GetTxResponse {
  blockHeight: string
}

export interface GetAtomicTxStatusResponse extends GetTxStatusResponse {
  blockHeight: string
}
