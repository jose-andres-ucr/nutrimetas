import React from 'react';
import { View, Text, FlatList, StyleSheet,Image } from 'react-native';
import firestore from '@react-native-firebase/firestore';
import { useRoute } from '@react-navigation/native';

const PatientGoals = () => {
    const route = useRoute();
    const patientName = route.params?.name;
    const [goals, setGoals] = React.useState<any[]>([]);
    const [patientInfo, setPatientInfo] = React.useState<any>(null);
    
    React.useEffect(() => {
        const patientRef = firestore().collection('Patient').where('name', '==', patientName);
        const patientUnsubscribe = patientRef.onSnapshot((snapshot) => {
            const patientData = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
            setPatientInfo(patientData[0]);
            //Obtain reference 
            const goalRef = patientData[0].Goals[0];
            // Obtain data through reference
            goalRef.get().then((doc) => {
                if (doc.exists) {
                    setGoals([doc.data()]);
                } else {
                    console.log("No such document!");
                }
            }).catch((error) => {
                console.log("Error getting document:", error);
            });
        });

        return () => {
            patientUnsubscribe();
        };
    }, [patientName]);

    const renderGoalItem = (goal: any) => {
        return (
            <View style={styles.item}>
                <Text>Title: {goal.Title}</Text>
                <Text>Description: {goal.Description}</Text>
            </View>
        );
    };
    const getDescription = (goal: any) => {
        return `${goal.Description} a ${goal.Frequency} veces, ${goal.Modality}`;
    };
    return (
        <View>
            {patientInfo && (
                <View style={styles.patientInfo}>
                    <Text>Name: {patientInfo.name}</Text>
                    <Text>Email: {patientInfo.email}</Text>
                    <Text>Phone: {patientInfo.phone}</Text>
                </View>
            )}
            <FlatList
            data={goals}
            renderItem={({ item }) => (
                    <View style={styles.item}>
                        <Image
                            style={styles.itemImage}
                            source={{ uri: 'https://icons-for-free.com/iff/png/256/profile+profile+page+user+icon-1320186864367220794.png' }}
                        />
                        <View style={styles.goalDetails}>
                            <Text style={styles.itemTitle}>{item.Title}</Text>
                            <Text style={styles.itemDescription}>{getDescription(item)}</Text>
                        </View>
                    </View>
            )}
            keyExtractor={(item) => item.id}
        />
        </View>
    );
};

const styles = StyleSheet.create({
    patientInfo: {
        padding: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#ccc',
        marginBottom: 10,
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
    }
});

export default PatientGoals;
