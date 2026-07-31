import { View, Text, Pressable } from "react-native";
import { Feather } from "@expo/vector-icons";
import styles from "./styles";
import { C } from "../../theme";

export default function HeroSearch({ onSearch }) {
    return (
        <View style={styles.searchWrap}>
            <Pressable style={styles.searchBox} onPress={onSearch}>
                <Feather name="search" size={17} color={C.muted} />
                <Text style={styles.searchPlaceholder}>
                    Search salons, services…
                </Text>
                <View style={styles.filterBtn}>
                    <Feather name="sliders" size={15} color={C.gold} />
                </View>
            </Pressable>
        </View>
    );
}