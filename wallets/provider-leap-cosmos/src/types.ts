import type { LegacyNetworks } from '@arthur2079/wallets-core/legacy';
import type { ProviderAPI as CosmosProviderApi } from '@arthur2079/wallets-core/namespaces/cosmos';

export type ProviderObject = {
  [LegacyNetworks.COSMOS]: CosmosProviderApi;
};
export type Provider = Map<
  keyof ProviderObject,
  ProviderObject[keyof ProviderObject]
>;
