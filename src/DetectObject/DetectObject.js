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

const DetectObject = () => {
  const [role, setRole] = useState("teacher");
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
        const imageUri = result.assets[0].uri;
        setImageUri(imageUri);
        await analyzeImage(imageUri);
      }
    } catch (err) {
      console.log("Error taking photo: ", err);
    }
  };

  const analyzeImage = async (imageUri) => {
    if (!imageUri) {
      alert("Please take a photo first.");
      return;
    }

    setLoading(true); // Start loading
    try {
      const apiUrl = process.env.EXPO_PUBLIC_GOOGLE_CLOUD_VISION_API_URL;

      const base64Image = await FileSystem.readAsStringAsync(imageUri, {
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
          setLabels(detectedLabels);
        } else {
          console.log("Detected labels: ", detectedLabels);
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
      setTask((prevTask) =>
        prevTask.filter((label) => !descriptions.includes(label))
      );
    } else {
      alert("Nije pronađeno!");
    }
    setImageUri(null);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Tražilica </Text>

      <TouchableOpacity
        onPress={() => setRole(role === "teacher" ? "student" : "teacher")}
        style={[styles.button, { backgroundColor: "green" }]}
      >
        <Text style={styles.text}>
          Switch to {role === "teacher" ? "Student" : "Teacher"} Mode
        </Text>
      </TouchableOpacity>

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

      {!imageUri && role === "teacher" && (
        <View>
          <TouchableOpacity onPress={takePhoto} style={styles.button}>
            <Text style={styles.text}>Uslikaj</Text>
          </TouchableOpacity>
          <Text style={[styles.title2]}>Odabrani predmeti:</Text>
          {task.map((label, index) => (
            <Text key={index} style={styles.outputText}>
              {label}
            </Text>
          ))}
        </View>
      )}

      {loading && (
        <ActivityIndicator
          size="large"
          color="blue"
          style={{ marginVertical: 20 }}
        />
      )}

      {role === "teacher" && labels.length > 0 && (
        <View>
          <Text style={[styles.title2]}>Što želim odabrati?</Text>
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

      {role === "student" && !loading && (
        <View>
          <Text style={[styles.title2]}>Pronađi:</Text>
          {task.map((label, index) => (
            <Text key={index} style={styles.outputText}>
              {label}
            </Text>
          ))}

          <TouchableOpacity onPress={takePhoto} style={styles.button}>
            <Text style={styles.text}>Pronađi predmet</Text>
          </TouchableOpacity>
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
    fontColor: "white",
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
