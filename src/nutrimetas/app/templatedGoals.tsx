import { StyleSheet, TouchableOpacity, FlatList, View, Text, Image } from 'react-native';
import React, { useState, useEffect, useContext } from 'react';
import firestore from '@react-native-firebase/firestore';
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/Ionicons';
import { SessionContext } from '@/shared/LoginSession';  // Importa el contexto de la sesión
import { useGlobalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

const TemplatedGoals = () => {
    const router = useRouter();
    const [templatedGoals, setTemplatedGoals] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsubscribe = firestore()
            .collection('Goal')
            .where('Template', '==', true)
            .onSnapshot(
            snapshot => {
                const goalsList = snapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data(),
                }));
                setTemplatedGoals(goalsList);
                setLoading(false);
            },
            error => {
                console.error("Error fetching goals: ", error);
                setLoading(false);
            }
            );
        console.log(templatedGoals)
        return () => unsubscribe();
    }, []);

    if (loading) {
        return <Text>Loading...</Text>;
    }   

    const onPressHandle = async (goalDocId: string) => {
        router.push({ pathname: '/CheckboxPatients', params: { patientId: goalDocId } });
        // navigation.navigate('GoalList', { sessionDocId: patientDocId });
    };

    return (
        <SafeAreaView>
            <FlatList
                data={templatedGoals}
                keyExtractor={item => item.id}
                renderItem={({ item }) => (
                    <TouchableOpacity onPress={() => onPressHandle(item.id)}>
                        <View style={styles.item}>
                            <Image
                                style={styles.itemImage}
                                source={{ uri: 'https://icons-for-free.com/iff/png/512/flag+24px-131985190044767854.png' }}
                            />
                            <View>
                                <Text style={styles.itemName}> {item.id} </Text>
                            </View>
                        </View>
                    </TouchableOpacity>
                )}
            />
        </SafeAreaView>
    );
};

export default TemplatedGoals;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        paddingTop: 50,
        paddingLeft: 20,
        paddingRight: 20, 
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 10,
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        textAlign: 'left',
        marginLeft: 10, 
    },
    item: {
        flexDirection: 'row',
        alignItems: 'center',
        margin: '2%',
        borderBottomWidth: 1
    },
    itemImage: {
        width: 60,
        height: 60,
        marginRight: 10
    },
    goalDetails: {
        flex: 1
    },
    itemTitle: {
        fontWeight: 'bold',
        fontSize: 16
    },
    itemDescription: {
        fontSize: 14
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center'
    },
    emptyText: {
        fontSize: 18,
        textAlign: 'center'
    },
    itemName: {
        fontWeight: 'bold',
        fontSize: 16,
    },
});
