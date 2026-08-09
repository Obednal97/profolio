import "server-only";
import { z } from "zod";
import {
  NotificationPriority,
  NotificationType,
  type Prisma,
} from "@prisma/client";
import { prisma } from "@/server/db";
import { requireUser } from "@/server/auth/session";
import { NotFound } from "@/server/http/errors";
import { blankable } from "@/server/http/zod";

/**
 * In-app notifications.
 *
 * Every query is scoped to the caller. The NestJS service relied on
 * `update({ where: { id, userId } })` for that, which Prisma accepts but which
 * throws a record-not-found error rather than returning a clean 404; the reads
 * here filter first and report a missing row properly.
 */

export const NotificationQuerySchema = z
  .object({
    isRead: blankable(z.enum(["true", "false"])),
    type: blankable(z.enum(NotificationType)),
    priority: blankable(z.enum(NotificationPriority)),
    limit: z.coerce.number().int().min(1).max(100).default(50),
    offset: z.coerce.number().int().min(0).default(0),
  })
  .strict();
export type NotificationQuery = z.infer<typeof NotificationQuerySchema>;

export const NotificationIdSchema = z.object({ id: z.uuid() }).strict();

export async function listNotifications(query: NotificationQuery) {
  const user = await requireUser();

  const where: Prisma.NotificationWhereInput = {
    userId: user.id,
    ...(query.isRead !== undefined ? { isRead: query.isRead === "true" } : {}),
    ...(query.type ? { type: query.type } : {}),
    ...(query.priority ? { priority: query.priority } : {}),
  };

  const [notifications, totalCount, unreadCount] = await Promise.all([
    prisma.notification.findMany({
      where,
      orderBy: [{ priority: "desc" }, { createdAt: "desc" }],
      take: query.limit,
      skip: query.offset,
    }),
    prisma.notification.count({ where }),
    prisma.notification.count({ where: { userId: user.id, isRead: false } }),
  ]);

  return {
    notifications,
    totalCount,
    unreadCount,
    hasMore: query.offset + notifications.length < totalCount,
  };
}

export async function getUnreadCount() {
  const user = await requireUser();

  return {
    count: await prisma.notification.count({
      where: { userId: user.id, isRead: false },
    }),
  };
}

export async function markAsRead(id: string) {
  const user = await requireUser();

  const existing = await prisma.notification.findFirst({
    where: { id, userId: user.id },
    select: { id: true },
  });
  if (!existing) throw new NotFound("Notification not found");

  return prisma.notification.update({
    where: { id },
    data: { isRead: true, readAt: new Date() },
  });
}

export async function markAllAsRead() {
  const user = await requireUser();

  const result = await prisma.notification.updateMany({
    where: { userId: user.id, isRead: false },
    data: { isRead: true, readAt: new Date() },
  });

  return { success: true as const, updated: result.count };
}

export async function deleteNotification(id: string) {
  const user = await requireUser();

  const existing = await prisma.notification.findFirst({
    where: { id, userId: user.id },
    select: { id: true },
  });
  if (!existing) throw new NotFound("Notification not found");

  await prisma.notification.delete({ where: { id } });

  return { success: true as const };
}

/** Clears the ones already read, leaving anything still unread. */
export async function deleteReadNotifications() {
  const user = await requireUser();

  const result = await prisma.notification.deleteMany({
    where: { userId: user.id, isRead: true },
  });

  return { success: true as const, deleted: result.count };
}

/**
 * Raises a notification for a user. Server-side only - there is no route for
 * it, because a user creating their own notifications is not a feature.
 */
export async function createNotification(input: {
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  data?: Prisma.InputJsonValue;
  priority?: NotificationPriority;
}) {
  return prisma.notification.create({
    data: {
      userId: input.userId,
      type: input.type,
      title: input.title,
      message: input.message,
      data: input.data ?? {},
      priority: input.priority ?? "NORMAL",
    },
  });
}
