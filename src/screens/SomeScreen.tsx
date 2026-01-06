import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "../navigation/types";

const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

function goToProfileTab() {
  navigation.navigate("Main", { screen: "Profile" });
}

function goToHomeTab() {
  navigation.navigate("Main", { screen: "Home" });
}