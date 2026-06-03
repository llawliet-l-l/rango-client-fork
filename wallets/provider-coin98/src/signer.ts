import type { LegacyNetworkProviderMap } from '@arthur2079/wallets-core/legacy';
import type { SignerFactory } from 'rango-types';

import {
  dynamicImportWithRefinedError,
  getNetworkInstance,
  Networks,
} from '@arthur2079/wallets-shared';
import { DefaultSignerFactory, TransactionType as TxType } from 'rango-types';

import { Coin98SolanaSigner } from './signers/solana.js';

export default async function getSigners(
  provider: LegacyNetworkProviderMap
): Promise<SignerFactory> {
  const ethProvider = getNetworkInstance(provider, Networks.ETHEREUM);
  const solProvider = getNetworkInstance(provider, Networks.SOLANA);
  const signers = new DefaultSignerFactory();
  const { DefaultEvmSigner } = await dynamicImportWithRefinedError(
    async () => await import('@arthur2079/signer-evm')
  );
  signers.registerSigner(TxType.EVM, new DefaultEvmSigner(ethProvider));
  signers.registerSigner(TxType.SOLANA, new Coin98SolanaSigner(solProvider));
  return signers;
}
