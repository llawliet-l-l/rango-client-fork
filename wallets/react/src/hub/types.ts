import type {
  CommonNamespaces,
  FindProxiedNamespace,
  ProviderMetadata,
} from '@arthur2079/wallets-core';

export type AllProxiedNamespaces = FindProxiedNamespace<
  keyof CommonNamespaces,
  CommonNamespaces
>;

export type ExtensionLink = keyof ProviderMetadata['extensions'];
