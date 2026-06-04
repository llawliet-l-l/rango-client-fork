import type { ProviderAPI } from '@arthur2079/wallets-core/namespaces/evm';
import type { SignerFactory } from 'rango-types';

import { dynamicImportWithRefinedError } from '@arthur2079/wallets-shared';
import { DefaultSignerFactory, TransactionType as TxType } from 'rango-types';

export default async function getSigners(
  provider: ProviderAPI
): Promise<SignerFactory> {
  const signers = new DefaultSignerFactory();
  const { DefaultEvmSigner } = await dynamicImportWithRefinedError(
    async () => await import('@arthur2079/signer-evm')
  );
  signers.registerSigner(TxType.EVM, new DefaultEvmSigner(provider));
  return signers;
}
