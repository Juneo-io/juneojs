
export enum NetworkOperationType {
  Send = 'Send',
  Cross = 'Cross',
  Bridge = 'Bridge',
  Validate = 'Validate',
  Delegate = 'Delegate',
  Wrap = 'Wrap',
  Unwrap = 'Unwrap'
}

export enum ChainOperationType {
  Send = NetworkOperationType.Send,
  Validate = NetworkOperationType.Validate,
  Delegate = NetworkOperationType.Delegate,
  Wrap = NetworkOperationType.Wrap,
  Unwrap = NetworkOperationType.Unwrap
}

export enum MCNOperationType {
  Cross = NetworkOperationType.Cross,
  Bridge = NetworkOperationType.Bridge
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
