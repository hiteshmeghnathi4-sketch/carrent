import React, { useEffect, useState } from "react";
import { Image, Pressable, RefreshControl, StyleSheet, Text, TextInput, View } from "react-native";
import { useIsFocused } from "@react-navigation/native";
import { apiRequest } from "../api";
import { Screen, Panel, Eyebrow, HeroTitle, BodyText, ActionButton, StatusPill, EmptyPanel, LoadingPanel } from "../components";
import { formatSeats, translateDescription, translateFuel, translateTransmission } from "../i18n";
import { colors, fonts, radius, spacing } from "../theme";
import { formatCurrency, getErrorMessage } from "../utils";

export function CarsScreen({ navigation }) {
  const isFocused = useIsFocused();
  const [city, setCity] = useState("");
  const [cars, setCars] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (isFocused) {
      loadCars();
    }
  }, [isFocused]);

  async function loadCars(nextCity = city, silent = false) {
    try {
      if (silent) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError("");
      const query = nextCity ? `?city=${encodeURIComponent(nextCity)}` : "";
      const data = await apiRequest(`/cars${query}`);
      setCars(data.cars);
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
        <LoadingPanel title="ફ્લીટ લોડ થઈ રહી છે" message="તમારી મુસાફરી માટે નવીનતમ ઉપલબ્ધ કાર્સ લાવવામાં આવી રહી છે." />
      </Screen>
    );
  }

  return (
    <Screen refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => loadCars(city, true)} />}>
      <Panel>
        <Eyebrow>કાર્સ જુઓ</Eyebrow>
        <HeroTitle>શહેર પ્રમાણે શોધો અને મુસાફરી દરમિયાન જ ફ્લીટ સરખાવો.</HeroTitle>
        <BodyText>
          શહેર પ્રમાણે ફિલ્ટર કરો, કારની પ્રોફાઇલ ખોલો અને એપ છોડ્યા વગર બુકિંગ વિનંતી કરો.
        </BodyText>

        <View style={styles.searchRow}>
          <TextInput
            value={city}
            onChangeText={setCity}
            placeholder="દિલ્હી, મુંબઈ, બેંગલુરુ..."
            placeholderTextColor={colors.muted}
            style={styles.searchInput}
          />
          <ActionButton label="શોધો" onPress={() => loadCars(city)} />
        </View>

        {city ? <ActionButton label="શહેર ફિલ્ટર સાફ કરો" onPress={() => { setCity(""); loadCars(""); }} variant="secondary" /> : null}
        {error ? <Text style={styles.errorText}>{error}</Text> : null}
      </Panel>

      {!cars.length ? (
        <EmptyPanel title="કોઈ કાર મળી નથી" message="બીજું શહેર અજમાવો અથવા સંપૂર્ણ ફ્લીટ જોવા માટે ફિલ્ટર સાફ કરો." />
      ) : null}

      {cars.map((car) => (
        <Pressable
          key={car.id}
          onPress={() => navigation.navigate("CarDetails", { carId: car.id, initialCar: car })}
          style={({ pressed }) => [styles.cardPressable, pressed && styles.cardPressed]}
        >
          <Panel style={styles.carCard}>
            <Image source={{ uri: car.imageUrl }} style={styles.carImage} />
            <View style={styles.cardBody}>
              <View style={styles.topRow}>
                <StatusPill status={car.city} />
                <StatusPill status={car.category} />
              </View>
              <HeroTitle style={styles.cardTitle}>{car.brand} {car.name}</HeroTitle>
              <BodyText>{translateDescription(car.description)}</BodyText>
              <View style={styles.metaRow}>
                <Text style={styles.metaText}>{translateTransmission(car.transmission)}</Text>
                <Text style={styles.metaText}>{translateFuel(car.fuel)}</Text>
                <Text style={styles.metaText}>{formatSeats(car.seats)}</Text>
              </View>
              <Text style={styles.priceText}>{formatCurrency(car.pricePerDay)} / દિવસ</Text>
            </View>
          </Panel>
        </Pressable>
      ))}
    </Screen>
  );
}

const styles = StyleSheet.create({
  searchRow: {
    gap: spacing.sm,
  },
  searchInput: {
    minHeight: 50,
    borderRadius: 18,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 15,
    color: colors.text,
    fontFamily: fonts.body,
  },
  errorText: {
    color: colors.danger,
    fontFamily: fonts.medium,
  },
  cardPressable: {
    borderRadius: radius.lg,
  },
  cardPressed: {
    opacity: 0.95,
  },
  carCard: {
    padding: 0,
    overflow: "hidden",
  },
  carImage: {
    width: "100%",
    height: 220,
    backgroundColor: colors.surfaceAlt,
  },
  cardBody: {
    padding: spacing.lg,
    gap: spacing.sm,
  },
  topRow: {
    flexDirection: "row",
    gap: spacing.xs,
    flexWrap: "wrap",
  },
  cardTitle: {
    fontSize: 24,
    lineHeight: 28,
  },
  metaRow: {
    flexDirection: "row",
    gap: spacing.sm,
    flexWrap: "wrap",
  },
  metaText: {
    color: colors.muted,
    fontFamily: fonts.medium,
  },
  priceText: {
    color: colors.accentDark,
    fontFamily: fonts.display,
    fontSize: 22,
  },
});
