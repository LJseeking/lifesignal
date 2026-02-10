export const ERC20_ABI = [
  {
    name: "symbol",
    type: "function",
    stateMutability: "view",
    inputs: [],
    outputs: [{ type: "string" }],
  },
  {
    name: "decimals",
    type: "function",
    stateMutability: "view",
    inputs: [],
    outputs: [{ type: "uint8" }],
  },
  {
    name: "balanceOf",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "account", type: "address" }],
    outputs: [{ type: "uint256" }],
  },
  {
    name: "allowance",
    type: "function",
    stateMutability: "view",
    inputs: [
      { name: "owner", type: "address" },
      { name: "spender", type: "address" },
    ],
    outputs: [{ type: "uint256" }],
  },
  {
    name: "approve",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [
      { name: "spender", type: "address" },
      { name: "amount", type: "uint256" },
    ],
    outputs: [{ type: "bool" }],
  },
  {
    name: "Transfer",
    type: "event",
    anonymous: false,
    inputs: [
      { indexed: true, name: "from", type: "address" },
      { indexed: true, name: "to", type: "address" },
      { indexed: false, name: "value", type: "uint256" },
    ],
  },
] as const;

export const ENERGY_VAULT_ABI = [
  {
    name: "charge",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [{ name: "tokenAmount", type: "uint256" }],
    outputs: [],
  },
  {
    name: "quoteEnergyCredit",
    type: "function",
    stateMutability: "pure",
    inputs: [{ name: "tokenAmount", type: "uint256" }],
    outputs: [{ type: "uint256" }],
  },
  {
    name: "CREDIT_PER_TOKEN",
    type: "function",
    stateMutability: "view",
    inputs: [],
    outputs: [{ type: "uint256" }],
  },
  {
    name: "token",
    type: "function",
    stateMutability: "view",
    inputs: [],
    outputs: [{ type: "address" }],
  },
  {
    name: "treasury",
    type: "function",
    stateMutability: "view",
    inputs: [],
    outputs: [{ type: "address" }],
  },
  {
    name: "EnergyCharged",
    type: "event",
    anonymous: false,
    inputs: [
      { indexed: true, name: "user", type: "address" },
      { indexed: false, name: "tokenAmount", type: "uint256" },
      { indexed: false, name: "energyCredit", type: "uint256" },
    ],
  },
] as const;
