export const ERC20ABI: string[] = [
  'function name() view returns (string)',
  'function decimals() view returns (uint8)',
  'function symbol() view returns (string)',
  'function totalSupply() view returns (uint256)',
  'function balanceOf(address owner) view returns (uint256)',
  'function allowance(address owner, address spender) view returns (uint256)',
  'function transfer(address to, uint amount) returns (bool)',
  'function approve(address spender, uint256 amount) returns (bool)',
  'function transferFrom(address from, address to, uint256 amount) returns (bool)',
  'event Transfer(address indexed from, address indexed to, uint256 value)',
  'event Approval(address indexed owner, address indexed spender, uint256 value)'
]

export const JRC20ABI: string[] = ERC20ABI.concat([
  'function deposit()',
  'function withdraw(uint256 value)',
  'function totalNativeSupply() view returns (uint256)',
  'function nativeAssetId() view returns (uint256)'
])

export const WrappedABI: string[] = ERC20ABI.concat([
  'function deposit() payable',
  'function withdraw(uint wad)',
  'event Deposit(address indexed dst, uint wad)',
  'event Withdrawal(address indexed src, uint wad)'
])

export const AuctionABI: string[] = ['function redeemAuction(uint256 auctionId)']

export const StreamABI: string[] = [
  'function withdrawFromStream(uint256 streamId, uint256 amount) returns (bool)',
  'function cancelStream(uint256 streamId) returns (bool)'
]
