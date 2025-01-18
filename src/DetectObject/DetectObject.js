import React, { useState, useEffect  } from "react";
import { useNavigation} from "@react-navigation/native";
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
import {ref, set, onValue, get, update} from "firebase/database";

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
    const groupsRef = ref(database, 'groups');
    const snapshot = await get(groupsRef);

    if (!snapshot.exists()) return [];

    const groupsData = snapshot.val();
    return Object.entries(groupsData)
        .filter(([_, group]) => group.members?.[userId])
        .map(([groupId, group]) => groupId);
  } catch (err) {
    console.error('Error fetching user groups:', err);
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

      const availableTasks = tasks.filter(task => !completedTasks[task]);
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
        const currentGroupScore = (groupData.leaderboard?.[userId] || 0) + POINTS_PER_FIND;

        await update(ref(database, `groups/${groupId}/leaderboard`), {
          [userId]: currentGroupScore
        });
      }
    }

    const completedTasksRef = ref(database, `completedTasks/${userId}`);
    const completedSnapshot = await get(completedTasksRef);
    let completedTasks = completedSnapshot.val() || {};

    await set(completedTasksRef, {
      ...completedTasks,
      [completedTask]: true
    });

    return currentScore;
  } catch (err) {
    console.log("Greška kod ažuriranja bodova: ", err);
  }
}

const DetectObject = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { role, userId } = route.params || { role: "student", userId: null };
  const [imageUri, setImageUri] = useState(null);
  const [labels, setLabels] = useState([]);
  const [task, setTask] = useState([]);
  const [loading, setLoading] = useState(false);
  const [currentScore, setCurrentScore] = useState(0);

  useEffect(() => {
    // Fetch  score
    const loadData = async () => {
      if (userId) {
        const scoreRef = ref(database, `leaderboard/${userId}`);
        try{
          const snapshot = await get(scoreRef);
          if (snapshot.exists()) {
            setCurrentScore(snapshot.val().score || 0);
          }
        }
        catch (err) {
          console.log("Error fetching scoreboard: ", err);
        }
        if (role === "student") {
          await getTasksFromDatabase(setTask, userId);
        }
      }
    };

    loadData();

  }, [userId, role]);

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
      const apiUrl = process.env.EXPO_PUBLIC_GOOGLE_CLOUD_VISION_API_URL;
      const base64Image = await FileSystem.readAsStringAsync(uri, {
        encoding: FileSystem.EncodingType.Base64,
      });

      const requestData = {
        requests: [
          {
            image: { content: base64Image },
            features: [{ type: "LABEL_DETECTION", maxResults: 3 }],
          },
        ],
      };

      const apiResponse = await axios.post(apiUrl, requestData);
      const detectedLabels = apiResponse.data.responses[0]?.labelAnnotations;

      if (detectedLabels) {
        if (role === "teacher") {
          setLabels(detectedLabels); // let teacher select which labels to add
        } else {
          checkMatch(detectedLabels); // student checks for match immediately
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
    const updatedTasks = [...task, label];
    setTask(updatedTasks);
    saveTaskToDatabase(updatedTasks); // Sprema zadatak u bazu
    alert(`Label "${label}" dodan u zadatak.`);
    setImageUri(null);
    setLabels([]);
  };

  const checkMatch = async (detectedLabels) => {
    const descriptions = detectedLabels.map((l) => l.description);
    const matchingTask = task.find((label) => descriptions.includes(label));

    if (matchingTask) {
      try {
        const newScore = await updateUserScore(userId, matchingTask);
        setCurrentScore(newScore);
        alert(`Pronađeno! +${POINTS_PER_FIND} bodova!`);
        /*setTask((prevTask) =>
            prevTask.filter((label) => !descriptions.includes(label))
        );*/
        await getTasksFromDatabase(setTask, userId);
      } catch (err) {
            console.log("Error updating score: ", err);
            alert("Error updating score. Please try again.");
        }
    } else {
      alert("Nije pronađeno!");
    }
    setImageUri(null);
  };

  useEffect(() => {
    if (role === "student") {
      getTasksFromDatabase(setTask); // Učenik dohvaća zadatke pri učitavanju
    }
  }, []);

  return (
    <View style={styles.screenContainer}>
      <CustomHeader title="Detect Object" />
      <View style={styles.contentContainer}>
        <Text style={styles.title}>Tražilica</Text>
        <Text style={styles.subTitle}>
          You are in {role.toUpperCase()} mode.
        </Text>
        <Text style={styles.scoreText}>Current Score: {currentScore}</Text>
        {imageUri && (
          <Image source={{ uri: imageUri }} style={styles.imagePreview} />
        )}

        {loading && (
          <ActivityIndicator size="large" color="blue" style={{ margin: 20 }} />
        )}

        {role === "teacher" && (
          <View style={styles.teacherContainer}>
            {!imageUri && (
              <>
                <TouchableOpacity onPress={takePhoto} style={styles.button}>
                  <Text style={styles.buttonText}>Uslikaj</Text>
                </TouchableOpacity>
                <Text style={styles.labelTitle}>Odabrani predmeti:</Text>
                {task.map((label, index) => (
                  <Text key={index} style={styles.taskText}>
                    {label}
                  </Text>
                ))}
              </>
            )}

            {labels.length > 0 && (
              <View style={{ marginTop: 10 }}>
                <Text style={styles.labelTitle}>Što želim odabrati?</Text>
                {labels.map((label) => (
                  <TouchableOpacity
                    key={label.mid}
                    onPress={() => selectLabel(label.description)}
                    style={styles.labelButton}
                  >
                    <Text style={styles.labelText}>{label.description}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>
        )}

        {role === "student" && (
          <View style={styles.studentContainer}>
            <Text style={styles.labelTitle}>Pronađi:</Text>
            {task.map((label, index) => (
              <Text key={index} style={styles.taskText}>
                {label}
              </Text>
            ))}

            {!loading && (
              <TouchableOpacity onPress={takePhoto} style={styles.button}>
                <Text style={styles.buttonText}>Pronađi predmet</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
         <TouchableOpacity
        onPress={() => navigation.navigate("Main", { role, userId })}
        style={[styles.button, { backgroundColor: "#4CAF50" }]}
      >
        <Text style={styles.buttonText}>Povratak na Main</Text>
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
});
