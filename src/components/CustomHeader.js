import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";

const HEADER_HEIGHT = 64;

const CustomHeader = ({ title }) => {
  const navigation = useNavigation();
  const route = useRoute();

  // If there's a previous route in the navigation stack, show back button
  const canGoBack = navigation.canGoBack();

  return (
    <View style={styles.headerContainer}>
      {canGoBack ? (
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>
      ) : (
        // If there's no previous route, render an empty placeholder
        <View style={styles.backButtonPlaceholder} />
      )}

      <Text style={styles.headerTitle}>{title || route.name}</Text>

      {/* Right placeholder if you want an icon or want the title centered */}
      <View style={styles.rightPlaceholder} />
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
});

export default CustomHeader;
