import {
  mainnet,
  arbitrumOne,
  arbitrumNova,
  base,
  sepolia,
  holesky,
  arbitrumSepolia,
  berachainTestnetbArtio,
  baseSepolia,
} from './chains';
import { ParentChainId } from './types/ParentChain';

export function createRollupGetMaxDataSize(parentChainId: ParentChainId): bigint {
  // doing switch here to make sure it's exhaustive when checking against `ParentChainId`
  switch (parentChainId) {
    // mainnet L1
    case mainnet.id:
    // testnet L1
    case sepolia.id:
    case holesky.id:
    case berachainTestnetbArtio.id:
      return BigInt(117_964);

    // mainnet L2
    case arbitrumOne.id:
    case arbitrumNova.id:
    case base.id:
    // testnet L2
    case arbitrumSepolia.id:
    case baseSepolia.id:
      return BigInt(104_857);
  }
}
