/**
 * 时间转换工具
 * 规范：前端发送北京时间，后端存储 UTC，返回北京时间
 */

/**
 * 将北京时间字符串转为 UTC ISO 字符串（存储用）
 * 前端发送的格式如 "2026-06-23T20:42:00" 或 "2026-06-23 20:42:00"（无时区）
 */
export function toUtcIso(beijingTimeStr: string): string {
  if (!beijingTimeStr) return beijingTimeStr;
  const d = new Date(beijingTimeStr);
  // 无时区信息时，JS 按服务器本地时区解析，需手动减去 8 小时偏移
  if (!beijingTimeStr.includes('+') && !beijingTimeStr.includes('Z')) {
    return new Date(d.getTime() - 8 * 3600 * 1000).toISOString();
  }
  return d.toISOString();
}

/**
 * 将 UTC ISO 字符串转为北京时间字符串（返回给前端用）
 */
export function toBeijingTime(utcStr: string): string {
  if (!utcStr) return utcStr;
  const d = new Date(utcStr);
  if (isNaN(d.getTime())) return utcStr;
  return new Date(d.getTime() + 8 * 3600 * 1000).toISOString().replace('Z', '+08:00');
}

/**
 * 将数据库返回的记录中的时间字段转为北京时间
 */
export function convertTimesToBeijing(record: any): any {
  if (!record) return record;
  const timeFields = [
    'created_at',
    'updated_at',
    'due_date',
    'reminder_date',
    'expiry_date',
    'purchase_date',
    'borrow_date',
    'expected_return_date',
    'actual_return_date',
    'sent_at',
    'recorded_at',
    'responded_at',
    'last_read_at',
    'last_message_at',
  ];
  const result = { ...record };
  for (const field of timeFields) {
    if (result[field]) {
      result[field] = toBeijingTime(result[field]);
    }
  }
  return result;
}
