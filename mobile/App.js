import "react-native-gesture-handler";
import React from "react";
import { NavigationContainer, DefaultTheme } from "@react-navigation/native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { StatusBar } from "expo-status-bar";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { AuthProvider, useAuth } from "./src/context/AuthContext";
import { Screen, LoadingPanel } from "./src/components";
import { colors } from "./src/theme";
import { AuthScreen } from "./src/screens/AuthScreen";
import { CarsScreen } from "./src/screens/CarsScreen";
import { CarDetailsScreen } from "./src/screens/CarDetailsScreen";
import { BookingsScreen } from "./src/screens/BookingsScreen";
import { ProfileScreen } from "./src/screens/ProfileScreen";
import { AdminDashboardScreen } from "./src/screens/AdminDashboardScreen";
import { AdminCarsScreen } from "./src/screens/AdminCarsScreen";
import { AdminCarFormScreen } from "./src/screens/AdminCarFormScreen";
import { AdminBookingsScreen } from "./src/screens/AdminBookingsScreen";
import { AdminUsersScreen } from "./src/screens/AdminUsersScreen";

const AuthStack = createNativeStackNavigator();
const UserCarStack = createNativeStackNavigator();
const AdminCarStack = createNativeStackNavigator();
const UserTabs = createBottomTabNavigator();
const AdminTabs = createBottomTabNavigator();

const navigationTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: colors.canvas,
    card: colors.surface,
    primary: colors.accent,
    text: colors.text,
    border: "rgba(22, 30, 38, 0.1)",
  },
};

const sharedScreenOptions = {
  headerStyle: {
    backgroundColor: colors.surface,
  },
  headerShadowVisible: false,
  headerTintColor: colors.text,
  headerTitleStyle: {
    fontWeight: "700",
  },
  contentStyle: {
    backgroundColor: colors.canvas,
  },
};

function UserCarStackScreen() {
  return (
    <UserCarStack.Navigator screenOptions={sharedScreenOptions}>
      <UserCarStack.Screen name="CarsList" component={CarsScreen} options={{ title: "Browse Cars" }} />
      <UserCarStack.Screen
        name="CarDetails"
        component={CarDetailsScreen}
        options={{ title: "Car Details" }}
      />
    </UserCarStack.Navigator>
  );
}

function AdminCarStackScreen() {
  return (
    <AdminCarStack.Navigator screenOptions={sharedScreenOptions}>
      <AdminCarStack.Screen name="FleetHome" component={AdminCarsScreen} options={{ title: "Manage Cars" }} />
      <AdminCarStack.Screen
        name="FleetForm"
        component={AdminCarFormScreen}
        options={({ route }) => ({
          title: route.params?.mode === "edit" ? "Edit Car" : "Add Car",
        })}
      />
    </AdminCarStack.Navigator>
  );
}

function UserTabNavigator() {
  return (
    <UserTabs.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: colors.muted,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: "rgba(22, 30, 38, 0.08)",
          height: 68,
          paddingBottom: 8,
          paddingTop: 8,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: "700",
        },
      }}
    >
      <UserTabs.Screen name="Cars" component={UserCarStackScreen} />
      <UserTabs.Screen name="Bookings" component={BookingsScreen} />
      <UserTabs.Screen name="Profile" component={ProfileScreen} />
    </UserTabs.Navigator>
  );
}

function AdminTabNavigator() {
  return (
    <AdminTabs.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: colors.muted,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: "rgba(22, 30, 38, 0.08)",
          height: 68,
          paddingBottom: 8,
          paddingTop: 8,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: "700",
        },
      }}
    >
      <AdminTabs.Screen name="Dashboard" component={AdminDashboardScreen} />
      <AdminTabs.Screen name="Fleet" component={AdminCarStackScreen} />
      <AdminTabs.Screen name="Bookings" component={AdminBookingsScreen} />
      <AdminTabs.Screen name="Users" component={AdminUsersScreen} />
      <AdminTabs.Screen name="Profile" component={ProfileScreen} />
    </AdminTabs.Navigator>
  );
}

function AppContent() {
  const { ready, user } = useAuth();

  if (!ready) {
    return (
      <Screen scroll={false}>
        <LoadingPanel title="Booting DriveMint mobile" message="Restoring your session and preparing the app." />
      </Screen>
    );
  }

  if (!user) {
    return (
      <AuthStack.Navigator screenOptions={sharedScreenOptions}>
        <AuthStack.Screen name="Auth" component={AuthScreen} options={{ headerShown: false }} />
      </AuthStack.Navigator>
    );
  }

  return user.role === "admin" ? <AdminTabNavigator /> : <UserTabNavigator />;
}

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <AuthProvider>
          <NavigationContainer theme={navigationTheme}>
            <StatusBar style="dark" />
            <AppContent />
          </NavigationContainer>
        </AuthProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
