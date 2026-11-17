import { useCallback, useState } from "react";
import {
  Alert,
  ActivityIndicator,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { router, useFocusEffect } from "expo-router";

import ProfileInfo from "./components/profile_info";
import ButtonsFunction from "./components/buttons_function";
import NavPublish, { PublishTabKey } from "./components/nav_publish";
import PostsProfile, { Post as ProfilePost } from "./components/posts_profile";
import {
  followUser,
  checkFollowing,
  getFollowers,
  getFollowing,
  getUserProfile,
  unfollowUser,
} from "../../services/authService";
import { getFavoriteClothes, TradingClothes } from "../../services/clothesService";
import { FeedPost, getSavedPosts, getUserPosts } from "../../services/postService";
import { getLoggedUser } from "../../services/storage";
import { api } from "../../services/api";

interface ProfileData {
  id_usuario: number;
  nome: string;
  email: string;
  foto_perfil: string | null;
  bio: string | null;
}

function absoluteImageUrl(url: string | null | undefined) {
  if (!url || /^https?:\/\//i.test(url)) return url ?? undefined;
  return `${api.defaults.baseURL}${url}`;
}

function toProfilePosts(posts: FeedPost[]): ProfilePost[] {
  return posts
    .filter((post) => post.imagem)
    .map((post) => ({ id: String(post.id), imageUrl: post.imagem! }));
}

export default function ProfileScreen({ profileId }: { profileId?: number }) {
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [isOwnProfile, setIsOwnProfile] = useState(false);
  const [activeTab, setActiveTab] = useState<PublishTabKey>("posts");
  const [isFollowing, setIsFollowing] = useState(false);
  const [followers, setFollowers] = useState(0);
  const [following, setFollowing] = useState(0);
  const [posts, setPosts] = useState<FeedPost[]>([]);
  const [savedPosts, setSavedPosts] = useState<FeedPost[]>([]);
  const [savedClothes, setSavedClothes] = useState<TradingClothes[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
    let active = true;

    async function loadProfile() {
      setLoading(true);
      setError(null);
      setActiveTab("posts");
      setProfile(null);
      setPosts([]);
      setSavedPosts([]);
      setSavedClothes([]);
      try {
        const loggedUser = await getLoggedUser();
        const targetId = profileId || Number(loggedUser?.id_usuario);
        if (!targetId) throw new Error("Entre na sua conta para ver este perfil.");

        const [profileData, followersData, followingData, userPosts] =
          await Promise.all([
            getUserProfile(targetId),
            getFollowers(targetId),
            getFollowing(targetId),
            getUserPosts(targetId),
          ]);
        if (!active) return;

        const ownProfile =
          Number(loggedUser?.id_usuario) === Number(profileData.id_usuario);
        setProfile(profileData);
        setFollowers(Number(followersData.seguidores) || 0);
        setFollowing(Number(followingData.seguindo) || 0);
        setPosts(userPosts);
        setIsOwnProfile(ownProfile);

        if (ownProfile) {
          const [ownSavedPosts, ownSavedClothes] = await Promise.all([
            getSavedPosts(),
            getFavoriteClothes(),
          ]);
          if (!active) return;
          setSavedPosts(ownSavedPosts);
          setSavedClothes(ownSavedClothes);
        } else {
          setSavedPosts([]);
          setSavedClothes([]);
          if (loggedUser) {
            setIsFollowing(
              await checkFollowing(
                Number(profileData.id_usuario),
                Number(loggedUser.id_usuario)
              )
            );
          } else {
            setIsFollowing(false);
          }
        }
      } catch (loadError: unknown) {
        console.error("Erro ao carregar perfil:", loadError);
        if (active) {
          setError(
            loadError instanceof Error
              ? loadError.message
              : "Não foi possível carregar o perfil."
          );
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    void loadProfile();
    return () => {
      active = false;
    };
    }, [profileId])
  );

  async function handleFollow() {
    if (!profile) return;
    try {
      if (isFollowing) {
        await unfollowUser(profile.id_usuario, 0);
        setIsFollowing(false);
        setFollowers((count) => Math.max(0, count - 1));
      } else {
        await followUser(profile.id_usuario, 0);
        setIsFollowing(true);
        setFollowers((count) => count + 1);
      }
    } catch (followError: unknown) {
      console.error("Erro ao atualizar seguimento:", followError);
      Alert.alert(
        "Não foi possível atualizar",
        followError instanceof Error
          ? followError.message
          : "Tente novamente."
      );
    }
  }

  if (loading) {
    return (
      <View style={[styles.screen, styles.centered]}>
        <ActivityIndicator color="#3CFF00" />
      </View>
    );
  }

  if (!profile) {
    return (
      <View style={[styles.screen, styles.centered]}>
        <Text style={styles.errorText}>{error ?? "Perfil não encontrado."}</Text>
      </View>
    );
  }

  const profilePosts = toProfilePosts(posts);
  const data = {
    name: profile.nome,
    username: profile.email.split("@")[0],
    avatarUrl: absoluteImageUrl(profile.foto_perfil),
    tagText: profile.bio || "",
    location: "",
    stats: {
      publicacoes: posts.length,
      seguindo: following,
      seguidores: followers,
    },
  };

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <ProfileInfo
        data={data}
        isOwnProfile={isOwnProfile}
        isFollowing={isFollowing}
        onSettingsPress={() => router.push("/settings")}
        onFollowPress={() => void handleFollow()}
        onMessagePress={() =>
          router.push({
            pathname: "/conversation",
            params: {
              id: String(profile.id_usuario),
              name: profile.nome,
              photo: profile.foto_perfil ?? "",
            },
          })
        }
      />

      {isOwnProfile ? (
        <ButtonsFunction
          onTrocarPress={() => router.push("/clothesFeed")}
          onArmarioPress={() => router.push("/wardrobe")}
        />
      ) : null}

      <NavPublish
        activeTab={activeTab}
        onChangeTab={setActiveTab}
        showSaved={isOwnProfile}
      />

      {activeTab === "posts" ? (
        <PostsProfile posts={profilePosts} />
      ) : (
        <View>
          <Text style={styles.sectionTitle}>Posts salvos</Text>
          <PostsProfile posts={toProfilePosts(savedPosts)} emptyLabel="nenhum post salvo" />
          <Text style={styles.sectionTitle}>Roupas salvas</Text>
          {savedClothes.length === 0 ? (
            <Text style={styles.emptySaved}>nenhuma roupa salva</Text>
          ) : (
            <View style={styles.clothingList}>
              {savedClothes.map((clothing) => (
                <View key={clothing.id_roupa} style={styles.clothingItem}>
                  {clothing.imagem_url ? (
                    <Image
                      source={{ uri: absoluteImageUrl(clothing.imagem_url) }}
                      style={styles.clothingImage}
                    />
                  ) : (
                    <View style={[styles.clothingImage, styles.imagePlaceholder]} />
                  )}
                  <View style={styles.clothingInfo}>
                    <Text style={styles.clothingName}>{clothing.nome}</Text>
                    <Text style={styles.clothingDetails}>
                      {[clothing.categoria, clothing.tamanho && `Tamanho ${clothing.tamanho}`]
                        .filter(Boolean)
                        .join(" • ")}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          )}
        </View>
      )}
      {error ? <Text style={styles.errorText}>{error}</Text> : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#000",
  },
  content: {
    paddingBottom: 24,
  },
  centered: {
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  sectionTitle: {
    marginTop: 16,
    marginBottom: 8,
    paddingHorizontal: 16,
    color: "#FFF",
    fontSize: 14,
    fontWeight: "600",
  },
  emptySaved: {
    paddingVertical: 24,
    color: "#9CA3AF",
    fontSize: 13,
    textAlign: "center",
  },
  clothingList: {
    paddingHorizontal: 14,
  },
  clothingItem: {
    minHeight: 88,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 10,
    padding: 10,
    borderRadius: 6,
    backgroundColor: "#111",
  },
  clothingImage: {
    width: 64,
    height: 68,
    borderRadius: 100,
    backgroundColor: "#222",
  },
  imagePlaceholder: {
    borderWidth: 1,
    borderColor: "#333",
  },
  clothingInfo: {
    flex: 1,
  },
  clothingName: {
    color: "#FFF",
    fontSize: 14,
    fontWeight: "600",
  },
  clothingDetails: {
    marginTop: 5,
    color: "#999",
    fontSize: 12,
  },
  errorText: {
    padding: 20,
    color: "#FF8A8A",
    textAlign: "center",
  },
});
