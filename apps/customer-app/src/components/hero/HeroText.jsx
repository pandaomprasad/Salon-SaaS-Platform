import { View, Text } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import styles from "./styles";

export default function HeroText({ tagline, subtitle }) {
    return (
        <Animated.View entering={FadeInDown.delay(250).duration(600)} style={styles.textBlock}>
            <Text style={styles.tagline}>{tagline}</Text>
            <Text style={styles.subtitle}>{subtitle}</Text>
        </Animated.View>
    );
}