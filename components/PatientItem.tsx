import React from 'react';
import { View, Text, TouchableOpacity, Image, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import Colors from '@/constants/Colors';

interface Goal {
    id: string;
}

interface Patient {
    id: string;
    firstName: string;
    lastName: string;
    idNumber: string;
    Goals: Goal[];
}

interface PatientItemProps {
    item: Patient;
    handleCheckboxPress: (id: string) => void;
    selectedIds: string[];
    loading: boolean;
    goalDocId: string;
}

const PatientItem: React.FC<PatientItemProps> = ({ item, handleCheckboxPress, selectedIds, loading, goalDocId }) => {
    const isChecked = selectedIds.includes(item.id);
    const hasGoal = item.Goals && item.Goals.some((goal: any) => goal.id.toString() === goalDocId);

    const formatId = (idNumber: string) => {
        return idNumber.replace(/(\d{1})(\d{4})(\d{4})/, "$1-$2-$3");
    };

    return (
        <View>
            <View style={styles.item}>
                {loading ? (
                    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                        <Text>Cargando...</Text>
                    </View>
                ) : (
                    <>
                        {hasGoal ? (
                            <View>
                                <Icon name="checkmark-outline" size={24} color="gray" />
                            </View>
                        ) : (
                            <TouchableOpacity onPress={() => handleCheckboxPress(item.id)}>
                                <View style={[styles.checkbox, isChecked && styles.checked]} />
                            </TouchableOpacity>
                        )}

                        <Image
                            style={styles.itemImage}
                            source={{ uri: 'https://icons-for-free.com/iff/png/256/profile+profile+page+user+icon-1320186864367220794.png' }}
                        />
                        <View style={styles.nameAndIdContainer}>
                            <Text style={styles.itemName}> {item.lastName.trim()}, {item.firstName.trim()} </Text>
                            <Text style={styles.itemId}>{formatId(item.idNumber)}</Text>
                        </View>
                    </>
                )}
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    item: {
        flexDirection: 'row',
        alignItems: 'center',
        margin: '1%',
        marginTop: '3%',
        borderBottomWidth: 1,
    },
    checkbox: {
        width: 24,
        height: 24,
        borderWidth: 1,
        borderColor: Colors.gray,
        marginRight: 10,
    },
    checked: {
        backgroundColor: Colors.lightblue,
    },
    itemImage: {
        width: 60,
        height: 60,
    },
    itemName: {
        fontWeight: 'bold',
        fontSize: 16,
    },
    itemId: {
        color: Colors.gray,
        fontStyle: 'italic',
        marginLeft: '2%',
    },
    nameAndIdContainer: {
        flexDirection: 'column',
    },
});

export default PatientItem;
