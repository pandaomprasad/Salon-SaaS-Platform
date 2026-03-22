import { View, Text, Pressable } from "react-native";
import { Entypo, FontAwesome, Ionicons, Feather } from "@expo/vector-icons";
import Animated, { FadeInDown } from "react-native-reanimated";
import styles from "./styles";
import { C } from "../../theme";

export default function HeroTopBar({
    city,
    subCity,
    onLocation,
    onNotif,
    onProfile
}) {
    return (
        <Animated.View entering={FadeInDown.delay(100).duration(500)} style={styles.topBar}>
            <Pressable style={styles.locationBtn} onPress={onLocation}>
                <FontAwesome name="location-arrow" size={14} color={C.gold} />
                <View>
                    <View style={styles.cityRow}>
                        <Text style={styles.city}>{city}</Text>
                        <Entypo name="chevron-small-down" size={18} color="#fff" />
                    </View>
                    <Text style={styles.subCity}>{subCity}</Text>
                </View>
            </Pressable>

            <View style={styles.actions}>
                <Pressable style={styles.iconBtn} onPress={onNotif}>
                    <Ionicons name="notifications-outline" size={20} color="#fff" />
                </Pressable>

                <Pressable style={[styles.iconBtn, styles.profileBtn]} onPress={onProfile}>
                    <Feather name="user" size={18} color="#fff" />
                </Pressable>
            </View>
        </Animated.View>
    );
}