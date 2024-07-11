import {
  Address,
  AssetId,
  BlockchainId,
  EVMInput,
  EVMOutput,
  JEVMExportTransaction,
  JEVMImportTransaction,
  JuneoBuffer,
  Secp256k1Input,
  Secp256k1Output,
  TransactionId,
  TransferableInput,
  TransferableOutput
} from '../../../../src'

describe('JEVMExportTransaction', () => {
  test.each([
    {
      description: 'Parsing from JEVMAPI hex data',
      data: '0x0000000000010000002e17c58819e91f59d06aa805deeac8eb7f9a02f143e2b95b1c7966bf28dc6518ff8f4b348b4e89d5d614c666bc9d2fed3c2366612efec49853898e6f7505b17689000000019b31d8c5dd49fcde96218895f96a6ec1ea8945290000000000b143c4266ecea3035b1435f5cbb17dfc33cc1f4e9b058677915cc52c7ccfae1507b563000000000000031c00000001266ecea3035b1435f5cbb17dfc33cc1f4e9b058677915cc52c7ccfae1507b5630000000700000000009896e4000000000000000000000001000000014eabfc7c2777478e35893f1bc976690606609d2e000000010000000900000001d479ecb7af229a1e205da0c5a5ed8d4358e59c98ac5d024e2c24f3284ece0d7d48f1a42876e2a442941a4568340f7d5ecd308863f7ee78438cc77138418962610107693919'
    }
  ])('$description', async ({ data }) => {
    const parsed = JEVMExportTransaction.parse(data)
    expect(parsed).toBeInstanceOf(JEVMExportTransaction)
  })
})

describe('JEVMImportTransaction', () => {
  test.each([
    {
      description: 'Parsing from JEVMAPI hex data',
      data: '0x0000000000000000002e17c58819e91f59d06aa805deeac8eb7f9a02f143e2b95b1c7966bf28dc6518ff8f4b348b4e89d5d614c666bc9d2fed3c2366612efec49853898e6f7505b17689000000024ac1d07cb2674f7dc1481ea1f7d866783f2aeaf7055431f0d33d6f4b3be6b75c00000001266ecea3035b1435f5cbb17dfc33cc1f4e9b058677915cc52c7ccfae1507b563000000050000000000aa4ae000000001000000004ac1d07cb2674f7dc1481ea1f7d866783f2aeaf7055431f0d33d6f4b3be6b75c000000029e6519fe0110d9d868182539ce4944ae240d7fb1c34146678a01ad74282680740000000500000000000027100000000100000000000000029b31d8c5dd49fcde96218895f96a6ec1ea89452900000000008f1840266ecea3035b1435f5cbb17dfc33cc1f4e9b058677915cc52c7ccfae1507b5639b31d8c5dd49fcde96218895f96a6ec1ea89452900000000000027109e6519fe0110d9d868182539ce4944ae240d7fb1c34146678a01ad7428268074000000020000000900000001caef99337248b6b2c7aa3c4bace4eeb77ff8aef51d46ce180f12b7e21de906f965f0a2a4e46d1d8dc525d8215b1e5be9fa35ee2b310145484e9962b32246340f000000000900000001caef99337248b6b2c7aa3c4bace4eeb77ff8aef51d46ce180f12b7e21de906f965f0a2a4e46d1d8dc525d8215b1e5be9fa35ee2b310145484e9962b32246340f0052a4d58f'
    }
  ])('$description', async ({ data }) => {
    const parsed = JEVMImportTransaction.parse(data)
    expect(parsed).toBeInstanceOf(JEVMImportTransaction)
  })
})

