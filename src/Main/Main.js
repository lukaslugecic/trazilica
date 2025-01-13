import React, { useEffect, useState } from "react";
import { View, Text, Button, StyleSheet } from "react-native";
import { useRoute, useNavigation } from "@react-navigation/native";
import { ref, get, child } from "firebase/database";
import { database } from "../../firebaseConfig";

const Main = () => {
  const route = useRoute();
  const navigation = useNavigation();
  // We receive the user's role and userId from route params
  const { role, userId } = route.params || { role: "student", userId: null };

  const [score, setScore] = useState(0);

  // Example: fetch user’s score from the Realtime Database (leaderboard)
  useEffect(() => {
    if (userId) {
      const dbRef = ref(database);
      get(child(dbRef, `leaderboard/${userId}`))
        .then((snapshot) => {
          if (snapshot.exists()) {
            setScore(snapshot.val().score);
          }
        })
        .catch((error) => {
          console.log("Error fetching scoreboard: ", error);
        });
    }
  }, [userId]);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Welcome to the Main Screen!</Text>

      <Text style={styles.subtitle}>Your role is: {role.toUpperCase()}</Text>

      <Text style={styles.subtitle}>Your score is: {score}</Text>

      {/* Button to go to the DetectObject screen */}
      <Button
        title="Go to Detect Object"
        onPress={() => navigation.navigate("DetectObject", { role, userId })}
      />

      {role === "teacher" ? (
        <Text style={styles.subtitle}>[Teacher Dashboard content]</Text>
      ) : (
        <Text style={styles.subtitle}>[Student Dashboard content]</Text>
      )}
    </View>
  );
};

export default Main;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 20,
  },
  subtitle: {
    fontSize: 18,
    marginBottom: 10,
  },
});
