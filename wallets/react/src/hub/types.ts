import type { FindProxiedNamespace, ProviderMetadata } from '@hub3js/core';
import type { EvmActions } from '@hub3js/evm';
import type { SolanaActions } from '@hub3js/solana';
import type { CosmosActions } from '@rango-dev/wallets-core/namespaces/cosmos';
import type { StarknetActions } from '@rango-dev/wallets-core/namespaces/starknet';
import type { StellarActions } from '@rango-dev/wallets-core/namespaces/stellar';
import type { SuiActions } from '@rango-dev/wallets-core/namespaces/sui';
import type { TonActions } from '@rango-dev/wallets-core/namespaces/ton';
import type { TronActions } from '@rango-dev/wallets-core/namespaces/tron';
import type { UtxoActions } from '@rango-dev/wallets-core/namespaces/utxo';
import type { XRPLActions } from '@rango-dev/wallets-core/namespaces/xrpl';

export interface CommonNamespaces {
  evm: EvmActions;
  solana: SolanaActions;
  cosmos: CosmosActions;
  sui: SuiActions;
  utxo: UtxoActions;
  tron: TronActions;
  starknet: StarknetActions;
  xrpl: XRPLActions;
  ton: TonActions;
  stellar: StellarActions;
}

export type AllProxiedNamespaces = FindProxiedNamespace<
  keyof CommonNamespaces,
  CommonNamespaces
>;

export type ExtensionLink = keyof ProviderMetadata['extensions'];
