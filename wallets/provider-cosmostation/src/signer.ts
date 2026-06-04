import type { Provider } from './types.js';
import type { SignerFactory } from 'rango-types';

import {
  dynamicImportWithRefinedError,
  getNetworkInstance,
  Networks,
} from '@arthur2079/wallets-shared';
import { DefaultSignerFactory, TransactionType } from 'rango-types';

export default async function getSigners(
  provider: Provider
): Promise<SignerFactory> {
  const cosmosProvider = getNetworkInstance(provider, Networks.COSMOS);
  const evmProvider = getNetworkInstance(provider, Networks.ETHEREUM);
  const signers = new DefaultSignerFactory();
  const { DefaultCosmosSigner } = await dynamicImportWithRefinedError(
    async () => await import('@arthur2079/signer-cosmos')
  );
  const { DefaultEvmSigner } = await dynamicImportWithRefinedError(
    async () => await import('@arthur2079/signer-evm')
  );

  signers.registerSigner(
    TransactionType.EVM,
    new DefaultEvmSigner(evmProvider)
  );

  signers.registerSigner(
    TransactionType.COSMOS,
    new DefaultCosmosSigner(cosmosProvider)
  );
  return signers;
}
