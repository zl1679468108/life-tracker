import React, { useEffect, useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { appDesign, borderRadius, fontSize, fontWeight, spacing } from '../constants/theme';
import { AppAlertRequest, setAlertHandler } from '../lib/alert';
import { useColors } from '../stores/themeStore';

export function AppAlertHost() {
  const colors = useColors();
  const palette = colors.gray[50] === appDesign.dark.bg ? appDesign.dark : appDesign.light;
  const [request, setRequest] = useState<AppAlertRequest | null>(null);

  useEffect(() => {
    setAlertHandler(setRequest);
    return () => setAlertHandler(null);
  }, []);

  const close = () => setRequest(null);

  return (
    <Modal visible={!!request} transparent animationType="fade" onRequestClose={close}>
      <View style={[styles.scrim, { backgroundColor: palette.scrim }]}>
        <View style={[styles.dialog, { backgroundColor: palette.surface, borderColor: palette.border }]}>
          <Text style={[styles.title, { color: palette.text }]}>{request?.title}</Text>
          {!!request?.message && <Text style={[styles.message, { color: palette.textMuted }]}>{request.message}</Text>}
          <View style={styles.actions}>
            {request?.buttons.map((button, index) => {
              const destructive = button.style === 'destructive';
              const cancel = button.style === 'cancel';
              return (
                <Pressable
                  key={`${button.text}-${index}`}
                  style={[
                    styles.button,
                    {
                      backgroundColor: destructive ? palette.danger : cancel ? palette.surfaceSoft : palette.orange,
                      borderColor: cancel ? palette.border : 'transparent',
                    },
                  ]}
                  onPress={async () => {
                    close();
                    await button.onPress?.();
                  }}
                >
                  <Text style={[styles.buttonText, { color: cancel ? palette.textSecondary : '#FFFFFF' }]}>{button.text}</Text>
                </Pressable>
              );
            })}
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  scrim: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  dialog: {
    width: '100%',
    maxWidth: 340,
    borderWidth: 1,
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
  },
  title: {
    fontSize: fontSize['2xl'],
    lineHeight: 24,
    fontWeight: fontWeight.bold,
  },
  message: {
    fontSize: fontSize.base,
    lineHeight: 20,
    marginTop: spacing.sm,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: spacing.sm,
    marginTop: spacing.lg,
  },
  button: {
    minWidth: 88,
    minHeight: 44,
    borderWidth: 1,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.md,
  },
  buttonText: {
    fontSize: fontSize.base,
    lineHeight: 18,
    fontWeight: fontWeight.semiBold,
  },
});
