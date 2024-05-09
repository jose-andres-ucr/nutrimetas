import { StyleSheet, TouchableOpacity, FlatList, View, Text, Image } from 'react-native';
import React, { useState, useEffect } from 'react';
import firestore from '@react-native-firebase/firestore';

const GoalList = () => {
    const [goals, setGoals] = useState<any[]>([]);

    useEffect(() => {
        const unsubscribe = firestore()
            .collection('Goal')
            .onSnapshot((snapshot) => {
                const data = snapshot.docs.map((doc) => doc.data());
                setGoals(data);
            });

        return () => unsubscribe();
    }, []);

    const getDescription = (goal: any) => {
        return `${goal.Description} a ${goal.Frequency} veces, ${goal.Modality}`;
    };

    const onPressHandle = (selectedGoal: any) => {
        console.log(selectedGoal);
    };

    return (
        <FlatList
            data={goals}
            renderItem={({ item }) => (
                <TouchableOpacity onPress={() => onPressHandle(item)}>
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
                </TouchableOpacity>
            )}
            keyExtractor={(item) => item.id}
        />
    );
}

export default GoalList;

const styles = StyleSheet.create({
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