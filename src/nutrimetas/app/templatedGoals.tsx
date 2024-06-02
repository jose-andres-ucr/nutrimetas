import { StyleSheet, TouchableOpacity, FlatList, View, Text, Image } from 'react-native';
import React, { useState, useEffect, useContext } from 'react';
import firestore, { FirebaseFirestoreTypes } from '@react-native-firebase/firestore';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import Colors from '@/constants/Colors';

const TemplatedGoals = () => {
    const router = useRouter();
    const [templatedGoals, setTemplatedGoals] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsubscribe = firestore()
            .collection('Goal')
            .where('Template', '==', true)
            .onSnapshot(
                async snapshot => {
                    try {
                        const goalsListPromises = snapshot.docs.map(async doc => {
                            const goalData = doc.data();
                            const rubricRef = goalData.Rubric;
                            const rubricGoal = await fetchRubricGoal(rubricRef);
                            const descriptionGoal = await fetchDescriptionGoal(goalData);
                            return { id: doc.id, rubric: rubricGoal, description:descriptionGoal};
                        });
    
                        const goalsList = await Promise.all(goalsListPromises);
                        setTemplatedGoals(goalsList);
                        setLoading(false);
                    } catch (error) {
                        console.error("Error fetching goals: ", error);
                        setLoading(false);
                    }
                },
                error => {
                    console.error("Error fetching goals: ", error);
                    setLoading(false);
                }
            );
    
        return () => unsubscribe();
    }, []);

    const fetchReferenceData = async (collection: string, docId: string) => {
        const doc = await firestore().collection(collection).doc(docId).get();
        return doc.exists ? doc.data() : null;
    };

    const fetchDescriptionGoal = async (goalData: FirebaseFirestoreTypes.DocumentData) => {
        try {
            const fetchAllReferences = [
                fetchReferenceData('Type', goalData.Type),
                fetchReferenceData('Action', goalData.Action),
                fetchReferenceData('Rubric', goalData.Rubric),
                fetchReferenceData('Amount', goalData.Amount),
                fetchReferenceData('Portion', goalData.Portion),
                fetchReferenceData('Frequency', goalData.Frequency)
            ];
    
            const [
                typeData,
                actionData,
                rubricData,
                amountData,
                portionData,
                frequencyData
            ] = await Promise.all(fetchAllReferences);
    
            if (!typeData || !actionData || !rubricData || !amountData || !portionData || !frequencyData) {
                console.error('Missing data for building description');
                return '';
            }
    
            const typePrefix = (typeData.Name === 'Aumentar' || typeData.Name === 'Disminuir') ? 'a' : 'en';
            const portionName = (amountData.Value === 1) ? portionData.Name : portionData.Plural;
    
            return `${typeData.Name} ${actionData.Name} ${rubricData.Name} ${typePrefix} ${amountData.Value} ${portionName} ${frequencyData.Name}`;
        } catch (error) {
            console.error('Error building description:', error);
            return '';
        }
    };

    const fetchRubricGoal = async (rubricRef: string) => {
        try {
            const rubricData = await fetchReferenceData('Rubric', rubricRef);
            if (!rubricData) {
                throw new Error('Rubric data is missing');
            }    
            return rubricData.Name;
        } catch (error) {
            console.error('Error fetching rubric:', error);
            return 'Meta';
        }
    };

    if (loading) {
        return <Text>Cargando...</Text>;
    }   

    const onPressHandle = async (goalDocId: string) => {
        router.push({ pathname: '/CheckboxPatients', params: { goalDocId: goalDocId } });
    };

    return (
        <SafeAreaView style={styles.container}>
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
                            <View style={styles.goalDetails}>
                                <Text style={styles.itemTitle}> {item.rubric} </Text>
                                <Text style={styles.itemDescription}>{item.description}</Text>
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
        paddingLeft: 20,
        paddingRight: 20, 
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
        flexDirection: 'column',
        padding: 10,
    },
    itemTitle: {
        fontWeight: 'bold',
        fontSize: 16,
    },
    itemDescription: {
        fontSize: 14,
        flexWrap: 'wrap',
        width: '70%',
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center'
    },
    emptyText: {
        fontSize: 18,
        textAlign: 'center'
    }
});
