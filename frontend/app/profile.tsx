import { useEffect, useState } from "react";
import { StyleSheet, ScrollView } from "react-native";

import ProfileInfo from "../features/profile/components/profile_info";
import ButtonsFunction from "../features/profile/components/buttons_function";
import NavPublish, { PublishTabKey, } from "../features/profile/components/nav_publish";import PostsProfile, { mockPosts } from "../features/profile/components/posts_profile";

import { useLocalSearchParams } from "expo-router";
import { followUser, unfollowUser, checkFollowing, getUserProfile, getFollowers, getFollowing } from "../services/authService";
import { getLoggedUser } from "../services/storage";

export default function ProfileScreenExample() {

  const { id } = useLocalSearchParams();

  const [profile, setProfile] = useState<any>(null);
  const [isOwnProfile, setIsOwnProfile] = useState(false);
  const [activeTab, setActiveTab] = useState<PublishTabKey>("posts");
  const [isFollowing, setIsFollowing] = useState(false);
  const [followers, setFollowers] = useState(0);
  const [following, setFollowing] = useState({seguindo: 0,});

  useEffect(() => {

    async function load() {
      try {
        const data = await getUserProfile(Number(id));
        const followersData = await getFollowers(Number(id));
        const followingData = await getFollowing(Number(id));
        
        setFollowers(followersData.seguidores);
        setFollowing(followingData);

        console.log("Perfil:", data);
        setProfile(data);

        const loggedUser = await getLoggedUser();

        if (
          loggedUser &&
          loggedUser.id_usuario === data.id_usuario
        ) {
          setIsOwnProfile(true);
        } else {
          setIsOwnProfile(false);

          if (loggedUser) {
            const following = await checkFollowing(
              data.id_usuario,
              loggedUser.id_usuario
            );

            setIsFollowing(following);
          }
        }

      } catch (e) {
        console.log(e);
      }
    }
    load();

  }, [id]);

  if (!profile) {
    return null;
  }

  const data = {
    name: profile.nome,
    username: profile.email.split("@")[0],
    avatarUrl: profile.foto_perfil,
    tagText: profile.bio || "",
    location: "",
    stats: {
      publicacoes: 0,
      seguindo: following.seguindo,
      seguidores: followers,
    },
  };

  async function handleFollow() {
    const loggedUser = await getLoggedUser();
    if (!loggedUser) return;
    
    if (isFollowing) {
      await unfollowUser(
        profile.id_usuario,
        loggedUser.id_usuario
      );

      setIsFollowing(false);
      setFollowers(prev => prev - 1);
    } else {
      await followUser(
        profile.id_usuario,
        loggedUser.id_usuario
      );  
      setIsFollowing(true);
      setFollowers(prev => prev + 1);

    }
  }

  return (
    <ScrollView style={styles.screen}>

      <ProfileInfo
        data={data}
        isOwnProfile={isOwnProfile}
        isFollowing={isFollowing}
        onSettingsPress={() => console.log("config")}
        onFollowPress={handleFollow}
      />

      <ButtonsFunction
        onTrocarPress={() => console.log("trocar")}
        onArmarioPress={() => console.log("armario")}
        onDoarPress={() => console.log("doar")}
      />

      <NavPublish
        activeTab={activeTab}
        onChangeTab={setActiveTab}
      />

      <PostsProfile
        posts={activeTab === "posts" ? mockPosts : []}
      />

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#000000",
  },
});