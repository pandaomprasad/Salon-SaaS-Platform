import { StyleSheet, Dimensions } from "react-native";
import { C } from "../../theme";

const { height } = Dimensions.get("window");

export default StyleSheet.create({
    wrap: {
        height: height * 0.48,
        marginBottom: 8
    },

    topBar: {
        position: "absolute",
        top: height * 0.055,
        left: 16,
        right: 16,
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        zIndex: 10,
    },

    locationBtn: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8
    },

    cityRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 2
    },

    city: {
        color: "#fff",
        fontSize: 17,
        fontWeight: "800"
    },

    subCity: {
        color: "rgba(255,255,255,0.6)",
        fontSize: 11
    },

    actions: {
        flexDirection: "row",
        gap: 10
    },

    iconBtn: {
        width: 38,
        height: 38,
        borderRadius: 12,
        backgroundColor: "rgba(255,255,255,0.15)",
        alignItems: "center",
        justifyContent: "center",
    },

    profileBtn: {
        backgroundColor: C.gold
    },

    textBlock: {
        position: "absolute",
        bottom: height * 0.14,
        left: 20
    },

    tagline: {
        color: "#fff",
        fontSize: 36,
        fontWeight: "900"
    },

    subtitle: {
        color: "rgba(255,255,255,0.7)",
        fontSize: 13,
        marginTop: 6
    },

    searchWrap: {
        position: "absolute",
        bottom: 20,
        left: 16,
        right: 16
    },

    searchBox: {
        backgroundColor: C.surface,
        borderRadius: 16,
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 16,
        paddingVertical: 13,
        gap: 10
    },

    searchPlaceholder: {
        flex: 1,
        color: C.muted
    },

    filterBtn: {
        width: 32,
        height: 32,
        borderRadius: 8,
        backgroundColor: C.goldLight,
        alignItems: "center",
        justifyContent: "center",
    },
});