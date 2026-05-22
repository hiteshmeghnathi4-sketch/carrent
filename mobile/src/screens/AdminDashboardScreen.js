import React, { useEffect, useState } from "react";
import { RefreshControl, StyleSheet, Text, View } from "react-native";
import { useIsFocused } from "@react-navigation/native";
import { apiRequest } from "../api";
import { useAuth } from "../context/AuthContext";
import { Screen, Panel, Eyebrow, HeroTitle, BodyText, MetricCard, StatusPill, LoadingPanel } from "../components";
import { colors, spacing } from "../theme";
import { formatCurrency, getErrorMessage } from "../utils";

export function AdminDashboardScreen() {
  const { token } = useAuth();
  const isFocused = useIsFocused();
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (isFocused) {
      loadDashboard();
    }
  }, [isFocused]);

  async function loadDashboard(silent = false) {
    try {
      if (silent) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError("");
      const data = await apiRequest("/admin/dashboard", { token });
      setDashboard(data);
    } catch (loadError) {
      setError(getErrorMessage(loadError));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  if (loading) {
    return (
      <Screen scroll={false}>
        <LoadingPanel title="Loading dashboard" message="Gathering bookings, users, and revenue stats." />
      </Screen>
    );
  }

  return (
    <Screen refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => loadDashboard(true)} />}>
      <Panel>
        <Eyebrow>Admin dashboard</Eyebrow>
        <HeroTitle>Monitor fleet activity and revenue from one mobile view.</HeroTitle>
        <BodyText>Approved earnings, pending requests, and latest bookings stay visible here.</BodyText>
        {error ? <Text style={styles.errorText}>{error}</Text> : null}
      </Panel>

      <View style={styles.metricGrid}>
        <MetricCard label="Cars" value={String(dashboard?.stats?.cars || 0)} />
        <MetricCard label="Users" value={String(dashboard?.stats?.users || 0)} />
        <MetricCard label="Bookings" value={String(dashboard?.stats?.bookings || 0)} />
        <MetricCard label="Pending" value={String(dashboard?.stats?.pendingBookings || 0)} />
        <MetricCard label="Revenue" value={formatCurrency(dashboard?.stats?.acceptedRevenue || 0)} accent />
      </View>

      <Panel>
        <Eyebrow>Revenue by city</Eyebrow>
        <HeroTitle style={styles.sectionTitle}>Where earnings are coming from</HeroTitle>

        {!dashboard?.revenueByCity?.length ? (
          <BodyText>Accepted bookings will appear here once the admin team approves them.</BodyText>
        ) : (
          dashboard.revenueByCity.map((entry) => (
            <View key={entry.city} style={styles.listRow}>
              <Text style={styles.rowTitle}>{entry.city}</Text>
              <Text style={styles.rowValue}>{formatCurrency(entry.revenue)}</Text>
            </View>
          ))
        )}
      </Panel>

      <Panel>
        <Eyebrow>Recent bookings</Eyebrow>
        <HeroTitle style={styles.sectionTitle}>Latest requests</HeroTitle>
        {dashboard?.recentBookings?.map((booking) => (
          <View key={booking.id} style={styles.bookingRow}>
            <View style={styles.bookingCopy}>
              <Text style={styles.rowTitle}>{booking.user?.name || "Unknown user"}</Text>
              <BodyText>{booking.car?.brand} {booking.car?.name}</BodyText>
              <BodyText>{booking.pickupDate} to {booking.returnDate}</BodyText>
            </View>
            <StatusPill status={booking.status} />
          </View>
        ))}
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
  sectionTitle: {
    fontSize: 22,
    lineHeight: 26,
  },
  listRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: spacing.sm,
    paddingVertical: 8,
  },
  rowTitle: {
    color: colors.text,
    fontSize: 15,
    fontWeight: "700",
  },
  rowValue: {
    color: colors.accentDark,
    fontWeight: "700",
  },
  bookingRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: spacing.sm,
    alignItems: "flex-start",
  },
  bookingCopy: {
    flex: 1,
    gap: 4,
  },
});
