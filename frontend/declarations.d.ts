declare module "*.png";
declare module "*.jpg";
declare module "*.jpeg";
declare module "*.webp";

declare module "*.png" {
  import { ImageSourcePropType } from "react-native";
  const value: ImageSourcePropType;
  export default value;
}