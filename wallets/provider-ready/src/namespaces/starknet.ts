import type { StarknetActions } from '@arthur2079/wallets-core/namespaces/starknet';

import { NamespaceBuilder } from '@arthur2079/wallets-core';
import {
  builders as commonBuilders,
  standardizeAndThrowError,
} from '@arthur2079/wallets-core/namespaces/common';
import { actions, builders } from '@arthur2079/wallets-core/namespaces/starknet';

import { starknetActions } from '../actions/starknet.js';
import { starknetBuilders } from '../builders/starknet.js';
import { WALLET_ID } from '../constants.js';
import { starknetReady } from '../utils.js';

const [changeAccountSubscriber, changeAccountCleanup] = starknetBuilders
  .changeAccountSubscriber(starknetReady)
  .build();
const connect = builders
  .connect()
  .action(starknetActions.connect(starknetReady))
  .before(changeAccountSubscriber)
  .or(changeAccountCleanup)
  .or(standardizeAndThrowError)
  .build();

const disconnect = commonBuilders
  .disconnect<StarknetActions>()
  .after(changeAccountCleanup)
  .build();

const canEagerConnect = builders
  .canEagerConnect()
  .action(actions.canEagerConnect(starknetReady))
  .build();

const starknet = new NamespaceBuilder<StarknetActions>('Starknet', WALLET_ID)
  .action(connect)
  .action(disconnect)
  .action(canEagerConnect)
  .build();

export { starknet };
