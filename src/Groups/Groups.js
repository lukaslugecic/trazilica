import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  FlatList,
} from "react-native";
import { useRoute, useNavigation } from "@react-navigation/native";
import { database, auth } from "../../firebaseConfig";
import { ref, push, set, onValue, update, get, child } from "firebase/database";
import CustomHeader from "../components/CustomHeader";

const HEADER_HEIGHT = 64;

const Groups = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const { role, userId } = route.params || {};

  const [groupTag, setGroupTag] = useState("");
  const [joinTag, setJoinTag] = useState("");
  const [myGroups, setMyGroups] = useState([]);

  useEffect(() => {
    const groupsRef = ref(database, "groups");
    const unsubscribe = onValue(groupsRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val() || {};
        const groupList = Object.keys(data).map((groupId) => ({
          groupId,
          ...data[groupId],
        }));

        // Filter groups where the user is either the teacher or a member
        const userGroups = groupList.filter((group) => {
          if (role === "teacher" && group.teacherId === userId) {
            return true;
          }
          return group?.members?.[userId] === true;
        });
        setMyGroups(userGroups);
      } else {
        setMyGroups([]);
      }
    });

    return () => {
      unsubscribe();
    };
  }, [role, userId]);

  // Helper: fetch teacher's name from DB
  const getTeacherName = async (uid) => {
    const snap = await get(child(ref(database), `users/${uid}`));
    if (!snap.exists()) return "Teacher";
    const userData = snap.val();
    return userData.name || "Teacher";
  };

  // TEACHER: create group using a unique groupTag
  const createGroup = async () => {
    if (!groupTag.trim()) {
      Alert.alert("Validation Error", "Group tag cannot be empty.");
      return;
    }

    try {
      // 1) Fetch all groups
      const groupsSnap = await get(ref(database, "groups"));
      if (groupsSnap.exists()) {
        const groupsData = groupsSnap.val();
        // Check if groupTag is used
        const allGroups = Object.keys(groupsData).map((gId) => groupsData[gId]);
        /*const alreadyUsed = allGroups.some(
          (g) => g.groupTag?.toLowerCase() === groupTag.toLowerCase()
        );*/
        const alreadyUsed = Object.values(groupsData).some(
          (g) => g.groupTag?.toLowerCase() === groupTag.toLowerCase()
        );
        if (alreadyUsed) {
          Alert.alert("Error", "That group tag is already taken. Try another!");
          return;
        }
      }

      // 2) If not used, get teacher's name
      const teacherName = await getTeacherName(userId);

      // 3) Create a new group in DB
      const newGroupRef = push(ref(database, "groups"));
      const groupId = newGroupRef.key; // auto-generated
      await set(newGroupRef, {
        groupTag,
        teacherId: userId,
        teacherName,
        members: {
          [userId]: true,
        },
        leaderboard: {
          [userId]: 0,
        },
      });

      Alert.alert("Success", `Group tag "${groupTag}" created!`);
      setGroupTag("");
    } catch (error) {
      console.error("Error creating group:", error);
      Alert.alert("Error", "Could not create group. Please try again.");
    }
  };

  // STUDENT: join group by groupTag
  const joinGroup = async () => {
    if (!joinTag.trim()) {
      Alert.alert("Validation Error", "Group tag cannot be empty.");
      return;
    }

    try {
      // 1) Fetch all groups
      const groupsSnap = await get(ref(database, "groups"));
      if (!groupsSnap.exists()) {
        Alert.alert("Error", "No groups found in the database.");
        return;
      }

      const groupsData = groupsSnap.val();
      const targetGroup = Object.entries(groupsData).find(
        ([_, group]) => group.groupTag?.toLowerCase() === joinTag.toLowerCase()
      );

      if (!targetGroup) {
        Alert.alert("Error", `No group found with tag "${joinTag}".`);
        return;
      }

      const [groupId, groupData] = targetGroup;

      if (groupData.members?.[userId]) {
        Alert.alert("Info", "You are already in this group.");
        return;
      }

      const updates = {
        [`members/${userId}`]: true,
        [`leaderboard/${userId}`]: 0, // Initialize score for new member
      };

      await update(ref(database, `groups/${groupId}`), updates);

      Alert.alert("Success", `You joined the group "${targetGroup.groupTag}"!`);
      setJoinTag("");
    } catch (error) {
      console.error("Error joining group:", error);
      Alert.alert("Error", "Could not join group. Please try again.");
    }
  };

  // Navigate to scoreboard
  const handleScoreboard = (group) => {
    // We'll still pass the group's groupId to scoreboard
    navigation.navigate("Scoreboard", { groupId: group.groupId });
  };

  // For each group in "My Groups," show groupTag and teacherName
  const renderGroupItem = ({ item }) => {
    return (
      <View style={styles.groupItem}>
        <Text style={styles.tagText}>Group Tag: {item.groupTag}</Text>
        <Text style={styles.teacherText}>Teacher: {item.teacherName}</Text>
        <View style={styles.buttonContainer}>
          {role === "teacher" ? (
            <>
              <TouchableOpacity
                style={[styles.button, { backgroundColor: "#4CAF50" }]}
                onPress={() =>
                  navigation.navigate("TaskListManager", {
                    groupId: item.groupId,
                    groupTag: item.groupTag,
                  })
                }
              >
                <Text style={styles.buttonText}>Manage Tasks</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.button}
                onPress={() => handleScoreboard(item)}
              >
                <Text style={styles.buttonText}>View Scoreboard</Text>
              </TouchableOpacity>
            </>
          ) : (
            <>
              <TouchableOpacity
                style={[styles.button, { backgroundColor: "#4CAF50" }]}
                onPress={() =>
                  navigation.navigate("DetectObject", {
                    groupId: item.groupId,
                    groupTag: item.groupTag,
                    role,
                    userId,
                  })
                }
              >
                <Text style={styles.buttonText}>Find Objects</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.button}
                onPress={() => handleScoreboard(item)}
              >
                <Text style={styles.buttonText}>View Scoreboard</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </View>
    );
  };

  return (
    <View style={styles.screenContainer}>
      <CustomHeader title="Groups" />
      <View style={styles.contentContainer}>
        {role === "teacher" && (
          <View style={styles.formBlock}>
            <Text style={styles.title}>Create a New Group</Text>
            <TextInput
              placeholder="Group Tag (unique)"
              placeholderTextColor="rgba(0,0,0,0.4)"
              value={groupTag}
              onChangeText={setGroupTag}
              style={styles.input}
            />
            <TouchableOpacity
              onPress={createGroup}
              style={styles.primaryButton}
            >
              <Text style={styles.primaryButtonText}>Create Group</Text>
            </TouchableOpacity>
          </View>
        )}

        {role === "student" && (
          <View style={styles.formBlock}>
            <Text style={styles.title}>Join a Group by Tag</Text>
            <TextInput
              placeholder="Enter Group Tag"
              placeholderTextColor="rgba(0,0,0,0.4)"
              value={joinTag}
              onChangeText={setJoinTag}
              style={styles.input}
            />
            <TouchableOpacity onPress={joinGroup} style={styles.primaryButton}>
              <Text style={styles.primaryButtonText}>Join Group</Text>
            </TouchableOpacity>
          </View>
        )}

        <View style={[styles.formBlock, { marginTop: 30 }]}>
          <Text style={styles.title}>My Groups</Text>
          {myGroups.length === 0 ? (
            <Text style={{ marginTop: 10 }}>No groups found.</Text>
          ) : (
            <FlatList
              data={myGroups}
              keyExtractor={(item) => item.groupId}
              renderItem={renderGroupItem}
            />
          )}
        </View>
      </View>
    </View>
  );
};

