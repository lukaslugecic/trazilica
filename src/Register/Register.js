import React, { useState } from "react";
import {
  SafeAreaView,
  View,
  Text,
  StyleSheet,
  TextInput,
  Pressable,
  Keyboard,
  Alert,
  Button,
} from "react-native";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { ref, set, get } from "firebase/database";
import { useNavigation } from "@react-navigation/native";
import { auth, database } from "../../firebaseConfig";

export const Register = () => {
  const [name, setName] = useState("");
  const [role, setRole] = useState("student"); // Default
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const nav = useNavigation();

  const createProfile = async (userId) => {
    try {
      const user = await get(ref(database, `users/${email}`));
      console.log("User: ", user);

      await set(ref(database, `users/${userId}`), {
        name,
        role,
        email,
      });
      await set(ref(database, `leaderboard/${userId}`), { score: 0 });
    } catch (error) {
      console.error("Error saving profile to database: ", error);
      Alert.alert("Error", "Failed to save profile. Please try again.");
    }
  };

  const registerAndGoToMainFlow = async () => {
    if (!name.trim()) {
      Alert.alert("Validation Error", "Name cannot be empty.");
      return;
    }
    if (!email.trim() || !/\S+@\S+\.\S+/.test(email)) {
      Alert.alert("Validation Error", "Enter a valid email address.");
      return;
    }
    if (password.length < 6) {
      Alert.alert(
        "Validation Error",
        "Password must be at least 6 characters long."
      );
      return;
    }

    try {
      const response = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );
      if (response.user) {
        const userId = response.user.uid;
        await createProfile(userId);

        Alert.alert("Success", "Account created successfully!");
        nav.replace("Main", { userId, role });
      }
    } catch (error) {
      console.error("Error during registration: ", error);
      const errorMessage = error.message || "Please try again.";
      Alert.alert("Registration Error", errorMessage);
    }
  };

  return (
    <Pressable style={styles.contentView} onPress={Keyboard.dismiss}>
      <SafeAreaView style={styles.contentView}>
        <View style={styles.container}>
          <View style={styles.titleContainer}>
            <Text style={styles.titleText}>Register</Text>
          </View>
          <View style={styles.mainContent}>
            <TextInput
              style={styles.loginTextField}
              placeholder="Name"
              value={name}
              onChangeText={setName}
            />
            <TextInput
              style={styles.loginTextField}
              placeholder="Email"
              value={email}
              onChangeText={setEmail}
              inputMode="email"
              autoCapitalize="none"
            />
            <TextInput
              style={styles.loginTextField}
              placeholder="Password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
            />
            <View style={{ flexDirection: "row", marginVertical: 10 }}>
              <Button
                title="Student"
                onPress={() => setRole("student")}
                color={role === "student" ? "#2196F3" : "#B0BEC5"}
              />
              <View style={{ width: 20 }} />
              <Button
                title="Teacher"
                onPress={() => setRole("teacher")}
                color={role === "teacher" ? "#2196F3" : "#B0BEC5"}
              />
            </View>
            <Text>Current Role: {role}</Text>
          </View>

          <Button
            title="Sign Up"
            onPress={registerAndGoToMainFlow}
            color="#2196F3"
          />
          <Button title="Go Back" onPress={nav.goBack} color="#FF5722" />
        </View>
      </SafeAreaView>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  contentView: {
    flex: 1,
    backgroundColor: "white",
  },
  container: {
    flex: 1,
    marginHorizontal: 20,
    backgroundColor: "white",
    paddingTop: 20,
  },
  titleContainer: {
    flex: 1.2,
    justifyContent: "center",
  },
  titleText: {
    fontSize: 36,
    textAlign: "center",
    fontWeight: "bold",
  },
  loginTextField: {
    borderBottomWidth: 1,
    height: 50,
    fontSize: 18,
    marginVertical: 10,
    paddingHorizontal: 8,
  },
  mainContent: {
    flex: 6,
  },
});
