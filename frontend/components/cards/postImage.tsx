import { View, Image, StyleSheet } from "react-native";
import { Feather } from "@expo/vector-icons";

interface PostImageProps {
  imagem: string | null;
  aspectRatio?: number;
}

export default function PostImage({
  imagem,
  aspectRatio = 1,
}: PostImageProps) {
  return (
    <View style={[styles.container, { aspectRatio }]}>
      {imagem ? (
        <Image
          source={{ uri: imagem }}
          style={styles.image}
          resizeMode="cover"
        />
      ) : (
        <View style={styles.placeholder}>
          <ImagePlaceholder />
        </View>
      )}
    </View>
  );
}

// Mantém o placeholder simples, sem depender de outra biblioteca.
function ImagePlaceholder() {
  return <Feather name="image" size={38} color="#777" />;
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
    backgroundColor: "#151515",
    overflow: "hidden",
  },
  image: {
    width: "100%",
    height: "100%",
  },
  placeholder: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
});
