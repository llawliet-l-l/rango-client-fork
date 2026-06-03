import type { LegacyNetworks } from '@arthur2079/wallets-core/legacy';
import type { ProviderAPI as EvmProviderApi } from '@arthur2079/wallets-core/namespaces/evm';
import type { ProviderAPI as SolanaProviderApi } from '@arthur2079/wallets-core/namespaces/solana';

export type OkxBtcAddress = {
  address: string;
  publicKey: string;
  compressedPublicKey: string;
};
export type ProviderObject = {
  [LegacyNetworks.ETHEREUM]: EvmProviderApi;
  [LegacyNetworks.SOLANA]: SolanaProviderApi;
};
export type Provider = Map<
  keyof ProviderObject,
  ProviderObject[keyof ProviderObject]
>;
