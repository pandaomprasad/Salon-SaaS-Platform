import { View, Text } from "react-native";
import styles from "./styles";

export default function HeroText({ tagline = "PREMIUM GROOMING & BEAUTY", subtitle = "Book your salon experience" }) {
    return (
        <View style={styles.textBlock}>
            <Text style={styles.tagline}>{tagline}</Text>
            <Text style={styles.subtitle}>{subtitle}</Text>
        </View>
    );
}