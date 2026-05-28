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
import { formatDays, translateCity, translateStatus } from "../i18n";
import { colors, fonts, spacing } from "../theme";
import { formatCurrency, formatDateRange, getErrorMessage } from "../utils";

const FILTERS = [
  { value: "all", label: "બધા" },
  { value: "pending", label: "બાકી" },
  { value: "accepted", label: "મંજૂર" },
  { value: "rejected", label: "નકારેલ" },
];

export function AdminBookingsScreen() {
  const { token } = useAuth();
  const isFocused = useIsFocused();
  const [filter, setFilter] = useState("all");
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (isFocused) {
      loadBookings(filter);
    }
  }, [isFocused, filter]);

  async function loadBookings(nextFilter = filter, silent = false) {
    try {
      if (silent) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError("");
      const query = nextFilter === "all" ? "" : `?status=${nextFilter}`;
      const data = await apiRequest(`/admin/bookings${query}`, { token });
      setBookings(data.bookings);
    } catch (loadError) {
      setError(getErrorMessage(loadError));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  async function updateStatus(bookingId, status) {
    try {
      setError("");
      await apiRequest(`/admin/bookings/${bookingId}/status`, {
        method: "PATCH",
        token,
        body: { status },
      });
      await loadBookings(filter, true);
    } catch (statusError) {
      setError(getErrorMessage(statusError));
    }
  }

  if (loading) {
    return (
      <Screen scroll={false}>
        <LoadingPanel title="બુકિંગ્સ લોડ થઈ રહી છે" message="નવીનતમ ગ્રાહક વિનંતીઓ ચકાસી રહ્યા છીએ." />
      </Screen>
    );
  }

  return (
    <Screen refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => loadBookings(filter, true)} />}>
      <Panel>
        <Eyebrow>બુકિંગ મોડરેશન</Eyebrow>
        <HeroTitle>મોબાઇલમાંથી જ વિનંતીઓને મંજૂર અથવા નકારી દો.</HeroTitle>
        <BodyText>બાકી વિનંતીઓ એકસાથે રાખવામાં આવી છે જેથી એડમિન ઝડપથી કામ કરી શકે.</BodyText>
        {error ? <Text style={styles.errorText}>{error}</Text> : null}
      </Panel>

      <View style={styles.filterRow}>
        {FILTERS.map((item) => (
          <ActionButton
            key={item.value}
            label={item.label}
            onPress={() => setFilter(item.value)}
            variant={filter === item.value ? "primary" : "secondary"}
            small
          />
        ))}
      </View>

      {!bookings.length ? (
        <EmptyPanel title="આ ફિલ્ટર માટે કોઈ બુકિંગ નથી" message="ફિલ્ટર બદલો અથવા આગામી વિનંતી માટે રાહ જુઓ." />
      ) : null}

      {bookings.map((booking) => (
        <Panel key={booking.id}>
          <View style={styles.headingRow}>
            <View style={styles.headingCopy}>
              <Eyebrow>{booking.user?.email || "અજ્ઞાત વપરાશકર્તા"}</Eyebrow>
              <HeroTitle style={styles.cardTitle}>{booking.user?.name || "અજ્ઞાત વપરાશકર્તા"}</HeroTitle>
            </View>
            <StatusPill status={booking.status} />
          </View>

          <BodyText>{booking.car?.brand} {booking.car?.name} • {translateCity(booking.car?.city)}</BodyText>
          <BodyText>{formatDateRange(booking.pickupDate, booking.returnDate)} • {formatDays(booking.days)}</BodyText>
          <Text style={styles.amountText}>{formatCurrency(booking.totalPrice)}</Text>
          {booking.note ? <BodyText>નોંધ: {booking.note}</BodyText> : null}

          {booking.status === "pending" ? (
            <View style={styles.actionRow}>
              <ActionButton label={translateStatus("accepted")} onPress={() => updateStatus(booking.id, "accepted")} small />
              <ActionButton
                label={translateStatus("rejected")}
                onPress={() => updateStatus(booking.id, "rejected")}
                variant="danger"
                small
              />
            </View>
          ) : null}
        </Panel>
      ))}
    </Screen>
  );
}

const styles = StyleSheet.create({
  filterRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
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
  amountText: {
    color: colors.accentDark,
    fontFamily: fonts.display,
    fontSize: 22,
  },
  actionRow: {
    flexDirection: "row",
    gap: spacing.sm,
  },
});
