// components/SwipeCard.tsx
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

type Props = {
  backgroundColor: string;
  id?: number;          // ← add this
};

export default function SwipeCard({ backgroundColor, id }: Props) {
  return (
    <View style={[styles.card, { backgroundColor }]}>
      {id != null && (
        <Text style={styles.idText}>#{id}</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    width: '100%',
    height: '100%',
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  idText: {
    position: 'absolute',
    top: 8,
    left: 8,
    fontSize: 18,
    color: '#fff',
    fontWeight: 'bold',
  },
});
