import { View } from "react-native";
import HeroTopBar from "./HeroTopBar";
import HeroText from "./HeroText";
import HeroSearch from "./HeroSearch";
import HeroBackground from "./HeroBackground";
import styles from "./styles";

export default function HomeHero(props) {
    return (
        <View style={styles.wrap}>
            <HeroBackground imageUri={props.imageUri} />

            <HeroTopBar
                city={props.city}
                subCity={props.subCity}
                onLocation={props.onLocation}
                onNotif={props.onNotif}
                onProfile={props.onProfile}
            />

            <HeroText
                tagline={props.tagline}
                subtitle={props.subtitle}
            />

            <HeroSearch onSearch={props.onSearch} />
        </View>
    );
}