import { signOut } from "@/shared/User/Mutations/SessionMutations";
import { Text } from "@/components/Themed";
import { TouchableOpacity } from "react-native";
import { Image } from "expo-image";
import SignOutIcon from '@/assets/images/signOut.svg';
import { SessionContext } from "@/shared/Session/LoginSessionProvider";
import { useContext } from "react";

export default function useSignOutButton () {
    const session = useContext(SessionContext);
    const signOutMutation = signOut();

    return () => (
        <TouchableOpacity
            onPress={() => signOutMutation.mutate(session)}>
            <Image
                style={{
                    width: 35,
                    height: 35,
                    tintColor: "red",
                }}
                source={SignOutIcon}
                onError={(error) => {
                    console.error("Error loading image:", error);
                }}
                contentFit="contain"
            />
        </TouchableOpacity>
    );
}