describe('EVMOutput', () => {
  test.each([
    {
      description: 'Basic serialization',
      address: new Address('0x3ffa70d2b129bca2cd2ed6a7027598aa46214997'),
      amount: BigInt(100),
      assetId: new AssetId('2biwSVXZ8KMkwJbYnC4M6khf759pgr49ZPL4M1k8zvYjeQmG82'),
      expectedSerializedValue:
        '3ffa70d2b129bca2cd2ed6a7027598aa462149970000000000000064d28a0223d17697e48048cc00004aabc6736b68f853b026c50a59f3132e418a05'
    },
    {
      description: 'Serialization with large amount',
      address: new Address('0x3ffa70d2b129bca2cd2ed6a7027598aa46214997'),
      amount: BigInt('9007199254740991'),
      assetId: new AssetId('2biwSVXZ8KMkwJbYnC4M6khf759pgr49ZPL4M1k8zvYjeQmG82'),
      expectedSerializedValue:
        '3ffa70d2b129bca2cd2ed6a7027598aa46214997001fffffffffffffd28a0223d17697e48048cc00004aabc6736b68f853b026c50a59f3132e418a05'
    },
    {
      description: 'Serialization with different asset ID',
      address: new Address('0x3ffa70d2b129bca2cd2ed6a7027598aa46214997'),
      amount: BigInt(250),
      assetId: new AssetId('XgN1Q8XeEuj9SU5UtM2LtNWsufgrz6amVs8BwGcJZM7ZuarNq'),
      expectedSerializedValue:
        '3ffa70d2b129bca2cd2ed6a7027598aa4621499700000000000000fa45a8de9ee8e1300fa74cd67b462c2eaf93faa7f415645ebaddfe936e5cf56f93'
    },
    {
      description: 'Serialization with zero amount',
      address: new Address('0xb47e9dcd483278fdc19421858e7506947325614f'),
      amount: BigInt(0),
      assetId: new AssetId('2biwSVXZ8KMkwJbYnC4M6khf759pgr49ZPL4M1k8zvYjeQmG82'),
      expectedSerializedValue:
        'b47e9dcd483278fdc19421858e7506947325614f0000000000000000d28a0223d17697e48048cc00004aabc6736b68f853b026c50a59f3132e418a05'
    },
    {
      description: 'Serialization with same address different asset',
      address: new Address('0xb47e9dcd483278fdc19421858e7506947325614f'),
      amount: BigInt(500),
      assetId: new AssetId('XgN1Q8XeEuj9SU5UtM2LtNWsufgrz6amVs8BwGcJZM7ZuarNq'),
      expectedSerializedValue:
        'b47e9dcd483278fdc19421858e7506947325614f00000000000001f445a8de9ee8e1300fa74cd67b462c2eaf93faa7f415645ebaddfe936e5cf56f93'
    }
  ])('$description', ({ address, amount, assetId, expectedSerializedValue }) => {
    const evmOutput = new EVMOutput(address, amount, assetId)
    const serialized = evmOutput.serialize()
    expect(serialized).toBeInstanceOf(JuneoBuffer)
    expect(serialized.toHex()).toBe(expectedSerializedValue)
  })
})

describe('EVMInput', () => {
  test.each([
    {
      description: 'Basic serialization',
      address: new Address('0xb47e9dcd483278fdc19421858e7506947325614f'),
      amount: BigInt(200),
      assetId: new AssetId('XgN1Q8XeEuj9SU5UtM2LtNWsufgrz6amVs8BwGcJZM7ZuarNq'),
      nonce: BigInt(1),
      expectedSerializedValue:
        'b47e9dcd483278fdc19421858e7506947325614f00000000000000c845a8de9ee8e1300fa74cd67b462c2eaf93faa7f415645ebaddfe936e5cf56f930000000000000001'
    },
    {
      description: 'Serialization with extremely high amount',
      address: new Address('0x23eB882F57A6E8173e2A6152883E1FB30C8926EC'),
      amount: BigInt('9007199254740991'),
      assetId: new AssetId('tDxKdhyn2b9dNLMdsSv3xEY8ihGf7991XSWxXMzWu1bLtAued'),
      nonce: BigInt(10),
      expectedSerializedValue:
        '23eb882f57a6e8173e2a6152883e1fb30c8926ec001fffffffffffff744f11ad6ec1e112762bbbba11f3f56db36bf3c0061020aec8d4332406d52df0000000000000000a'
    },
    {
      description: 'Serialization with very high nonce',
      address: new Address('0xA12A2Ba31638BD51E105F882749546A206a70FC5'),
      amount: BigInt(1000),
      assetId: new AssetId('G3mH67ubqNAJB6txHTHFtFzH56ynrhd2ynJrUk6RjT9iBzXbK'),
      nonce: BigInt('9007199254740991'),
      expectedSerializedValue:
        'a12a2ba31638bd51e105f882749546a206a70fc500000000000003e8222ae27e8c75732c641f35edc71b56b52179072b5c099317ad25ed2de5a93925001fffffffffffff'
    },
    {
      description: 'Serialization with zero values',
      address: new Address('0x84a105dAc8b065124C9Bd3E1347C952c5748E502'),
      amount: BigInt(0),
      assetId: new AssetId('2REm6DRSgbVyE4dypnzBU9WWUV4zW9VcsTMHiDha7GLV84ZXCy'),
      nonce: BigInt(0),
      expectedSerializedValue:
        '84a105dac8b065124c9bd3e1347c952c5748e5020000000000000000babacf29dfce5c3835259d6cdd5ea5c88bd1335f61f4baa7bc24cad03bcc43c60000000000000000'
    }
  ])('$description', ({ address, amount, assetId, nonce, expectedSerializedValue }) => {
    const evmInput = new EVMInput(address, amount, assetId, nonce)
    const serialized = evmInput.serialize()
    expect(serialized).toBeInstanceOf(JuneoBuffer)
    expect(serialized.toHex()).toBe(expectedSerializedValue)
  })
})

