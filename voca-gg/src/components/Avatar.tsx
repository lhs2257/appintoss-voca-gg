import React from 'react';
import { View, Text } from 'react-native';

interface AvatarProps {
  name: string;
  color: string;
  size?: number;
}

export function Avatar({ name, color, size = 32 }: AvatarProps) {
  const initial = name ? name.charAt(0).toUpperCase() : '?';
  const fontSize = Math.round(size * 0.44);

  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: color,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Text
        style={{
          fontSize,
          fontWeight: '800',
          color: '#FFFFFF',
          lineHeight: size,
          includeFontPadding: false,
          textAlignVertical: 'center',
        }}
      >
        {initial}
      </Text>
    </View>
  );
}
