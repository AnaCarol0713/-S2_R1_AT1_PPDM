import Home from "./src/screens/Home";
import { StatusBar } from "react-native";

import { SafeAreaProvider } from "react-native-safe-area-context"


export default function App() {
  return (
    <SafeAreaProvider>
      <StatusBar barStyle="dark-content" />
      <Home />
    </SafeAreaProvider>
  );
}


