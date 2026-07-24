/** 按名称稳定哈希取头像主色，消息/对话共用 */
const AVATAR_COLORS = ['#F36F3C', '#7C5CFC', '#1E88E5', '#10A66E', '#E84A5F', '#D89400', '#8E24AA', '#43A047'];

export function avatarColor(name?: string | null): string {
  if (!name) return AVATAR_COLORS[0];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

export function avatarInitial(name?: string | null, fallback = '友'): string {
  return (name || fallback).slice(0, 1).toUpperCase();
}
