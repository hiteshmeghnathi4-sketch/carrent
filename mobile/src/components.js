import React from "react";
import {
  ActivityIndicator,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { colors, fonts, radius, spacing } from "./theme";
import { localizeLabel } from "./i18n";

export function Screen({
  children,
  scroll = true,
  contentContainerStyle,
  refreshControl,
  keyboardShouldPersistTaps = "handled",
}) {
  return (
    <LinearGradient colors={[colors.canvas, colors.canvasDeep]} style={styles.shell}>
      <SafeAreaView style={styles.safeArea}>
        {scroll ? (
          <ScrollView
            style={styles.body}
            contentContainerStyle={[styles.bodyContent, contentContainerStyle]}
            refreshControl={refreshControl}
            keyboardShouldPersistTaps={keyboardShouldPersistTaps}
          >
            {children}
          </ScrollView>
        ) : (
          <View style={[styles.body, styles.bodyContent, contentContainerStyle]}>{children}</View>
        )}
      </SafeAreaView>
    </LinearGradient>
  );
}

export function Panel({ children, style }) {
  return <View style={[styles.panel, style]}>{children}</View>;
}

export function Eyebrow({ children }) {
  return <Text style={styles.eyebrow}>{children}</Text>;
}

export function HeroTitle({ children, style }) {
  return <Text style={[styles.heroTitle, style]}>{children}</Text>;
}

export function BodyText({ children, style }) {
  return <Text style={[styles.bodyText, style]}>{children}</Text>;
}

export function ActionButton({
  label,
  onPress,
  variant = "primary",
  disabled = false,
  small = false,
}) {
  const variantStyle =
    variant === "secondary"
      ? styles.buttonSecondary
      : variant === "danger"
        ? styles.buttonDanger
        : styles.buttonPrimary;
  const textStyle =
    variant === "secondary" ? styles.buttonSecondaryText : styles.buttonPrimaryText;

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.button,
        small && styles.buttonSmall,
        variantStyle,
        disabled && styles.buttonDisabled,
        pressed && !disabled && styles.buttonPressed,
      ]}
    >
      <Text style={[styles.buttonText, textStyle]}>{label}</Text>
    </Pressable>
  );
}

export function TextField({
  label,
  value,
  onChangeText,
  placeholder,
  secureTextEntry = false,
  multiline = false,
  keyboardType = "default",
  autoCapitalize = "sentences",
}) {
  return (
    <View style={styles.fieldWrap}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.muted}
        secureTextEntry={secureTextEntry}
        multiline={multiline}
        keyboardType={keyboardType}
        autoCapitalize={autoCapitalize}
        style={[styles.input, multiline && styles.inputMultiline]}
      />
    </View>
  );
}

export function StatusPill({ status }) {
  const normalized = String(status || "").toLowerCase();
  const label = localizeLabel(status);
  const toneStyle =
    normalized === "accepted" || normalized === "available" || normalized === "active"
      ? styles.statusAccepted
      : normalized === "rejected" || normalized === "inactive" || normalized === "unavailable"
        ? styles.statusRejected
        : styles.statusPending;

  return (
    <View style={[styles.statusPill, toneStyle]}>
      <Text style={styles.statusText}>{label}</Text>
    </View>
  );
}

export function MetricCard({ label, value, accent = false }) {
  return (
    <View style={[styles.metricCard, accent && styles.metricCardAccent]}>
      <Text style={[styles.metricLabel, accent && styles.metricLabelAccent]}>{label}</Text>
      <Text style={[styles.metricValue, accent && styles.metricValueAccent]}>{value}</Text>
    </View>
  );
}

export function EmptyPanel({ title, message }) {
  return (
    <Panel>
      <HeroTitle style={styles.emptyTitle}>{title}</HeroTitle>
      <BodyText>{message}</BodyText>
    </Panel>
  );
}

export function LoadingPanel({ title, message }) {
  return (
    <Panel style={styles.loadingPanel}>
      <ActivityIndicator size="large" color={colors.accent} />
      <HeroTitle style={styles.loadingTitle}>{title}</HeroTitle>
      <BodyText style={styles.loadingMessage}>{message}</BodyText>
    </Panel>
  );
}

