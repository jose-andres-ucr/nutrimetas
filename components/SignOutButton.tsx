import { signOut } from "@/shared/User/Mutations/SessionMutations";
import { Text } from "@/components/Themed";
import { TouchableOpacity } from "react-native";
import { Image } from "expo-image";
import SignOutIcon from '@/assets/images/signOut.svg';

export default function useSignOutButton () {
    const signOutMutation = signOut();

    return () => (
        <TouchableOpacity
            onPress={() => signOutMutation.mutate()}>
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