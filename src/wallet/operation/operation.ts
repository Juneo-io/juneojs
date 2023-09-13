
export enum NetworkOperationType {
  Send = 'Send',
  Cross = 'Cross',
  Bridge = 'Bridge',
  Validate = 'Validate',
  Delegate = 'Delegate',
  Wrap = 'Wrap',
  Unwrap = 'Unwrap'
}

export interface NetworkOperation {
  type: NetworkOperationType
}

export enum NetworkOperationStatus {
  Initializing = 'Initializing',
  Executing = 'Executing',
  Done = 'Done',
  Timeout = 'Timeout',
  Error = 'Error'
}
