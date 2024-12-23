import { Picker } from '@react-native-picker/picker';
import React, { useState, useEffect, useCallback } from 'react';
import { StyleSheet, View, Text, TextInput, Pressable, Alert, ScrollView, Modal, FlatList } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import icd10Codes from '../assets/icd10_codes.json';
import { useSQLiteContext } from 'expo-sqlite';
import { useFocusEffect } from '@react-navigation/native';

const NewPatientScreen = ({ navigation, route }) => {
  const { fromScreen } = route.params || {};
  const db = useSQLiteContext();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [AMKANumber, setAmkaNumber] = useState('');
  const [Sex, setSex] = useState('');
  const [Address, setAddress] = useState('');
  const [PostalCode, setPostalCode] = useState('');
  const [City, setCity] = useState('');
  const [Telefon, setTelefon] = useState('');
  const [Email, setEmail] = useState('');
  const [dob, setDob] = useState('');
  const [DoctorID, setDoctorID] = useState('');
  const [Disease, setSelectedDisease] = useState('');
  const [isModalVisible, setModalVisible] = useState(false);
  const [isDiseaseModalVisible, setDiseaseModalVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredCodes, setFilteredCodes] = useState([]);
  const [PatientSource, setPatientSource] = useState('');
  const [isSourceModalVisible, setIsSourceModalVisible] = useState(false);

  const fetchDoctorID = useCallback(async () => {
    try {
      const id = await AsyncStorage.getItem('DoctorID');
      if (id !== null) {
        setDoctorID(id);
      }
    } catch (error) {
      console.log('Error while getting DoctorID:', error);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchDoctorID();
    }, [fetchDoctorID])
  );

  useEffect(() => {
    setFilteredCodes(icd10Codes);
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

  const handleAddPatient = async () => {
    if (!firstName || !lastName || !dob || !AMKANumber || !Sex || !Address || !PostalCode || !City || !Telefon || !Email || !Disease || !PatientSource) {
      Alert.alert('Attention!', 'Please fill all fields.');
      return;
    }

    try {
      await db.runAsync(
        'INSERT INTO patients (firstName, lastName, AMKAnumber, Sex, Disease, Address, PostalCode, City, Telefon, Email, dob, DoctorID, PatientSource) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [firstName, lastName, AMKANumber, Sex, Disease, Address, PostalCode, City, Telefon, Email, dob, DoctorID, PatientSource]
      );

      navigation.navigate('PatientList');

    } catch (error) {
      console.log('Error while adding patient: ', error);
      Alert.alert('Error', 'An error occurred while adding the patient.');
    }
  };

  const toggleModal = () => {
    setModalVisible(!isModalVisible);
  };

  const toggleDiseaseModal = () => {
    setDiseaseModalVisible(!isDiseaseModalVisible);
  };

  const toggleSourceModal = () => {
    setIsSourceModalVisible(!isSourceModalVisible);
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Add New Patient</Text>

      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Personal Information</Text>
        <TextInput
          style={styles.input}
          placeholder='First Name'
          value={firstName}
          onChangeText={setFirstName}
        />
        <TextInput
          style={styles.input}
          placeholder='Last Name'
          value={lastName}
          onChangeText={setLastName}
        />
        <TextInput
          style={styles.input}
          placeholder='AMKA Number'
          value={AMKANumber}
          onChangeText={setAmkaNumber}
          keyboardType="numeric"
        />
        <TextInput
          style={styles.input}
          placeholder='Date of Birth (YYYY-MM-DD)'
          value={dob}
          onChangeText={setDob}
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Contact Information</Text>
        <TextInput
          style={styles.input}
          placeholder='Address'
          value={Address}
          onChangeText={setAddress}
          multiline
        />
        <TextInput
          style={styles.input}
          placeholder='City'
          value={City}
          onChangeText={setCity}
        />
        <TextInput
          style={styles.input}
          placeholder='Postal Code'
          value={PostalCode}
          onChangeText={setPostalCode}
          keyboardType="numeric"
        />
        <TextInput
          style={styles.input}
          placeholder='Phone Number'
          value={Telefon}
          onChangeText={setTelefon}
          keyboardType="phone-pad"
        />
        <TextInput
          style={styles.input}
          placeholder='Email'
          value={Email}
          onChangeText={setEmail}
          keyboardType="email-address"
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Other Information</Text>
        <Pressable style={styles.pickerButton} onPress={toggleModal}>
          <Text style={styles.pickerButtonText}>{Sex || 'Select Gender'}</Text>
        </Pressable>
        <Pressable style={styles.pickerButton} onPress={toggleDiseaseModal}>
          <Text style={styles.pickerButtonText}>{Disease || 'Select Disease'}</Text>
        </Pressable>
        <Pressable style={styles.pickerButton} onPress={toggleSourceModal}>
          <Text style={styles.pickerButtonText}>{PatientSource || 'Select Source'}</Text>
        </Pressable>
      </View>

      <Pressable style={styles.submitButton} onPress={handleAddPatient}>
        <Text style={styles.submitButtonText}>Add Patient</Text>
      </Pressable>

      <Modal
        visible={isModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={toggleModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Picker
              selectedValue={Sex}
              style={styles.picker}
              onValueChange={(itemValue) => {
                setSex(itemValue);
                toggleModal();
              }}
            >
              <Picker.Item label="Select Gender" value="" />
              <Picker.Item label="Male" value="Male" />
              <Picker.Item label="Female" value="Female" />
            </Picker>
          </View>
        </View>
      </Modal>

      <Modal
        visible={isDiseaseModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={toggleDiseaseModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Pressable onPress={toggleDiseaseModal} style={styles.closeButton}>
              <Text style={styles.closeButtonText}>X</Text>
            </Pressable>

            <TextInput
              style={styles.input}
              placeholder="Search Disease Code"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            <FlatList
              data={filteredCodes.slice(0, 10)}
              keyExtractor={(item) => item.code}
              renderItem={({ item }) => (
                <Pressable onPress={() => {
                  setSelectedDisease(item.code + " - " + item.desc);
                  toggleDiseaseModal();
                }}>
                  <Text>{`${item.code} - ${item.desc}`}</Text>
                </Pressable>
              )}
            />
          </View>
        </View>
      </Modal>

      <Modal
        visible={isSourceModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={toggleSourceModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Picker
              selectedValue={PatientSource}
              style={styles.picker}
              onValueChange={(itemValue) => {
                setPatientSource(itemValue);
                toggleSourceModal();
              }}
            >
              <Picker.Item label="Select Source" value="" />
              <Picker.Item label="Clinic" value="Clinic" />
              <Picker.Item label="Hospital" value="Hospital" />
            </Picker>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 20,
    backgroundColor: '#ecf0f1', // Çok açık gri
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: "center",
    color: '#3498db', // Canlı mavi
  },
  inputGroup: {
    marginBottom: 20,
    backgroundColor: '#ffffff', // Beyaz
    borderRadius: 10,
    padding: 15,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.23,
    shadowRadius: 2.62,
    elevation: 4,
  },
  inputLabel: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#3498db', // Canlı mavi
  },
  input: {
    width: '100%',
    padding: 12,
    marginVertical: 8,
    borderWidth: 1,
    borderColor: '#bdc3c7', // Açık gri
    borderRadius: 8,
    fontSize: 16,
  },
  pickerButton: {
    backgroundColor: '#bdc3c7', // Açık gri
    padding: 12,
    borderRadius: 8,
    marginVertical: 8,
  },
  pickerButtonText: {
    fontSize: 16,
    color: '#2c3e50', // Koyu lacivert
  },
  submitButton: {
    backgroundColor: '#146C94', // Canlı mavi
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
  },
  submitButtonText: {
    color: '#ffffff', // Beyaz
    fontWeight: 'bold',
    fontSize: 18,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#ffffff', // Beyaz
    padding: 20,
    borderRadius: 10,
    width: '80%',
  },
  closeButton: {
    position: 'absolute',
    top: 5,
    right: 5,
    backgroundColor: '#e74c3c', // Kırmızı
    borderRadius: 10,
    padding: 3,
    zIndex: 1,
  },
  closeButtonText: {
    color: '#ffffff', // Beyaz
    fontWeight: 'bold',
    fontSize: 16,
  },
});

export default NewPatientScreen;