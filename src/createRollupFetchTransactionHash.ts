import { Address, PublicClient, Transport, Chain } from 'viem';
import { AbiEvent } from 'abitype';

import { validateParentChain } from './types/ParentChain';
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

export type CreateRollupFetchTransactionHashParams<TChain extends Chain | undefined> = {
  rollup: Address;
  publicClient: PublicClient<Transport, TChain>;
};

const RollupInitializedEventAbi: AbiEvent = {
  anonymous: false,
  inputs: [
    {
      indexed: false,
      internalType: 'bytes32',
      name: 'machineHash',
      type: 'bytes32',
    },
    {
      indexed: false,
      internalType: 'uint256',
      name: 'chainId',
      type: 'uint256',
    },
  ],
  name: 'RollupInitialized',
  type: 'event',
};

const earliestRollupCreatorDeploymentBlockNumber = {
  // mainnet L1
  [mainnet.id]: 18736164n,
  // mainnet L2
  [arbitrumOne.id]: 150599584n,
  [arbitrumNova.id]: 47798739n,
  [base.id]: 12978604n,
  // testnet L1
  [sepolia.id]: 4741823n,
  [holesky.id]: 1118493n,
  [berachainTestnetbArtio.id]: 3901860n,
  // testnet L2
  [arbitrumSepolia.id]: 654628n,
  [baseSepolia.id]: 10606961n,
};

export async function createRollupFetchTransactionHash<TChain extends Chain | undefined>({
  rollup,
  publicClient,
}: CreateRollupFetchTransactionHashParams<TChain>) {
  const chainId = validateParentChain(publicClient);

  console.log(`createRollupFetchTransactionHash: chainId = ${chainId}`);

  // This code does not seem to work well
  // const fromBlock =
  //   chainId in earliestRollupCreatorDeploymentBlockNumber
  //     ? earliestRollupCreatorDeploymentBlockNumber[chainId]
  //     : 'earliest';

  var found = false;
  for (const key in earliestRollupCreatorDeploymentBlockNumber) {
    if (chainId.toString() == key) {
      found = true;
      break;
    }
  }
  const fromBlock = found ? earliestRollupCreatorDeploymentBlockNumber[chainId] : 'earliest';

  // Find the RollupInitialized event from that Rollup contract
  var transactionHash = "" as `0x${string}`;
  if (fromBlock != 'earliest') {
    const latestBlockNumber = await publicClient.getBlockNumber();
    var rangeStart = fromBlock;
    while (rangeStart < latestBlockNumber) {
      var rangeEnd = rangeStart + BigInt(9_999);
      if (rangeEnd > latestBlockNumber) {
        rangeEnd = latestBlockNumber;
      }
      console.log(`createRollupFetchTransactionHash: getLogs from=${rangeStart} to=${rangeEnd}`);
      const rollupInitializedEvents = await publicClient.getLogs({
        address: rollup,
        event: RollupInitializedEventAbi,
        fromBlock: rangeStart,
        toBlock: rangeEnd,
      });
      if (rollupInitializedEvents.length == 0) {
        rangeStart = rangeEnd + BigInt(1);
      } else if (rollupInitializedEvents.length == 1) {
        // Get the transaction hash that emitted that event
        transactionHash = rollupInitializedEvents[0].transactionHash;
        break;
      } else {
        throw new Error(
          `Expected to find 1 RollupInitialized event for rollup address ${rollup} but found ${rollupInitializedEvents.length}`,
        );
      }
    }
  } else {
  const rollupInitializedEvents = await publicClient.getLogs({
    address: rollup,
    event: RollupInitializedEventAbi,
    fromBlock,
    toBlock: 'latest',
  });

  if (rollupInitializedEvents.length !== 1) {
    throw new Error(
      `Expected to find 1 RollupInitialized event for rollup address ${rollup} but found ${rollupInitializedEvents.length}`,
    );
  }

  // Get the transaction hash that emitted that event
  const transactionHash = rollupInitializedEvents[0].transactionHash;

  if (!transactionHash) {
    throw new Error(
      `No transactionHash found in RollupInitialized event for rollup address ${rollup}`,
    );
  }

  return transactionHash;
}
