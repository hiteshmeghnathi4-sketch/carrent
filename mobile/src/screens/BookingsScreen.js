import React, { useEffect, useState } from "react";
import { Image, RefreshControl, StyleSheet, Text, View } from "react-native";
import { useIsFocused } from "@react-navigation/native";
import { apiRequest } from "../api";
import { useAuth } from "../context/AuthContext";
import {
  Screen,
  Panel,
  Eyebrow,
  HeroTitle,
  BodyText,
  StatusPill,
  EmptyPanel,
  LoadingPanel,
} from "../components";
import { formatDays, translateCity } from "../i18n";
import { colors, fonts, spacing } from "../theme";
import { formatCurrency, formatDateRange, getErrorMessage } from "../utils";

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
        <LoadingPanel title="બુકિંગ્સ લોડ થઈ રહી છે" message="તમારો તાજો બુકિંગ ઇતિહાસ લાવવામાં આવી રહ્યો છે." />
      </Screen>
    );
  }

  return (
    <Screen refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => loadBookings(true)} />}>
      <Panel>
        <Eyebrow>બુકિંગ ઇતિહાસ</Eyebrow>
        <HeroTitle>એક જ સમયરેખામાં બધી વિનંતીઓ અને મંજૂરીઓ જુઓ.</HeroTitle>
        <BodyText>બાકી, મંજૂર અને નકારેલ બધી સ્થિતિઓ એપમાં જ દેખાય છે.</BodyText>
        {error ? <Text style={styles.errorText}>{error}</Text> : null}
      </Panel>

      {!bookings.length ? (
        <EmptyPanel title="હજુ સુધી કોઈ બુકિંગ નથી" message="કાર્સ ટેબમાંથી તમારી પ્રથમ બુકિંગ કરો." />
      ) : null}

      {bookings.map((booking) => (
        <Panel key={booking.id} style={styles.bookingPanel}>
          <Image source={{ uri: booking.car?.imageUrl }} style={styles.bookingImage} />
          <View style={styles.bookingBody}>
            <View style={styles.headingRow}>
              <View style={styles.headingCopy}>
                <Eyebrow>{translateCity(booking.car?.city)}</Eyebrow>
                <HeroTitle style={styles.cardTitle}>{booking.car?.brand} {booking.car?.name}</HeroTitle>
              </View>
              <StatusPill status={booking.status} />
            </View>
            <BodyText>{formatDateRange(booking.pickupDate, booking.returnDate)} • {formatDays(booking.days)}</BodyText>
            <Text style={styles.amountText}>{formatCurrency(booking.totalPrice)}</Text>
            {booking.note ? <BodyText>નોંધ: {booking.note}</BodyText> : null}
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