describe('JEVMImportTransaction', () => {
  test.each([
    {
      description: 'Basic serialization for JEVMImportTransaction',
      networkId: 1,
      blockchainId: new BlockchainId('2biwSVXZ8KMkwJbYnC4M6khf759pgr49ZPL4M1k8zvYjeQmG82'),
      sourceChain: new BlockchainId('2biwSVXZ8KMkwJbYnC4M6khf759pgr49ZPL4M1k8zvYjeQmG82'),
      importedInputs: [
        new TransferableInput(
          new TransactionId('HXrTQEJKuUDYwQ6MPi7WZELssJwjhmhbbNrUq8XLwit4xEFdq'),
          0,
          new AssetId('2NQFaeBwMcACKqsKqMoLzYmVAHMYeFREfYJq6dtQnsJ5tTyk42'),
          new Secp256k1Input(BigInt(1000), [0])
        )
      ],
      outputs: [
        new EVMOutput(
          new Address('0x9d865eebc7037472d780cdfb70ba2f0471998a32'),
          BigInt(3000),
          new AssetId('2NQFaeBwMcACKqsKqMoLzYmVAHMYeFREfYJq6dtQnsJ5tTyk42')
        )
      ],
      expectedSerializedValue:
        '00000000000000000001d28a0223d17697e48048cc00004aabc6736b68f853b026c50a59f3132e418a05d28a0223d17697e48048cc00004aabc6736b68f853b026c50a59f3132e418a05000000012589ad25990a9335e6c984490f2bf5056ba6e4a62c1a669d38f0c19974516a6f00000000b44a17bc82c895623d5fda84b07389ceb845424d8f6fba12b797eeb9368d37ab0000000500000000000003e80000000100000000000000019d865eebc7037472d780cdfb70ba2f0471998a320000000000000bb8b44a17bc82c895623d5fda84b07389ceb845424d8f6fba12b797eeb9368d37ab'
    },
    {
      description: 'High values serialization for JEVMImportTransaction',
      networkId: 2,
      blockchainId: new BlockchainId('2biwSVXZ8KMkwJbYnC4M6khf759pgr49ZPL4M1k8zvYjeQmG82'),
      sourceChain: new BlockchainId('2biwSVXZ8KMkwJbYnC4M6khf759pgr49ZPL4M1k8zvYjeQmG82'),
      importedInputs: [
        new TransferableInput(
          new TransactionId('HXrTQEJKuUDYwQ6MPi7WZELssJwjhmhbbNrUq8XLwit4xEFdq'),
          1,
          new AssetId('2NQFaeBwMcACKqsKqMoLzYmVAHMYeFREfYJq6dtQnsJ5tTyk42'),
          new Secp256k1Input(BigInt('9007199254740991'), [1])
        )
      ],
      outputs: [
        new EVMOutput(
          new Address('0x9d865eebc7037472d780cdfb70ba2f0471998a32'),
          BigInt('9007199254740991'),
          new AssetId('2NQFaeBwMcACKqsKqMoLzYmVAHMYeFREfYJq6dtQnsJ5tTyk42')
        )
      ],
      expectedSerializedValue:
        '00000000000000000002d28a0223d17697e48048cc00004aabc6736b68f853b026c50a59f3132e418a05d28a0223d17697e48048cc00004aabc6736b68f853b026c50a59f3132e418a05000000012589ad25990a9335e6c984490f2bf5056ba6e4a62c1a669d38f0c19974516a6f00000001b44a17bc82c895623d5fda84b07389ceb845424d8f6fba12b797eeb9368d37ab00000005001fffffffffffff0000000100000001000000019d865eebc7037472d780cdfb70ba2f0471998a32001fffffffffffffb44a17bc82c895623d5fda84b07389ceb845424d8f6fba12b797eeb9368d37ab'
    },

    {
      description: 'Zero values serialization for JEVMImportTransaction',
      networkId: 3,
      blockchainId: new BlockchainId('2biwSVXZ8KMkwJbYnC4M6khf759pgr49ZPL4M1k8zvYjeQmG82'),
      sourceChain: new BlockchainId('2biwSVXZ8KMkwJbYnC4M6khf759pgr49ZPL4M1k8zvYjeQmG82'),
      importedInputs: [
        new TransferableInput(
          new TransactionId('HXrTQEJKuUDYwQ6MPi7WZELssJwjhmhbbNrUq8XLwit4xEFdq'),
          0,
          new AssetId('2NQFaeBwMcACKqsKqMoLzYmVAHMYeFREfYJq6dtQnsJ5tTyk42'),
          new Secp256k1Input(BigInt(0), [0])
        )
      ],
      outputs: [
        new EVMOutput(
          new Address('0x9d865eebc7037472d780cdfb70ba2f0471998a32'),
          BigInt(0),
          new AssetId('2NQFaeBwMcACKqsKqMoLzYmVAHMYeFREfYJq6dtQnsJ5tTyk42')
        )
      ],
      expectedSerializedValue:
        '00000000000000000003d28a0223d17697e48048cc00004aabc6736b68f853b026c50a59f3132e418a05d28a0223d17697e48048cc00004aabc6736b68f853b026c50a59f3132e418a05000000012589ad25990a9335e6c984490f2bf5056ba6e4a62c1a669d38f0c19974516a6f00000000b44a17bc82c895623d5fda84b07389ceb845424d8f6fba12b797eeb9368d37ab0000000500000000000000000000000100000000000000019d865eebc7037472d780cdfb70ba2f0471998a320000000000000000b44a17bc82c895623d5fda84b07389ceb845424d8f6fba12b797eeb9368d37ab'
    }
  ])('$description', ({ networkId, blockchainId, sourceChain, importedInputs, outputs, expectedSerializedValue }) => {
    const jevmImportTransaction = new JEVMImportTransaction(
      networkId,
      blockchainId,
      sourceChain,
      importedInputs,
      outputs
    )
    const serialized = jevmImportTransaction.serialize()
    expect(serialized).toBeInstanceOf(JuneoBuffer)
    expect(serialized.toHex()).toBe(expectedSerializedValue)
  })
})

