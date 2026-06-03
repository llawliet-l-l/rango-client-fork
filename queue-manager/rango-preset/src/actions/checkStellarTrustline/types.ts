import type { ProxiedNamespace } from '@arthur2079/wallets-core';
import type { StellarActions } from '@arthur2079/wallets-core/namespaces/stellar';

export type StellarNamespace = ProxiedNamespace<StellarActions>;
export type TargetToken = {
  code: string;
  issuer: string;
  value: string;
};
