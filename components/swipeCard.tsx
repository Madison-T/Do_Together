import { StyleSheet, Text, View } from "react-native";

export default function SwipeCard({ backgroundColor }: { backgroundColor: string }) {
  return (
    <View style={[styles.card, { backgroundColor }]}>
      <Text style={styles.text}>Swipe Me!</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    width: 300,
    height: 400,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "white", // you can also control background here
  },
  
  text: {
    color: "#fff",
    fontSize: 24,
    fontWeight: "bold",
  },
});