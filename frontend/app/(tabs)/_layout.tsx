import { Tabs } from 'expo-router';
import React from 'react';
import { View, StyleSheet, Text } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { layout, fontSize, fontWeight } from '../../constants/theme';
import { useColors } from '../../stores/themeStore';
import { useTodoStore } from '../../stores/todoStore';

function TabIcon({ name, color, badge, colors }: { name: string; color: string; badge?: number; colors: any }) {
  return (
    <View>
      <MaterialCommunityIcons name={name as any} size={24} color={color} />
      {badge !== undefined && badge > 0 && (
        <View style={[styles.badge, { backgroundColor: colors.danger }]}>
          <Text style={[styles.badgeText, { color: colors.white }]}>{badge > 99 ? '99+' : badge}</Text>
        </View>
      )}
    </View>
  );
}

export default function TabLayout() {
  const { todos } = useTodoStore();
  const colors = useColors();
  const pendingCount = todos.filter((t) => !t.completed).length;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.gray[400],
        tabBarStyle: [styles.tabBar, { borderTopColor: colors.gray[100], backgroundColor: colors.white }],
        tabBarLabelStyle: styles.tabLabel,
        tabBarIconStyle: styles.tabIcon,
        sceneStyle: { backgroundColor: colors.gray[50] },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: '首页',
          tabBarIcon: ({ color }) => (
            <TabIcon name="home" color={color} colors={colors} />
          ),
        }}
      />
      <Tabs.Screen
        name="items"
        options={{
          title: '物品',
          tabBarIcon: ({ color }) => (
            <TabIcon name="package-variant" color={color} colors={colors} />
          ),
        }}
      />
      <Tabs.Screen
        name="todos"
        options={{
          title: '待办',
          tabBarIcon: ({ color }) => (
            <TabIcon name="check-circle" color={color} badge={pendingCount} colors={colors} />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: '设置',
          tabBarIcon: ({ color }) => (
            <TabIcon name="cog" color={color} colors={colors} />
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    height: layout.tabBar,
    paddingTop: 8,
    borderTopWidth: 1,
  },
  tabLabel: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    marginTop: 2,
  },
  tabIcon: {
    marginBottom: 0,
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -8,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  badgeText: {
    fontSize: 9,
    fontWeight: fontWeight.bold,
  },
});
