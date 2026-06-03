import type { UtxoActions } from '@arthur2079/wallets-core/namespaces/utxo';

import { ActionBuilder, NamespaceBuilder } from '@arthur2079/wallets-core';
import {
  builders as commonBuilders,
  standardizeAndThrowError,
} from '@arthur2079/wallets-core/namespaces/common';
import {
  builders,
  CAIP_ZCASH_CHAIN_ID,
  utils,
} from '@arthur2079/wallets-core/namespaces/utxo';

import { WALLET_ID } from '../../constants.js';

import { getZcashAccounts, requestZcashAccounts } from './helpers.js';

const connect = builders
  .connect()
  .action(async function () {
    const accounts = await requestZcashAccounts();

    return utils.formatAccountsToCAIP(accounts, CAIP_ZCASH_CHAIN_ID);
  })
  .or(standardizeAndThrowError)
  .build();

const canEagerConnect = new ActionBuilder<UtxoActions, 'canEagerConnect'>(
  'canEagerConnect'
)
  .action(async () => {
    const accounts = await getZcashAccounts().catch(() => []);
    return accounts.length > 0;
  })
  .build();

const disconnect = commonBuilders.disconnect<UtxoActions>().build();

export const namespace = new NamespaceBuilder<UtxoActions>('UTXO', WALLET_ID)
  .action(connect)
  .action(disconnect)
  .action(canEagerConnect)
  .build();
