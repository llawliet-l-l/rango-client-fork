import type { LegacyNetworks } from '@arthur2079/wallets-core/legacy';
import type { ProviderAPI } from '@arthur2079/wallets-core/namespaces/evm';

export type ProviderObject = {
  [LegacyNetworks.ETHEREUM]: ProviderAPI;
};
export type Provider = Map<
  keyof ProviderObject,
  ProviderObject[keyof ProviderObject]
>;
