import { JRC20ContractAdapter } from '../solidity'
import { JRC20Asset } from './asset'
import { PlatformBlockchain, JVMBlockchain, JEVMBlockchain } from './chain'
import { MCN, PrimarySupernet, StakeConfig } from './network'

export const NativeAssetBalanceContract: string = '0x0100000000000000000000000000000000000001'
export const NativeAssetCallContract: string = '0x0100000000000000000000000000000000000002'

const SocotraAddress: string = 'https://api.socotra-test.network:9650'

export const SocotraJUNEAssetId: string = '2RcLCZTsxSnvzeBvtrjRo8PCzLXuecHBoyr8DNp1R8ob8kHkbR'
export const SocotraETH1AssetId: string = 'JeUvxJPXoL3EtVGSPwtyYXVymxGbpcBcaa2Kq7TCB43HsKMAS'
export const SocotraMBTC1AssetId: string = '2pLiXK8pUNqS9DHTKpkiex6g6DRdSfxqJCoZsLM3zq62WtFje3'
export const SocotraDOGE1AssetId: string = '2PR1Dn3w6QUcvVAsb2UTw7F6khcVBjC68SLgyW6MdoqtpaE7ox'
export const SocotraTUSD1AssetId: string = 'saRTCAtLBo4d3WvJT3ibJmv9dpn3oQQ8gXgkB8ADsQwiFJh6L'
export const SocotraUSDT1AssetId: string = '2TBXB5U2rqPWqebfvjvXJNu27vig6s5mCgkdLYBJzE6jXnrNso'
export const SocotraDAI1AssetId: string = '2vq3K3PxumUV7Uf9PgPoBfr1y8MDjAtMDRex8yTqYzfyrtVJJU'
export const SocotraEUROC1AssetId: string = '2NQFaeBwMcACKqsKqMoLzYmVAHMYeFREfYJq6dtQnsJ5tTyk42'
export const SocotraLTC1AssetId: string = '2REm6DRSgbVyE4dypnzBU9WWUV4zW9VcsTMHiDha7GLV84ZXCy'
export const SocotraXLM1AssetId: string = '25revVW7o2DgkhQPTkbGLNxscS6G9Mj6eTu7PCgKvzw3HM7pJv'
export const SocotraBCH1AssetId: string = '2sC7LPyJguMWdJztKGUa35ABj7KRh1WSNQThLWhdxhJJwGdhv2'
export const SocotraPAXG1AssetId: string = 'VKJNVVGFPWwrpbYtdGanMhTdScZrRYWbgE1JVqzj2YGnU8ewv'
export const SocotraICP1AssetId: string = 'HiNZ8RV33htiXovM2P66DZADWyHuRyEwcyRYJcB8ivNMvsqP1'
export const SocotraXIDR1AssetId: string = 'bvyN7nY8NFpQc7BGQEfFRaBu9Wqj53NpDb9GZ2raAxsuN9GP5'
export const SocotraXSGD1AssetId: string = '2BvFezbxtuztCGJbGvz8Dx7woKqMLeZNZ6C6assFMFwGVcCpaH'
export const SocotraETC1AssetId: string = '3sPY2qNyaGop5JNLaSr8GtWHrimtMMkYifACSRVZNKEyZowBg'
export const SocotraR1000AssetId: string = 'G3mH67ubqNAJB6txHTHFtFzH56ynrhd2ynJrUk6RjT9iBzXbK'
export const SocotraR10AssetId: string = 'tDxKdhyn2b9dNLMdsSv3xEY8ihGf7991XSWxXMzWu1bLtAued'

