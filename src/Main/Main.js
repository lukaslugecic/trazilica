import React, { useEffect, useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import {useRoute, useNavigation, useFocusEffect} from "@react-navigation/native";
import { ref, get, child } from "firebase/database";
import { database } from "../../firebaseConfig";
import CustomHeader from "../components/CustomHeader";

const HEADER_HEIGHT = 64;

const Main = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const { role, userId } = route.params || { role: "student", userId: null };
  const [score, setScore] = useState(0);

  useFocusEffect(
      React.useCallback(() => {
        const fetchScore = async () => {
          if (userId) {
            const dbRef = ref(database);
            try {
              const snapshot = await get(child(dbRef, `leaderboard/${userId}`));
              if (snapshot.exists()) {
                setScore(snapshot.val().score);
              }
            } catch (error) {
              console.log("Error fetching scoreboard: ", error);
            }
          }
        };

        fetchScore();
      }, [userId])
  );

  const goToDetectObject = () => {
    navigation.navigate("DetectObject", { role, userId });
  };

  const goToGroups = () => {
    navigation.navigate("Groups", { role, userId });
  };

  return (
    <View style={styles.screenContainer}>
      <CustomHeader title="Main" />
      <View style={styles.contentContainer}>
        <Text style={styles.title}>Welcome to the Main Screen!</Text>
        <Text style={styles.subTitle}>Your role is: {role.toUpperCase()}</Text>
        <Text style={styles.subTitle}>Your global score is: {score}</Text>

        <TouchableOpacity onPress={goToDetectObject} style={styles.button}>
          <Text style={styles.buttonText}>Detect Objects</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={goToGroups} style={styles.button}>
          <Text style={styles.buttonText}>Groups</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default Main;

const styles = StyleSheet.create({
  screenContainer: {
    flex: 1,
    backgroundColor: "#fff",
  },
  contentContainer: {
    flex: 1,
    marginTop: HEADER_HEIGHT,
    padding: 20,
    alignItems: "center",
  },
  title: {
    fontSize: 26,
    fontWeight: "bold",
    marginBottom: 10,
    textAlign: "center",
  },
  subTitle: {
    fontSize: 16,
    marginBottom: 15,
    textAlign: "center",
    color: "#333",
  },
  button: {
    backgroundColor: "#2196F3",
    paddingVertical: 14,
    paddingHorizontal: 22,
    borderRadius: 6,
    marginVertical: 8,
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
});
