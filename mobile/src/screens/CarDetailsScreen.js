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
import { formatSeats, translateCity, translateDescription } from "../i18n";
import { colors, fonts, spacing } from "../theme";
import {
  addDays,
  formatCurrency,
  formatInputDate,
  getErrorMessage,
  parseInputDate,
} from "../utils";

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
      setError("બુકિંગ વિનંતી કરવા માટે કૃપા કરીને લોગિન કરો.");
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
    const nextDate =
      selectedDate || parseInputDate(pickerField === "pickup" ? pickupDate : returnDate);

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
        <LoadingPanel title="કાર લોડ થઈ રહી છે" message="નવીનતમ વિગતો અને બુકિંગ ઉપલબ્ધતા લાવવામાં આવી રહી છે." />
      </Screen>
    );
  }

  if (!car) {
    return (
      <Screen>
        <Panel>
          <HeroTitle>કાર ઉપલબ્ધ નથી</HeroTitle>
          <BodyText>{error || "આ કાર હાલ લોડ થઈ શકી નથી."}</BodyText>
        </Panel>
      </Screen>
    );
  }

  return (
    <Screen refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => loadCar(true)} />}>
      <Panel style={styles.heroPanel}>
        <Image source={{ uri: car.imageUrl }} style={styles.heroImage} />
        <Eyebrow>{translateCity(car.city)}</Eyebrow>
        <HeroTitle>{car.brand} {car.name}</HeroTitle>
        <BodyText>{translateDescription(car.description)}</BodyText>
        <View style={styles.metaRow}>
          <StatusPill status={car.category} />
          <StatusPill status={car.transmission} />
          <StatusPill status={car.fuel} />
          <StatusPill status={formatSeats(car.seats)} />
        </View>
        <Text style={styles.priceText}>{formatCurrency(car.pricePerDay)} / દિવસ</Text>
      </Panel>

      <Panel>
        <Eyebrow>બુકિંગ પેનલ</Eyebrow>
        {user?.role === "admin" ? (
          <>
            <HeroTitle style={styles.sectionTitle}>એડમિન એકાઉન્ટ કાર બુક કરી શકતું નથી.</HeroTitle>
            <BodyText>આ લિસ્ટિંગમાં ફેરફાર કરવા ફ્લીટ ટેબનો ઉપયોગ કરો અથવા વિનંતીઓ જોવા બુકિંગ્સ ટેબ ખોલો.</BodyText>
          </>
        ) : (
          <>
            <HeroTitle style={styles.sectionTitle}>આ કાર માટે વિનંતી કરો</HeroTitle>
            <BodyText>તમારી મુસાફરીની તારીખો પસંદ કરો અને એડમિન ટીમ માટે પિકઅપ નોંધ ઉમેરો.</BodyText>

            <View style={styles.dateRow}>
              <Pressable onPress={() => setPickerField("pickup")} style={styles.dateChip}>
                <Text style={styles.dateLabel}>પિકઅપ તારીખ</Text>
                <Text style={styles.dateValue}>{pickupDate}</Text>
              </Pressable>
              <Pressable onPress={() => setPickerField("return")} style={styles.dateChip}>
                <Text style={styles.dateLabel}>રિટર્ન તારીખ</Text>
                <Text style={styles.dateValue}>{returnDate}</Text>
              </Pressable>
            </View>

            <TextField
              label="નોંધ"
              value={note}
              onChangeText={setNote}
              placeholder="પિકઅપ પસંદગીઓ અથવા મુસાફરીની વિગતો"
              multiline
            />

            {error ? <Text style={styles.errorText}>{error}</Text> : null}
            <ActionButton
              label={submitting ? "મોકલાઈ રહ્યું છે..." : "બુકિંગ વિનંતી કરો"}
              onPress={submitBooking}
              disabled={submitting}
            />
          </>
        )}
      </Panel>

      <Panel>
        <Eyebrow>નજીકના વિકલ્પો</Eyebrow>
        <HeroTitle style={styles.sectionTitle}>{translateCity(car.city)} માં વધુ વિકલ્પો</HeroTitle>

        {!relatedCars.length ? (
          <BodyText>આ શહેરમાં સંબંધિત કાર્સ હજી સૂચિબદ્ધ નથી.</BodyText>
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
                <Text style={styles.relatedPrice}>{formatCurrency(related.pricePerDay)} / દિવસ</Text>
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