export const SocotraPlatformChain: PlatformBlockchain = new PlatformBlockchain(
  'Platform-Chain', '11111111111111111111111111111111LpoYY', SocotraJUNEAssetId, ['P']
)
export const SocotraJVMChain: JVMBlockchain = new JVMBlockchain(
  'JVM-Chain', '2RyfCyJ6ieAtwVpUD8a3Yb9fUbGLabQr8RBUEyDeStUAPfjNL6', SocotraJUNEAssetId, ['JVM']
)
export const SocotraJUNEChain: JEVMBlockchain = new JEVMBlockchain(
  'JUNE-Chain', 'oyx3MBFhTdrEnn2NxS6tmgh1GEjDhY9fDmGEUqeGND5BEwUHm', SocotraJUNEAssetId, BigInt(220001), SocotraAddress, ['JUNE'], [
    new JRC20Asset('0x2d00000000000000000000000000000000000000', 'Ethereum', 'ETH.e', 9, SocotraETH1AssetId),
    new JRC20Asset('0x2e00000000000000000000000000000000000000', 'mBitcoin', 'mBTC.a', 9, SocotraMBTC1AssetId),
    new JRC20Asset('0x2f00000000000000000000000000000000000000', 'Doge', 'DOGE.b', 9, SocotraDOGE1AssetId),
    new JRC20Asset('0x3000000000000000000000000000000000000000', 'TrueUSD', 'TUSD.e', 9, SocotraTUSD1AssetId),
    new JRC20Asset('0x3100000000000000000000000000000000000000', 'Tether USD', 'USDT.e', 9, SocotraUSDT1AssetId),
    new JRC20Asset('0x3200000000000000000000000000000000000000', 'Dai', 'DAI.e', 9, SocotraDAI1AssetId),
    new JRC20Asset('0x3300000000000000000000000000000000000000', 'Euro Coin', 'EUROC.e', 9, SocotraEUROC1AssetId),
    new JRC20Asset('0x3400000000000000000000000000000000000000', 'Litecoin', 'LTC.b', 9, SocotraLTC1AssetId),
    new JRC20Asset('0x3500000000000000000000000000000000000000', 'Stellar', 'XLM.x', 9, SocotraXLM1AssetId),
    new JRC20Asset('0x3600000000000000000000000000000000000000', 'Bitcoin Cash', 'BCH.b', 9, SocotraBCH1AssetId),
    new JRC20Asset('0x3700000000000000000000000000000000000000', 'Pax Gold', 'PAXG.e', 9, SocotraPAXG1AssetId),
    new JRC20Asset('0x3800000000000000000000000000000000000000', 'Internet Computer', 'ICP.x', 9, SocotraICP1AssetId),
    new JRC20Asset('0x3900000000000000000000000000000000000000', 'XIDR', 'XIDR.e', 9, SocotraXIDR1AssetId),
    new JRC20Asset('0x3a00000000000000000000000000000000000000', 'XSGD', 'XSGD.e', 9, SocotraXSGD1AssetId),
    new JRC20Asset('0x3b00000000000000000000000000000000000000', 'Ethereum Classic', 'ETC.x', 9, SocotraETC1AssetId),
    new JRC20Asset('0x3c00000000000000000000000000000000000000', 'R1000', 'R1000.a', 9, SocotraR1000AssetId),
    new JRC20Asset('0x3d00000000000000000000000000000000000000', 'R10', 'R10.a', 9, SocotraR10AssetId)
  ]
)
export const SocotraETH1Chain: JEVMBlockchain = new JEVMBlockchain(
  'ETH1-Chain', 'fqxdvHoxBciiVa7wAZjq48HYmFVyQefrDpPyVuPd5GAUHAjEN', SocotraETH1AssetId, BigInt(220002), SocotraAddress, ['ETH1']
)
export const SocotraMBTC1Chain: JEVMBlockchain = new JEVMBlockchain(
  'MBTC1-Chain', '2c2z3duV8XJhkZHedp19WTBtKEpkfG5BAcvKdL8tbjSgH8uj2o', SocotraMBTC1AssetId, BigInt(220003), SocotraAddress, ['MBTC1']
)
export const SocotraDOGE1Chain: JEVMBlockchain = new JEVMBlockchain(
  'DOGE1-Chain', 'wb8QNS3zrwd94Mc1o7L2mqhL8CQiRAvkVLTXFkdnbX1LaESpn', SocotraDOGE1AssetId, BigInt(220004), SocotraAddress, ['DOGE1']
)
export const SocotraTUSD1Chain: JEVMBlockchain = new JEVMBlockchain(
  'TUSD1-Chain', '2691pZxz1tU1mHQ6wDqzwCrVASnZ8K4GumhZs8a2teSEdVncMU', SocotraTUSD1AssetId, BigInt(220005), SocotraAddress, ['TUSD1']
)
export const SocotraUSDT1Chain: JEVMBlockchain = new JEVMBlockchain(
  'USDT1-Chain', 'xNScMRJEmvx8A34Df2gQkTSjLMqWDcPbaPYfPYJRuf1cjLHLM', SocotraUSDT1AssetId, BigInt(220006), SocotraAddress, ['USDT1']
)
export const SocotraDAI1Chain: JEVMBlockchain = new JEVMBlockchain(
  'DAI1-Chain', 'XgN1Q8XeEuj9SU5UtM2LtNWsufgrz6amVs8BwGcJZM7ZuarNq', SocotraDAI1AssetId, BigInt(220007), SocotraAddress, ['DAI1']
)
export const SocotraEUROC1Chain: JEVMBlockchain = new JEVMBlockchain(
  'EUROC1-Chain', '2biwSVXZ8KMkwJbYnC4M6khf759pgr49ZPL4M1k8zvYjeQmG82', SocotraEUROC1AssetId, BigInt(220008), SocotraAddress, ['EUROC1']
)
export const SocotraLTC1Chain: JEVMBlockchain = new JEVMBlockchain(
  'LTC1-Chain', 'fawNQXm5Q8AzyvuvASN1NfvYuqqmvr55WQeD8ZibJz6Q12WP4', SocotraLTC1AssetId, BigInt(220009), SocotraAddress, ['LTC1']
)
export const SocotraXLM1Chain: JEVMBlockchain = new JEVMBlockchain(
  'XLM1-Chain', '2deaJGmohHKGJNeeCc76AdBpjxYgGQvqg7egYFnrUTm8PLKihd', SocotraXLM1AssetId, BigInt(220010), SocotraAddress, ['XLM1']
)
export const SocotraBCH1Chain: JEVMBlockchain = new JEVMBlockchain(
  'BCH1-Chain', '29n3FwMYBxUGtH97BeheVfr2HTxmK2u8XvCuWyaHSKMmMeisVv', SocotraBCH1AssetId, BigInt(220011), SocotraAddress, ['BCH1']
)
export const SocotraPAXG1Chain: JEVMBlockchain = new JEVMBlockchain(
  'PAXG1-Chain', 'SRPjwo4SgDKFAonPLy9mmYzVRNAv5o8nUJ1GyMJ9S3ojr87bW', SocotraPAXG1AssetId, BigInt(220012), SocotraAddress, ['PAXG1']
)
export const SocotraICP1Chain: JEVMBlockchain = new JEVMBlockchain(
  'ICP1-Chain', '2t2xzE2d1A1GRzX6oX1HrRTAFoh7BEMyLk3mu2VuDzhDXqpxFm', SocotraICP1AssetId, BigInt(220013), SocotraAddress, ['ICP1']
)
export const SocotraXIDR1Chain: JEVMBlockchain = new JEVMBlockchain(
  'XIDR1-Chain', '2EtXarWUkB4FaQHyEAEFKemMDYMitQxR6yKEjUz1dvA4mxq4hq', SocotraXIDR1AssetId, BigInt(220014), SocotraAddress, ['XIDR1']
)
export const SocotraXSGD1Chain: JEVMBlockchain = new JEVMBlockchain(
  'XSGD1-Chain', '2u5LruuaCVuJ8qbasjZNh4ZKMhX96hFT3jQZvnvSCtY9faVViN', SocotraXSGD1AssetId, BigInt(220015), SocotraAddress, ['XSGD1']
)
export const SocotraETC1Chain: JEVMBlockchain = new JEVMBlockchain(
  'ETC1-Chain', '2T2erzcpLjaeiYqFX7HWG6EenkR3vpk6pdY1HLEZmK4P9UJ8xS', SocotraETC1AssetId, BigInt(220016), SocotraAddress, ['ETC1']
)
export const SocotraR1000Chain: JEVMBlockchain = new JEVMBlockchain(
  'R1000-Chain', '2eWMraHV8fMZmCGcHTcS8aurRWXcyrerWYooJZm6PE5ayLhYnh', SocotraR1000AssetId, BigInt(220017), SocotraAddress, ['R1000']
)
export const SocotraR10Chain: JEVMBlockchain = new JEVMBlockchain(
  'R10-Chain', '4KZj9sbft2PT2yZCoS7ntSxhnSsw3Jjwv8xDmD2thmgLmQ8W3', SocotraR10AssetId, BigInt(220018), SocotraAddress, ['R10']
)

