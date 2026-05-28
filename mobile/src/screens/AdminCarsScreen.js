import React, { useEffect, useState } from "react";
import { Alert, Image, Pressable, RefreshControl, StyleSheet, Text, View } from "react-native";
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
import { translateCategory, translateCity, translateFuel, translateTransmission } from "../i18n";
import { colors, fonts, spacing } from "../theme";
import { formatCurrency, getErrorMessage } from "../utils";

export function AdminCarsScreen({ navigation }) {
  const { token } = useAuth();
  const isFocused = useIsFocused();
  const [cars, setCars] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (isFocused) {
      loadCars();
    }
  }, [isFocused]);

  async function loadCars(silent = false) {
    try {
      if (silent) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError("");
      const data = await apiRequest("/admin/cars", { token });
      setCars(data.cars);
    } catch (loadError) {
      setError(getErrorMessage(loadError));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  function confirmDelete(car) {
    Alert.alert("કાર ડિલીટ કરો", `${car.brand} ${car.name} ને ફ્લીટમાંથી દૂર કરવી છે?`, [
      { text: "રદ કરો", style: "cancel" },
      {
        text: "ડિલીટ",
        style: "destructive",
        onPress: async () => {
          try {
            await apiRequest(`/admin/cars/${car.id}`, {
              method: "DELETE",
              token,
            });
            await loadCars(true);
          } catch (deleteError) {
            setError(getErrorMessage(deleteError));
          }
        },
      },
    ]);
  }

  if (loading) {
    return (
      <Screen scroll={false}>
        <LoadingPanel title="ફ્લીટ લોડ થઈ રહી છે" message="નવીનતમ કાર્સ અને ઉપલબ્ધતા સ્થિતિ સમન્વયિત થઈ રહી છે." />
      </Screen>
    );
  }

  return (
    <Screen refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => loadCars(true)} />}>
      <Panel>
        <Eyebrow>ફ્લીટ મેનેજમેન્ટ</Eyebrow>
        <HeroTitle>એન્ડ્રોઇડથી જ રેન્ટલ લિસ્ટિંગ ઉમેરો, ફેરફાર કરો અને દૂર કરો.</HeroTitle>
        <BodyText>એડમિન અહીં ઇન્વેન્ટરી સંભાળી શકે છે, જેમાં ગેલેરીમાંથી પસંદ કરેલા ફોટા પણ સામેલ છે.</BodyText>
        <ActionButton label="નવી કાર ઉમેરો" onPress={() => navigation.navigate("FleetForm", { mode: "create" })} />
        {error ? <Text style={styles.errorText}>{error}</Text> : null}
      </Panel>

      {!cars.length ? <EmptyPanel title="હજુ સુધી કોઈ કાર નથી" message="શરૂઆત કરવા માટે તમારી પ્રથમ ફ્લીટ લિસ્ટિંગ ઉમેરો." /> : null}

      {cars.map((car) => (
        <Panel key={car.id} style={styles.cardPanel}>
          <Image source={{ uri: car.imageUrl }} style={styles.cardImage} />
          <View style={styles.cardBody}>
            <View style={styles.topRow}>
              <View style={styles.copy}>
                <Eyebrow>{translateCity(car.city)}</Eyebrow>
                <HeroTitle style={styles.cardTitle}>{car.brand} {car.name}</HeroTitle>
              </View>
              <StatusPill status={car.available ? "available" : "unavailable"} />
            </View>

            <BodyText>{translateCategory(car.category)} • {translateTransmission(car.transmission)} • {translateFuel(car.fuel)}</BodyText>
            <Text style={styles.priceText}>{formatCurrency(car.pricePerDay)} / દિવસ</Text>

            <View style={styles.actionRow}>
              <ActionButton
                label="સંપાદિત કરો"
                onPress={() => navigation.navigate("FleetForm", { mode: "edit", car })}
                variant="secondary"
                small
              />
              <ActionButton label="ડિલીટ" onPress={() => confirmDelete(car)} variant="danger" small />
            </View>
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
  cardPanel: {
    padding: 0,
    overflow: "hidden",
  },
  cardImage: {
    width: "100%",
    height: 210,
    backgroundColor: colors.surfaceAlt,
  },
  cardBody: {
    padding: spacing.lg,
    gap: spacing.sm,
  },
  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: spacing.sm,
    alignItems: "flex-start",
  },
  copy: {
    flex: 1,
    gap: 4,
  },
  cardTitle: {
    fontSize: 22,
    lineHeight: 26,
  },
  priceText: {
    color: colors.accentDark,
    fontFamily: fonts.display,
    fontSize: 21,
  },
  actionRow: {
    flexDirection: "row",
    gap: spacing.sm,
  },
});
