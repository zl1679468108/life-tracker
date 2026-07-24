import { BadRequestException } from '@nestjs/common';

type OwnedRow = { user_id?: string | null } | null | undefined;

export type OwnedResourceLabels = {
  notFound: string;
  systemForbidden: string;
  forbidden: string;
};

/**
 * 断言资源为当前用户自有（非系统预设、非他人数据）。
 * 用于分类 / 位置等「系统预设 user_id IS NULL」资源。
 */
export function assertUserOwnedResource(
  existing: OwnedRow,
  userId: string,
  labels: OwnedResourceLabels,
): asserts existing is { user_id: string } {
  if (!existing) {
    throw new BadRequestException(labels.notFound);
  }
  if (!existing.user_id) {
    throw new BadRequestException(labels.systemForbidden);
  }
  if (existing.user_id !== userId) {
    throw new BadRequestException(labels.forbidden);
  }
}