export function PhotoPreview({ uri, label }) {
  return (
    <Panel style={styles.photoPanel}>
      <Text style={styles.fieldLabel}>{label}</Text>
      {uri ? (
        <Image source={{ uri }} style={styles.previewImage} />
      ) : (
        <View style={styles.previewEmpty}>
          <BodyText style={styles.previewEmptyText}>
            ઇમેજ URL ઉમેરો અથવા ગેલેરીમાંથી ફોટો પસંદ કરો.
          </BodyText>
        </View>
      )}
    </Panel>
  );
}

export function Divider() {
  return <View style={styles.divider} />;
}

const styles = StyleSheet.create({
  shell: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  body: {
    flex: 1,
  },
  bodyContent: {
    padding: spacing.lg,
    gap: spacing.md,
  },
  panel: {
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: "#45240F",
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.1,
    shadowRadius: 28,
    elevation: 3,
    gap: spacing.sm,
  },
  eyebrow: {
    color: colors.accentDark,
    textTransform: "uppercase",
    letterSpacing: 1.3,
    fontSize: 12,
    fontFamily: fonts.medium,
  },
  heroTitle: {
    color: colors.text,
    fontSize: 29,
    lineHeight: 34,
    fontFamily: fonts.display,
  },
  bodyText: {
    color: colors.muted,
    fontSize: 15,
    lineHeight: 23,
    fontFamily: fonts.body,
  },
  button: {
    minHeight: 50,
    paddingHorizontal: 18,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
  },
  buttonSmall: {
    minHeight: 42,
    paddingHorizontal: 16,
  },
  buttonPrimary: {
    backgroundColor: colors.accent,
  },
  buttonSecondary: {
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1,
    borderColor: colors.border,
  },
  buttonDanger: {
    backgroundColor: colors.danger,
  },
  buttonDisabled: {
    opacity: 0.55,
  },
  buttonPressed: {
    transform: [{ scale: 0.99 }],
  },
  buttonText: {
    fontFamily: fonts.medium,
    fontSize: 15,
  },
  buttonPrimaryText: {
    color: "#FFF8F2",
  },
  buttonSecondaryText: {
    color: colors.text,
  },
  fieldWrap: {
    gap: 8,
  },
  fieldLabel: {
    color: colors.text,
    fontSize: 14,
    fontFamily: fonts.medium,
  },
  input: {
    minHeight: 50,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 15,
    color: colors.text,
    fontSize: 15,
    fontFamily: fonts.body,
  },
  inputMultiline: {
    minHeight: 110,
    paddingTop: 14,
    textAlignVertical: "top",
  },
  statusPill: {
    alignSelf: "flex-start",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
  },
  statusAccepted: {
    backgroundColor: colors.successSoft,
  },
  statusPending: {
    backgroundColor: colors.pendingSoft,
  },
  statusRejected: {
    backgroundColor: colors.dangerSoft,
  },
  statusText: {
    color: colors.text,
    fontSize: 13,
    textTransform: "capitalize",
    fontFamily: fonts.medium,
  },
  metricCard: {
    flex: 1,
    minWidth: 140,
    padding: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 8,
  },
  metricCardAccent: {
    backgroundColor: colors.accentDark,
    borderColor: colors.accentDark,
  },
  metricLabel: {
    color: colors.muted,
    fontSize: 13,
    fontFamily: fonts.medium,
  },
  metricLabelAccent: {
    color: "#F5E7DE",
  },
  metricValue: {
    color: colors.text,
    fontSize: 24,
    fontFamily: fonts.display,
  },
  metricValueAccent: {
    color: "#FFF8F2",
  },
  emptyTitle: {
    fontSize: 24,
    lineHeight: 28,
  },
  loadingPanel: {
    alignItems: "center",
    justifyContent: "center",
    flex: 1,
    marginTop: spacing.xl,
  },
  loadingTitle: {
    fontSize: 24,
    textAlign: "center",
  },
  loadingMessage: {
    textAlign: "center",
  },
  photoPanel: {
    padding: spacing.md,
  },
  previewImage: {
    width: "100%",
    height: 210,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceAlt,
  },
  previewEmpty: {
    height: 160,
    borderRadius: radius.md,
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing.md,
    backgroundColor: colors.surfaceAlt,
  },
  previewEmptyText: {
    textAlign: "center",
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: 4,
  },
});
