import type { LegacyNetworks } from '@arthur2079/wallets-core/legacy';
import type { ProviderAPI as StarknetProviderAPI } from '@arthur2079/wallets-core/namespaces/starknet';

export type ProviderObject = {
  [LegacyNetworks.STARKNET]: StarknetProviderAPI;
};
export type Provider = Map<
  keyof ProviderObject,
  ProviderObject[keyof ProviderObject]
>;
