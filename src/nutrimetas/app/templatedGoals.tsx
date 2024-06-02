import { StyleSheet, TouchableOpacity, FlatList, View, Text, Image } from 'react-native';
import React, { useState, useEffect, useContext } from 'react';
import firestore from '@react-native-firebase/firestore';
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/Ionicons';
import { SessionContext } from '@/shared/LoginSession';  // Importa el contexto de la sesión
import { useGlobalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

const TemplatedGoals = () => {
    return (
       <SafeAreaView>
            
       </SafeAreaView>
    );
}

export default TemplatedGoals;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        paddingTop: 50,
        paddingLeft: 20,
        paddingRight: 20, // Added paddingRight for space for the tittle
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
        marginLeft: 10, // Margin on the left to separate the button from the title
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
    floatingButton: {
        position: 'absolute',
        bottom: 20,
        right: 20,
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: 'green',
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 5,
    },
});
