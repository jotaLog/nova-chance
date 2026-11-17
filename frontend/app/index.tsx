import { ActivityIndicator, StyleSheet, View } from "react-native";

export default function Index() {
  return (
    <View style={styles.container}>
      <ActivityIndicator color="#3CFF00" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#000",
  },
});
