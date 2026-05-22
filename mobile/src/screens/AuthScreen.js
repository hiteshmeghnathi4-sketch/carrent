import React, { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Screen, Panel, Eyebrow, HeroTitle, BodyText, ActionButton, TextField } from "../components";
import { APP_NAME, API_BASE_URL } from "../config";
import { useAuth } from "../context/AuthContext";
import { colors, fonts, spacing } from "../theme";
import { getErrorMessage } from "../utils";

export function AuthScreen() {
  const { signIn, signUp } = useAuth();
  const [mode, setMode] = useState("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState(mode === "login" ? "aarav@example.com" : "");
  const [phone, setPhone] = useState("");
  const [city, setCity] = useState("");
  const [password, setPassword] = useState(mode === "login" ? "user123" : "");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit() {
    setSubmitting(true);
    setError("");

    try {
      if (mode === "login") {
        await signIn({ email, password });
      } else {
        await signUp({ name, email, phone, city, password });
      }
    } catch (submissionError) {
      setError(getErrorMessage(submissionError));
    } finally {
      setSubmitting(false);
    }
  }

  function switchMode(nextMode) {
    setMode(nextMode);
    setError("");

    if (nextMode === "login") {
      setEmail("aarav@example.com");
      setPassword("user123");
    } else {
      setEmail("");
      setPassword("");
    }
  }

  return (
    <Screen>
      <Panel>
        <Eyebrow>Android experience</Eyebrow>
        <HeroTitle>{APP_NAME} on mobile</HeroTitle>
        <BodyText>
          Sign in as a customer or admin, browse the fleet, manage bookings, and run the rental
          operation from a proper Android app shell.
        </BodyText>
      </Panel>

      <Panel>
        <View style={styles.toggleRow}>
          <Pressable
            onPress={() => switchMode("login")}
            style={[styles.toggleButton, mode === "login" && styles.toggleButtonActive]}
          >
            <Text style={[styles.toggleText, mode === "login" && styles.toggleTextActive]}>
              Login
            </Text>
          </Pressable>
          <Pressable
            onPress={() => switchMode("signup")}
            style={[styles.toggleButton, mode === "signup" && styles.toggleButtonActive]}
          >
            <Text style={[styles.toggleText, mode === "signup" && styles.toggleTextActive]}>
              Sign Up
            </Text>
          </Pressable>
        </View>

        {mode === "signup" ? (
          <TextField label="Full name" value={name} onChangeText={setName} placeholder="Aarav Mehta" />
        ) : null}

        <TextField
          label="Email"
          value={email}
          onChangeText={setEmail}
          placeholder="name@example.com"
          keyboardType="email-address"
          autoCapitalize="none"
        />

        {mode === "signup" ? (
          <>
            <TextField
              label="Mobile number"
              value={phone}
              onChangeText={setPhone}
              placeholder="9876543210"
              keyboardType="phone-pad"
            />
            <TextField label="City" value={city} onChangeText={setCity} placeholder="Bengaluru" />
          </>
        ) : null}

        <TextField
          label="Password"
          value={password}
          onChangeText={setPassword}
          placeholder="Minimum 6 characters"
          secureTextEntry
          autoCapitalize="none"
        />

        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        <ActionButton
          label={submitting ? "Please wait..." : mode === "login" ? "Login" : "Create Account"}
          onPress={handleSubmit}
          disabled={submitting}
        />
      </Panel>

      <Panel>
        <Eyebrow>Demo accounts</Eyebrow>
        <BodyText>User: aarav@example.com / user123</BodyText>
        <BodyText>Admin: admin@drivemint.com / admin123</BodyText>
        <BodyText style={styles.apiHint}>API base: {API_BASE_URL}</BodyText>
      </Panel>
    </Screen>
  );
}

const styles = StyleSheet.create({
  toggleRow: {
    flexDirection: "row",
    backgroundColor: colors.surfaceAlt,
    borderRadius: 999,
    padding: 6,
    gap: 8,
  },
  toggleButton: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 44,
    borderRadius: 999,
  },
  toggleButtonActive: {
    backgroundColor: colors.accentDark,
  },
  toggleText: {
    color: colors.muted,
    fontFamily: fonts.medium,
    fontSize: 14,
  },
  toggleTextActive: {
    color: "#FFF7F0",
  },
  errorText: {
    color: colors.danger,
    fontFamily: fonts.medium,
    fontSize: 14,
  },
  apiHint: {
    marginTop: spacing.xs,
    fontSize: 13,
  },
});
