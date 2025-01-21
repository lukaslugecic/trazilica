import React, { useState, useEffect } from "react";
import { useNavigation } from "@react-navigation/native";
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import axios from "axios";
import * as ImagePicker from "expo-image-picker";
import * as FileSystem from "expo-file-system";
import { useRoute } from "@react-navigation/native";
import CustomHeader from "../components/CustomHeader";
import { database } from "../../firebaseConfig";
import { ref, set, onValue, get, update } from "firebase/database";

const HEADER_HEIGHT = 64;
const POINTS_PER_FIND = 1;

export const saveTaskToDatabase = async (taskList) => {
  try {
    const taskRef = ref(database, "tasks/");
    await set(taskRef, taskList);
    alert("Predmeti su uspješno spremljeni!");
  } catch (err) {
    console.log("Greška kod spremanja zadatka: ", err);
  }
};

const getUserGroups = async (userId) => {
  try {
    const groupsRef = ref(database, "groups");
    const snapshot = await get(groupsRef);

    if (!snapshot.exists()) return [];

    const groupsData = snapshot.val();
    return Object.entries(groupsData)
      .filter(([_, group]) => group.members?.[userId])
      .map(([groupId, group]) => groupId);
  } catch (err) {
    console.error("Error fetching user groups:", err);
    return [];
  }
};

export const getTasksFromDatabase = async (setTask, userId) => {
  const taskRef = ref(database, "tasks/");
  const completedTasksRef = ref(database, `completedTasks/${userId}`);

  try {
    const tasksSnapshot = await get(taskRef);
    const completedTasksSnapshot = await get(completedTasksRef);

    if (!tasksSnapshot.exists()) {
      alert("Nema spremljenih zadataka, zamolite učitelja da ih postavi.");
      return;
    }

    const tasks = tasksSnapshot.val();
    const completedTasks = completedTasksSnapshot.val() || [];

    const availableTasks = tasks.filter((task) => !completedTasks[task]);
    console.log("Dostupni zadaci: ", availableTasks);
    console.log("Završeni zadaci: ", completedTasks);
    setTask(availableTasks);
  } catch (err) {
    console.log("Greška kod dohvaćanja zadatka: ", err);
  }
};

const updateUserScore = async (userId, completedTask) => {
  try {
    const userScoreRef = ref(database, `leaderboard/${userId}`);
    const scoreSnapshot = await get(userScoreRef);
    const currentScore = (scoreSnapshot.val()?.score || 0) + POINTS_PER_FIND;
    await update(userScoreRef, { score: currentScore });

    const userGroups = await getUserGroups(userId);

    for (const groupId of userGroups) {
      const groupRef = ref(database, `groups/${groupId}`);
      const groupSnapshot = await get(groupRef);

      if (groupSnapshot.exists()) {
        const groupData = groupSnapshot.val();
        const currentGroupScore =
          (groupData.leaderboard?.[userId] || 0) + POINTS_PER_FIND;

        await update(ref(database, `groups/${groupId}/leaderboard`), {
          [userId]: currentGroupScore,
        });
      }
    }

    const completedTasksRef = ref(database, `completedTasks/${userId}`);
    const completedSnapshot = await get(completedTasksRef);
    let completedTasks = completedSnapshot.val() || {};

    await set(completedTasksRef, {
      ...completedTasks,
      [completedTask]: true,
    });

    return currentScore;
  } catch (err) {
    console.log("Greška kod ažuriranja bodova: ", err);
  }
};