describe('JEVMExportTransaction', () => {
  test.each([
    {
      description: 'Basic serialization for JEVMExportTransaction',
      networkId: 1,
      blockchainId: new BlockchainId('2c2z3duV8XJhkZHedp19WTBtKEpkfG5BAcvKdL8tbjSgH8uj2o'),
      destinationChain: new BlockchainId('2c2z3duV8XJhkZHedp19WTBtKEpkfG5BAcvKdL8tbjSgH8uj2o'),
      inputs: [
        new EVMInput(
          new Address('0x0123456789abcdef0123456789abcdef01234567'),
          BigInt(1000),
          new AssetId('25revVW7o2DgkhQPTkbGLNxscS6G9Mj6eTu7PCgKvzw3HM7pJv'),
          BigInt(1)
        )
      ],
      exportedOutputs: [
        new TransferableOutput(
          new AssetId('25revVW7o2DgkhQPTkbGLNxscS6G9Mj6eTu7PCgKvzw3HM7pJv'),
          new Secp256k1Output(BigInt(1000), BigInt(0), 1, [new Address('0x0123456789abcdef0123456789abcdef01234567')])
        )
      ],
      expectedSerializedValue:
        '00000000000100000001d33edb0dcd6df2b65e889ceb734da2041f1078512ac60de6aa87579f77b4c0e1d33edb0dcd6df2b65e889ceb734da2041f1078512ac60de6aa87579f77b4c0e1000000010123456789abcdef0123456789abcdef0123456700000000000003e88eb8f382e28b56222a34df0cf68fefab22cec085d2fc7d047561210cb7c3ef470000000000000001000000018eb8f382e28b56222a34df0cf68fefab22cec085d2fc7d047561210cb7c3ef470000000700000000000003e8000000000000000000000001000000010123456789abcdef0123456789abcdef01234567'
    },
    {
      description: 'JEVMExportTransaction with multiple inputs and outputs',
      networkId: 2,
      blockchainId: new BlockchainId('2c2z3duV8XJhkZHedp19WTBtKEpkfG5BAcvKdL8tbjSgH8uj2o'),
      destinationChain: new BlockchainId('2c2z3duV8XJhkZHedp19WTBtKEpkfG5BAcvKdL8tbjSgH8uj2o'),
      inputs: [
        new EVMInput(
          new Address('0x0123456789abcdef0123456789abcdef01234567'),
          BigInt(500),
          new AssetId('25revVW7o2DgkhQPTkbGLNxscS6G9Mj6eTu7PCgKvzw3HM7pJv'),
          BigInt(2)
        ),
        new EVMInput(
          new Address('0x89abcdef0123456789abcdef0123456789abcdef'),
          BigInt(1500),
          new AssetId('25revVW7o2DgkhQPTkbGLNxscS6G9Mj6eTu7PCgKvzw3HM7pJv'),
          BigInt(3)
        )
      ],
      exportedOutputs: [
        new TransferableOutput(
          new AssetId('25revVW7o2DgkhQPTkbGLNxscS6G9Mj6eTu7PCgKvzw3HM7pJv'),
          new Secp256k1Output(BigInt(2000), BigInt(0), 1, [new Address('0xfedcba9876543210fedcba9876543210fedcba98')])
        )
      ],
      expectedSerializedValue:
        '00000000000100000002d33edb0dcd6df2b65e889ceb734da2041f1078512ac60de6aa87579f77b4c0e1d33edb0dcd6df2b65e889ceb734da2041f1078512ac60de6aa87579f77b4c0e1000000020123456789abcdef0123456789abcdef0123456700000000000001f48eb8f382e28b56222a34df0cf68fefab22cec085d2fc7d047561210cb7c3ef47000000000000000289abcdef0123456789abcdef0123456789abcdef00000000000005dc8eb8f382e28b56222a34df0cf68fefab22cec085d2fc7d047561210cb7c3ef470000000000000003000000018eb8f382e28b56222a34df0cf68fefab22cec085d2fc7d047561210cb7c3ef470000000700000000000007d000000000000000000000000100000001fedcba9876543210fedcba9876543210fedcba98'
    },
    {
      description: 'JEVMExportTransaction with higher nonce and multiple addresses',
      networkId: 1,
      blockchainId: new BlockchainId('2c2z3duV8XJhkZHedp19WTBtKEpkfG5BAcvKdL8tbjSgH8uj2o'),
      destinationChain: new BlockchainId('2c2z3duV8XJhkZHedp19WTBtKEpkfG5BAcvKdL8tbjSgH8uj2o'),
      inputs: [
        new EVMInput(
          new Address('0xabcdef0123456789abcdef0123456789abcdef01'),
          BigInt(3000),
          new AssetId('25revVW7o2DgkhQPTkbGLNxscS6G9Mj6eTu7PCgKvzw3HM7pJv'),
          BigInt(10)
        )
      ],
      exportedOutputs: [
        new TransferableOutput(
          new AssetId('25revVW7o2DgkhQPTkbGLNxscS6G9Mj6eTu7PCgKvzw3HM7pJv'),
          new Secp256k1Output(BigInt(3000), BigInt(0), 2, [
            new Address('0x0123456789abcdef0123456789abcdef01234567'),
            new Address('0x89abcdef0123456789abcdef0123456789abcdef')
          ])
        )
      ],
      expectedSerializedValue:
        '00000000000100000001d33edb0dcd6df2b65e889ceb734da2041f1078512ac60de6aa87579f77b4c0e1d33edb0dcd6df2b65e889ceb734da2041f1078512ac60de6aa87579f77b4c0e100000001abcdef0123456789abcdef0123456789abcdef010000000000000bb88eb8f382e28b56222a34df0cf68fefab22cec085d2fc7d047561210cb7c3ef47000000000000000a000000018eb8f382e28b56222a34df0cf68fefab22cec085d2fc7d047561210cb7c3ef47000000070000000000000bb8000000000000000000000002000000020123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef'
    }
  ])(
    '$description',
    ({ networkId, blockchainId, destinationChain, inputs, exportedOutputs, expectedSerializedValue }) => {
      const jevmExportTransaction = new JEVMExportTransaction(
        networkId,
        blockchainId,
        destinationChain,
        inputs,
        exportedOutputs
      )
      const serialized = jevmExportTransaction.serialize()
      expect(serialized).toBeInstanceOf(JuneoBuffer)
      expect(serialized.toHex()).toBe(expectedSerializedValue)
    }
  )
})
