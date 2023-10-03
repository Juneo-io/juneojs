import * as dotenv from "dotenv";

import {
  Blockchain,
  ChainAccount,
  EVMAccount,
  ExecutableOperation,
  MCNAccount,
  MCNProvider,
  MCNWallet,
  SendOperation,
  SocotraEUROC1AssetId,
  SocotraJUNEAssetId,
  SocotraJUNEChain,
  SocotraJVMChain,
} from "../../../src/index";
dotenv.config();

describe("Send Operations", () => {
  let mockBlockchain: Blockchain;
  let mockAssetId: string;
  let mockValue: bigint;
  let mockRecipient: string;
  const wallet = MCNWallet.recover(process.env.MNEMONIC ?? "");
  const provider: MCNProvider = new MCNProvider();
  const mcnAccount: MCNAccount = new MCNAccount(provider, wallet);
  const account: ChainAccount = mcnAccount.getAccount(SocotraJUNEChain.id);
  const EXCESSIVE_AMOUNT = BigInt(
    "100000000000000000000000000000000000000000000000",
  );
  const DONE_STATUS = "Done";

  // fetch all balances before tests
  beforeAll(async () => {
    (account as EVMAccount).registerAssets(SocotraJUNEChain.registeredAssets);
    mcnAccount.getAccount(SocotraJVMChain.id);
  });

  beforeEach(async () => {
    mockBlockchain = SocotraJUNEChain;
    mockAssetId = SocotraJUNEAssetId;
    mockValue = BigInt(1000);
    mockRecipient = "0x3c647d88Bc92766075feA7A965CA599CAAB2FD26";
    await mcnAccount.fetchAllBalances();
  });

  describe("Valid Operations EVM", () => {
    test("should correctly create a SendOperation instance", async () => {
      // valid
      const operation = new SendOperation(
        mockBlockchain,
        mockAssetId,
        mockValue,
        mockRecipient,
      );

      // Verify that the instance has the correct properties
      expect(operation.chain).toEqual(mockBlockchain);
      expect(operation.assetId).toEqual(mockAssetId);
    });

    test("should perform the send operation correctly", async () => {
      // valid
      const operation = new SendOperation(
        mockBlockchain,
        mockAssetId,
        mockValue,
        mockRecipient,
      );

      const summary = await mcnAccount.estimate(operation);
      const executable: ExecutableOperation = summary.getExecutable();

      await mcnAccount.execute(summary);
      await expect(executable.status).toEqual(DONE_STATUS);
    });

    test("Should send ERC20 tokens", async () => {
      // valid
      const operation = new SendOperation(
        mockBlockchain,
        "0x2d00000000000000000000000000000000000000",
        BigInt(1),
        mockRecipient,
      );

      const summary = await mcnAccount.estimate(operation);
      const executable: ExecutableOperation = summary.getExecutable();

      await mcnAccount.execute(summary);
      await expect(executable.status).toEqual(DONE_STATUS);
    });
  });
  
  describe("Invalid Operations EVM", () => {
    test("should not create a send operation with a value of -1", async () => {
      // invalid
      const operation = new SendOperation(
        mockBlockchain,
        mockAssetId,
        BigInt(-1),
        mockRecipient,
      );

      const summary = await mcnAccount.estimate(operation);
      await expect(mcnAccount.execute(summary)).rejects.toThrow(
        'unsigned value cannot be negative (fault="overflow", operation="getUint", value=-1, code=NUMERIC_FAULT, version=6.7.1)',
      );
    });

    test("should not create a send operation with a value bigger than balance", async () => {
      // invalid
      const operation = new SendOperation(
        mockBlockchain,
        mockAssetId,
        EXCESSIVE_AMOUNT,
        mockRecipient,
      );

      const summary = await mcnAccount.estimate(operation);
      await expect(mcnAccount.execute(summary)).rejects.toThrow(
        "missing funds to perform operation: Send",
      );
    });

    test("Should not send ERC20 tokens", async () => {
      // invalid
      const operation = new SendOperation(
        mockBlockchain,
        SocotraEUROC1AssetId,
        EXCESSIVE_AMOUNT,
        mockRecipient,
      );

      const summary = await mcnAccount.estimate(operation);
      await expect(mcnAccount.execute(summary)).rejects.toThrow(
        "missing funds to perform operation: Send",
      );
    });
  });

  describe("Valid Operations JVM", () => {
    test("Should send JUNE on JVM chain", async () => {
      // valid
      const operation = new SendOperation(
        SocotraJVMChain,
        SocotraJUNEAssetId,
        BigInt(10000000),
        "JVM-socotra167w40pwvlrf5eg0d9t48zj6kwkaqz2xan50pal",
      );

      const summary = await mcnAccount.estimate(operation);
      const executable: ExecutableOperation = summary.getExecutable();

      await mcnAccount.execute(summary);
      await expect(executable.status).toEqual(DONE_STATUS);
    });
  });

  describe("Invalid Operations JVM", () => {
    test("Should not send more than JUNE balance on JVM chain", async () => {
      // invalid
      const operation = new SendOperation(
        SocotraJVMChain,
        SocotraJUNEAssetId,
        EXCESSIVE_AMOUNT,
        "JVM-socotra167w40pwvlrf5eg0d9t48zj6kwkaqz2xan50pal",
      );

      const summary = await mcnAccount.estimate(operation);

      await expect(mcnAccount.execute(summary)).rejects.toThrow(
        "missing funds to perform operation: Send",
      );
    });

    test("Should not send 0 JUNE on JVM chain", async () => {
      // invalid
      const operation = new SendOperation(
        SocotraJVMChain,
        SocotraJUNEAssetId,
        BigInt(0),
        "JVM-socotra167w40pwvlrf5eg0d9t48zj6kwkaqz2xan50pal",
      );

      const summary = await mcnAccount.estimate(operation);
      await expect(mcnAccount.execute(summary)).rejects.toThrow(
        "Cannot read properties of undefined (reading 'length')",
      );
    });
  });
});
