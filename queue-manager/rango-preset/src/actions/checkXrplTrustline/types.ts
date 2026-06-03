import type { ProxiedNamespace } from '@arthur2079/wallets-core';
import type { XRPLActions } from '@arthur2079/wallets-core/namespaces/xrpl';

export type XrplNamespace = ProxiedNamespace<XRPLActions>;
export type TargetToken = {
  currency: string;
  account: string;
  amount: string;
};
