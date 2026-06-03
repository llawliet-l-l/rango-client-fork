import type {
  ProviderAPI,
  StarknetActions,
} from '@arthur2079/wallets-core/namespaces/starknet';

import { ChangeAccountSubscriberBuilder } from '@arthur2079/wallets-core/namespaces/common';
import { utils } from '@arthur2079/wallets-core/namespaces/starknet';
// Hooks
export const changeAccountSubscriber = (getInstance: () => ProviderAPI) =>
  new ChangeAccountSubscriberBuilder<string[], ProviderAPI, StarknetActions>()
    .getInstance(getInstance)

    .onSwitchAccount((event) => {
      if (!event.payload.length) {
        event.preventDefault();
      }
    })
    .format(async (_, accounts) => utils.formatAccountsToCAIP(accounts))
    .addEventListener((instance, callback) => {
      instance.on('accountsChanged', callback);
    })
    .removeEventListener((instance, callback) => {
      instance.off('accountsChanged', callback);
    });

export const starknetBuilders = { changeAccountSubscriber };