export const SocotraPrimarySupernet: PrimarySupernet = new PrimarySupernet('11111111111111111111111111111111LpoYY', [
  SocotraPlatformChain, SocotraJVMChain, SocotraJUNEChain, SocotraETH1Chain, SocotraMBTC1Chain,
  SocotraDOGE1Chain, SocotraTUSD1Chain, SocotraUSDT1Chain, SocotraDAI1Chain, SocotraEUROC1Chain,
  SocotraLTC1Chain, SocotraXLM1Chain, SocotraBCH1Chain, SocotraPAXG1Chain, SocotraICP1Chain,
  SocotraXIDR1Chain, SocotraXSGD1Chain, SocotraETC1Chain, SocotraR1000Chain, SocotraR10Chain
], SocotraPlatformChain, SocotraJVMChain)

export const SocotraStakeConfig: StakeConfig = new StakeConfig(
  // 80%, 1, 100000, 0.01, 1 day, 365 days
  0.8, 1_000000000, 1000000_000000000, 10000000, 24 * 3600, 365 * 24 * 3600
)
export const SocotraNetwork: MCN = new MCN(SocotraAddress, 2, 'socotra', SocotraStakeConfig, SocotraPrimarySupernet)

export const BelgradeJUNEAssetId: string = 'dcND1oFSYQBKvLhsfJgFnLPnKuWntXY34GQdYRffThZbfZ7JD'
export const BelgradeUSDC1AssetId: string = 'f2aFbTdjMLPeLTbi8EzqjJwx95zF9jhdG4zQ6JWRgTAmihCZv'
export const BelgradeBUSD1AssetId: string = '2h4isjyZaNpKf5qFt5gBfAZGXcWRVgUqVaNYE9LRFNrF4rqKwx'
export const BelgradeEUROC1AssetId: string = '2dBT199DhU99qgohAbG1oYM9PuGoAy6xPpBJ4EUDhPpCKyF7n3'
export const BelgradePAXG1AssetId: string = 'XP39Jfa56x33U269ejiKgP6XZ5GXkMZX5m7ZR63u3gDSZVShs'
export const BelgradeMBTC1AssetId: string = 'tFA26E4syGj9KEyA3hZemp7qMaQ6KqBB4h4M4Y9xRmxQ18zuX'

