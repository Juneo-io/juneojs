export const AddressSize = 20
export const AssetIdSize = 32
export const TransactionIdSize = 32
export const BlockchainIdSize = 32
export const SupernetIdSize = 32
export const DynamicIdSize = 32
export const SignatureSize = 65
export const NodeIdSize = 20
export const BLSPublicKeySize = 48
export const BLSSignatureSize = 96
export const ProofOfPossessionSize = BLSPublicKeySize + BLSSignatureSize
export const PrimarySignerSize = 4 + ProofOfPossessionSize
export const EmptySignerSize = 4
export const ValidatorSize = NodeIdSize + 3 * 8
export const EVMOutputSize = AddressSize + 8 + AssetIdSize
export const EVMInputSize = AddressSize + 8 + AssetIdSize + 8

export const CodecId = 0

export const Secp256k1InitialStateFxId = 0x00000000

export const JVMBaseTransactionTypeId = 0x00000000
export const CreateAssetTransactionTypeId = 0x00000001
export const JVMImportTransactionTypeId = 0x00000003
export const JVMExportTransactionTypeId = 0x00000004
export const Secp256k1InputTypeId = 0x00000005
export const Secp256k1OutputTypeId = 0x00000007
export const Secp256k1CredentialsTypeId = 0x00000009
export const SupernetAuthTypeId = 0x0000000a
export const Secp256k1OutputOwnersTypeId = 0x0000000b
export const AddValidatorTransactionTypeId = 0x0000000c
export const AddSupernetValidatorTransactionType = 0x0000000d
export const AddDelegatorTransactionTypeId = 0x0000000e
export const CreateChainTransactionTypeId = 0x0000000f
export const CreateSupernetTransactionTypeId = 0x00000010
export const PlatformImportTransactionTypeId = 0x00000011
export const PlatformExportTransactionTypeId = 0x00000012
export const RemoveSupernetTransactionTypeId = 0x00000017
export const TransformSupernetTransactionTypeId = 0x00000018
export const AddPermissionlessValidatorTransactionTypeId = 0x00000019
export const AddPermissionlessDelegatorTransactionTypeId = 0x0000001a
export const EmptySignerTypeId = 0x0000001b
export const PrimarySignerTypeId = 0x0000001c
export const TransferSupernetOwnershipTransactionTypeId = 0x00000021
export const PlatformBaseTransactionTypeId = 0x00000022

export const EVMImportTransactionTypeId = 0
export const EVMExportTransactionTypeId = 1

export const EVMFeeConfigDefaultGasLimit: number = 15_000_000
export const EVMFeeConfigDefaultTargetBlockRate: number = 2
export const EVMFeeConfigDefaultMinBaseFee: number = 25_000_000_000
export const EVMFeeConfigDefaultTargetGas: number = 15_000_000
export const EVMFeeConfigDefaultBaseFeeChangeDenominator: number = 36
export const EVMFeeConfigDefaultMinBlockGasCost: number = 0
export const EVMFeeConfigDefaultMaxBlockGasCost: number = 1_000_000
export const EVMFeeConfigDefaultBlockGasCostStep: number = 200_000
