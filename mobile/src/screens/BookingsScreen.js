import React, { useEffect, useState } from "react";
import { Image, RefreshControl, StyleSheet, Text, View } from "react-native";
import { useIsFocused } from "@react-navigation/native";
import { apiRequest } from "../api";
import { useAuth } from "../context/AuthContext";
import { Screen, Panel, Eyebrow, HeroTitle, BodyText, StatusPill, EmptyPanel, LoadingPanel } from "../components";
import { colors, fonts, spacing } from "../theme";
import { formatCurrency, getErrorMessage } from "../utils";

export function BookingsScreen() {
  const { token } = useAuth();
  const isFocused = useIsFocused();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (isFocused) {
      loadBookings();
    }
  }, [isFocused]);

  async function loadBookings(silent = false) {
    try {
      if (silent) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError("");
      const data = await apiRequest("/bookings", { token });
      setBookings(data.bookings);
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
        <LoadingPanel title="Loading bookings" message="Pulling your latest booking history." />
      </Screen>
    );
  }

  return (
    <Screen refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => loadBookings(true)} />}>
      <Panel>
        <Eyebrow>Booking history</Eyebrow>
        <HeroTitle>Track every request and approval from one timeline.</HeroTitle>
        <BodyText>Pending, accepted, and rejected statuses all stay visible inside the app.</BodyText>
        {error ? <Text style={styles.errorText}>{error}</Text> : null}
      </Panel>

      {!bookings.length ? (
        <EmptyPanel title="No bookings yet" message="Place your first booking from the Cars tab." />
      ) : null}

      {bookings.map((booking) => (
        <Panel key={booking.id} style={styles.bookingPanel}>
          <Image source={{ uri: booking.car?.imageUrl }} style={styles.bookingImage} />
          <View style={styles.bookingBody}>
            <View style={styles.headingRow}>
              <View style={styles.headingCopy}>
                <Eyebrow>{booking.car?.city}</Eyebrow>
                <HeroTitle style={styles.cardTitle}>{booking.car?.brand} {booking.car?.name}</HeroTitle>
              </View>
              <StatusPill status={booking.status} />
            </View>
            <BodyText>
              {booking.pickupDate} to {booking.returnDate} • {booking.days} day{booking.days > 1 ? "s" : ""}
            </BodyText>
            <Text style={styles.amountText}>{formatCurrency(booking.totalPrice)}</Text>
            {booking.note ? <BodyText>Note: {booking.note}</BodyText> : null}
          </View>
        </Panel>
      ))}
    </Screen>
  );
}

const styles = StyleSheet.create({
  bookingPanel: {
    padding: 0,
    overflow: "hidden",
  },
  bookingImage: {
    width: "100%",
    height: 190,
    backgroundColor: colors.surfaceAlt,
  },
  bookingBody: {
    padding: spacing.lg,
    gap: spacing.sm,
  },
  headingRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: spacing.sm,
    alignItems: "flex-start",
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
  errorText: {
    color: colors.danger,
    fontFamily: fonts.medium,
  },
});