const BelgradeAddress: string = 'https://api1.mcnpoc4.xyz:9650'
const RelayChainName: string = 'Relay-Chain'
const RelayChainId: string = '11111111111111111111111111111111LpoYY'
export const BelgradeRelayChain: PlatformBlockchain = new PlatformBlockchain(RelayChainName, RelayChainId, BelgradeJUNEAssetId, ['Relay'])
export const BelgradeJVMChain: JVMBlockchain = new JVMBlockchain('JVM-Chain', 'PMarXk9qgoRszKv5zLsH7F66m8FetM2AiUk2NjYcwTiZJ3S7q', BelgradeJUNEAssetId, ['Asset'])
export const BelgradeJUNEChain: JEVMBlockchain = new JEVMBlockchain('JUNE-Chain', '21Fsdh9v1PGLey87GVLnkH89icNzLWrgn3CH1vL6Tb7J7hu5w5',
  BelgradeJUNEAssetId, BigInt(330001), BelgradeAddress, ['JUNE'], [
    new JRC20Asset('0x2d00000000000000000000000000000000000000', 'USD Coin', 'USDC.e', 9, BelgradeUSDC1AssetId),
    new JRC20Asset('0x2e00000000000000000000000000000000000000', 'BUSD', 'BUSD.b', 9, BelgradeBUSD1AssetId),
    new JRC20Asset('0x2f00000000000000000000000000000000000000', 'Euro Coin', 'EUROC.e', 9, BelgradeEUROC1AssetId),
    new JRC20Asset('0x3000000000000000000000000000000000000000', 'Pax Gold', 'PAXG.e', 9, BelgradePAXG1AssetId),
    new JRC20Asset('0x3100000000000000000000000000000000000000', 'mBitcoin', 'mBTC.a', 9, BelgradeMBTC1AssetId)
  ]
)
BelgradeJUNEChain.contractHandler.registerAdapter(new JRC20ContractAdapter(BelgradeJUNEChain.ethProvider))
export const BelgradeUSDC1Chain: JEVMBlockchain = new JEVMBlockchain('USDC1-Chain', '2q7wRN9B835BxcpkAtiyaYqF9SDrKY9wPmkq6osNjxrTccZViq',
  BelgradeUSDC1AssetId, BigInt(330002), BelgradeAddress, ['USDC1'])
