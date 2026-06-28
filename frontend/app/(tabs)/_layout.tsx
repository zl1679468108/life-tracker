import { Tabs } from 'expo-router';
import React from 'react';
import { View, StyleSheet, Text } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { appDesign, layout, fontSize, fontWeight } from '../../constants/theme';
import { useColors } from '../../stores/themeStore';
import { useConversationStore } from '../../stores/conversationStore';

function TabIcon({ name, color }: { name: string; color: string }) {
  return (
    <MaterialCommunityIcons name={name as any} size={24} color={color} />
  );
}

export default function TabLayout() {
  const colors = useColors();
  const conversations = useConversationStore((s) => s.conversations);
  const palette = colors.gray[50] === appDesign.dark.bg ? appDesign.dark : appDesign.light;

  // 计算总未读数
  const totalUnread = conversations.reduce((sum, c) => sum + (c.unread_count || 0), 0);

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: palette.orange,
        tabBarInactiveTintColor: palette.textMuted,
        tabBarStyle: [styles.tabBar, { borderTopColor: palette.border, backgroundColor: palette.surface }],
        tabBarLabelStyle: styles.tabLabel,
        tabBarIconStyle: styles.tabIcon,
        sceneStyle: { backgroundColor: palette.bg },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: '首页',
          tabBarIcon: ({ color }) => <TabIcon name="home" color={color} />,
        }}
      />
      <Tabs.Screen
        name="workbench"
        options={{
          title: '工作台',
          tabBarIcon: ({ color }) => <TabIcon name="grid" color={color} />,
        }}
      />
      <Tabs.Screen
        name="messages"
        options={{
          title: '消息',
          tabBarIcon: ({ color }) => (
            <View>
              <TabIcon name="message-text-outline" color={color} />
              {totalUnread > 0 && (
                <View style={[styles.badge, { backgroundColor: colors.danger }]}>
                  <Text style={[styles.badgeText, { color: colors.white }]}>
                    {totalUnread > 99 ? '99+' : totalUnread}
                  </Text>
                </View>
              )}
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: '我的',
          tabBarIcon: ({ color }) => <TabIcon name="account" color={color} />,
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
