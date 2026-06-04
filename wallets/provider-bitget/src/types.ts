import type { LegacyNetworks } from '@arthur2079/wallets-core/legacy';
import type { ProviderAPI as EvmProviderApi } from '@arthur2079/wallets-core/namespaces/evm';
import type { ProviderAPI as TronProviderApi } from '@arthur2079/wallets-core/namespaces/tron';
import type { ProviderAPI as UtxoProviderApi } from '@arthur2079/wallets-core/namespaces/utxo';

export type ProviderObject = {
  [LegacyNetworks.ETHEREUM]: EvmProviderApi;
  [LegacyNetworks.TRON]: TronProviderApi;
  [LegacyNetworks.BTC]: UtxoProviderApi;
};
export type Provider = Map<
  keyof ProviderObject,
  ProviderObject[keyof ProviderObject]
>;

export type TronChangeAccountEvent = {
  isBitkeep: boolean;
  message: {
    action: string;
    data: {
      address: string;
    };
  };
};
