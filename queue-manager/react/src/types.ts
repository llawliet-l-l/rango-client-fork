import type { Manager } from '@arthur2079/queue-manager-core';

export type ManagerContext = Manager | undefined;
export type ManagerState = {
  loadedFromPersistor: boolean;
};