export const BelgradeBUSD1Chain: JEVMBlockchain = new JEVMBlockchain('BUSD1-Chain', '2Pg3FsDKyPKTMH179zN6vQN9248gqcqLAx2dvasxjqKZ8oCePX',
  BelgradeBUSD1AssetId, BigInt(330003), BelgradeAddress, ['BUSD1'])
export const BelgradeEUROC1Chain: JEVMBlockchain = new JEVMBlockchain('EUROC1-Chain', 'v1Kt7z7GAjsfJzHF7r2UPXWCpEF6U7wQaGmKyzHSBZeYmpCvH',
  BelgradeEUROC1AssetId, BigInt(330004), BelgradeAddress, ['EUROC1'])
export const BelgradePAXG1Chain: JEVMBlockchain = new JEVMBlockchain('PAXG1-Chain', 'r3YpRNgLLXJBPbihK23us9MnJ3Jcncz2gCUbuzWrw1LyhtFBD',
  BelgradePAXG1AssetId, BigInt(330005), BelgradeAddress, ['PAXG1'])
export const BelgradeMBTC1Chain: JEVMBlockchain = new JEVMBlockchain('mBTC1-Chain', 'uvSeFKmQG1H7J1Zd4obsdqr2YNEtR397htc6pVUZdHFnkoEf5',
  BelgradeMBTC1AssetId, BigInt(330006), BelgradeAddress, ['mBTC1'])

export const BelgradePrimarySupernet: PrimarySupernet = new PrimarySupernet('11111111111111111111111111111111LpoYY',
  [BelgradeRelayChain, BelgradeJVMChain, BelgradeJUNEChain, BelgradeUSDC1Chain, BelgradeBUSD1Chain, BelgradeEUROC1Chain, BelgradePAXG1Chain, BelgradeMBTC1Chain],
  BelgradeRelayChain, BelgradeJVMChain
)

export const BelgradeStakeConfig: StakeConfig = new StakeConfig(
  // 80%, 100, 45000, 0.01, 14 days, 365 days
  0.8, 100_000000000, 45000_000000000, 10000000, 2 * 7 * 24 * 3600, 365 * 24 * 3600
)

export const BelgradeNetwork: MCN = new MCN(BelgradeAddress, 1, 'june', BelgradeStakeConfig, BelgradePrimarySupernet)
export const TestNetwork: MCN = SocotraNetwork
// TODO Update when mainnet is online
export const MainNetwork: MCN = TestNetwork
