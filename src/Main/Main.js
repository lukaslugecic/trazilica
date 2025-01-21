import React, { useEffect, useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import {
  useRoute,
  useNavigation,
  useFocusEffect,
} from "@react-navigation/native";
import { ref, get, child } from "firebase/database";
import { database } from "../../firebaseConfig";
import CustomHeader from "../components/CustomHeader";

const HEADER_HEIGHT = 64;

const Main = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const { role, userId } = route.params || { role: "student", userId: null };
  const [score, setScore] = useState(0);
  const [userName, setUserName] = useState("");

  useEffect(() => {
    const fetchUserName = async () => {
      if (userId) {
        try {
          const userRef = ref(database, `users/${userId}`);
          const snapshot = await get(userRef);
          if (snapshot.exists()) {
            setUserName(snapshot.val().name || "");
          }
        } catch (error) {
          console.log("Error fetching username:", error);
        }
      }
    };

    fetchUserName();
  }, [userId]);

  const goToDetectObject = () => {
    navigation.navigate("DetectObject", { role, userId });
  };

  const goToGroups = () => {
    navigation.navigate("Groups", { role, userId });
  };

  const renderTeacherView = () => (
    <>
      <Text style={styles.title}>Teacher Dashboard</Text>
      <Text style={styles.description}>
        Welcome, {userName}! Create and manage groups, set tasks for students to
        find
      </Text>

      <TouchableOpacity
        onPress={() => navigation.navigate("Groups", { role, userId })}
        style={styles.button}
      >
        <Text style={styles.buttonText}>Manage Groups</Text>
      </TouchableOpacity>
    </>
  );

  const renderStudentView = () => (
    <>
      <Text style={styles.title}>Student Dashboard</Text>

      <Text style={styles.description}>
        Welcome, {userName}! Join groups and find objects to earn points!
      </Text>

      <TouchableOpacity
        onPress={() => navigation.navigate("Groups", { role, userId })}
        style={styles.button}
      >
        <Text style={styles.buttonText}>My Groups</Text>
      </TouchableOpacity>
    </>
  );

  return (
    <View style={styles.screenContainer}>
      <CustomHeader title="Dashboard" />
      <View style={styles.contentContainer}>
        {role === "teacher" ? renderTeacherView() : renderStudentView()}
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
  description: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    marginBottom: 30,
    paddingHorizontal: 20,
  },
});
