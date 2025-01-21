import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
  Alert,
  ActivityIndicator,
} from "react-native";
import { useRoute } from "@react-navigation/native";
import { database } from "../../firebaseConfig";
import { ref, get, set } from "firebase/database";
import * as ImagePicker from "expo-image-picker";
import axios from "axios";
import * as FileSystem from "expo-file-system";
import CustomHeader from "../components/CustomHeader";

const HEADER_HEIGHT = 64;

const TaskListManager = () => {
  const route = useRoute();
  const { groupId } = route.params;
  const [imageUri, setImageUri] = useState(null);
  const [loading, setLoading] = useState(false);
  const [labels, setLabels] = useState([]);
  const [taskList, setTaskList] = useState([]);

  useEffect(() => {
    loadTaskList();
  }, []);

  const loadTaskList = async () => {
    try {
      const tasksRef = ref(database, `groups/${groupId}/tasks`);
      const snapshot = await get(tasksRef);
      if (snapshot.exists()) {
        setTaskList(snapshot.val() || []);
      }
    } catch (err) {
      console.error("Error loading tasks:", err);
    }
  };

  const takePhoto = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Error", "Camera permission needed");
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [4, 3],
        quality: 1,
      });

      if (!result.canceled) {
        const newUri = result.assets[0].uri;
        setImageUri(newUri);
        await analyzeImage(newUri);
      }
    } catch (err) {
      console.error("Error taking photo:", err);
      Alert.alert("Error", "Failed to take photo");
    }
  };

  const analyzeImage = async (uri) => {
    if (!uri) return;
    setLoading(true);

    try {
      const apiUrl = process.env.EXPO_PUBLIC_GOOGLE_CLOUD_VISION_API_URL;
      const base64Image = await FileSystem.readAsStringAsync(uri, {
        encoding: FileSystem.EncodingType.Base64,
      });

      const requestData = {
        requests: [
          {
            image: { content: base64Image },
            features: [{ type: "LABEL_DETECTION", maxResults: 5 }],
          },
        ],
      };

      const response = await axios.post(apiUrl, requestData);
      const detectedLabels = response.data.responses[0]?.labelAnnotations || [];
      setLabels(detectedLabels);
    } catch (err) {
      console.error("Error analyzing image:", err);
      Alert.alert("Error", "Failed to analyze image");
    } finally {
      setLoading(false);
    }
  };

  const addToTaskList = async (label) => {
    try {
      const updatedTasks = [...new Set([...taskList, label.description])];
      await set(ref(database, `groups/${groupId}/tasks`), updatedTasks);
      setTaskList(updatedTasks);
      setImageUri(null);
      setLabels([]);
      Alert.alert("Success", "Item added to task list");
    } catch (err) {
      console.error("Error saving task:", err);
      Alert.alert("Error", "Failed to save task");
    }
  };

  return (
    <View style={styles.screenContainer}>
      <CustomHeader title="Task Manager" />
      <View style={styles.contentContainer}>
        <Text style={styles.title}>Add Items to Find</Text>
        <View style={styles.taskListContainer}>
          <Text style={styles.subtitle}>Current Tasks:</Text>
          {taskList.map((task, index) => (
            <Text key={index} style={styles.taskItem}>
              • {task}
            </Text>
          ))}
        </View>
        {imageUri && (
          <Image source={{ uri: imageUri }} style={styles.imagePreview} />
        )}
        {loading && (
          <ActivityIndicator
            size="large"
            color="#2196F3"
            style={styles.loader}
          />
        )}
        {labels.length > 0 && (
          <ScrollView style={styles.labelsScrollView}>
            <View style={styles.labelsContainer}>
              <Text style={styles.subtitle}>Select item to add:</Text>
              {labels.map((label) => (
                <TouchableOpacity
                  key={label.mid}
                  style={styles.labelButton}
                  onPress={() => addToTaskList(label)}
                >
                  <Text style={styles.labelText}>{label.description}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        )}
        {!loading && !labels.length && (
          <TouchableOpacity style={styles.button} onPress={takePhoto}>
            <Text style={styles.buttonText}>Scan New Item</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
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
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 20,
  },
  subtitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 10,
  },
  taskListContainer: {
    backgroundColor: "#f5f5f5",
    padding: 15,
    borderRadius: 8,
    marginBottom: 20,
  },
  taskItem: {
    fontSize: 16,
    marginVertical: 3,
  },
  imagePreview: {
    width: "100%",
    height: 200,
    borderRadius: 8,
    marginBottom: 20,
  },
  loader: {
    marginVertical: 20,
  },
  labelsContainer: {
    marginTop: 20,
  },
  labelButton: {
    backgroundColor: "#e3f2fd",
    padding: 12,
    borderRadius: 8,
    marginVertical: 5,
  },
  labelText: {
    fontSize: 16,
    color: "#2196F3",
  },
  button: {
    backgroundColor: "#2196F3",
    padding: 15,
    borderRadius: 8,
    alignItems: "center",
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  labelsScrollView: {
    maxHeight: 300,
    marginTop: 20,
    marginBottom: 20,
  },
});

export default TaskListManager;
