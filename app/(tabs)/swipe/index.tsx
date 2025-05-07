// SwipeScreen.tsx

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

import SwipeCard from '../../../components/swipeCard';
import { auth } from '../../../firebaseConfig';
import { addVote } from '../../../hooks/useFirestore';

const COLORS = [
  "#FF8A80", "#EA80FC", "#8C9EFF", "#80D8FF", "#A7FFEB",
  "#FFD180", "#FFFF8D", "#CCFF90", "#A7FFEB", "#80D8FF",
  "#8C9EFF", "#B388FF", "#EA80FC", "#FF8A80", "#FF80AB",
  "#FF9E80", "#FFE57F", "#D4E157", "#80CBC4", "#4DB6AC",
  "#64B5F6", "#7986CB", "#9575CD", "#BA68C8", "#F06292",
  "#E57373", "#FF8A65", "#FFD54F", "#DCE775", "#AED581",
  "#4DB6AC", "#4FC3F7", "#7986CB", "#9575CD", "#BA68C8",
  "#F06292", "#E57373", "#FF8A65", "#FFD54F", "#DCE775",
  "#AED581", "#80CBC4", "#4FC3F7", "#7986CB", "#9575CD",
  "#BA68C8", "#F06292", "#E57373", "#FF8A65", "#FFD54F",
];

// We tag each card with an id 1–50 so we can store it in Firestore
type Card = { id: number; color: string };
const initialCards: Card[] = COLORS.map((c, i) => ({ id: i + 1, color: c }));

export default function SwipeScreen() {
  const [cards, setCards] = useState<Card[]>(initialCards);
  const router = useRouter();

  // Animated values
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);

  // Style binding for the top card
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

  // Called on swipe end (via runOnJS)
  const removeTopCard = async (direction: 'yes' | 'no') => {
    const user = auth.currentUser;
    if (user && cards.length) {
      const cardId = cards[0].id.toString();
      // Use the card's ID as the vote document ID:
      await addVote(cardId, 'defaultGroup', user.uid, direction);
    }
    // Remove it from local deck & reset animation
    setCards(prev => prev.slice(1));
    translateX.value = 0;
    translateY.value = 0;
    // Go show history
    router.push('/history');
  };

  // Gesture handling
  const gestureHandler = useAnimatedGestureHandler({
    onStart: (_, ctx: any) => {
      ctx.startX = translateX.value;
      ctx.startY = translateY.value;
    },
    onActive: (event, ctx: any) => {
      translateX.value = ctx.startX + event.translationX;
      translateY.value = ctx.startY + event.translationY;
    },
    onEnd: (event) => {
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
                  style={[
                    styles.cardContainer,
                    isTop && animatedStyle,
                  ]}
                >
                  <SwipeCard backgroundColor={card.color} />
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
