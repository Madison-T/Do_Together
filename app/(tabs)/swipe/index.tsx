// app/(tabs)/swipe/index.tsx
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { GestureHandlerRootView, PanGestureHandler } from 'react-native-gesture-handler';
import Animated, {
  interpolate,
  runOnJS,
  useAnimatedGestureHandler,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';

import SwipeCard from '../../../components/swipeCard'; // ← corrected import
import { useAuth } from '../../../contexts/AuthContext';
import { useGroupContext } from '../../../contexts/GroupContext';
import { addVote } from '../../../hooks/useFirestore';

// ─── 50 UNIQUE HEX COLORS ─────────────────────────────────────────────────────
const COLORS = [
  '#FF6633', '#FFB399', '#FF33FF', '#FFFF99', '#00B3E6',
  '#E6B333', '#3366E6', '#999966', '#99FF99', '#B34D4D',
  '#80B300', '#809900', '#E6B3B3', '#6680B3', '#66991A',
  '#FF99E6', '#CCFF1A', '#FF1A66', '#E6331A', '#33FFCC',
  '#66994D', '#B366CC', '#4D8000', '#B33300', '#CC80CC',
  '#66664D', '#991AFF', '#E666FF', '#4DB3FF', '#1AB399',
  '#E666B3', '#33991A', '#CC9999', '#B3B31A', '#00E680',
  '#4D8066', '#809980', '#E6FF80', '#1AFF33', '#999933',
  '#FF3380', '#CCCC00', '#66E64D', '#4D80CC', '#9900B3',
  '#E64D66', '#4DB380', '#FF4D4D', '#99E6E6', '#6666FF'
];
type Card = { id: number; color: string };

export default function SwipeScreen() {
  const [cards, setCards] = useState<Card[]>(
    () => COLORS.map((c, i) => ({ id: i + 1, color: c }))
  );

  const router = useRouter();
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      {
        rotate: `${interpolate(
          translateX.value,
          [-300, 0, 300],
          [-15, 0, 15]
        )}deg`,
      },
    ],
  }));

  const { user } = useAuth();
  const { groupId } = useGroupContext();

  const removeTopCard = async (direction: 'yes' | 'no') => {
    if (user && groupId && cards.length) {
      const cardId = cards[0].id.toString();
      await addVote(cardId, groupId, user.uid, direction);
    }
    setCards(prev => prev.slice(1));
    translateX.value = 0;
    translateY.value = 0;
    router.push('/history');
  };

  const gestureHandler = useAnimatedGestureHandler({
    onStart: (_, ctx: any) => {
      ctx.startX = translateX.value;
      ctx.startY = translateY.value;
    },
    onActive: (event, ctx: any) => {
      translateX.value = ctx.startX + event.translationX;
      translateY.value = ctx.startY + event.translationY;
    },
    onEnd: event => {
      const SWIPE_THRESHOLD = 120;
      if (Math.abs(event.translationX) > SWIPE_THRESHOLD) {
        const dir: 'yes' | 'no' = event.translationX > 0 ? 'yes' : 'no';
        runOnJS(removeTopCard)(dir);
      } else {
        translateX.value = withSpring(0);
        translateY.value = withSpring(0);
      }
    },
  });

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <View style={styles.container}>
        {cards
          .map((card, idx) => {
            const isTop = idx === 0;
            return (
              <PanGestureHandler
                key={card.id}
                onGestureEvent={gestureHandler}
                enabled={isTop}
              >
                <Animated.View
                  style={[styles.cardContainer, isTop && animatedStyle]}
                >
                  <SwipeCard
                    backgroundColor={card.color}
                    id={card.id}
                  />
                </Animated.View>
              </PanGestureHandler>
            );
          })
          .reverse()}
      </View>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  cardContainer: {
    position: 'absolute',
    width: 300,
    height: 400,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

