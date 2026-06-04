import type { ModalPropTypes } from '@arthur2079/ui';
import type { PropsWithChildren } from 'react';

import { Modal } from '@arthur2079/ui';
import React from 'react';

import { useUiStore } from '../../../store/ui';

export function WatermarkedModal(props: PropsWithChildren<ModalPropTypes>) {
  const { watermark } = useUiStore();

  const hasWatermark = watermark === 'FULL';
  return (
    <Modal hasWatermark={hasWatermark} {...props}>
      {props.children}
    </Modal>
  );
}
