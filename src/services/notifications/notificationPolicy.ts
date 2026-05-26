export interface NotificationPreferences {
  enabled: boolean;
  mentionsOnly: boolean;
  doNotDisturb: boolean;
  workHoursOnly: boolean;
  mutedRoomIds: string[];
  mutedProjectIds: string[];
}

export function shouldDeliverNotification(
  preferences: NotificationPreferences,
  event: { type: string; roomId?: string; projectId?: string; isMention?: boolean }
) {
  if (!preferences.enabled || preferences.doNotDisturb) return false;
  if (event.roomId && preferences.mutedRoomIds.includes(event.roomId)) return false;
  if (event.projectId && preferences.mutedProjectIds.includes(event.projectId)) return false;
  if (preferences.mentionsOnly && !event.isMention) return false;
  return true;
}
