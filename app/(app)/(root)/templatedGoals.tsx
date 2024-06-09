import { StyleSheet, TouchableOpacity, FlatList, View, Text, Image, ActivityIndicator } from 'react-native';
import React, { useState, useEffect, useContext } from 'react';
import firestore, { FirebaseFirestoreTypes } from '@react-native-firebase/firestore';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import Colors from '@/constants/Colors';
import { useGoalFirestoreQuery } from '@/components/FetchData';

const TemplatedGoals = () => {
    const router = useRouter();
    const { data: templatedGoals = [], error, isLoading } = useGoalFirestoreQuery();

    if (isLoading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={Colors.blue} />
                <Text style={styles.loadingText}>Cargando...</Text>
            </View>
        );
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
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        marginTop: 10,
        fontSize: 18,
    },
});
