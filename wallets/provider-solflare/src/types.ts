import type { LegacyNetworks } from '@arthur2079/wallets-core/legacy';
import type { ProviderAPI as SolanaProviderApi } from '@arthur2079/wallets-core/namespaces/solana';

export type ProviderObject = {
  [LegacyNetworks.SOLANA]: SolanaProviderApi;
};
export type Provider = Map<
  keyof ProviderObject,
  ProviderObject[keyof ProviderObject]
>;
