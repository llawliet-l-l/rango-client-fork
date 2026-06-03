import type { LegacyNetworks } from '@arthur2079/wallets-core/legacy';
import type { ProviderAPI as EvmProviderApi } from '@arthur2079/wallets-core/namespaces/evm';

export type EnkryptEvmProvider = EvmProviderApi & {
  selectedAddress: string;
};
export type ProviderObject = {
  [LegacyNetworks.ETHEREUM]: EnkryptEvmProvider;
};
export type Provider = Map<
  keyof ProviderObject,
  ProviderObject[keyof ProviderObject]
>;
