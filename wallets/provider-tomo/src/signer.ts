import type { LegacyNetworkProviderMap } from '@arthur2079/wallets-core/legacy';
import type { SignerFactory } from 'rango-types';

import {
  dynamicImportWithRefinedError,
  getNetworkInstance,
  Networks,
} from '@arthur2079/wallets-shared';
import { DefaultSignerFactory, TransactionType as TxType } from 'rango-types';

export default async function getSigners(
  provider: LegacyNetworkProviderMap
): Promise<SignerFactory> {
  const ethProvider = getNetworkInstance(provider, Networks.ETHEREUM);
  const signers = new DefaultSignerFactory();
  const { DefaultEvmSigner } = await dynamicImportWithRefinedError(
    async () => await import('@arthur2079/signer-evm')
  );
  signers.registerSigner(TxType.EVM, new DefaultEvmSigner(ethProvider));
  return signers;
}
