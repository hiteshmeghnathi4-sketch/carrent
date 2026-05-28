import React, { useState } from "react";
import { Alert, StyleSheet, Text, View } from "react-native";
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
    Alert.alert(label, `${label} ને ${current ? "બંધ" : "ચાલુ"} કરવું છે?`, [
      { text: "રદ કરો", style: "cancel" },
      { text: "પુષ્ટિ કરો", onPress: () => setter(!current) },
    ]);
  }

  return (
    <Screen>
      <Panel>
        <Eyebrow>{isEdit ? "ફ્લીટ એન્ટ્રી સંપાદિત કરો" : "ફ્લીટ એન્ટ્રી ઉમેરો"}</Eyebrow>
        <HeroTitle>{isEdit ? `${existingCar?.name} અપડેટ કરો` : "નવી કાર લિસ્ટિંગ બનાવો"}</HeroTitle>
        <BodyText>ગેલેરીમાંથી ફોટો અપલોડ કરો અથવા જરૂર હોય તો ઇમેજ URL નો ઉપયોગ કરો.</BodyText>
      </Panel>

      <Panel>
        <TextField label="કારનું નામ" value={name} onChangeText={setName} placeholder="Compass Trailhawk" />
        <TextField label="બ્રાન્ડ" value={brand} onChangeText={setBrand} placeholder="Jeep" />
        <TextField label="શહેર" value={city} onChangeText={setCity} placeholder="દિલ્હી" />
        <TextField label="કેટેગરી" value={category} onChangeText={setCategory} placeholder="એસયુવી" />
        <TextField
          label="ટ્રાન્સમિશન"
          value={transmission}
          onChangeText={setTransmission}
          placeholder="ઓટોમેટિક"
        />
        <TextField label="ફ્યુઅલ" value={fuel} onChangeText={setFuel} placeholder="પેટ્રોલ" />
        <TextField label="બેઠકો" value={seats} onChangeText={setSeats} placeholder="5" keyboardType="numeric" />
        <TextField
          label="દિવસ દીઠ કિંમત"
          value={pricePerDay}
          onChangeText={setPricePerDay}
          placeholder="5200"
          keyboardType="numeric"
        />
        <TextField
          label="ઇમેજ URL"
          value={image}
          onChangeText={setImage}
          placeholder="નીચે ફોટો પસંદ કરો તો આ વૈકલ્પિક છે"
          keyboardType="url"
          autoCapitalize="none"
        />
        <TextField
          label="વર્ણન"
          value={description}
          onChangeText={setDescription}
          placeholder="ગ્રાહકોને આ કાર કેમ સારી પસંદગી છે તે લખો."
          multiline
        />

        <View style={styles.toggleRow}>
          <ActionButton
            label={available ? "ઉપલબ્ધ: ચાલુ" : "ઉપલબ્ધ: બંધ"}
            onPress={() => toggleValue(available, setAvailable, "ઉપલબ્ધતા")}
            variant="secondary"
          />
          <ActionButton
            label={featured ? "ફીચર્ડ: ચાલુ" : "ફીચર્ડ: બંધ"}
            onPress={() => toggleValue(featured, setFeatured, "ફીચર્ડ ફ્લેગ")}
            variant="secondary"
          />
        </View>

        <ActionButton label="કારનો ફોટો પસંદ કરો" onPress={pickPhoto} variant="secondary" />

        <PhotoPreview
          label="હાલનું પ્રિવ્યુ"
          uri={photo?.uri || existingCar?.imageUrl || (image ? image : "")}
        />

        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        <ActionButton
          label={saving ? "સંગ્રહિત થઈ રહ્યું છે..." : isEdit ? "કારમાં ફેરફાર સંગ્રહિત કરો" : "કાર ઉમેરો"}
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