export default Groups;

const styles = StyleSheet.create({
  screenContainer: {
    flex: 1,
    backgroundColor: "#fff",
  },
  contentContainer: {
    flex: 1,
    marginTop: HEADER_HEIGHT,
    padding: 16,
  },
  formBlock: {
    marginBottom: 20,
    backgroundColor: "#fdfdfd",
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#eee",
  },
  title: {
    fontSize: 18,
    fontWeight: "600",
    marginVertical: 8,
    color: "#333",
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 10,
    borderRadius: 6,
    fontSize: 16,
    backgroundColor: "#fff",
  },
  primaryButton: {
    backgroundColor: "#2196F3",
    paddingVertical: 12,
    borderRadius: 6,
    alignItems: "center",
  },
  primaryButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  groupItem: {
    backgroundColor: "#f7f7f7",
    padding: 12,
    marginVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#eee",
  },
  tagText: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 4,
    color: "#333",
  },
  teacherText: {
    fontSize: 14,
    color: "#666",
    marginBottom: 8,
  },
  scoreButton: {
    backgroundColor: "#4A90E2",
    paddingVertical: 8,
    borderRadius: 6,
    alignItems: "center",
  },
  scoreButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "bold",
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 8,
  },
  button: {
    flex: 0.48,
    backgroundColor: "#2196F3",
    paddingVertical: 8,
    borderRadius: 6,
    alignItems: "center",
  },
  buttonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "bold",
  },
});
