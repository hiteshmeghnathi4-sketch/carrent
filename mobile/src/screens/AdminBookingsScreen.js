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
import { colors, fonts, spacing } from "../theme";
import { formatCurrency, getErrorMessage } from "../utils";

const FILTERS = ["all", "pending", "accepted", "rejected"];

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
        <LoadingPanel title="Loading bookings" message="Checking the latest customer requests." />
      </Screen>
    );
  }

  return (
    <Screen refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => loadBookings(filter, true)} />}>
      <Panel>
        <Eyebrow>Booking moderation</Eyebrow>
        <HeroTitle>Accept or reject requests from mobile.</HeroTitle>
        <BodyText>Pending requests are kept together so admins can work quickly in the field.</BodyText>
        {error ? <Text style={styles.errorText}>{error}</Text> : null}
      </Panel>

      <View style={styles.filterRow}>
        {FILTERS.map((item) => (
          <ActionButton
            key={item}
            label={item}
            onPress={() => setFilter(item)}
            variant={filter === item ? "primary" : "secondary"}
            small
          />
        ))}
      </View>

      {!bookings.length ? (
        <EmptyPanel title="No bookings for this filter" message="Switch filters or wait for the next request." />
      ) : null}

      {bookings.map((booking) => (
        <Panel key={booking.id}>
          <View style={styles.headingRow}>
            <View style={styles.headingCopy}>
              <Eyebrow>{booking.user?.email || "Unknown user"}</Eyebrow>
              <HeroTitle style={styles.cardTitle}>{booking.user?.name || "Unknown user"}</HeroTitle>
            </View>
            <StatusPill status={booking.status} />
          </View>

          <BodyText>{booking.car?.brand} {booking.car?.name} • {booking.car?.city}</BodyText>
          <BodyText>{booking.pickupDate} to {booking.returnDate} • {booking.days} day{booking.days > 1 ? "s" : ""}</BodyText>
          <Text style={styles.amountText}>{formatCurrency(booking.totalPrice)}</Text>
          {booking.note ? <BodyText>Note: {booking.note}</BodyText> : null}

          {booking.status === "pending" ? (
            <View style={styles.actionRow}>
              <ActionButton label="Accept" onPress={() => updateStatus(booking.id, "accepted")} small />
              <ActionButton
                label="Reject"
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
