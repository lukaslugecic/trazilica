import { useNavigation } from "@react-navigation/native";
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
import { signInWithEmailAndPassword } from "firebase/auth";
import { ref, get, child } from "firebase/database";
import { auth, database } from "../../firebaseConfig";
import CustomHeader from "../components/CustomHeader";

const HEADER_HEIGHT = 64;

export const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const nav = useNavigation();

  const goToRegistration = () => {
    nav.push("Register");
  };

  const goToMainFlow = async () => {
    if (!email || !password) {
      Alert.alert("Validation Error", "Email and password must not be empty.");
      return;
    }
    try {
      const response = await signInWithEmailAndPassword(auth, email, password);
      console.log("Login response: ", response);
      if (response.user) {
        const userId = response.user.uid;
        const snapshot = await get(child(ref(database), `users/${userId}`));
        if (snapshot.exists()) {
          const userData = snapshot.val();
          const userRole = userData.role || "student";
          nav.replace("Main", { userId, role: userRole });
        } else {
          Alert.alert(
            "Error",
            "Unable to find user data in database. Please register."
          );
        }
      }
    } catch (error) {
      Alert.alert("Login Error", error.message || "Please try again.");
    }
  };

  return (
    <Pressable style={styles.screenContainer} onPress={Keyboard.dismiss}>
      <CustomHeader title="Login" />
      <SafeAreaView style={styles.contentContainer}>
        <View style={styles.formBlock}>
          <Text style={styles.title}>Welcome Back</Text>
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

          <TouchableOpacity onPress={goToMainFlow} style={styles.primaryButton}>
            <Text style={styles.primaryButtonText}>Login</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={goToRegistration}
            style={[styles.outlineButton, { marginTop: 12 }]}
          >
            <Text style={styles.outlineButtonText}>Sign Up</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  screenContainer: {
    flex: 1,
    backgroundColor: "#fff",
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
    fontSize: 24,
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

export default Login;
