import { View, Image, StyleSheet, TouchableOpacity, FlatList, Text, Dimensions } from "react-native";

const COLORS = {
  background: "#000000",
  gray: "#9CA3AF",
};

const SCREEN_WIDTH = Dimensions.get("window").width;
const NUM_COLUMNS = 3;
const GAP = 2;
const ITEM_SIZE = (SCREEN_WIDTH - GAP * (NUM_COLUMNS - 1)) / NUM_COLUMNS;

export interface Post {
  id: string;
  imageUrl: string;
}

interface PostsProfileProps {
  posts: Post[];
  onPostPress?: (post: Post) => void;
  emptyLabel?: string;
}

export default function PostsProfile({
  posts,
  onPostPress,
  emptyLabel = "nenhuma publicação ainda",
}: PostsProfileProps) {
  if (posts.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>{emptyLabel}</Text>
      </View>
    );
  }

  return (
    <FlatList
      data={posts}
      keyExtractor={(item) => item.id}
      numColumns={NUM_COLUMNS}
      scrollEnabled={false}
      renderItem={({ item }) => (
        <TouchableOpacity
          style={styles.item}
          activeOpacity={0.8}
          onPress={() => onPostPress?.(item)}
        >
          <Image source={{ uri: item.imageUrl }} style={styles.image} />
        </TouchableOpacity>
      )}
      columnWrapperStyle={styles.row}
    />
  );
}

// Mock pra testar enquanto não tem API
export const mockPosts: Post[] = [
  { id: "1", imageUrl: "https://placehold.co/300x300/111/2ECC71?text=1" },
  { id: "2", imageUrl: "https://placehold.co/300x300/111/2ECC71?text=2" },
  { id: "3", imageUrl: "https://placehold.co/300x300/111/2ECC71?text=3" },
  { id: "4", imageUrl: "https://placehold.co/300x300/111/2ECC71?text=4" },
];

const styles = StyleSheet.create({
  row: {
    gap: GAP,
  },
  item: {
    width: ITEM_SIZE,
    height: ITEM_SIZE,
    marginBottom: GAP,
  },
  image: {
    width: "100%",
    height: "100%",
    backgroundColor: "#111",
  },
  emptyContainer: {
    paddingVertical: 32,
    alignItems: "center",
    backgroundColor: COLORS.background,
  },
  emptyText: {
    color: COLORS.gray,
    fontSize: 13,
  },
});
