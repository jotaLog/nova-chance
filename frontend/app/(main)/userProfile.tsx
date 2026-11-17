import { useLocalSearchParams } from "expo-router";
import ProfileScreen from "../../features/profile/profile_screen";

export default function UserProfile() {
  const { id } = useLocalSearchParams<{ id?: string | string[] }>();
  const profileId = Number(Array.isArray(id) ? id[0] : id);
  return <ProfileScreen profileId={profileId} />;
}
