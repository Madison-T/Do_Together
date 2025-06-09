// components/ui/AppButton.js
import React from 'react';
import { StyleSheet, Text, TouchableOpacity } from 'react-native';
import { theme } from '../../app/theme';

export default function AppButton({
  title,
  onPress,
  style = {},
  textStyle = {},
  ...props
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.8}
      style={[styles.button, style]}
      {...props}
    >
      <Text style={[styles.text, textStyle]}>
        {title}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    backgroundColor: theme.colors.primary,
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.lg,
    borderRadius: 6,
    alignItems: 'center',
  },
  text: {
    ...theme.typography.body,
    color: '#fff',
  },
});
