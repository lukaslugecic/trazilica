import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, FlatList } from "react-native";
import { useRoute } from "@react-navigation/native";
import { ref, onValue, get, child } from "firebase/database";
import { database } from "../../firebaseConfig";
import CustomHeader from "../components/CustomHeader";

const HEADER_HEIGHT = 64;

const Scoreboard = () => {
  const route = useRoute();
  const { groupId } = route.params || {};

  const [groupTag, setGroupTag] = useState("");
  const [scores, setScores] = useState([]);

  useEffect(() => {
    if (!groupId) return;

    // Listen to the entire group object
    const groupRef = ref(database, `groups/${groupId}`);
    const unsubscribe = onValue(groupRef, async (snapshot) => {
      if (!snapshot.exists()) {
        // If group doesn't exist, clear everything
        setGroupTag("");
        setScores([]);
        return;
      }

      const groupData = snapshot.val() || {};
      const theTag = groupData.groupTag || "";
      setGroupTag(theTag);

      const teacherUid = groupData.teacherId || null;
      const leaderboard = groupData.leaderboard || {};

      const studentUids = Object.keys(leaderboard).filter(
        (uid) => uid !== teacherUid
      );

      const newScores = [];
      for (const uid of studentUids) {
        try {
          const userSnap = await get(child(ref(database), `users/${uid}`));
          let studentName = "Student";
          if (userSnap.exists()) {
            const userData = userSnap.val();
            studentName = userData.name || "Student";
          }

          newScores.push({
            userId: uid, // we won't display it, but we keep it as a key
            userName: studentName,
            score: leaderboard[uid],
          });
        } catch (err) {
          console.log("Error fetching user data:", err);
          newScores.push({
            userId: uid,
            userName: "Student",
            score: leaderboard[uid],
          });
        }
      }

      setScores(newScores);
    });

    return () => unsubscribe();
  }, [groupId]);

  return (
    <View style={styles.screenContainer}>
      <CustomHeader title="Scoreboard" />
      <View style={styles.contentContainer}>
        <Text style={styles.title}>Group Scoreboard</Text>
        <Text style={styles.subTitle}>Group Tag: {groupTag || "No Tag"}</Text>
        {scores.length === 0 ? (
          <Text style={styles.noScoresText}>No students in scoreboard.</Text>
        ) : (
          <FlatList
            data={scores}
            keyExtractor={(item) => item.userId}
            renderItem={({ item }) => (
              <View style={styles.scoreItem}>
                <Text style={styles.scoreText}>Name: {item.userName}</Text>
                <Text style={styles.scoreText}>Score: {item.score}</Text>
              </View>
            )}
          />
        )}
      </View>
    </View>
  );
};

export default Scoreboard;

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
    marginBottom: 8,
  },
  subTitle: {
    fontSize: 16,
    marginBottom: 16,
  },
  noScoresText: {
    fontSize: 16,
    marginTop: 10,
    color: "#666",
  },
  scoreItem: {
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#ccc",
  },
  scoreText: {
    fontSize: 16,
    color: "#333",
  },
});
