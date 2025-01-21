import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import { auth } from "../../firebaseConfig";
import { signOut } from "firebase/auth";

const HEADER_HEIGHT = 64;

const CustomHeader = ({ title }) => {
  const navigation = useNavigation();
  const route = useRoute();

  const isLoginScreen = route.name === "Login";

  // If there's a previous route in the navigation stack, show back button
  const canGoBack = navigation.canGoBack() && !isLoginScreen;

  const isLoggedInScreen = !["Login", "Register"].includes(route.name);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigation.reset({
        index: 0,
        routes: [{ name: "Login" }],
      });
    } catch (error) {
      console.error("Error signing out: ", error);
    }
  };

  const handleBack = () => {
    if (canGoBack) {
      const previousRoute =
        navigation.getState().routes[navigation.getState().routes.length - 2];

      if (previousRoute.name === "Main") {
        navigation.replace("Main", previousRoute.params);
      } else {
        navigation.goBack();
      }
    }
  };

  return (
    <View style={styles.headerContainer}>
      {canGoBack ? (
        <TouchableOpacity style={styles.backButton} onPress={handleBack}>
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>
      ) : (
        // If there's no previous route, render an empty placeholder
        <View style={styles.backButtonPlaceholder} />
      )}

      <Text style={styles.headerTitle}>{title || route.name}</Text>

      {isLoggedInScreen ? (
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.logoutButtonText}>Logout</Text>
        </TouchableOpacity>
      ) : (
        <View style={styles.rightPlaceholder} />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  headerContainer: {
    flexDirection: "row",
    alignItems: "center",
    height: HEADER_HEIGHT,
    backgroundColor: "#4A90E2",
    paddingHorizontal: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 4,
  },
  backButton: {
    width: 50,
    justifyContent: "center",
  },
  backButtonText: {
    color: "#fff",
    fontSize: 26,
    fontWeight: "bold",
  },
  backButtonPlaceholder: {
    width: 50,
  },
  headerTitle: {
    flex: 1,
    textAlign: "center",
    color: "#fff",
    fontWeight: "600",
    fontSize: 22,
  },
  rightPlaceholder: {
    width: 50,
  },
  logoutButton: {
    width: 50,
    justifyContent: "center",
    alignItems: "center",
  },
  logoutButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "500",
  },
});

export default CustomHeader;
