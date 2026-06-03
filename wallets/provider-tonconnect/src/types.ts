import type { LegacyNetworks } from '@arthur2079/wallets-core/legacy';
import type {
  TonConnectUI,
  TonConnectUiOptionsWithManifest,
} from '@tonconnect/ui';

export type Environments = TonConnectUiOptionsWithManifest;

type ProviderObject = {
  [LegacyNetworks.TON]: TonConnectUI;
};

export type Provider = Map<
  keyof ProviderObject,
  ProviderObject[keyof ProviderObject]
>;
