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

  const [groupInfo, setGroupInfo] = useState({
    tag: "",
    scores: [],
  });

  useEffect(() => {
    if (!groupId) return;

    // Listen to the entire group object
    const groupRef = ref(database, `groups/${groupId}`);
    const unsubscribe = onValue(groupRef, async (snapshot) => {
      if (!snapshot.exists()) {
        // If group doesn't exist, clear everything
        setGroupInfo({ tag: "", scores: [] });
        return;
      }

      const groupData = snapshot.val();
      const leaderboard = groupData.leaderboard || {};
      const members = groupData.members || {};

      // Get all member data and scores
      const memberPromises = Object.keys(members).map(async (uid) => {
        try {
          const userSnap = await get(ref(database, `users/${uid}`));
          const userData = userSnap.val() || {};

          return {
            userId: uid,
            userName: userData.name || "Unknown User",
            score: leaderboard[uid] || 0,
            role: userData.role || "student",
          };
        } catch (err) {
          console.error("Error fetching user data:", err);
          return {
            userId: uid,
            userName: "Unknown User",
            score: leaderboard[uid] || 0,
            role: "student",
          };
        }
      });

      const memberData = await Promise.all(memberPromises);

      // Sort by score in descending order
      const sortedScores = memberData
        .filter((member) => member.role === "student") // Only show students
        .sort((a, b) => b.score - a.score);

      setGroupInfo({
        tag: groupData.groupTag || "",
        scores: sortedScores,
      });
    });

    return () => unsubscribe();
  }, [groupId]);

  const renderScoreItem = ({ item, index }) => (
    <View style={styles.scoreItem}>
      <View style={styles.rankContainer}>
        <Text style={styles.rankText}>#{index + 1}</Text>
      </View>
      <View style={styles.scoreDetails}>
        <Text style={styles.nameText}>{item.userName}</Text>
        <Text style={styles.scoreText}>{item.score} points</Text>
      </View>
    </View>
  );

  return (
    <View style={styles.screenContainer}>
      <CustomHeader title="Group Scoreboard" />
      <View style={styles.contentContainer}>
        <View style={styles.headerSection}>
          <Text style={styles.groupTag}>Group: {groupInfo.tag}</Text>
          <Text style={styles.subTitle}>
            {groupInfo.scores.length}{" "}
            {groupInfo.scores.length === 1 ? "Student" : "Students"}
          </Text>
        </View>

        {groupInfo.scores.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>No scores yet</Text>
            <Text style={styles.emptyStateSubText}>
              Students will appear here when they earn points
            </Text>
          </View>
        ) : (
          <FlatList
            data={groupInfo.scores}
            keyExtractor={(item) => item.userId}
            renderItem={renderScoreItem}
            contentContainerStyle={styles.listContainer}
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
    padding: 16,
  },
  headerSection: {
    marginBottom: 20,
    padding: 16,
    backgroundColor: "#f8f9fa",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#e9ecef",
  },
  groupTag: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#2196F3",
  },
  subTitle: {
    fontSize: 16,
    color: "#666",
    marginTop: 4,
  },
  listContainer: {
    paddingVertical: 8,
  },
  scoreItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    marginVertical: 4,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#eee",
  },
  rankContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#2196F3",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  rankText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  scoreDetails: {
    flex: 1,
  },
  nameText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
  },
  scoreText: {
    fontSize: 14,
    color: "#666",
    marginTop: 2,
  },
  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingBottom: 100,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#666",
  },
  emptyStateSubText: {
    fontSize: 14,
    color: "#999",
    marginTop: 8,
    textAlign: "center",
  },
});
