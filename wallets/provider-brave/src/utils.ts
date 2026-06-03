import type { Provider } from './types.js';
import type { ProviderAPI as EvmProviderApi } from '@arthur2079/wallets-core/namespaces/evm';
import type { ProviderAPI as SolanaProviderApi } from '@arthur2079/wallets-core/namespaces/solana';

import { LegacyNetworks } from '@arthur2079/wallets-core/legacy';

export function brave(): Provider | null {
  const { braveEthereum, braveSolana } = window;
  if (!braveEthereum || !braveSolana) {
    return null;
  }
  const instances: Provider = new Map();
  if (braveEthereum) {
    instances.set(LegacyNetworks.ETHEREUM, braveEthereum);
  }
  if (braveSolana) {
    instances.set(LegacyNetworks.SOLANA, braveSolana);
  }

  return instances;
}

export function getInstanceOrThrow(): Provider {
  const instances = brave();

  if (!instances) {
    throw new Error('Brave Wallet is not injected. Please check your wallet.');
  }

  return instances;
}

export function evmBrave(): EvmProviderApi {
  const instances = brave();

  const evmInstance = instances?.get(LegacyNetworks.ETHEREUM);

  if (!evmInstance) {
    throw new Error(
      'Brave Wallet not injected or EVM not enabled. Please check your wallet.'
    );
  }

  return evmInstance as EvmProviderApi;
}

export function solanaBrave(): SolanaProviderApi {
  const instance = brave();
  const solanaInstance = instance?.get(LegacyNetworks.SOLANA);

  if (!solanaInstance) {
    throw new Error(
      'Brave Wallet not injected or Solana not enabled. Please check your wallet.'
    );
  }

  return solanaInstance as SolanaProviderApi;
}
