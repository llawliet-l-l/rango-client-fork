import type { SignerFactory } from 'rango-types';

import {
  type LegacyNetworkProviderMap,
  LegacyNetworks,
} from '@arthur2079/wallets-core/legacy';
import {
  dynamicImportWithRefinedError,
  getNetworkInstance,
} from '@arthur2079/wallets-shared';
import { DefaultSignerFactory, TransactionType as TxType } from 'rango-types';

export default async function getSigners(
  provider: LegacyNetworkProviderMap
): Promise<SignerFactory> {
  const tronProvider = getNetworkInstance(provider, LegacyNetworks.TRON);
  const signers = new DefaultSignerFactory();
  const { DefaultTronSigner } = await dynamicImportWithRefinedError(
    async () => await import('@arthur2079/signer-tron')
  );
  signers.registerSigner(TxType.TRON, new DefaultTronSigner(tronProvider));
  return signers;
}
