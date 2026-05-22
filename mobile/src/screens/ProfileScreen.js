import React, { useEffect, useState } from "react";
import { RefreshControl, StyleSheet, Text, View } from "react-native";
import { useIsFocused } from "@react-navigation/native";
import { apiRequest } from "../api";
import { useAuth } from "../context/AuthContext";
import {
  Screen,
  Panel,
  Eyebrow,
  HeroTitle,
  BodyText,
  ActionButton,
  MetricCard,
  TextField,
  LoadingPanel,
} from "../components";
import { colors, spacing } from "../theme";
import { getErrorMessage } from "../utils";

export function ProfileScreen() {
  const { token, user, signOut, updateStoredUser } = useAuth();
  const isFocused = useIsFocused();
  const [name, setName] = useState(user?.name || "");
  const [email, setEmail] = useState(user?.email || "");
  const [phone, setPhone] = useState(user?.phone || "");
  const [city, setCity] = useState(user?.city || "");
  const [password, setPassword] = useState("");
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (isFocused) {
      loadProfile();
    }
  }, [isFocused]);

  async function loadProfile(silent = false) {
    try {
      if (silent) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError("");
      const data = await apiRequest("/profile", { token });
      setName(data.user.name);
      setEmail(data.user.email);
      setPhone(data.user.phone);
      setCity(data.user.city);
      setSummary(data.bookingSummary);
      await updateStoredUser(data.user);
    } catch (loadError) {
      setError(getErrorMessage(loadError));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  async function saveProfile() {
    try {
      setSaving(true);
      setError("");

      const data = await apiRequest("/profile", {
        method: "PUT",
        token,
        body: {
          name,
          email,
          phone,
          city,
          password,
        },
      });

      setPassword("");
      await updateStoredUser(data.user);
    } catch (saveError) {
      setError(getErrorMessage(saveError));
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <Screen scroll={false}>
        <LoadingPanel title="Loading profile" message="Syncing your account details and booking summary." />
      </Screen>
    );
  }

  return (
    <Screen refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => loadProfile(true)} />}>
      <Panel>
        <Eyebrow>Profile management</Eyebrow>
        <HeroTitle>Keep your account details current.</HeroTitle>
        <BodyText>
          Update your contact info, change password when needed, and sign out safely from the app.
        </BodyText>
      </Panel>

      <View style={styles.metricGrid}>
        <MetricCard label="Total bookings" value={String(summary?.total || 0)} />
        <MetricCard label="Accepted" value={String(summary?.accepted || 0)} />
        <MetricCard label="Pending" value={String(summary?.pending || 0)} accent />
      </View>

      <Panel>
        <TextField label="Full name" value={name} onChangeText={setName} placeholder="Your name" />
        <TextField
          label="Email"
          value={email}
          onChangeText={setEmail}
          placeholder="name@example.com"
          keyboardType="email-address"
          autoCapitalize="none"
        />
        <TextField
          label="Mobile number"
          value={phone}
          onChangeText={setPhone}
          placeholder="9876543210"
          keyboardType="phone-pad"
        />
        <TextField label="City" value={city} onChangeText={setCity} placeholder="Your city" />
        <TextField
          label="New password"
          value={password}
          onChangeText={setPassword}
          placeholder="Leave blank to keep the current password"
          secureTextEntry
          autoCapitalize="none"
        />

        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        <ActionButton label={saving ? "Saving..." : "Save changes"} onPress={saveProfile} disabled={saving} />
        <ActionButton label="Logout" onPress={signOut} variant="secondary" />
      </Panel>
    </Screen>
  );
}

const styles = StyleSheet.create({
  metricGrid: {
    flexDirection: "row",
    gap: spacing.sm,
    flexWrap: "wrap",
  },
  errorText: {
    color: colors.danger,
  },
});
