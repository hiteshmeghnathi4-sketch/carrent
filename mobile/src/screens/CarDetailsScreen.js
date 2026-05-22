import React, { useEffect, useState } from "react";
import {
  Image,
  Platform,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useIsFocused } from "@react-navigation/native";
import DateTimePicker from "@react-native-community/datetimepicker";
import { apiRequest } from "../api";
import { useAuth } from "../context/AuthContext";
import {
  Screen,
  Panel,
  Eyebrow,
  HeroTitle,
  BodyText,
  ActionButton,
  TextField,
  StatusPill,
  LoadingPanel,
} from "../components";
import { colors, fonts, spacing } from "../theme";
import { addDays, formatCurrency, formatInputDate, getErrorMessage, parseInputDate } from "../utils";

export function CarDetailsScreen({ navigation, route }) {
  const { token, user } = useAuth();
  const isFocused = useIsFocused();
  const [car, setCar] = useState(route.params?.initialCar || null);
  const [relatedCars, setRelatedCars] = useState([]);
  const [note, setNote] = useState("");
  const [pickupDate, setPickupDate] = useState(formatInputDate(addDays(new Date(), 1)));
  const [returnDate, setReturnDate] = useState(formatInputDate(addDays(new Date(), 2)));
  const [pickerField, setPickerField] = useState("");
  const [loading, setLoading] = useState(!route.params?.initialCar);
  const [refreshing, setRefreshing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (isFocused) {
      loadCar();
    }
  }, [isFocused, route.params?.carId]);

  async function loadCar(silent = false) {
    try {
      if (silent) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError("");
      const data = await apiRequest(`/cars/${route.params.carId}`);
      setCar(data.car);
      setRelatedCars(data.relatedCars || []);
    } catch (loadError) {
      setError(getErrorMessage(loadError));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  async function submitBooking() {
    if (!token) {
      setError("Please log in to request a booking.");
      return;
    }

    try {
      setSubmitting(true);
      setError("");

      await apiRequest("/bookings", {
        method: "POST",
        token,
        body: {
          carId: car.id,
          pickupDate,
          returnDate,
          note,
        },
      });

      navigation.getParent()?.navigate("Bookings");
    } catch (bookingError) {
      setError(getErrorMessage(bookingError));
    } finally {
      setSubmitting(false);
    }
  }

  function handleDateChange(_event, selectedDate) {
    const nextDate = selectedDate || parseInputDate(pickerField === "pickup" ? pickupDate : returnDate);

    if (Platform.OS === "android") {
      setPickerField("");
    }

    if (!selectedDate) {
      return;
    }

    const formatted = formatInputDate(nextDate);

    if (pickerField === "pickup") {
      setPickupDate(formatted);
      if (formatted > returnDate) {
        setReturnDate(formatted);
      }
    } else {
      setReturnDate(formatted);
    }
  }

  if (loading && !car) {
    return (
      <Screen scroll={false}>
        <LoadingPanel title="Loading car" message="Fetching the latest details and booking availability." />
      </Screen>
    );
  }

  if (!car) {
    return (
      <Screen>
        <Panel>
          <HeroTitle>Car unavailable</HeroTitle>
          <BodyText>{error || "This car could not be loaded right now."}</BodyText>
        </Panel>
      </Screen>
    );
  }

  return (
    <Screen refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => loadCar(true)} />}>
      <Panel style={styles.heroPanel}>
        <Image source={{ uri: car.imageUrl }} style={styles.heroImage} />
        <Eyebrow>{car.city}</Eyebrow>
        <HeroTitle>{car.brand} {car.name}</HeroTitle>
        <BodyText>{car.description}</BodyText>
        <View style={styles.metaRow}>
          <StatusPill status={car.category} />
          <StatusPill status={car.transmission} />
          <StatusPill status={car.fuel} />
          <StatusPill status={`${car.seats} seats`} />
        </View>
        <Text style={styles.priceText}>{formatCurrency(car.pricePerDay)} / day</Text>
      </Panel>

      <Panel>
        <Eyebrow>Booking panel</Eyebrow>
        {user?.role === "admin" ? (
          <>
            <HeroTitle style={styles.sectionTitle}>Admin accounts cannot book cars.</HeroTitle>
            <BodyText>Use the Fleet tab to edit this listing or the Bookings tab to review requests.</BodyText>
          </>
        ) : (
          <>
            <HeroTitle style={styles.sectionTitle}>Request this car</HeroTitle>
            <BodyText>Choose your trip dates and add any pickup notes for the admin team.</BodyText>

            <View style={styles.dateRow}>
              <Pressable onPress={() => setPickerField("pickup")} style={styles.dateChip}>
                <Text style={styles.dateLabel}>Pickup date</Text>
                <Text style={styles.dateValue}>{pickupDate}</Text>
              </Pressable>
              <Pressable onPress={() => setPickerField("return")} style={styles.dateChip}>
                <Text style={styles.dateLabel}>Return date</Text>
                <Text style={styles.dateValue}>{returnDate}</Text>
              </Pressable>
            </View>

            <TextField
              label="Notes"
              value={note}
              onChangeText={setNote}
              placeholder="Pickup preferences or trip details"
              multiline
            />

            {error ? <Text style={styles.errorText}>{error}</Text> : null}
            <ActionButton
              label={submitting ? "Submitting..." : "Request Booking"}
              onPress={submitBooking}
              disabled={submitting}
            />
          </>
        )}
      </Panel>

      <Panel>
        <Eyebrow>Nearby alternatives</Eyebrow>
        <HeroTitle style={styles.sectionTitle}>More options in {car.city}</HeroTitle>

        {!relatedCars.length ? (
          <BodyText>No related cars are listed in this city yet.</BodyText>
        ) : (
          relatedCars.map((related) => (
            <Pressable
              key={related.id}
              onPress={() => navigation.push("CarDetails", { carId: related.id, initialCar: related })}
              style={({ pressed }) => [styles.relatedCard, pressed && styles.relatedPressed]}
            >
              <Image source={{ uri: related.imageUrl }} style={styles.relatedImage} />
              <View style={styles.relatedBody}>
                <Text style={styles.relatedTitle}>{related.brand} {related.name}</Text>
                <Text style={styles.relatedPrice}>{formatCurrency(related.pricePerDay)} / day</Text>
              </View>
            </Pressable>
          ))
        )}
      </Panel>

      {pickerField ? (
        <DateTimePicker
          value={parseInputDate(pickerField === "pickup" ? pickupDate : returnDate)}
          mode="date"
          minimumDate={new Date()}
          onChange={handleDateChange}
        />
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  heroPanel: {
    padding: 0,
    overflow: "hidden",
  },
  heroImage: {
    width: "100%",
    height: 250,
    backgroundColor: colors.surfaceAlt,
  },
  metaRow: {
    flexDirection: "row",
    gap: spacing.xs,
    flexWrap: "wrap",
    paddingHorizontal: spacing.lg,
  },
  priceText: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
    color: colors.accentDark,
    fontFamily: fonts.display,
    fontSize: 24,
  },
  sectionTitle: {
    fontSize: 22,
    lineHeight: 26,
  },
  dateRow: {
    flexDirection: "row",
    gap: spacing.sm,
    flexWrap: "wrap",
  },
  dateChip: {
    flex: 1,
    minWidth: 140,
    borderRadius: 20,
    padding: spacing.md,
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1,
    borderColor: colors.border,
  },
  dateLabel: {
    color: colors.muted,
    fontFamily: fonts.medium,
    fontSize: 13,
  },
  dateValue: {
    color: colors.text,
    fontFamily: fonts.display,
    fontSize: 19,
    marginTop: 6,
  },
  errorText: {
    color: colors.danger,
    fontFamily: fonts.medium,
  },
  relatedCard: {
    flexDirection: "row",
    gap: spacing.sm,
    alignItems: "center",
    borderRadius: 20,
    backgroundColor: colors.surfaceAlt,
    padding: spacing.sm,
  },
  relatedPressed: {
    opacity: 0.92,
  },
  relatedImage: {
    width: 86,
    height: 72,
    borderRadius: 16,
    backgroundColor: colors.canvas,
  },
  relatedBody: {
    flex: 1,
    gap: 6,
  },
  relatedTitle: {
    color: colors.text,
    fontFamily: fonts.medium,
    fontSize: 15,
  },
  relatedPrice: {
    color: colors.accentDark,
    fontFamily: fonts.display,
    fontSize: 18,
  },
});
