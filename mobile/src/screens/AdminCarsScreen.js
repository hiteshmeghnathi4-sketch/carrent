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
    Alert.alert("Delete car", `Remove ${car.brand} ${car.name} from the fleet?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
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
        <LoadingPanel title="Loading fleet" message="Syncing the latest cars and availability states." />
      </Screen>
    );
  }

  return (
    <Screen refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => loadCars(true)} />}>
      <Panel>
        <Eyebrow>Fleet management</Eyebrow>
        <HeroTitle>Add, edit, and remove rental listings from Android.</HeroTitle>
        <BodyText>Admins can maintain inventory here, including locally picked photos.</BodyText>
        <ActionButton label="Add new car" onPress={() => navigation.navigate("FleetForm", { mode: "create" })} />
        {error ? <Text style={styles.errorText}>{error}</Text> : null}
      </Panel>

      {!cars.length ? <EmptyPanel title="No cars yet" message="Add your first fleet listing to get started." /> : null}

      {cars.map((car) => (
        <Panel key={car.id} style={styles.cardPanel}>
          <Image source={{ uri: car.imageUrl }} style={styles.cardImage} />
          <View style={styles.cardBody}>
            <View style={styles.topRow}>
              <View style={styles.copy}>
                <Eyebrow>{car.city}</Eyebrow>
                <HeroTitle style={styles.cardTitle}>{car.brand} {car.name}</HeroTitle>
              </View>
              <StatusPill status={car.available ? "available" : "unavailable"} />
            </View>

            <BodyText>{car.category} • {car.transmission} • {car.fuel}</BodyText>
            <Text style={styles.priceText}>{formatCurrency(car.pricePerDay)} / day</Text>

            <View style={styles.actionRow}>
              <ActionButton
                label="Edit"
                onPress={() => navigation.navigate("FleetForm", { mode: "edit", car })}
                variant="secondary"
                small
              />
              <ActionButton label="Delete" onPress={() => confirmDelete(car)} variant="danger" small />
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
