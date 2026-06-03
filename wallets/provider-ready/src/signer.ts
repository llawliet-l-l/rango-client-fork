import type { Provider } from './types.js';
import type { SignerFactory } from 'rango-types';

import { LegacyNetworks } from '@arthur2079/wallets-core/legacy';
import {
  dynamicImportWithRefinedError,
  getNetworkInstance,
} from '@arthur2079/wallets-shared';
import { DefaultSignerFactory, TransactionType } from 'rango-types';

export default async function getSigners(
  provider: Provider
): Promise<SignerFactory> {
  const signers = new DefaultSignerFactory();
  const starknetProvider = getNetworkInstance(
    provider,
    LegacyNetworks.STARKNET
  );

  const { DefaultStarknetSigner } = await dynamicImportWithRefinedError(
    async () => await import('@arthur2079/signer-starknet')
  );
  signers.registerSigner(
    TransactionType.STARKNET,
    new DefaultStarknetSigner(starknetProvider)
  );
  return signers;
}
