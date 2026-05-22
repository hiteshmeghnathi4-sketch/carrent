import React, { useState } from "react";
import { Alert, Image, Pressable, StyleSheet, Text, View } from "react-native";
import * as ImagePicker from "expo-image-picker";
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
  PhotoPreview,
} from "../components";
import { colors, spacing } from "../theme";
import { getErrorMessage } from "../utils";

export function AdminCarFormScreen({ navigation, route }) {
  const { token } = useAuth();
  const existingCar = route.params?.car || null;
  const isEdit = route.params?.mode === "edit";
  const [name, setName] = useState(existingCar?.name || "");
  const [brand, setBrand] = useState(existingCar?.brand || "");
  const [city, setCity] = useState(existingCar?.city || "");
  const [category, setCategory] = useState(existingCar?.category || "");
  const [transmission, setTransmission] = useState(existingCar?.transmission || "");
  const [fuel, setFuel] = useState(existingCar?.fuel || "");
  const [seats, setSeats] = useState(String(existingCar?.seats || 5));
  const [pricePerDay, setPricePerDay] = useState(String(existingCar?.pricePerDay || ""));
  const [image, setImage] = useState(
    existingCar?.image && !String(existingCar.image).startsWith("/uploads/") ? existingCar.image : ""
  );
  const [description, setDescription] = useState(existingCar?.description || "");
  const [available, setAvailable] = useState(existingCar?.available ?? true);
  const [featured, setFeatured] = useState(existingCar?.featured ?? false);
  const [photo, setPhoto] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function pickPhoto() {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [16, 10],
      quality: 0.85,
    });

    if (result.canceled) {
      return;
    }

    const asset = result.assets[0];
    setPhoto(asset);
  }

  async function submitCar() {
    try {
      setSaving(true);
      setError("");

      const form = new FormData();
      form.append("name", name);
      form.append("brand", brand);
      form.append("city", city);
      form.append("category", category);
      form.append("transmission", transmission);
      form.append("fuel", fuel);
      form.append("seats", seats);
      form.append("pricePerDay", pricePerDay);
      form.append("image", image);
      form.append("description", description);
      form.append("available", String(available));
      form.append("featured", String(featured));

      if (photo) {
        form.append("photo", {
          uri: photo.uri,
          name: photo.fileName || `car-photo-${Date.now()}.jpg`,
          type: photo.mimeType || "image/jpeg",
        });
      }

      const path = isEdit ? `/admin/cars/${existingCar.id}` : "/admin/cars";
      const method = isEdit ? "PUT" : "POST";

      await apiRequest(path, {
        method,
        token,
        body: form,
      });

      navigation.goBack();
    } catch (submitError) {
      setError(getErrorMessage(submitError));
    } finally {
      setSaving(false);
    }
  }

  function toggleValue(current, setter, label) {
    Alert.alert(label, `Set ${label.toLowerCase()} to ${current ? "off" : "on"}?`, [
      { text: "Cancel", style: "cancel" },
      { text: "Confirm", onPress: () => setter(!current) },
    ]);
  }

  return (
    <Screen>
      <Panel>
        <Eyebrow>{isEdit ? "Edit fleet entry" : "Add fleet entry"}</Eyebrow>
        <HeroTitle>{isEdit ? `Update ${existingCar?.name}` : "Create a new car listing"}</HeroTitle>
        <BodyText>Upload a gallery photo or keep using an external image URL as a fallback.</BodyText>
      </Panel>

      <Panel>
        <TextField label="Car name" value={name} onChangeText={setName} placeholder="Compass Trailhawk" />
        <TextField label="Brand" value={brand} onChangeText={setBrand} placeholder="Jeep" />
        <TextField label="City" value={city} onChangeText={setCity} placeholder="Delhi" />
        <TextField label="Category" value={category} onChangeText={setCategory} placeholder="SUV" />
        <TextField
          label="Transmission"
          value={transmission}
          onChangeText={setTransmission}
          placeholder="Automatic"
        />
        <TextField label="Fuel" value={fuel} onChangeText={setFuel} placeholder="Petrol" />
        <TextField label="Seats" value={seats} onChangeText={setSeats} placeholder="5" keyboardType="numeric" />
        <TextField
          label="Price per day"
          value={pricePerDay}
          onChangeText={setPricePerDay}
          placeholder="5200"
          keyboardType="numeric"
        />
        <TextField
          label="Image URL"
          value={image}
          onChangeText={setImage}
          placeholder="Optional if you choose a photo below"
          keyboardType="url"
          autoCapitalize="none"
        />
        <TextField
          label="Description"
          value={description}
          onChangeText={setDescription}
          placeholder="Tell customers what makes this car a strong pick."
          multiline
        />

        <View style={styles.toggleRow}>
          <ActionButton
            label={available ? "Available: On" : "Available: Off"}
            onPress={() => toggleValue(available, setAvailable, "Availability")}
            variant="secondary"
          />
          <ActionButton
            label={featured ? "Featured: On" : "Featured: Off"}
            onPress={() => toggleValue(featured, setFeatured, "Featured flag")}
            variant="secondary"
          />
        </View>

        <ActionButton label="Choose car photo" onPress={pickPhoto} variant="secondary" />

        <PhotoPreview
          label="Current preview"
          uri={photo?.uri || existingCar?.imageUrl || (image ? image : "")}
        />

        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        <ActionButton
          label={saving ? "Saving..." : isEdit ? "Save car changes" : "Add car"}
          onPress={submitCar}
          disabled={saving}
        />
      </Panel>
    </Screen>
  );
}

const styles = StyleSheet.create({
  toggleRow: {
    gap: spacing.sm,
  },
  errorText: {
    color: colors.danger,
  },
});
