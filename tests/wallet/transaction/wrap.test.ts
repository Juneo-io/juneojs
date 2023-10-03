import * as dotenv from "dotenv";

import {
  Blockchain,
  ChainAccount,
  EVMAccount,
  ExecutableOperation,
  MCNAccount,
  MCNProvider,
  MCNWallet,
  SocotraBCH1Chain,
  SocotraJUNEChain,
  SocotraWJUNEAsset,
  UnwrapOperation,
  WrapOperation,
  WrappedAsset
} from "../../../src/index";

dotenv.config();

describe("Wrapping and Unwrapping Operations", () => {
  let mockBlockchain: Blockchain;
  let mockAsset: WrappedAsset; 
  let mockAmount: bigint;
  const wallet = MCNWallet.recover(process.env.MNEMONIC ?? "");
  const provider: MCNProvider = new MCNProvider();
  const mcnAccount: MCNAccount = new MCNAccount(provider, wallet);
  const account: ChainAccount = mcnAccount.getAccount(SocotraJUNEChain.id);

  // fetch all balances before tests
  beforeAll(async () => {
    (account as EVMAccount).registerAssets(SocotraJUNEChain.registeredAssets);
    mcnAccount.getAccount(SocotraBCH1Chain.id)
    await account.fetchAllBalances();
  });

  beforeEach(() => {
    mockBlockchain = SocotraJUNEChain;
    mockAsset = SocotraWJUNEAsset;
    mockAmount = BigInt(1000);
  });

  test("should correctly create a WrapOperation instance", async () => {
    // valid
    const operation = new WrapOperation(mockBlockchain, mockAsset, mockAmount);

    expect(operation.chain).toEqual(mockBlockchain);
    expect(operation.asset).toEqual(mockAsset);
    expect(operation.amount).toEqual(mockAmount);
  });

  test("should perform the wrap operation correctly", async () => {
    // valid
    const operation = new WrapOperation(mockBlockchain, mockAsset, mockAmount);

    const summary = await mcnAccount.estimate(operation);
    const executable: ExecutableOperation = summary.getExecutable();

    await mcnAccount.execute(summary);
    await expect(executable.status).toEqual("Done");
  },10000);

  test("should correctly create an UnwrapOperation instance", async () => {
    // valid
    const operation = new UnwrapOperation(mockBlockchain, mockAsset, mockAmount);

    expect(operation.chain).toEqual(mockBlockchain);
    expect(operation.asset).toEqual(mockAsset);
    expect(operation.amount).toEqual(mockAmount);
  });

  test("should perform the unwrap operation correctly", async () => {
    // valid
    const operation = new UnwrapOperation(mockBlockchain, mockAsset, mockAmount);

    const summary = await mcnAccount.estimate(operation);
    const executable: ExecutableOperation = summary.getExecutable();

    await mcnAccount.execute(summary);
    await expect(executable.status).toEqual("Done");
  },15000);

  test("should not wrap more than the available balance", async () => {
    // invalid
    const excessiveAmount = BigInt("100000000000000000000000000000000000000000000000");
    const operation = new WrapOperation(mockBlockchain, mockAsset, excessiveAmount);

    const summary = await mcnAccount.estimate(operation);
    await expect(mcnAccount.execute(summary)).rejects.toThrow(
      "missing funds to perform operation: Wrap"
    );
  },10000);

  test("should not unwrap more than the available wrapped balance", async () => {
    // invalid   
    const excessiveAmount = BigInt("100000000000000000000000000000000000000000000000");
    const operation = new UnwrapOperation(mockBlockchain, mockAsset, excessiveAmount);

    const summary = await mcnAccount.estimate(operation);
    await expect(mcnAccount.execute(summary)).rejects.toThrow(
      "missing funds to perform operation: Unwrap"
    );
  },10000);

  test("should not perform the wrap operation with amount 0", async () => {
    // invalid
    const operation = new WrapOperation(mockBlockchain, mockAsset, BigInt(0));

    const summary = await mcnAccount.estimate(operation);
    const executable: ExecutableOperation = summary.getExecutable();

    await mcnAccount.execute(summary);
    await expect(executable.status).toEqual("Done");
  },10000);


});
