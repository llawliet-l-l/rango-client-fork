import type { ProviderAPI as EvmProviderApi } from '@arthur2079/wallets-core/namespaces/evm';

import { LegacyNetworks } from '@arthur2079/wallets-core/legacy';
import { isEvmAddress } from '@arthur2079/wallets-shared';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type Provider = Record<string, any>;
export function safepal(): Provider | null {
  const { safepalProvider: safePalEvm } = window;
  if (!safePalEvm) {
    return null;
  }
  const instances = new Map();
  if (safePalEvm) {
    instances.set(LegacyNetworks.ETHEREUM, safePalEvm);
  }

  return instances;
}

export function evmSafepal(): EvmProviderApi {
  const instances = safepal();
  const evmInstance = instances?.get(LegacyNetworks.ETHEREUM);
  if (!evmInstance) {
    throw new Error(
      'Safepal not injected or EVM not enabled. Please check your wallet.'
    );
  }
  return evmInstance as EvmProviderApi;
}
export function getInstanceOrThrow(): Provider {
  const instances = safepal();

  if (!instances) {
    throw new Error('Trust Wallet is not injected. Please check your wallet.');
  }

  return instances;
}
/**
 * Return true if address is a valid EVM address.
 * Accepts:
 *  - all-lowercase or all-uppercase 0x-prefixed hex (non-checksummed - allowed)
 *  - checksummed (mixed-case according to EIP-55)
 */
export function isValidEvmAddress(address: string): boolean {
  // Pick wallet address.
  const walletAddress = address.split(':')[2];

  return isEvmAddress(walletAddress);
}
