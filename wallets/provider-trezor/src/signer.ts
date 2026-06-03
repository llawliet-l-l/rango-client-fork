import type { SignerFactory } from 'rango-types';

import { dynamicImportWithRefinedError } from '@arthur2079/wallets-shared';
import { DefaultSignerFactory, TransactionType as TxType } from 'rango-types';

export default async function getSigners(): Promise<SignerFactory> {
  const signers = new DefaultSignerFactory();
  const { EthereumSigner } = await dynamicImportWithRefinedError(
    async () => await import('./signers/ethereum.js')
  );
  signers.registerSigner(TxType.EVM, new EthereumSigner());
  return signers;
}
