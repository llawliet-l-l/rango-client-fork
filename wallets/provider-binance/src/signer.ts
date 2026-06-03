import type { Provider } from './types.js';
import type { SignerFactory } from 'rango-types';

import { LegacyNetworks as Networks } from '@arthur2079/wallets-core/legacy';
import {
  dynamicImportWithRefinedError,
  getNetworkInstance,
} from '@arthur2079/wallets-shared';
import { DefaultSignerFactory, TransactionType as TxType } from 'rango-types';

export default async function getSigners(
  provider: Provider
): Promise<SignerFactory> {
  const evmProvider = getNetworkInstance(provider, Networks.ETHEREUM);
  const signers = new DefaultSignerFactory();
  const { DefaultEvmSigner } = await dynamicImportWithRefinedError(
    async () => await import('@arthur2079/signer-evm')
  );
  signers.registerSigner(TxType.EVM, new DefaultEvmSigner(evmProvider));
  return signers;
}
