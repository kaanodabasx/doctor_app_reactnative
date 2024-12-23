import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Modal, FlatList, TextInput } from 'react-native';
import { useSQLiteContext } from 'expo-sqlite';
import { Ionicons } from '@expo/vector-icons';
import icd10Codes from '../assets/icd10_codes.json';

const PatientHistoryScreen = ({ route, navigation }) => {
    const { patientID } = route.params;
    const db = useSQLiteContext();
    const [historyID, setHistoryID] = useState(null);
    const [diseases, setDiseases] = useState([]);
    const [medications, setMedications] = useState([]);
    const [allergies, setAllergies] = useState([]);
    const [isDiseaseModalVisible, setDiseaseModalVisible] = useState(false);
    const [isMedicationModalVisible, setMedicationModalVisible] = useState(false);
    const [isAllergyModalVisible, setAllergyModalVisible] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [filteredCodes, setFilteredCodes] = useState(icd10Codes);
    const [newItem, setNewItem] = useState('');

    useEffect(() => {
        fetchPatientHistory();
    }, []);

    useEffect(() => {
        if (searchQuery === '') {
            setFilteredCodes(icd10Codes);
        } else {
            const filtered = icd10Codes.filter(code =>
                code.code.toUpperCase().startsWith(searchQuery.toUpperCase()) ||
                code.desc.toUpperCase().includes(searchQuery.toUpperCase())
            );
            setFilteredCodes(filtered);
        }
    }, [searchQuery]);

    const fetchPatientHistory = async () => {
        try {
            const result = await db.getAllAsync(
                'SELECT * FROM history WHERE HastaID = ?',
                [patientID]
            );
            if (result.length > 0) {
                setHistoryID(result[0].HistoryID);
                setDiseases(parseJsonSafely(result[0].Diseases, []));
                setMedications(parseJsonSafely(result[0].Medications, []));
                setAllergies(parseJsonSafely(result[0].Allergies, []));
            } else {
                const insertResult = await db.runAsync(
                    'INSERT INTO history (HastaID, Diseases, Medications, Allergies) VALUES (?, ?, ?, ?)',
                    [patientID, '[]', '[]', '[]']
                );
                setHistoryID(insertResult.insertId);
                setDiseases([]);
                setMedications([]);
                setAllergies([]);
            }
        } catch (error) {
            console.error('Hasta geçmişi alınırken bir hata oluştu:', error);
        }
    };

    const parseJsonSafely = (jsonString, defaultValue) => {
        try {
            return jsonString ? JSON.parse(jsonString) : defaultValue;
        } catch (error) {
            console.log('Error parsing JSON:', error);
            return defaultValue;
        }
    };

    const saveHistory = async () => {
        if (historyID === null) {
            console.error('Kaydedilecek geçmiş kaydı bulunamadı.');
            return;
        }

        try {
            await db.runAsync(
                'UPDATE history SET Diseases = ?, Medications = ?, Allergies = ? WHERE HistoryID = ?',
                [
                    JSON.stringify(diseases),
                    JSON.stringify(medications),
                    JSON.stringify(allergies),
                    historyID
                ]
            );
        } catch (error) {
            console.error('Geçmiş kaydedilirken bir hata oluştu:', error);
        }
    };

    const handleSelectDisease = (item) => {
        const newDisease = `${item.code} - ${item.desc}`;
        if (!diseases.includes(newDisease)) {
            setDiseases(prevDiseases => [...prevDiseases, newDisease]);
        }
        setDiseaseModalVisible(false);
    };

    const addItem = (type) => {
        if (newItem.trim() === '') return;

        switch (type) {
            case 'medication':
                setMedications(prevMedications => [...prevMedications, newItem.trim()]);
                break;
            case 'allergy':
                setAllergies(prevAllergies => [...prevAllergies, newItem.trim()]);
                break;
        }
        setNewItem('');
        if (type === 'medication') {
            setMedicationModalVisible(false);
        } else if (type === 'allergy') {
            setAllergyModalVisible(false);
        }
    };

    const removeItem = (index, type) => {
        switch (type) {
            case 'disease':
                setDiseases(prevDiseases => prevDiseases.filter((_, i) => i !== index));
                break;
            case 'medication':
                setMedications(prevMedications => prevMedications.filter((_, i) => i !== index));
                break;
            case 'allergy':
                setAllergies(prevAllergies => prevAllergies.filter((_, i) => i !== index));
                break;
        }
    };

    useEffect(() => {
        if (historyID !== null) {
            saveHistory();
        }
    }, [diseases, medications, allergies]);

    return (
        <ScrollView style={styles.container}>
            <Text style={styles.title}>Patient History</Text>

            <View style={styles.contentContainer}>
                <View style={styles.leftColumn}>
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Past Diseases</Text>
                        <TouchableOpacity style={styles.addButton} onPress={() => setDiseaseModalVisible(true)}>
                            <Text style={styles.addButtonText}>Add Disease</Text>
                            <Ionicons name="add-circle-outline" size={24} color="#19A7CE" />
                        </TouchableOpacity>
                        {diseases.map((disease, index) => (
                            <View key={index} style={styles.itemContainer}>
                                <Text style={styles.itemText}>{disease}</Text>
                                <TouchableOpacity onPress={() => removeItem(index, 'disease')}>
                                    <Ionicons name="close-circle" size={24} color="#FF6B6B" />
                                </TouchableOpacity>
                            </View>
                        ))}
                    </View>

                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Known Allergies</Text>
                        <TouchableOpacity style={styles.addButton} onPress={() => setAllergyModalVisible(true)}>
                            <Text style={styles.addButtonText}>Add Allergy</Text>
                            <Ionicons name="add-circle-outline" size={24} color="#19A7CE" />
                        </TouchableOpacity>
                        {allergies.map((allergy, index) => (
                            <View key={index} style={styles.itemContainer}>
                                <Text style={styles.itemText}>{allergy}</Text>
                                <TouchableOpacity onPress={() => removeItem(index, 'allergy')}>
                                    <Ionicons name="close-circle" size={24} color="#FF6B6B" />
                                </TouchableOpacity>
                            </View>
                        ))}
                    </View>
                </View>

                <View style={styles.rightColumn}>
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Previously Used Medications</Text>
                        <TouchableOpacity style={styles.addButton} onPress={() => setMedicationModalVisible(true)}>
                            <Text style={styles.addButtonText}>Add Medication</Text>
                            <Ionicons name="add-circle-outline" size={24} color="#19A7CE" />
                        </TouchableOpacity>
                        {medications.map((medication, index) => (
                            <View key={index} style={styles.itemContainer}>
                                <Text style={styles.itemText}>{medication}</Text>
                                <TouchableOpacity onPress={() => removeItem(index, 'medication')}>
                                    <Ionicons name="close-circle" size={24} color="#FF6B6B" />
                                </TouchableOpacity>
                            </View>
                        ))}
                    </View>
                </View>
            </View>

            {/* Disease Modal */}
            <Modal
                visible={isDiseaseModalVisible}
                transparent={true}
                animationType="slide"
                onRequestClose={() => setDiseaseModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <TextInput
                            style={styles.searchInput}
                            placeholder="Search Disease Code"
                            value={searchQuery}
                            onChangeText={setSearchQuery}
                        />
                        <FlatList
                            data={filteredCodes.slice(0, 10)}
                            keyExtractor={(item) => item.code}
                            renderItem={({ item }) => (
                                <TouchableOpacity onPress={() => handleSelectDisease(item)}>
                                    <Text style={styles.modalItem}>{`${item.code} - ${item.desc}`}</Text>
                                </TouchableOpacity>
                            )}
                        />
                        <TouchableOpacity style={styles.closeButton} onPress={() => setDiseaseModalVisible(false)}>
                            <Text style={styles.closeButtonText}>Close</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>

            {/* Medication Modal */}
            <Modal
                visible={isMedicationModalVisible}
                transparent={true}
                animationType="slide"
                onRequestClose={() => setMedicationModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <TextInput
                            style={styles.input}
                            placeholder="Enter medication"
                            value={newItem}
                            onChangeText={setNewItem}
                        />
                        <TouchableOpacity style={styles.addButton} onPress={() => { addItem('medication'); setMedicationModalVisible(false); }}>
                            <Text style={styles.addButtonText}>Add Medication</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.closeButton} onPress={() => setMedicationModalVisible(false)}>
                            <Text style={styles.closeButtonText}>Close</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>

            {/* Allergy Modal */}
            <Modal
                visible={isAllergyModalVisible}
                transparent={true}
                animationType="slide"
                onRequestClose={() => setAllergyModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <TextInput
                            style={styles.input}
                            placeholder="Enter allergy"
                            value={newItem}
                            onChangeText={setNewItem}
                        />
                        <TouchableOpacity style={styles.addButton} onPress={() => { addItem('allergy'); setAllergyModalVisible(false); }}>
                            <Text style={styles.addButtonText}>Add Allergy</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.closeButton} onPress={() => setAllergyModalVisible(false)}>
                            <Text style={styles.closeButtonText}>Close</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 20,
        backgroundColor: '#f5f5f5',
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        marginBottom: 20,
        color: '#146C94',
        textAlign: 'center',
    },
    contentContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    leftColumn: {
        flex: 1,
        marginRight: 10,
    },
    rightColumn: {
        flex: 1,
        marginLeft: 10,
    },
    section: {
        marginBottom: 30,
    },
    sectionTitle: {
        fontSize: 22,
        fontWeight: 'bold',
        marginBottom: 15,
        color: '#146C94',
    },
    addButton: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: '#E8F6FC',
        borderRadius: 10,
        padding: 15,
        marginBottom: 15,
    },
    addButtonText: {
        color: '#19A7CE',
        fontSize: 16,
        fontWeight: 'bold',
    },
    itemContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: '#F0F0F0',
        borderRadius: 8,
        padding: 12,
        marginBottom: 8,
    },
    itemText: {
        fontSize: 16,
        color: '#333',
        flex: 1,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalContent: {
        backgroundColor: '#FFF',
        padding: 20,
        borderRadius: 10,
        width: '80%',
        maxHeight: '80%',
    },
    searchInput: {
        borderWidth: 1,
        borderColor: '#ccc',
        borderRadius: 5,
        padding: 10,
        marginBottom: 10,
    },
    modalItem: {
        fontSize: 16,
        paddingVertical: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    closeButton: {
        backgroundColor: '#19A7CE',
        padding: 10,
        borderRadius: 5,
        alignItems: 'center',
        marginTop: 10,
    },
    closeButtonText: {
        color: '#FFF',
        fontSize: 16,
        fontWeight: 'bold',
    },
    input: {
        height: 40,
        borderColor: '#ccc',
        borderWidth: 1,
        borderRadius: 5,
        paddingHorizontal: 10,
        marginBottom: 10,
    },
});

export default PatientHistoryScreen;
