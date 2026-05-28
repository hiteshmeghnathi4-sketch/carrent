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
        <LoadingPanel title="પ્રોફાઇલ લોડ થઈ રહી છે" message="તમારી એકાઉન્ટ વિગતો અને બુકિંગ સારાંશ સમન્વયિત થઈ રહ્યા છે." />
      </Screen>
    );
  }

  return (
    <Screen refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => loadProfile(true)} />}>
      <Panel>
        <Eyebrow>પ્રોફાઇલ મેનેજમેન્ટ</Eyebrow>
        <HeroTitle>તમારી એકાઉન્ટ વિગતો અપડેટ રાખો.</HeroTitle>
        <BodyText>
          સંપર્ક માહિતી અપડેટ કરો, જરૂર પડે ત્યારે પાસવર્ડ બદલો અને એપમાંથી સુરક્ષિત રીતે લોગઆઉટ કરો.
        </BodyText>
      </Panel>

      <View style={styles.metricGrid}>
        <MetricCard label="કુલ બુકિંગ્સ" value={String(summary?.total || 0)} />
        <MetricCard label="મંજૂર" value={String(summary?.accepted || 0)} />
        <MetricCard label="બાકી" value={String(summary?.pending || 0)} accent />
      </View>

      <Panel>
        <TextField label="પૂર્ણ નામ" value={name} onChangeText={setName} placeholder="તમારું નામ" />
        <TextField
          label="ઇમેઇલ"
          value={email}
          onChangeText={setEmail}
          placeholder="name@example.com"
          keyboardType="email-address"
          autoCapitalize="none"
        />
        <TextField
          label="મોબાઇલ નંબર"
          value={phone}
          onChangeText={setPhone}
          placeholder="9876543210"
          keyboardType="phone-pad"
        />
        <TextField label="શહેર" value={city} onChangeText={setCity} placeholder="તમારું શહેર" />
        <TextField
          label="નવો પાસવર્ડ"
          value={password}
          onChangeText={setPassword}
          placeholder="હાલનો પાસવર્ડ જાળવવા માટે ખાલી રાખો"
          secureTextEntry
          autoCapitalize="none"
        />

        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        <ActionButton label={saving ? "સંગ્રહિત થઈ રહ્યું છે..." : "ફેરફાર સંગ્રહિત કરો"} onPress={saveProfile} disabled={saving} />
        <ActionButton label="લોગઆઉટ" onPress={signOut} variant="secondary" />
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
