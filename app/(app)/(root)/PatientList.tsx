import { StyleSheet, TouchableOpacity, FlatList, TextInput, Image } from 'react-native';
import React, { useState, useEffect, useContext } from 'react';
import firestore from '@react-native-firebase/firestore';
import { useRouter } from 'expo-router';
import Colors from '@/constants/Colors';
import { View, Text } from "@/components/Themed";
import { SafeAreaView } from 'react-native-safe-area-context';
import { SessionContext } from '@/shared/LoginSession';
import profileIcon from '@/assets/images/ProfileIcon.png';
import searchIcon from '@/assets/images/searchIcon.png';

function ExpedientesScreen() {
    return (
      <Text style={styles.subtitle}>
        NUTRI<Text style={{ color: Colors.lightblue }}>METAS</Text>
      </Text>
    );
  }

const PatientList = () => {
    const session = useContext(SessionContext);
    const router = useRouter();
    const [patients, setPatients] = useState<any[]>([]);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        const unsubscribe = firestore()
            .collection('Professionals')
            .doc(session?.docId)
            .collection('Patient')
            .onSnapshot((snapshot) => {
                const data = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
                setPatients(sortPatients(data));
            });

        return () => unsubscribe();
    }, []);

    const normalizeString = (str: string) => {
        return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
    };

    const sortPatients = (patientsList: any[]) => {
        return patientsList.sort((a, b) => {
            const lastNameA = normalizeString(a.lastName);
            const lastNameB = normalizeString(b.lastName);
            if (lastNameA < lastNameB) return -1;
            if (lastNameA > lastNameB) return 1;
            return 0;
        });
    };

    const onPressHandle = async (patientDocId: string) => {
        router.push({ pathname: '/GoalList', params: { patientId: patientDocId } });
    };

    const filteredPatients = patients.filter(patient => {

        const searchTermLower = normalizeString(searchTerm);

        const firstNameMatch = normalizeString(patient.firstName).includes(searchTermLower);
        const lastNameMatch = normalizeString(patient.lastName).includes(searchTermLower);
        const idMatch = patient.idNumber.toLowerCase().startsWith(searchTermLower.replace(/-/g, ''));

        const fullNameWithLastName = normalizeString(patient.lastName.trim() + " " + patient.firstName.trim());
        const fullNameWithFirstName = normalizeString(patient.firstName.trim() + " " + patient.lastName.trim());
        const fullNameMatch = fullNameWithLastName.includes(searchTermLower) || fullNameWithFirstName.includes(searchTermLower);


        if (firstNameMatch) {
            return firstNameMatch;
        }
        if (lastNameMatch) {
            return lastNameMatch;
        }
        if (fullNameMatch) {
            return fullNameMatch;
        }
        if (idMatch) {
            return idMatch;
        }
    });

    function formatId(idNumber: string) {
        return idNumber.replace(/(\d{1})(\d{4})(\d{4})/, "$1-$2-$3");
    }
    
    if (patients.length == 0){
        return(
            <SafeAreaView>
                <View style={{height: "100%", alignItems: 'center', marginTop: '70%'}}>
                    <Text style={{textAlign:'center', fontSize: 18}}>
                        No hay pacientes que mostrar. Agregue uno con el botón de abajo
                    </Text>
                    <Image
                        source={require("@/assets/images/below-arrow.png")}
                        style={{width:24, height: 24, margin: 20}}
                    />
                </View>
            </SafeAreaView>
        )
    }
    return (
        <SafeAreaView>
            <FlatList
                data={filteredPatients}
                renderItem={({ item }) => (
                    <TouchableOpacity onPress={() => onPressHandle(item.id)}>
                        <View style={styles.item}>
                            <Image
                                style={styles.itemImage}
                                source={profileIcon}
                            />
                            <View style={styles.nameAndIdContainer}>
                                <Text style={styles.itemName}> {item.lastName.trim()}, {item.firstName.trim()} </Text>
                                <Text style={styles.itemId}>{formatId(item.idNumber)}</Text>
                            </View>
                        </View>
                    </TouchableOpacity>
                )}
                keyExtractor={(item) => item.idNumber}
                ListHeaderComponent={
                    <View >
                        <View style={styles.title}>
                            <ExpedientesScreen />
                        </View>
                        <View style={styles.searchContainer}>
                            <View style={styles.inputContainer}>
                                <Image
                                    style={styles.searchIcon}
                                    source={searchIcon}
                                />
                                <TextInput
                                    style={styles.searchBar}
                                    placeholder="Paciente"
                                    onChangeText={setSearchTerm}
                                    value={searchTerm}
                                />
                            </View>
                        </View>
                    </View>
                }
                
            />
        </SafeAreaView>
    );
}

export default PatientList

const styles = StyleSheet.create({
    searchContainer: {
        flexDirection: 'row',
        borderColor: Colors.lightGray,
        borderWidth: 1,
        borderRadius: 10,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    searchIcon: {
        width: 24,
        height: 24,
        marginRight: 5,
    },
    searchBar: {
        flex: 1,
        height: 40,
    },
    item: {
        flexDirection: 'row',
        alignItems: 'center',
        margin: '1%',
        marginTop: '3%',
        borderBottomWidth: 1,
    },
    itemImage: {
        width: 60,
        height: 60
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
    title: {
        alignItems: 'center',
        top: '-15%'
    },
    subtitle: {
        fontSize: 30,
        fontWeight: 'bold',
        color: Colors.green,
        top: '10%'
    },
});