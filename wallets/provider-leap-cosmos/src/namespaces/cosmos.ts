import { keplrCosmosActions } from '@arthur2079/provider-keplr/lib';
import { ActionBuilder, NamespaceBuilder } from '@arthur2079/wallets-core';
import {
  builders as commonBuilders,
  standardizeAndThrowError,
} from '@arthur2079/wallets-core/namespaces/common';
import {
  builders,
  type CosmosActions,
} from '@arthur2079/wallets-core/namespaces/cosmos';

import { cosmosBuilders } from '../builders/cosmos.js';
import { WALLET_ID } from '../constants.js';
import { cosmosLeap } from '../utils.js';

const [changeAccountSubscriber, changeAccountCleanup] = cosmosBuilders
  .changeAccountSubscriber(cosmosLeap)
  .build();

const connect = builders
  .connect()
  .action(keplrCosmosActions.connect(cosmosLeap))
  .or(standardizeAndThrowError)
  .or(changeAccountCleanup)
  .before(changeAccountSubscriber)
  .build();

const suggest = new ActionBuilder<CosmosActions, 'suggest'>('suggest')
  .action(keplrCosmosActions.suggest(cosmosLeap))
  .or(standardizeAndThrowError)
  .build();

const disconnect = commonBuilders
  .disconnect<CosmosActions>()
  .before(changeAccountCleanup)
  .build();

const cosmos = new NamespaceBuilder<CosmosActions>('Cosmos', WALLET_ID)
  .action(connect)
  .action(disconnect)
  .action(suggest)
  .build();

export { cosmos };
