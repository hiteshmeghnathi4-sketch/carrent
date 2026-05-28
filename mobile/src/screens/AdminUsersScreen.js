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
  StatusPill,
  EmptyPanel,
  LoadingPanel,
} from "../components";
import { translateCity, translateRole } from "../i18n";
import { colors, spacing } from "../theme";
import { formatCurrency, getErrorMessage } from "../utils";

export function AdminUsersScreen() {
  const { token, user: currentUser, updateStoredUser } = useAuth();
  const isFocused = useIsFocused();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (isFocused) {
      loadUsers();
    }
  }, [isFocused]);

  async function loadUsers(silent = false) {
    try {
      if (silent) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError("");
      const data = await apiRequest("/admin/users", { token });
      setUsers(data.users);
    } catch (loadError) {
      setError(getErrorMessage(loadError));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  async function toggleStatus(account) {
    try {
      setError("");
      const data = await apiRequest(`/admin/users/${account.id}/status`, {
        method: "PATCH",
        token,
      });

      if (account.id === currentUser?.id) {
        await updateStoredUser(data.user);
      }

      await loadUsers(true);
    } catch (statusError) {
      setError(getErrorMessage(statusError));
    }
  }

  async function toggleRole(account) {
    try {
      setError("");
      const nextRole = account.role === "admin" ? "user" : "admin";
      const data = await apiRequest(`/admin/users/${account.id}/role`, {
        method: "PATCH",
        token,
        body: { role: nextRole },
      });

      if (account.id === currentUser?.id) {
        await updateStoredUser(data.user);
      }

      await loadUsers(true);
    } catch (roleError) {
      setError(getErrorMessage(roleError));
    }
  }

  if (loading) {
    return (
      <Screen scroll={false}>
        <LoadingPanel title="વપરાશકર્તાઓ લોડ થઈ રહ્યા છે" message="એકાઉન્ટ, ભૂમિકા અને આવકની વિગતો ભેગી થઈ રહી છે." />
      </Screen>
    );
  }

  return (
    <Screen refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => loadUsers(true)} />}>
      <Panel>
        <Eyebrow>વપરાશકર્તા મેનેજમેન્ટ</Eyebrow>
        <HeroTitle>સંપર્ક વિગતો જુઓ અને એકાઉન્ટ ઍક્સેસ નિયંત્રિત કરો.</HeroTitle>
        <BodyText>એડમિન અહીં મોબાઇલ નંબર જોઈ શકે છે, ભૂમિકાઓ બદલી શકે છે અને એકાઉન્ટ નિષ્ક્રિય કરી શકે છે.</BodyText>
        {error ? <Text style={styles.errorText}>{error}</Text> : null}
      </Panel>

      {!users.length ? <EmptyPanel title="કોઈ વપરાશકર્તા મળ્યા નથી" message="સાઇનઅપ પછી એકાઉન્ટ્સ અહીં દેખાશે." /> : null}

      {users.map((account) => (
        <Panel key={account.id}>
          <View style={styles.headingRow}>
            <View style={styles.headingCopy}>
              <Eyebrow>{account.email}</Eyebrow>
              <HeroTitle style={styles.cardTitle}>{account.name}</HeroTitle>
            </View>
            <StatusPill status={account.active ? "active" : "inactive"} />
          </View>

          <BodyText>મોબાઇલ: {account.phone || "આપેલ નથી"}</BodyText>
          <BodyText>શહેર: {translateCity(account.city)}</BodyText>
          <BodyText>ભૂમિકા: {translateRole(account.role)}</BodyText>
          <BodyText>બુકિંગ્સ: {account.bookings} • આવક: {formatCurrency(account.revenue)}</BodyText>

          <View style={styles.actionRow}>
            <ActionButton
              label={account.role === "admin" ? "વપરાશકર્તા બનાવો" : "એડમિન બનાવો"}
              onPress={() => toggleRole(account)}
              variant="secondary"
              small
            />
            <ActionButton
              label={account.active ? "નિષ્ક્રિય કરો" : "ફરી સક્રિય કરો"}
              onPress={() => toggleStatus(account)}
              variant={account.active ? "danger" : "secondary"}
              small
            />
          </View>
        </Panel>
      ))}
    </Screen>
  );
}

const styles = StyleSheet.create({
  errorText: {
    color: colors.danger,
  },
  headingRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: spacing.sm,
  },
  headingCopy: {
    flex: 1,
    gap: 4,
  },
  cardTitle: {
    fontSize: 22,
    lineHeight: 26,
  },
  actionRow: {
    flexDirection: "row",
    gap: spacing.sm,
    flexWrap: "wrap",
  },
});
