import { Platform } from "react-native";

export const colors = {
  canvas: "#F4ECDC",
  canvasDeep: "#E8D6BE",
  surface: "#FFF9F1",
  surfaceAlt: "#F8F0E3",
  text: "#18212A",
  muted: "#64707B",
  accent: "#C45C2F",
  accentDark: "#8E3B1B",
  accentSoft: "#F4CBB7",
  success: "#1D7C59",
  successSoft: "#D5F0E5",
  pending: "#A86514",
  pendingSoft: "#FCE4BA",
  danger: "#B34234",
  dangerSoft: "#F8D6D1",
  border: "rgba(24, 33, 42, 0.1)",
};

export const spacing = {
  xs: 8,
  sm: 12,
  md: 16,
  lg: 20,
  xl: 28,
};

export const radius = {
  md: 18,
  lg: 24,
  xl: 30,
};

export const fonts = {
  display: Platform.select({ ios: "Georgia", android: "serif" }),
  body: Platform.select({ ios: "System", android: "sans-serif" }),
  medium: Platform.select({ ios: "System", android: "sans-serif-medium" }),
};
