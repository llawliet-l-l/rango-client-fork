import type { LegacyNetworks } from '@arthur2079/wallets-core/legacy';
import type { ProviderAPI as EvmProviderApi } from '@arthur2079/wallets-core/namespaces/evm';

export type ProviderObject = {
  [LegacyNetworks.ETHEREUM]: EvmProviderApi;
};
export type Provider = Map<
  keyof ProviderObject,
  ProviderObject[keyof ProviderObject]
>;
