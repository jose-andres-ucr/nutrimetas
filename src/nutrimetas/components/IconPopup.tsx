"use strict"

// Dependencies
// Core React Native UI
import { View, Text, StyleSheet, Pressable, ImageSourcePropType, Modal, 
    TextStyle} from "react-native";

// Expo UI
import { Image } from "expo-image";

// Login form rendering and hooks
export default function ImagePopup(
    props: {
        isActive : boolean,
        isPressable : boolean,
        onCloseRequest?: (() => void),
        onActionRequest?: (() => void),

        icon: ImageSourcePropType | undefined, 
        description: {content : string, style : TextStyle},
        actionText: string,
    }
) {
    return (
        /* Pop up dialog box */
        <Modal 
            visible={props.isActive}
            transparent={true}
            animationType="slide"
            onRequestClose={props.onCloseRequest}
        >
            { /* Overall view */ }
            <View style={PopupStyles.OverallView}>

            { /* Box container */ }
            <View style={PopupStyles.BoxView}>
                { /* Icon */ }
                    <View style={PopupStyles.IconView}>
                        <Image 
                            source={props.icon}
                            onError={(event) => {
                                console.error("Error loading image:", event.error);
                            }}
                            
                            contentFit="contain"
                            contentPosition="center"
                            style={PopupStyles.Icon}
                        />
                    </View>

                    { /* Description */ }
                    <View>
                        <Text style={props.description.style}> 
                            {props.description.content}
                        </Text>
                    </View>

                    { /* Action button */ }
                    <Pressable 
                        disabled = {!props.isPressable}
                        onPress = {props.onCloseRequest}
                        style = {PopupStyles.ActionButton}
                    >
                        <Text style={PopupStyles.ActionText}> 
                            {props.actionText} 
                        </Text>
                    </Pressable>
            </View>
            </View>
        </Modal>
    );
}

// Icon Popup styles
const PopupStyles = StyleSheet.create({
    OverallView: {
        flex: 1,
        padding: 20,
        gap: 5,

        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "transparent"
    },
    BoxView: {
        padding: 20,
        gap: 15,
        maxWidth: 300,
        maxHeight: 400,
        borderRadius: 30,
        elevation: 3,

        alignSelf: "center",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "white",
    },
    IconView: {
        width: 200,
        height: 100,

        alignSelf: "center",
        alignItems: "center",
        justifyContent: "center",
    },
    Icon: {
        width: 200,
        height: 100,
    },
    ActionButton: {
        paddingVertical: 12,
        paddingHorizontal: 75,
        borderRadius: 4,
        elevation: 3,

        alignItems: 'center',
        justifyContent: 'center',
        
        backgroundColor: '#00C0F3',
    },
    ActionText: {
        fontWeight: "bold",
        fontFamily: "sans-serif-light",
        fontStyle: "normal",
        color: "white",

        textAlign: "justify",
        borderBottomColor: '#A6A6A6',
    },
});