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
} from "../../../src/index";
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

  // fetch all balances before tests
  beforeAll(async () => {
    (account as EVMAccount).registerAssets(SocotraJUNEChain.registeredAssets);
    mcnAccount.getAccount(SocotraEUROC1Chain.id);
    mcnAccount.getAccount(SocotraJVMChain.id);
    mcnAccount.getAccount(SocotraPlatformChain.id);
    await account.fetchAllBalances();
  });

  beforeEach(() => {
    mockSourceBlockchain = SocotraJUNEChain;
    mockDestinationBlockchain = SocotraEUROC1Chain;
    mockAssetId = "0x3300000000000000000000000000000000000000";
    mockValue = BigInt(1000);
  });

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
    await expect(executable.status).toEqual("Done");
  }, 10000);

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
      BigInt(100000000000000000000000000000000000000000000000),
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
      BigInt(100000000000000000000000000000000000000000000000),
    );

    const summary = await mcnAccount.estimate(operation);
    await expect(mcnAccount.execute(summary)).rejects.toThrow(
      "missing funds to perform operation: Cross",
    );
  });

  test("Should cross Native to ERC20", async () => {
    // valid
    const operation = new CrossOperation(
      SocotraEUROC1Chain,
      SocotraJUNEChain,
      SocotraEUROC1AssetId,
      BigInt(100000000000000),
    );
    const summary = await mcnAccount.estimate(operation);
    const executable: ExecutableOperation = summary.getExecutable();

    await mcnAccount.execute(summary);
    await expect(executable.status).toEqual("Done");
  }, 10000);

  test("Should cross JUNE chain to JVM chain", async () => {
    // valid
    const operation = new CrossOperation(
      SocotraJUNEChain,
      SocotraJVMChain,
      SocotraJUNEAssetId,
      BigInt(1000000000000),
    );
    const summary = await mcnAccount.estimate(operation);
    const executable: ExecutableOperation = summary.getExecutable();

    await mcnAccount.execute(summary);
    await expect(executable.status).toEqual("Done");
  });

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
    await expect(executable.status).toEqual("Done");
  });

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
    await expect(executable.status).toEqual("Done");
  });

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
    await expect(executable.status).toEqual("Done");
  });

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
    await expect(executable.status).toEqual("Done");
  });

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
    await expect(executable.status).toEqual("Done");
  });
});