const DetectObject = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { groupId, groupTag, userId } = route.params;

  const [imageUri, setImageUri] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [groupScore, setGroupScore] = useState(0);

  useEffect(() => {
    const loadData = async () => {
      try {
        // Get tasks for this group
        const tasksRef = ref(database, `groups/${groupId}/tasks`);
        const completedTasksRef = ref(database, `completedTasks/${userId}`);

        const [tasksSnap, completedSnap] = await Promise.all([
          get(tasksRef),
          get(completedTasksRef),
        ]);

        const allTasks = tasksSnap.val() || [];
        const completedTasks = completedSnap.val() || {};

        // Filter out completed tasks
        const availableTasks = allTasks.filter((task) => !completedTasks[task]);
        setTasks(availableTasks);

        // Get user's score for this group
        const groupRef = ref(
          database,
          `groups/${groupId}/leaderboard/${userId}`
        );
        const scoreSnap = await get(groupRef);
        setGroupScore(scoreSnap.val() || 0);
      } catch (err) {
        console.error("Error loading data:", err);
      }
    };

    loadData();
  }, [groupId, userId]);

  const takePhoto = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== "granted") {
        alert("Camera permission is required to take photos.");
        return;
      }
      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [4, 3],
        quality: 1,
      });
      if (!result.canceled) {
        const newUri = result.assets[0].uri;
        await analyzeImage(result.assets[0].uri);
      }
    } catch (err) {
      console.log("Error taking photo: ", err);
      alert("Failed to take photo");
    }
  };

  const analyzeImage = async (uri) => {
    if (!uri) {
      alert("Please take a photo first.");
      return;
    }
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

      const apiResponse = await axios.post(apiUrl, requestData);
      const labels = apiResponse.data.responses[0]?.labelAnnotations || [];

      checkMatch(labels);
    } catch (err) {
      console.log("Error analyzing image: ", err);
      alert("Error analyzing image. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  /*const selectLabel = (label) => {
    const updatedTasks = [...task, label];
    setTask(updatedTasks);
    saveTaskToDatabase(updatedTasks); // Sprema zadatak u bazu
    alert(`Label "${label}" dodan u zadatak.`);
    setImageUri(null);
    setLabels([]);
  };*/

  const checkMatch = async (labels) => {
    const detectedLabels = labels.map((l) => l.description.toLowerCase());
    const matchingTask = tasks.find((task) =>
      detectedLabels.includes(task.toLowerCase())
    );

    if (!matchingTask) {
      alert("Nije pronađeno!");
      setImageUri(null);
      return;
    }

    try {
      const groupRef = ref(database, `groups/${groupId}/leaderboard/${userId}`);
      const scoreSnap = await get(groupRef);
      const newScore = (scoreSnap.val() || 0) + POINTS_PER_FIND;
      await update(ref(database, `groups/${groupId}/leaderboard`), {
        [userId]: newScore,
      });
      setGroupScore(newScore);

      // Mark task as completed
      await update(ref(database, `completedTasks/${userId}`), {
        [matchingTask]: true,
      });

      // Update available tasks
      setTasks((prev) => prev.filter((task) => task !== matchingTask));

      alert(`Pronađeno: ${matchingTask}!\n+${POINTS_PER_FIND} bodova!`);
    } catch (err) {
      console.log("Error updating score: ", err);
      alert("Error updating score. Please try again.");
    }

    setImageUri(null);
  };

  return (
    <View style={styles.screenContainer}>
      <CustomHeader title={`Find Objects - ${groupTag}`} />
      <View style={styles.contentContainer}>
        <Text style={styles.scoreText}>Points in this group: {groupScore}</Text>

        <View style={styles.taskContainer}>
          <Text style={styles.sectionTitle}>Find one of these:</Text>
          {tasks.length > 0 ? (
            tasks.map((task, index) => (
              <Text key={index} style={styles.taskText}>
                • {task}
              </Text>
            ))
          ) : (
            <Text style={styles.noTasksText}>
              All tasks completed! Great job!
            </Text>
          )}
        </View>

        {imageUri && (
          <Image source={{ uri: imageUri }} style={styles.imagePreview} />
        )}

        {loading ? (
          <ActivityIndicator
            size="large"
            color="#2196F3"
            style={styles.loader}
          />
        ) : (
          tasks.length > 0 && (
            <TouchableOpacity style={styles.cameraButton} onPress={takePhoto}>
              <Text style={styles.buttonText}>Take Photo</Text>
            </TouchableOpacity>
          )
        )}

        <TouchableOpacity
          style={[styles.button, { backgroundColor: "#4CAF50" }]}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.buttonText}>Back to Groups</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default DetectObject;

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
    marginBottom: 8,
  },
  subTitle: {
    fontSize: 16,
    marginBottom: 20,
  },
  imagePreview: {
    width: 280,
    height: 280,
    borderRadius: 10,
    marginVertical: 20,
    borderWidth: 2,
    borderColor: "#ccc",
  },
  teacherContainer: {
    width: "100%",
    alignItems: "center",
  },
  studentContainer: {
    width: "100%",
    alignItems: "center",
  },
  button: {
    backgroundColor: "#2196F3",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 6,
    marginVertical: 10,
    alignItems: "center",
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  labelTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginTop: 10,
    marginBottom: 6,
  },
  taskText: {
    fontSize: 16,
    marginVertical: 2,
    color: "#333",
  },
  labelButton: {
    backgroundColor: "lightgray",
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 6,
    marginVertical: 5,
    alignItems: "center",
  },
  labelText: {
    fontSize: 16,
    color: "#333",
  },
  scoreText: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 16,
    color: "#4CAF50",
  },
  taskContainer: {
    backgroundColor: "#f5f5f5",
    padding: 15,
    borderRadius: 8,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 10,
    color: "#333",
  },
  noTasksText: {
    fontSize: 16,
    color: "#666",
    fontStyle: "italic",
    textAlign: "center",
    marginVertical: 10,
  },
  preview: {
    width: "100%",
    height: 300,
    borderRadius: 8,
    marginVertical: 20,
  },
  loader: {
    marginVertical: 20,
  },
  cameraButton: {
    backgroundColor: "#2196F3",
    paddingVertical: 15,
    borderRadius: 8,
    marginTop: "auto",
    marginBottom: 10,
  },
});
