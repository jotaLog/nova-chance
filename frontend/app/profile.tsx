import { useState } from "react";
import { View, StyleSheet, ScrollView } from "react-native";

import ProfileInfo, { ProfileInfoData } from "../features/profile/components/profile_info";
import ButtonsFunction from "../features/profile/components/buttons_function";
import NavPublish, { PublishTabKey } from "../features/profile/components/nav_publish";
import PostsProfile, { mockPosts } from "../features/profile/components/posts_profile";

// Exemplo: perfil do PRÓPRIO usuário (bate com o print 2)
const ownProfileMock: ProfileInfoData = {
  name: "felipe lopes",
  username: "lipeswagboy",
  stats: { publicacoes: 4, trocas: 17, seguidores: 49 },
  tagIcon: "scissors",
  tagText: "estilo próprio",
  tagHighlight: "@dudinhawagirl",
  location: "São Leopoldo, RS",
};

// Exemplo: perfil de OUTRA pessoa (bate com o print 3)
const otherProfileMock: ProfileInfoData = {
  name: "daniel costa",
  username: "costa_clos3t",
  stats: { publicacoes: 1, trocas: 0, seguidores: 12 },
  tagText: "closet sempre",
  tagHighlight: "atualizado",
  location: "canoas, RS",
};

interface ProfileScreenExampleProps {
  isOwnProfile?: boolean; // troque pra true/false só pra testar os dois cenários
}

export default function ProfileScreenExample({ isOwnProfile = true }: ProfileScreenExampleProps) {
  const [activeTab, setActiveTab] = useState<PublishTabKey>("posts");
  const data = isOwnProfile ? ownProfileMock : otherProfileMock;

  return (
    <ScrollView style={styles.screen}>
      <ProfileInfo
        data={data}
        isOwnProfile={isOwnProfile}
        isFollowing={!isOwnProfile}
        onSettingsPress={() => console.log("abrir configurações")}
        onFollowPress={() => console.log("seguir/deixar de seguir")}
      />

      <ButtonsFunction
        onTrocarPress={() => console.log("trocar")}
        onArmarioPress={() => console.log("armario")}
        onDoarPress={() => console.log("doar")}
      />

      <NavPublish activeTab={activeTab} onChangeTab={setActiveTab} />

      <PostsProfile posts={activeTab === "posts" ? mockPosts : []} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#000000",
  },
});
