export const ENERGY_VAULT_ABI = [
  {
    inputs: [{ name: "tokenAmount", type: "uint256" }],
    name: "charge",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ name: "tokenAmount", type: "uint256" }],
    name: "quoteEnergyCredit",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "pure",
    type: "function",
  },
  {
    inputs: [],
    name: "token",
    outputs: [{ name: "", type: "address" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "treasury",
    outputs: [{ name: "", type: "address" }],
    stateMutability: "view",
    type: "function",
  },
] as const;
