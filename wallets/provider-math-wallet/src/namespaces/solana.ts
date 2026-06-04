import { NamespaceBuilder } from '@arthur2079/wallets-core';
import {
  builders as commonBuilders,
  standardizeAndThrowError,
} from '@arthur2079/wallets-core/namespaces/common';
import {
  actions,
  builders,
  type SolanaActions,
} from '@arthur2079/wallets-core/namespaces/solana';

import { WALLET_ID } from '../constants.js';
import { solanaMathWallet } from '../utils.js';

const connect = builders
  .connect()
  .action(actions.connect(solanaMathWallet))
  .or(standardizeAndThrowError)
  .build();

const disconnect = commonBuilders.disconnect<SolanaActions>().build();

const solana = new NamespaceBuilder<SolanaActions>('Solana', WALLET_ID)
  .action(connect)
  .action(disconnect)
  .build();

export { solana };
