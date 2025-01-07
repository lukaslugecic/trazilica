import React, { useActionState, useEffect, useState } from "react";
import { View, StyleSheet, FlatList } from "react-native";


export const Leaderboard = () => {
    const [leaderboard, setLeaderboard] = useState([]);
    
    useEffect(() => {
        // Fetch Leaderboard Here
    }, []);
    
    return (
        <View style={styles.container}>
        <FlatList
            data={leaderboard}
            renderItem={({ item }) => (
            <View style={styles.leaderboardItem}>
                <Text>{item.name}</Text>
                <Text>{item.score}</Text>
            </View>
            )}
            keyExtractor={(item) => item.id}
        />
        </View>
    );
};