import React, { useEffect, useState, useCallback } from 'react';
import { StyleSheet, View, Text, FlatList, ActivityIndicator, Pressable, TextInput, Alert, Modal } from 'react-native';
import { useSQLiteContext } from 'expo-sqlite';
import { Swipeable } from 'react-native-gesture-handler';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';

const PatientListScreen = ({ navigation }) => {
  const db = useSQLiteContext();
  const [patients, setPatients] = useState([]);
  const [filteredPatients, setFilteredPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchVisible, setSearchVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterModalVisible, setFilterModalVisible] = useState(false);
  const [genderFilter, setGenderFilter] = useState('');
  const [sourceFilter, setSourceFilter] = useState('');

  const fetchPatients = useCallback(async () => {
    try {
      const doctorID = await AsyncStorage.getItem('DoctorID');
      if (!doctorID) {
        Alert.alert('Error', 'Doctor ID not found.');
        return;
      }
      const result = await db.getAllAsync('SELECT * FROM patients WHERE DoctorID = ?', [doctorID]);
      setPatients(result);
      setFilteredPatients(result);
    } catch (error) {
      console.log('Error fetching patients: ', error);
    } finally {
      setLoading(false);
    }
  }, [db]);

  useFocusEffect(
    useCallback(() => {
      fetchPatients();
    }, [fetchPatients])
  );

  const handleSearch = (text) => {
    setSearchQuery(text);
    if (text) {
      const filteredData = patients.filter(patient =>
        `${patient.firstName} ${patient.lastName}`.toLowerCase().includes(text.toLowerCase()) ||
        patient.AMKANumber.includes(text)
      );
      setFilteredPatients(filteredData);
    } else {
      setFilteredPatients(patients);
    }
  };

  const applyFilters = () => {
    let data = [...patients];

    if (genderFilter) {
      data = data.filter(patient => patient.Sex === genderFilter);
    }

    if (sourceFilter) {
      data = data.filter(patient => patient.PatientSource === sourceFilter);
    }

    setFilteredPatients(data);
    setFilterModalVisible(false);
  };

  const resetFilters = () => {
    setGenderFilter('');
    setSourceFilter('');
    setFilteredPatients(patients);
    setFilterModalVisible(false);
  };

  const handleDeletePatient = async (patientID) => {
    try {
      await db.runAsync('DELETE FROM patients WHERE HastaID = ?', [patientID]);
      Alert.alert('Success', 'Patient deleted successfully!');
      fetchPatients();
    } catch (error) {
      console.log('Error deleting patient: ', error);
      Alert.alert('Error', 'An error occurred while deleting the patient.');
    }
  };

  const renderRightActions = (progress, dragX, patientID) => (
    <View style={styles.swipeActions}>
      <Pressable
        style={[styles.actionButton, styles.deleteButton]}
        onPress={() => handleDeletePatient(patientID)}
      >
        <Text style={styles.actionButtonText}>Delete</Text>
      </Pressable>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#3498db" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Patient List</Text>
        <View style={styles.headerButtons}>
          <Pressable style={styles.iconButton} onPress={() => setSearchVisible(!searchVisible)}>
            <Ionicons name="search" size={24} color="white" />
          </Pressable>
          <Pressable style={styles.iconButton} onPress={() => setFilterModalVisible(true)}>
            <Ionicons name="filter" size={24} color="white" />
          </Pressable>
          <Pressable style={styles.iconButton} onPress={() => navigation.navigate('NewPatient', { fromScreen: 'ScreenB' })}>
            <Ionicons name="add" size={24} color="white" />
          </Pressable>
        </View>
      </View>
      {searchVisible && (
        <TextInput
          style={styles.searchInput}
          placeholder="Search by patient name, surname, or AMKA number"
          value={searchQuery}
          onChangeText={handleSearch}
        />
      )}
      <FlatList
        data={filteredPatients}
        keyExtractor={(item) => item.HastaID.toString()}
        renderItem={({ item }) => (
          <Swipeable
            renderRightActions={(progress, dragX) => renderRightActions(progress, dragX, item.HastaID)}
          >
            <Pressable
              style={styles.card}
              onPress={() => navigation.navigate('PatientDetail', { patient: item })}
            >
              <View style={styles.cardContent}>
                <Text style={styles.cardText}>{`${item.firstName} ${item.lastName}`}</Text>
                <Text style={styles.cardSubText}>{`AMKA: ${item.AMKANumber}`}</Text>
              </View>
              <Ionicons name="chevron-forward" size={24} color="#3498db" />
            </Pressable>
          </Swipeable>
        )}
      />
      <Modal
        animationType="slide"
        transparent={true}
        visible={filterModalVisible}
        onRequestClose={() => setFilterModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Filter and Sort</Text>

            <Text style={styles.modalLabel}>Gender:</Text>
            <View style={styles.filterButtonGroup}>
              <Pressable
                style={[styles.filterButton, genderFilter === 'Male' && styles.selectedFilter]}
                onPress={() => setGenderFilter('Male')}
              >
                <Text style={styles.filterButtonText}>Male</Text>
              </Pressable>
              <Pressable
                style={[styles.filterButton, genderFilter === 'Female' && styles.selectedFilter]}
                onPress={() => setGenderFilter('Female')}
              >
                <Text style={styles.filterButtonText}>Female</Text>
              </Pressable>
            </View>

            <Text style={styles.modalLabel}>Source:</Text>
            <View style={styles.filterButtonGroup}>
              <Pressable
                style={[styles.filterButton, sourceFilter === 'Clinic' && styles.selectedFilter]}
                onPress={() => setSourceFilter('Clinic')}
              >
                <Text style={styles.filterButtonText}>Clinic</Text>
              </Pressable>
              <Pressable
                style={[styles.filterButton, sourceFilter === 'Hospital' && styles.selectedFilter]}
                onPress={() => setSourceFilter('Hospital')}
              >
                <Text style={styles.filterButtonText}>Hospital</Text>
              </Pressable>
            </View>

            <View style={styles.modalButtons}>
              <Pressable style={styles.modalButton} onPress={applyFilters}>
                <Text style={styles.modalButtonText}>Apply</Text>
              </Pressable>
              <Pressable style={styles.modalButton} onPress={resetFilters}>
                <Text style={styles.modalButtonText}>Reset</Text>
              </Pressable>
              <Pressable style={styles.modalButton} onPress={() => setFilterModalVisible(false)}>
                <Text style={styles.modalButtonText}>Close</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#ecf0f1',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#3498db',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#bdc3c7',
  },
  headerButtons: {
    flexDirection: 'row',
  },
  iconButton: {
    backgroundColor: '#146C94',
    padding: 10,
    borderRadius: 50,
    marginLeft: 10,
  },
  searchInput: {
    backgroundColor: '#f0f0f0',
    borderRadius: 25,
    padding: 12,
    marginBottom: 15,
    fontSize: 16,
  },
  card: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    marginVertical: 8,
    borderRadius: 15,
    backgroundColor: '#ffffff',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  cardContent: {
    flex: 1,
  },
  cardText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2c3e50',
  },
  cardSubText: {
    fontSize: 14,
    color: '#7f8c8d',
    marginTop: 4,
  },
  swipeActions: {
    flexDirection: 'row',
  },
  actionButton: {
    justifyContent: 'center',
    alignItems: 'center',
    width: 100,
    borderRadius: 15,
    marginVertical: 8,
  },
  deleteButton: {
    backgroundColor: '#F5A623',
  },
  actionButtonText: {
    color: 'white',
    fontSize: 16,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContent: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 15,
    width: '80%',
    maxHeight: '80%',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 15,
    textAlign: 'center',
    color: '#3498db',
  },
  modalLabel: {
    fontSize: 16,
    marginBottom: 10,
    color: '#333',
  },
  filterButtonGroup: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  filterButton: {
    flex: 1,
    backgroundColor: '#f0f0f0',
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 25,
    marginHorizontal: 5,
  },
  selectedFilter: {
    backgroundColor: '#19A7CE',
  },
  filterButtonText: {
    textAlign: 'center',
    color: '#333',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  modalButton: {
    flex: 1,
    backgroundColor: '#19A7CE',
    paddingVertical: 12,
    borderRadius: 25,
    marginHorizontal: 5,
  },
  modalButtonText: {
    color: 'white',
    fontSize: 16,
    textAlign: 'center',
  },
});

export default PatientListScreen;

