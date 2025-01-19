import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { Login } from "./src/Login/Login";
import { Register } from "./src/Register/Register";
import DetectObject from "./src/DetectObject/DetectObject";
import Main from "./src/Main/Main";
import Groups from "./src/Groups/Groups";
import Scoreboard from "./src/Groups/Scoreboard";
import TaskListManager from "./src/TaskListManager/TaskListManager";

const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Login" component={Login} />
        <Stack.Screen name="Register" component={Register} />
        <Stack.Screen name="Main" component={Main} />
        <Stack.Screen name="DetectObject" component={DetectObject} />
        <Stack.Screen name="Groups" component={Groups} />
        <Stack.Screen name="Scoreboard" component={Scoreboard} />
        <Stack.Screen name="TaskListManager" component={TaskListManager} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
