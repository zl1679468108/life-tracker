/** MaterialCommunityIcons 选项（分类 / 位置管理共用） */

export const CATEGORY_ICON_OPTIONS = [
  'laptop', 'book-open-variant', 'shopping', 'tshirt-crew', 'food-apple',
  'car', 'home', 'gift', 'briefcase', 'palette',
  'music', 'camera', 'dumbbell', 'bike', 'headphones',
  'wallet', 'key-variant', 'medal', 'star', 'coffee',
  'flower', 'dog', 'baby-carriage', 'football', 'guitar',
  'tag', 'heart', 'diamond-stone', 'lightning-bolt', 'leaf',
  'puzzle', 'rocket-launch', 'shield-check', 'snowflake', 'fire',
] as const;

export const LOCATION_ICON_OPTIONS = [
  'book-open-variant', 'bed', 'sofa', 'pot-steam', 'bag-personal-outline',
  'home', 'office-building', 'warehouse', 'garage', 'castle',
  'floor-plan', 'door-open', 'stairs', 'elevator-passenger', 'shower-head',
  'washing-machine', 'fridge', 'microwave', 'stove', 'dishwasher',
  'map-marker', 'car', 'bike', 'train', 'airplane',
  'school', 'hospital-building', 'store', 'church', 'basketball',
  'swim', 'tennis', 'soccer', 'pool', 'tent',
] as const;

export type CategoryIconName = (typeof CATEGORY_ICON_OPTIONS)[number];
export type LocationIconName = (typeof LOCATION_ICON_OPTIONS)[number];
