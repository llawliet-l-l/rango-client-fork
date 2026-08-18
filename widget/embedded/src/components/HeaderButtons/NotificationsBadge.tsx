import { EventSeverity } from '@arthur2079/queue-manager-rango-preset';
import { Typography } from '@arthur2079/ui';
import React from 'react';

import { useNotificationStore } from '../../store/notification';

import { NotificationsBadgeContainer } from './HeaderButtons.styles';

export function NotificationsBadge() {
  const { getNotifications } = useNotificationStore();

  const notificationsList = getNotifications();

  const notificationsCount = notificationsList.length;

  const hasSeverNotification = !!notificationsList.find(
    (notificationItem) =>
      notificationItem.event.messageSeverity === EventSeverity.WARNING
  );

  return notificationsCount ? (
    <NotificationsBadgeContainer isSever={hasSeverNotification}>
      <Typography
        variant="body"
        size="xsmall"
        color="$background"
        id="widget-header-notifications-badge-container">
        {notificationsCount}
      </Typography>
    </NotificationsBadgeContainer>
  ) : null;
}
