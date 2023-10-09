import * as dotenv from "dotenv";
import {
  Blockchain,
  ChainAccount,
  CrossOperation,
  EVMAccount,
  ExecutableOperation,
  MCNAccount,
  MCNProvider,
  MCNWallet,
  SocotraEUROC1AssetId,
  SocotraEUROC1Chain,
  SocotraJUNEAssetId,
  SocotraJUNEChain,
  SocotraJVMChain,
  SocotraPlatformChain,
} from "../../../src";
dotenv.config();

describe("Cross Operations", () => {
  let mockSourceBlockchain: Blockchain;
  let mockDestinationBlockchain: Blockchain;
  let mockAssetId: string;
  let mockValue: bigint;
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
    (account as EVMAccount).fetchAllChainBalances()
    mcnAccount.getAccount(SocotraEUROC1Chain.id);
    mcnAccount.getAccount(SocotraJVMChain.id);
    mcnAccount.getAccount(SocotraPlatformChain.id);
  });

  beforeEach(async () => {
    mockSourceBlockchain = SocotraJUNEChain;
    mockDestinationBlockchain = SocotraEUROC1Chain;
    mockAssetId = "0x3300000000000000000000000000000000000000";
    mockValue = BigInt(1000);
    await mcnAccount.fetchChainsBalances()
  });

  describe("Valid Operations EVM", () => {
    test("should correctly create a CrossOperation instance", async () => {
      // valid
      const operation = new CrossOperation(
        mockSourceBlockchain,
        mockDestinationBlockchain,
        mockAssetId,
        mockValue,
      );

      // Verify that the instance has the correct properties
      expect(operation.source).toEqual(mockSourceBlockchain);
      expect(operation.assetId).toEqual(mockAssetId);
    });

    test("should perform the cross operation correctly", async () => {
      // valid
      const operation = new CrossOperation(
        mockSourceBlockchain,
        mockDestinationBlockchain,
        mockAssetId,
        mockValue,
      );

      const summary = await mcnAccount.estimate(operation);
      const executable: ExecutableOperation = summary.getExecutable();

      await mcnAccount.execute(summary);
      await expect(executable.status).toEqual(DONE_STATUS);
    }, 15000);

    test("Should cross Native to ERC20", async () => {
      // valid
      const operation = new CrossOperation(
        SocotraEUROC1Chain,
        SocotraJUNEChain,
        SocotraEUROC1AssetId,
        BigInt(10000000000000),
      );
      const summary = await mcnAccount.estimate(operation);
      const executable: ExecutableOperation = summary.getExecutable();

      await mcnAccount.execute(summary);
      await expect(executable.status).toEqual(DONE_STATUS);
    }, 10000);

    test("Should cross JUNE chain to JVM chain", async () => {
      // valid
      const operation = new CrossOperation(
        SocotraJUNEChain,
        SocotraJVMChain,
        SocotraJUNEAssetId,
        BigInt(100000000000),
      );
      const summary = await mcnAccount.estimate(operation);
      const executable: ExecutableOperation = summary.getExecutable();

      await mcnAccount.execute(summary);
      await expect(executable.status).toEqual(DONE_STATUS);
    }, 10000);

    test("Should cross JUNE chain to Platform chain", async () => {
      // valid
      const operation = new CrossOperation(
        SocotraJUNEChain,
        SocotraPlatformChain,
        SocotraJUNEAssetId,
        BigInt(1000000000000),
      );
      const summary = await mcnAccount.estimate(operation);
      const executable: ExecutableOperation = summary.getExecutable();

      await mcnAccount.execute(summary);
      await expect(executable.status).toEqual(DONE_STATUS);
    }, 10000);

    test("Should cross Platform chain to JUNE chain ", async () => {
      // valid
      const operation = new CrossOperation(
        SocotraPlatformChain,
        SocotraJUNEChain,
        SocotraJUNEAssetId,
        BigInt(1000000),
      );
      const summary = await mcnAccount.estimate(operation);
      const executable: ExecutableOperation = summary.getExecutable();

      await mcnAccount.execute(summary);
      await expect(executable.status).toEqual(DONE_STATUS);
    }, 10000);

    test("Should cross Platform chain to JVM chain", async () => {
      // valid
      const operation = new CrossOperation(
        SocotraPlatformChain,
        SocotraJVMChain,
        SocotraJUNEAssetId,
        BigInt(1000000),
      );
      const summary = await mcnAccount.estimate(operation);
      const executable: ExecutableOperation = summary.getExecutable();

      await mcnAccount.execute(summary);
      await expect(executable.status).toEqual(DONE_STATUS);
    }, 10000);

    test("Should cross JVM chain to Platform chain", async () => {
      // valid
      const operation = new CrossOperation(
        SocotraJVMChain,
        SocotraPlatformChain,
        SocotraJUNEAssetId,
        BigInt(1000000),
      );
      const summary = await mcnAccount.estimate(operation);
      const executable: ExecutableOperation = summary.getExecutable();

      await mcnAccount.execute(summary);
      await expect(executable.status).toEqual(DONE_STATUS);
    }, 10000);

    test("Should cross JVM chain to JUNE chain", async () => {
      // valid
      const operation = new CrossOperation(
        SocotraJVMChain,
        SocotraJUNEChain,
        SocotraJUNEAssetId,
        BigInt(1000000),
      );
      const summary = await mcnAccount.estimate(operation);
      const executable: ExecutableOperation = summary.getExecutable();

      await mcnAccount.execute(summary);
      await expect(executable.status).toEqual(DONE_STATUS);
    }, 10000);
  });

  describe("Invalid Operations", () => {
    test("should not create a cross operation with a value of -1", async () => {
      // invalid
      const operation = new CrossOperation(
        mockSourceBlockchain,
        mockDestinationBlockchain,
        mockAssetId,
        BigInt(-1),
      );

      const summary = await mcnAccount.estimate(operation);
      await expect(mcnAccount.execute(summary)).rejects.toThrow(
        "user input amount must be greater than 0",
      );
    });

    test("should not create a cross operation with a value bigger than balance", async () => {
      // invalid
      const operation = new CrossOperation(
        mockSourceBlockchain,
        mockDestinationBlockchain,
        mockAssetId,
        EXCESSIVE_AMOUNT,
      );

      const summary = await mcnAccount.estimate(operation);
      await expect(mcnAccount.execute(summary)).rejects.toThrow(
        "missing funds to perform operation: Cross",
      );
    });

    test("Should not cross ERC20 tokens", async () => {
      // invalid
      const operation = new CrossOperation(
        mockSourceBlockchain,
        mockDestinationBlockchain,
        SocotraEUROC1AssetId,
        EXCESSIVE_AMOUNT,
      );

      const summary = await mcnAccount.estimate(operation);
      await expect(mcnAccount.execute(summary)).rejects.toThrow(
        "missing funds to perform operation: Cross",
      );
    }, 10000);

    test("Should not cross JUNE chain to JUNE chain", async () => {
      // invalid
      const operation = new CrossOperation(
        SocotraJUNEChain,
        SocotraJUNEChain,
        SocotraJUNEAssetId,
        EXCESSIVE_AMOUNT,
      );

      // for this one I got this error : missing funds to perform operation: Cross
    }, 10000);

    test("Should not cross 0 from JUNE chain to JVM chain", async () => {
      // invalid
      const operation = new CrossOperation(
        SocotraJUNEChain,
        SocotraJVMChain,
        SocotraJUNEAssetId,
        BigInt(0),
      );

      const summary = await mcnAccount.estimate(operation);
      await expect(mcnAccount.execute(summary)).rejects.toThrow(
        "user input amount must be greater than 0",
      );
    }, 10000);

    test("Should not cross 0 from JUNE chain to Platform chain", async () => {
      // invalid
      const operation = new CrossOperation(
        SocotraJUNEChain,
        SocotraPlatformChain,
        SocotraJUNEAssetId,
        BigInt(0),
      );

      const summary = await mcnAccount.estimate(operation);
      await expect(mcnAccount.execute(summary)).rejects.toThrow(
        "user input amount must be greater than 0",
      );
    }, 10000);

    test("Should not cross 0 from JVM chain to JUNE chain", async () => {
      // invalid
      const operation = new CrossOperation(
        SocotraJVMChain,
        SocotraJUNEChain,
        SocotraJUNEAssetId,
        BigInt(0),
      );

      const summary = await mcnAccount.estimate(operation);
      await expect(mcnAccount.execute(summary)).rejects.toThrow(
        "user input amount must be greater than 0",
      );
    }, 10000);

    test("Should not cross 0 from JVM chain to Platform chain", async () => {
      // invalid
      const operation = new CrossOperation(
        SocotraJVMChain,
        SocotraPlatformChain,
        SocotraJUNEAssetId,
        BigInt(0),
      );

      const summary = await mcnAccount.estimate(operation);
      await expect(mcnAccount.execute(summary)).rejects.toThrow(
        "user input amount must be greater than 0",
      );
    }, 10000);

    test("Should not cross 0 from Platform chain to JUNE chain", async () => {
      // invalid
      const operation = new CrossOperation(
        SocotraPlatformChain,
        SocotraJUNEChain,
        SocotraJUNEAssetId,
        BigInt(0),
      );

      const summary = await mcnAccount.estimate(operation);
      await expect(mcnAccount.execute(summary)).rejects.toThrow(
        "user input amount must be greater than 0",
      );
    }, 10000);

    test("Should not cross 0 from Platform chain to JVM chain", async () => {
      // invalid
      const operation = new CrossOperation(
        SocotraPlatformChain,
        SocotraJVMChain,
        SocotraJUNEAssetId,
        BigInt(0),
      );

      const summary = await mcnAccount.estimate(operation);
      await expect(mcnAccount.execute(summary)).rejects.toThrow(
        "user input amount must be greater than 0",
      );
    }, 10000);

  });
});
