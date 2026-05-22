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
        <LoadingPanel title="Loading users" message="Collecting account, role, and revenue details." />
      </Screen>
    );
  }

  return (
    <Screen refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => loadUsers(true)} />}>
      <Panel>
        <Eyebrow>User management</Eyebrow>
        <HeroTitle>See contact details and control account access.</HeroTitle>
        <BodyText>Admins can view mobile numbers, switch roles, and deactivate accounts here.</BodyText>
        {error ? <Text style={styles.errorText}>{error}</Text> : null}
      </Panel>

      {!users.length ? <EmptyPanel title="No users found" message="Accounts will appear here after signup." /> : null}

      {users.map((account) => (
        <Panel key={account.id}>
          <View style={styles.headingRow}>
            <View style={styles.headingCopy}>
              <Eyebrow>{account.email}</Eyebrow>
              <HeroTitle style={styles.cardTitle}>{account.name}</HeroTitle>
            </View>
            <StatusPill status={account.active ? "active" : "inactive"} />
          </View>

          <BodyText>Mobile: {account.phone || "Not provided"}</BodyText>
          <BodyText>City: {account.city}</BodyText>
          <BodyText>Role: {account.role}</BodyText>
          <BodyText>Bookings: {account.bookings} • Revenue: {formatCurrency(account.revenue)}</BodyText>

          <View style={styles.actionRow}>
            <ActionButton
              label={account.role === "admin" ? "Make user" : "Make admin"}
              onPress={() => toggleRole(account)}
              variant="secondary"
              small
            />
            <ActionButton
              label={account.active ? "Deactivate" : "Reactivate"}
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
