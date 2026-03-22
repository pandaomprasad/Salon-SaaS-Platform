import { Image, StyleSheet } from "react-native";
import { LinearGradient } from "expo-linear-gradient";

export default function HeroBackground({ imageUri }) {
    return (
        <>
            <Image source={{ uri: imageUri }} style={styles.bg} blurRadius={1} />

            <LinearGradient
                colors={["rgba(13,11,24,0.55)", "rgba(13,11,24,0.15)", "rgba(247,245,240,0)"]}
                style={StyleSheet.absoluteFill}
            />

            <LinearGradient
                colors={["rgba(247,245,240,0)", "rgba(247,245,240,0.6)", "#F7F5F0"]}
                style={[StyleSheet.absoluteFill, { top: "40%" }]}
            />
        </>
    );
}

const styles = StyleSheet.create({
    bg: {
        ...StyleSheet.absoluteFillObject,
        resizeMode: "cover"
    }
});