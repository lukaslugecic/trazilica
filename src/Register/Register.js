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
  TouchableOpacity,
} from "react-native";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { ref, set } from "firebase/database";
import { useNavigation } from "@react-navigation/native";
import { auth, database } from "../../firebaseConfig";
import CustomHeader from "../components/CustomHeader";

const HEADER_HEIGHT = 64;

export const Register = () => {
  const [name, setName] = useState("");
  const [role, setRole] = useState("student");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const nav = useNavigation();

  const createProfile = async (userId) => {
    try {
      await set(ref(database, `users/${userId}`), {
        userId,
        name,
        role,
        email,
      });
      // set(ref(database, `leaderboard/${userId}`), { score: 0 });
    } catch (error) {
      console.error("Error saving profile to database: ", error);
      Alert.alert("Error", "Failed to save profile. Please try again.");
    }
  };

  const registerAndGoToMainFlow = async () => {
    if (!name.trim()) {
      console.log("Name cannot be empty.");
      Alert.alert("Validation Error", "Name cannot be empty.");
      return;
    }
    if (!email.trim() || !/\S+@\S+\.\S+/.test(email)) {
      console.log("Invalid email address.");
      Alert.alert("Validation Error", "Enter a valid email address.");
      return;
    }
    if (password.length < 6) {
      console.log("Password must be at least 6 characters long.");
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
    <Pressable style={styles.screenContainer} onPress={Keyboard.dismiss}>
      <CustomHeader title="Register" />
      <SafeAreaView style={styles.contentContainer}>
        <View style={styles.formBlock}>
          <Text style={styles.title}>Create a New Account</Text>

          <TextInput
            style={styles.input}
            placeholder="Name"
            placeholderTextColor="rgba(0,0,0,0.4)"
            value={name}
            onChangeText={setName}
          />

          <TextInput
            style={styles.input}
            placeholder="Email"
            placeholderTextColor="rgba(0,0,0,0.4)"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
          />

          <TextInput
            style={styles.input}
            placeholder="Password"
            placeholderTextColor="rgba(0,0,0,0.4)"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />

          <View style={styles.roleContainer}>
            <TouchableOpacity
              onPress={() => setRole("student")}
              style={[
                styles.roleButton,
                role === "student" && styles.roleButtonSelected,
              ]}
            >
              <Text
                style={[
                  styles.roleButtonText,
                  role === "student" && styles.roleButtonTextSelected,
                ]}
              >
                Student
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setRole("teacher")}
              style={[
                styles.roleButton,
                role === "teacher" && styles.roleButtonSelected,
              ]}
            >
              <Text
                style={[
                  styles.roleButtonText,
                  role === "teacher" && styles.roleButtonTextSelected,
                ]}
              >
                Teacher
              </Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.currentRole}>Current Role: {role}</Text>

          <TouchableOpacity
            onPress={registerAndGoToMainFlow}
            style={styles.primaryButton}
          >
            <Text style={styles.primaryButtonText}>Sign Up</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={nav.goBack}
            style={[styles.outlineButton, { marginTop: 12 }]}
          >
            <Text style={styles.outlineButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  screenContainer: {
    flex: 1,
    backgroundColor: "white",
  },
  contentContainer: {
    flex: 1,
    marginTop: HEADER_HEIGHT,
    padding: 20,
  },
  formBlock: {
    backgroundColor: "#fdfdfd",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#eee",
    padding: 16,
    marginTop: 20,
  },
  title: {
    fontSize: 22,
    fontWeight: "600",
    marginBottom: 16,
    textAlign: "center",
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    marginBottom: 12,
    backgroundColor: "#fff",
  },
  roleContainer: {
    flexDirection: "row",
    justifyContent: "center",
    marginBottom: 8,
  },
  roleButton: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 6,
    paddingVertical: 8,
    paddingHorizontal: 16,
    marginHorizontal: 8,
    backgroundColor: "#f9f9f9",
  },
  roleButtonSelected: {
    backgroundColor: "#2196F3",
    borderColor: "#2196F3",
  },
  roleButtonText: {
    fontSize: 16,
    color: "#333",
  },
  roleButtonTextSelected: {
    color: "#fff",
    fontWeight: "bold",
  },
  currentRole: {
    fontSize: 14,
    textAlign: "center",
    marginBottom: 12,
  },
  primaryButton: {
    backgroundColor: "#2196F3",
    paddingVertical: 14,
    borderRadius: 6,
    alignItems: "center",
    marginTop: 4,
  },
  primaryButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  outlineButton: {
    borderWidth: 2,
    borderColor: "#2196F3",
    borderRadius: 6,
    paddingVertical: 12,
    alignItems: "center",
  },
  outlineButtonText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#2196F3",
  },
});

export default Register;
