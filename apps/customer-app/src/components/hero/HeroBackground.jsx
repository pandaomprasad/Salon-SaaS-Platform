import { View, StyleSheet } from "react-native";
import { C } from "../../theme";

export default function HeroBackground() {
    return (
        <View style={styles.bgOverlay} />
    );
}

const styles = StyleSheet.create({
    bgOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: C.dark,
    }
});