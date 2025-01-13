import {
  View,
  Text,
  TouchableOpacity,
  Image,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import React, { useState } from "react";
import axios from "axios";
import * as ImagePicker from "expo-image-picker";
import * as FileSystem from "expo-file-system";
import { useRoute } from "@react-navigation/native";
// import { ref, update } from "firebase/database"; // If you want to update scores

const DetectObject = () => {
  const route = useRoute();
  // read role and userId from route
  const { role, userId } = route.params || { role: "student", userId: null };

  const [imageUri, setImageUri] = useState(null);
  const [labels, setLabels] = useState([]);
  const [task, setTask] = useState([]);
  const [loading, setLoading] = useState(false);

  const takePhoto = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== "granted") {
        alert("Camera permission is required to take photos.");
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [3, 3],
        quality: 1,
      });

      if (!result.canceled) {
        const newUri = result.assets[0].uri;
        setImageUri(newUri);
        await analyzeImage(newUri);
      }
    } catch (err) {
      console.log("Error taking photo: ", err);
    }
  };

  const analyzeImage = async (uri) => {
    if (!uri) {
      alert("Please take a photo first.");
      return;
    }

    setLoading(true);
    try {
      // Make sure to set your Vision API URL in .env or wherever
      const apiUrl = process.env.EXPO_PUBLIC_GOOGLE_CLOUD_VISION_API_URL;

      const base64Image = await FileSystem.readAsStringAsync(uri, {
        encoding: FileSystem.EncodingType.Base64,
      });

      const requestData = {
        requests: [
          {
            image: {
              content: base64Image,
            },
            features: [
              {
                type: "LABEL_DETECTION",
                maxResults: 3,
              },
            ],
          },
        ],
      };

      const apiResponse = await axios.post(apiUrl, requestData);
      const detectedLabels = apiResponse.data.responses[0]?.labelAnnotations;

      if (detectedLabels) {
        if (role === "teacher") {
          // Show teacher the labels so they can pick
          setLabels(detectedLabels);
        } else {
          // Student: check if matches the tasks
          checkMatch(detectedLabels);
        }
      } else {
        alert("No labels detected. Try another photo.");
      }
    } catch (err) {
      console.log("Error analyzing image: ", err);
      alert("Error analyzing image. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const selectLabel = (label) => {
    setTask((prevTask) => [...prevTask, label]);
    alert(`Label "${label}" added to the task.`);
    setImageUri(null);
    setLabels([]);
  };

  const checkMatch = (detectedLabels) => {
    const descriptions = detectedLabels.map((label) => label.description);
    const match = task.some((label) => descriptions.includes(label));
    if (match) {
      alert("Pronađeno!");
      // Remove found labels from task array
      setTask((prevTask) =>
        prevTask.filter((label) => !descriptions.includes(label))
      );
      // Optionally update user score or do something else
      // if (userId) {
      //   const userRef = ref(database, `leaderboard/${userId}`);
      //   update(userRef, { score: newScore });
      // }
    } else {
      alert("Nije pronađeno!");
    }
    setImageUri(null);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Tražilica</Text>
      <Text>You are in {role.toUpperCase()} mode.</Text>

      {imageUri && (
        <Image
          source={{ uri: imageUri }}
          style={{
            width: 300,
            height: 300,
            borderRadius: 10,
            marginVertical: 20,
          }}
        />
      )}

      {loading && (
        <ActivityIndicator
          size="large"
          color="blue"
          style={{ marginVertical: 20 }}
        />
      )}

      {/* TEACHER UI */}
      {role === "teacher" && (
        <View>
          {/* If no photo is taken, show "Uslikaj" button */}
          {!imageUri && (
            <>
              <TouchableOpacity onPress={takePhoto} style={styles.button}>
                <Text style={styles.text}>Uslikaj</Text>
              </TouchableOpacity>
              <Text style={styles.title2}>Odabrani predmeti:</Text>
              {task.map((label, index) => (
                <Text key={index} style={styles.outputText}>
                  {label}
                </Text>
              ))}
            </>
          )}

          {/* If labels are detected, let teacher select which to add to task */}
          {labels.length > 0 && (
            <View>
              <Text style={styles.title2}>Što želim odabrati?</Text>
              {labels.map((label) => (
                <TouchableOpacity
                  key={label.mid}
                  onPress={() => selectLabel(label.description)}
                  style={styles.labelButton}
                >
                  <Text style={styles.outputText}>{label.description}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>
      )}

      {/* STUDENT UI */}
      {role === "student" && (
        <View>
          <Text style={styles.title2}>Pronađi:</Text>
          {task.map((label, index) => (
            <Text key={index} style={styles.outputText}>
              {label}
            </Text>
          ))}

          {!loading && (
            <TouchableOpacity onPress={takePhoto} style={styles.button}>
              <Text style={styles.text}>Pronađi predmet</Text>
            </TouchableOpacity>
          )}
        </View>
      )}
    </View>
  );
};

export default DetectObject;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    alignItems: "center",
  },
  title: {
    fontSize: 30,
    fontWeight: "bold",
    marginBottom: 20,
    marginTop: 50,
  },
  title2: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 10,
    marginTop: 10,
  },
  button: {
    backgroundColor: "blue",
    padding: 10,
    borderRadius: 5,
    margin: 10,
    alignItems: "center",
  },
  text: {
    color: "white",
    fontSize: 20,
    fontWeight: "bold",
  },
  outputText: {
    fontSize: 16,
    margin: 5,
  },
  labelButton: {
    backgroundColor: "lightgray",
    padding: 10,
    borderRadius: 5,
    marginVertical: 5,
    alignItems: "center",
  },
});
