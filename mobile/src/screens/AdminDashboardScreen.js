import React, { useEffect, useState } from "react";
import { RefreshControl, StyleSheet, Text, View } from "react-native";
import { useIsFocused } from "@react-navigation/native";
import { apiRequest } from "../api";
import { useAuth } from "../context/AuthContext";
import { Screen, Panel, Eyebrow, HeroTitle, BodyText, MetricCard, StatusPill, LoadingPanel } from "../components";
import { translateCity } from "../i18n";
import { colors, spacing } from "../theme";
import { formatCurrency, formatDateRange, getErrorMessage } from "../utils";

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
        <LoadingPanel title="ડેશબોર્ડ લોડ થઈ રહ્યો છે" message="બુકિંગ્સ, વપરાશકર્તાઓ અને આવકના આંકડા ભેગા થઈ રહ્યા છે." />
      </Screen>
    );
  }

  return (
    <Screen refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => loadDashboard(true)} />}>
      <Panel>
        <Eyebrow>એડમિન ડેશબોર્ડ</Eyebrow>
        <HeroTitle>એક જ મોબાઇલ વ્યૂમાં ફ્લીટ પ્રવૃત્તિ અને આવક જુઓ.</HeroTitle>
        <BodyText>મંજૂર આવક, બાકી વિનંતીઓ અને નવીનતમ બુકિંગ્સ અહીં દેખાશે.</BodyText>
        {error ? <Text style={styles.errorText}>{error}</Text> : null}
      </Panel>

      <View style={styles.metricGrid}>
        <MetricCard label="કાર્સ" value={String(dashboard?.stats?.cars || 0)} />
        <MetricCard label="વપરાશકર્તા" value={String(dashboard?.stats?.users || 0)} />
        <MetricCard label="બુકિંગ્સ" value={String(dashboard?.stats?.bookings || 0)} />
        <MetricCard label="બાકી" value={String(dashboard?.stats?.pendingBookings || 0)} />
        <MetricCard label="આવક" value={formatCurrency(dashboard?.stats?.acceptedRevenue || 0)} accent />
      </View>

      <Panel>
        <Eyebrow>શહેર પ્રમાણે આવક</Eyebrow>
        <HeroTitle style={styles.sectionTitle}>આવક ક્યાંથી આવી રહી છે</HeroTitle>

        {!dashboard?.revenueByCity?.length ? (
          <BodyText>એડમિન ટીમ મંજૂરી આપશે પછી મંજૂર બુકિંગ્સ અહીં દેખાશે.</BodyText>
        ) : (
          dashboard.revenueByCity.map((entry) => (
            <View key={entry.city} style={styles.listRow}>
              <Text style={styles.rowTitle}>{translateCity(entry.city)}</Text>
              <Text style={styles.rowValue}>{formatCurrency(entry.revenue)}</Text>
            </View>
          ))
        )}
      </Panel>

      <Panel>
        <Eyebrow>તાજેતરની બુકિંગ્સ</Eyebrow>
        <HeroTitle style={styles.sectionTitle}>નવીનતમ વિનંતીઓ</HeroTitle>
        {dashboard?.recentBookings?.map((booking) => (
          <View key={booking.id} style={styles.bookingRow}>
            <View style={styles.bookingCopy}>
              <Text style={styles.rowTitle}>{booking.user?.name || "અજ્ઞાત વપરાશકર્તા"}</Text>
              <BodyText>{booking.car?.brand} {booking.car?.name}</BodyText>
              <BodyText>{formatDateRange(booking.pickupDate, booking.returnDate)}</BodyText>
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
