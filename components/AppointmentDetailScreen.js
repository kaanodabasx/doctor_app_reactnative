import React, { useEffect, useState } from 'react';
import { StyleSheet, View, Text, Button, Image, Alert, Pressable, TextInput, ScrollView, TouchableOpacity, Modal, FlatList } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import { useSQLiteContext } from 'expo-sqlite';
import { Picker } from '@react-native-picker/picker';
import icd10Codes from '../assets/icd10_codes.json';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

const AppointmentDetailScreen = ({ route, navigation }) => {
  const { appointmentID } = route.params || {};
  const db = useSQLiteContext();
  const [appointment, setAppointment] = useState(null);
  const [image, setImage] = useState(null);
  const [description, setDescription] = useState('');
  const [xrays, setXrays] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedXray, setSelectedXray] = useState(null);
  const [patient, setPatient] = useState(null);
  const [notes, setNotes] = useState([]);
  const [newNote, setNewNote] = useState('');
  const [noteInputVisible, setNoteInputVisible] = useState(false);
  const [selectedDiseases, setSelectedDiseases] = useState([]);
  const [isDiseaseModalVisible, setDiseaseModalVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredCodes, setFilteredCodes] = useState(icd10Codes);
  const [medications, setMedications] = useState([]);
  const [newMedication, setNewMedication] = useState('');
  const [location, setLocation] = useState('');

  useEffect(() => {
    if (appointmentID) {
      fetchAppointmentDetails();
      requestPermissions();
    }
  }, [appointmentID]);

  const fetchAppointmentDetails = async () => {
    try {
      const result = await db.getAllAsync('SELECT * FROM appointments WHERE AppointmentID = ?', [appointmentID]);
      if (result.length > 0) {
        setAppointment(result[0]);
        fetchXrays();
        fetchPatientDetails(result[0].HastaID);
        fetchNotes();
        fetchMedications();
      }
    } catch (error) {
      console.log('Error fetching appointment details: ', error);
    }
  };

  const requestPermissions = async () => {
    const { status: cameraStatus } = await ImagePicker.requestCameraPermissionsAsync();
    const { status: galleryStatus } = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (cameraStatus !== 'granted' || galleryStatus !== 'granted') {
      Alert.alert('Permission required', 'Camera and gallery permissions are required to use this feature.');
    }
  };

  const fetchXrays = async () => {
    try {
      const result = await db.getAllAsync('SELECT * FROM xray WHERE AppointmentID = ?', [appointmentID]);
      setXrays(result);
    } catch (error) {
      console.log('Error fetching X-rays: ', error);
    }
  };

  const fetchPatientDetails = async (patientID) => {
    try {
      const result = await db.getAllAsync('SELECT * FROM patients WHERE HastaID = ?', [patientID]);
      if (result.length > 0) {
        setPatient(result[0]);
        const visitDiseaseResult = await db.getAllAsync('SELECT VisitDisease, Location FROM appointments WHERE AppointmentID = ?', [appointmentID]);
        if (visitDiseaseResult.length > 0) {
          const visitDisease = visitDiseaseResult[0].VisitDisease;
          setSelectedDiseases(visitDisease ? visitDisease.split(', ') : []);
          setLocation(visitDiseaseResult[0].Location);
        }
      }
    } catch (error) {
      console.log('Error fetching patient details: ', error);
    }
  };

  const fetchNotes = async () => {
    try {
      const result = await db.getAllAsync('SELECT Note FROM appointments WHERE AppointmentID = ?', [appointmentID]);
      setNotes([result[0]?.Note].filter(Boolean));
    } catch (error) {
      console.log('Error fetching notes: ', error);
    }
  };

  const fetchMedications = async () => {
    try {
      const result = await db.getAllAsync('SELECT Medication FROM appointments WHERE AppointmentID = ?', [appointmentID]);
      setMedications(
        result
          .map(item => item.Medication)
          .filter(Boolean) // null ve undefined değerleri filtrele
          .flatMap(med => med.split(',')) // virgülle ayrılmış ilaçları ayır
          .map(med => med.trim()) // her ilacı trimle
          .filter(med => med !== '') // boş stringleri filtrele
      );
    } catch (error) {
      console.log('Error fetching medications: ', error);
    }
  };

  const handleAddXray = async () => {
    if (image) {
      const fileName = image.uri.split('/').pop();
      const fileUri = `${FileSystem.documentDirectory}${fileName}`;
      try {
        await FileSystem.copyAsync({
          from: image.uri,
          to: fileUri,
        });

        await db.runAsync('INSERT INTO xray (FileName, Description, AppointmentID, HastaID) VALUES (?, ?, ?, ?)', [
          fileUri,
          description,
          appointmentID,
          appointment.HastaID,
        ]);
        setImage(null);
        setDescription('');
        fetchXrays();
      } catch (error) {
        console.log('Error adding X-ray: ', error);
        Alert.alert('Error', 'An error occurred while adding the X-ray.');
      }
    } else {
      Alert.alert('Error', 'No image selected.');
    }
  };

  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });

    if (!result.canceled) {
      setImage(result.assets[0]);
    }
  };

  const takePhoto = async () => {
    let result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });

    if (!result.canceled) {
      setImage(result.assets[0]);
    }
  };

  const openModal = (xray) => {
    setSelectedXray(xray);
    setModalVisible(true);
  };

  const closeModal = () => {
    setSelectedXray(null);
    setModalVisible(false);
  };

  const handleViewPatientDetails = () => {
    if (appointment && appointment.HastaID) {
      navigation.navigate('PatientDetail', {
        patientID: appointment.HastaID,
      });
    } else {
      Alert.alert('Error', 'Patient details are not available.');
    }
  };

  const handleAddNote = async () => {
    if (newNote.trim()) {
      try {
        await db.runAsync('UPDATE appointments SET Note = ? WHERE AppointmentID = ?', [
          newNote.trim(),
          appointmentID,
        ]);
        setNewNote('');
        setNoteInputVisible(false);
        fetchNotes();
      } catch (error) {
        console.log('Error adding note: ', error);
        Alert.alert('Error', 'An error occurred while adding the note.');
      }
    } else {
      Alert.alert('Error', 'Note cannot be empty.');
    }
  };

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

  const handleSelectDisease = (item) => {
    const updatedDiseases = selectedDiseases.includes(item)
      ? selectedDiseases.filter(disease => disease !== item)
      : [...selectedDiseases, item];
    setSelectedDiseases(updatedDiseases);
    updateVisitDisease(updatedDiseases.join(', '));
    setDiseaseModalVisible(false);
  };

  const handleDeleteDisease = (diseaseToDelete) => {
    const updatedDiseases = selectedDiseases.filter(disease => disease !== diseaseToDelete);
    setSelectedDiseases(updatedDiseases);
    updateVisitDisease(updatedDiseases.join(', '));
  };

  const updateVisitDisease = async (diseases) => {
    try {
      await db.runAsync('UPDATE appointments SET VisitDisease = ? WHERE AppointmentID = ?', [
        diseases,
        appointmentID,
      ]);
    } catch (error) {
      console.log('Error updating VisitDisease: ', error);
    }
  };

  const handleAddMedication = async () => {
    if (newMedication.trim()) {
      try {
        const updatedMedications = [...medications, newMedication.trim()];
        await db.runAsync('UPDATE appointments SET Medication = ? WHERE AppointmentID = ?', [
          updatedMedications.join(', '),
          appointmentID,
        ]);
        setNewMedication('');
        fetchMedications();
      } catch (error) {
        console.log('Error adding medication: ', error);
        Alert.alert('Error', 'An error occurred while adding the medication.');
      }
    } else {
      Alert.alert('Error', 'Medication cannot be empty.');
    }
  };

  const handleDeleteMedication = async (medicationToDelete) => {
    try {
      const updatedMedications = medications.filter(medication => medication.trim() !== medicationToDelete.trim());
      await db.runAsync('UPDATE appointments SET Medication = ? WHERE AppointmentID = ?', [
        updatedMedications.join(', '),
        appointmentID,
      ]);
      fetchMedications();
    } catch (error) {
      console.log('Error deleting medication: ', error);
      Alert.alert('Error', 'An error occurred while deleting the medication.');
    }
  };

  const handleDeleteXray = async (xrayID) => {
    try {
      await db.runAsync('DELETE FROM xray WHERE XrayID = ?', [xrayID]);
      Alert.alert('Success', 'X-ray deleted successfully!');
      fetchXrays();
    } catch (error) {
      console.log('Error deleting X-ray: ', error);
      Alert.alert('Error', 'An error occurred while deleting the X-ray.');
    }
  };

  return (
    <LinearGradient
      colors={['#F0F8FF', '#E6F3FF']}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {appointment ? (
          <>
            <View style={styles.header}>
              <Text style={styles.title}>Visit Details</Text>
              <Text style={styles.subtitle}>{`${appointment.Date} / ${appointment.Hour}`}</Text>
              <Text style={styles.locationText}>{appointment.Location}</Text>
            </View>

            <View style={styles.card}>
              <Text style={styles.cardTitle}>Description</Text>
              <Text style={styles.descriptionText}>{appointment.Description}</Text>
            </View>

            <View style={styles.rowContainer}>
              {patient && (
                <View style={[styles.card, styles.halfWidth]}>
                  <Text style={styles.cardTitle}>Patient Information</Text>
                  <View style={styles.patientInfoRow}>
                    <Text style={styles.patientInfoLabel}>Name:</Text>
                    <Text style={styles.patientInfoText}>{`${patient.firstName} ${patient.lastName}`}</Text>
                  </View>
                  <View style={styles.patientInfoRow}>
                    <Text style={styles.patientInfoLabel}>AMKA No:</Text>
                    <Text style={styles.patientInfoText}>{patient.AMKANumber}</Text>
                  </View>
                  <View style={styles.patientInfoRow}>
                    <Text style={styles.patientInfoLabel}>Phone:</Text>
                    <Text style={styles.patientInfoText}>{patient.Telefon}</Text>
                  </View>
                  <View style={styles.patientInfoRow}>
                    <Text style={styles.patientInfoLabel}>Main Disease:</Text>
                    <Text style={styles.patientInfoText}>{patient.Disease}</Text>
                  </View>
                  <View style={styles.patientInfoRow}>
                    <Text style={styles.patientInfoLabel}>First Location:</Text>
                    <Text style={styles.patientInfoText}>{patient.PatientSource}</Text>
                  </View>
                </View>
              )}

              <View style={[styles.card, styles.halfWidth]}>
                <Text style={styles.cardTitle}>Notes</Text>
                {notes.length > 0 ? (
                  notes.map((note, index) => (
                    <View key={index} style={styles.noteContainer}>
                      <Text style={styles.note}>{note}</Text>
                    </View>
                  ))
                ) : (
                  <Text style={styles.noDataText}>No notes available.</Text>
                )}
                {noteInputVisible ? (
                  <>
                    <TextInput
                      style={styles.input}
                      placeholder="Enter note"
                      value={newNote}
                      onChangeText={setNewNote}
                      multiline
                    />
                    <TouchableOpacity style={styles.addButton} onPress={handleAddNote}>
                      <Text style={styles.addButtonText}>Save Note</Text>
                    </TouchableOpacity>
                  </>
                ) : (
                  <TouchableOpacity style={styles.addButton} onPress={() => setNoteInputVisible(true)}>
                    <Text style={styles.addButtonText}>Add New Note</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>

            <View style={styles.rowContainer}>
              <View style={[styles.card, styles.halfWidth]}>
                <Text style={styles.cardTitle}>Diseases</Text>
                {selectedDiseases.length > 0 ? (
                  selectedDiseases.map((disease, index) => (
                    <View key={index} style={styles.diseaseContainer}>
                      <Text style={styles.diseaseText}>{disease}</Text>
                      <TouchableOpacity onPress={() => handleDeleteDisease(disease)}>
                        <Ionicons name="close-circle" size={24} color="#FF6B6B" />
                      </TouchableOpacity>
                    </View>
                  ))
                ) : (
                  <Text style={styles.noDataText}>No diseases selected.</Text>
                )}
                <TouchableOpacity style={styles.addButton} onPress={() => setDiseaseModalVisible(true)}>
                  <Ionicons name="add-circle-outline" size={24} color="#FFFFFF" />
                  <Text style={styles.addButtonText}>Add Disease</Text>
                </TouchableOpacity>
              </View>

              <View style={[styles.card, styles.halfWidth]}>
                <Text style={styles.cardTitle}>Medications</Text>
                {medications.filter(med => med.trim()).length > 0 ? (
                  medications.filter(med => med.trim()).map((medication, index) => (
                    <View key={index} style={styles.medicationContainer}>
                      <Text style={styles.medicationText}>{medication}</Text>
                      <TouchableOpacity onPress={() => handleDeleteMedication(medication)}>
                        <Ionicons name="close-circle" size={24} color="#FF6B6B" />
                      </TouchableOpacity>
                    </View>
                  ))
                ) : (
                  <Text style={styles.noDataText}>No medications available.</Text>
                )}
                <View style={styles.addMedicationContainer}>
                  <TextInput
                    style={styles.input}
                    placeholder="Add Medication"
                    value={newMedication}
                    onChangeText={setNewMedication}
                  />
                  <TouchableOpacity style={styles.addButton} onPress={handleAddMedication}>
                    <Ionicons name="add-circle-outline" size={24} color="#FFFFFF" />
                    <Text style={styles.addButtonText}>Add</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>

            <View style={styles.card}>
              <Text style={styles.cardTitle}>X-ray Images</Text>
              <ScrollView horizontal style={styles.imageScrollContainer}>
                {xrays.map((xray) => (
                  <View key={xray.XrayID} style={styles.xrayContainer}>
                    <TouchableOpacity onPress={() => openModal(xray)}>
                      <Image
                        source={{ uri: xray.FileName }}
                        style={styles.image}
                      />
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.deleteXrayButton}
                      onPress={() => handleDeleteXray(xray.XrayID)}
                    >
                      <Ionicons name="trash-outline" size={24} color="#FF6B6B" />
                    </TouchableOpacity>
                  </View>
                ))}
              </ScrollView>
              {image && (
                <View style={styles.imagePreviewContainer}>
                  <Image source={{ uri: image.uri }} style={styles.imagePreview} />
                </View>
              )}
              <TextInput
                style={[styles.input, styles.xrayDescriptionInput]}
                placeholder="Enter X-ray description"
                value={description}
                onChangeText={setDescription}
              />
              <View style={styles.buttonContainer}>
                <TouchableOpacity style={styles.button} onPress={pickImage}>
                  <Ionicons name="images-outline" size={24} color="white" />
                  <Text style={styles.buttonText}>Pick Image</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.button} onPress={takePhoto}>
                  <Ionicons name="camera-outline" size={24} color="white" />
                  <Text style={styles.buttonText}>Take Photo</Text>
                </TouchableOpacity>
              </View>
              <TouchableOpacity style={styles.addButton} onPress={handleAddXray}>
                <Text style={styles.addButtonText}>Add X-ray</Text>
              </TouchableOpacity>
            </View>
          </>
        ) : (
          <Text style={styles.noDataText}>Loading visit details...</Text>
        )}
      </ScrollView>

      <Modal
        visible={isDiseaseModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setDiseaseModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
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
                <Pressable onPress={() => handleSelectDisease(item.code + " - " + item.desc)}>
                  <Text>{`${item.code} - ${item.desc}`}</Text>
                </Pressable>
              )}
            />
            <Pressable style={styles.closeButton} onPress={() => setDiseaseModalVisible(false)}>
              <Text style={styles.closeButtonText}>Close</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      <Modal
        transparent={true}
        visible={modalVisible}
        onRequestClose={closeModal}
      >
        <View style={styles.modalContainer}>
          {selectedXray && (
            <>
              <Image source={{ uri: selectedXray.FileName }} style={styles.modalImage} />
              <Text style={styles.modalDescription}>{selectedXray.Description}</Text>
            </>
          )}
          <View style={styles.modalButtons}>
            <Pressable style={styles.closeButton} onPress={closeModal}>
              <Text style={styles.closeButtonText}>Close</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
  },
  header: {
    marginBottom: 20,
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 18,
    color: '#666',
    marginBottom: 5,
  },
  locationText: {
    fontSize: 16,
    color: '#4A90E2',
    fontWeight: '500',
  },
  card: {
    backgroundColor: '#FFF',
    borderRadius: 15,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  descriptionText: {
    fontSize: 16,
    color: '#555',
    lineHeight: 24,
  },
  patientInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  patientInfoLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#666',
    flex: 1,
  },
  patientInfoText: {
    fontSize: 16,
    color: '#333',
    flex: 2,
    textAlign: 'right',
  },
  diseaseContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F0F8FF',
    borderRadius: 10,
    padding: 10,
    marginBottom: 10,
  },
  diseaseText: {
    fontSize: 16,
    color: '#333',
    flex: 1,
  },
  medicationContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F0F8FF',
    borderRadius: 10,
    padding: 10,
    marginBottom: 10,
  },
  medicationText: {
    fontSize: 16,
    color: '#333',
    flex: 1,
  },
  addMedicationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#DDD',
    borderRadius: 10,
    padding: 10,
    fontSize: 16,
    marginRight: 10,
  },
  addButton: {
    backgroundColor: '#19A7CE',
    padding: 10,
    borderRadius: 10,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
  },
  addButtonText: {
    color: '#FFF',
    fontSize: 16,
    marginLeft: 5,
  },
  imageScrollContainer: {
    flexDirection: 'row',
    marginBottom: 15,
  },
  xrayContainer: {
    marginRight: 15,
    position: 'relative',
  },
  image: {
    width: 120,
    height: 120,
    borderRadius: 10,
  },
  deleteXrayButton: {
    position: 'absolute',
    top: 5,
    right: 5,
    backgroundColor: 'rgba(255,255,255,0.8)',
    borderRadius: 15,
    padding: 5,
  },
  imagePreviewContainer: {
    alignItems: 'center',
    marginVertical: 15,
  },
  imagePreview: {
    width: 200,
    height: 200,
    borderRadius: 10,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  button: {
    backgroundColor: '#19A7CE',
    padding: 10,
    borderRadius: 10,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    flex: 1,
    marginHorizontal: 5,
  },
  buttonText: {
    color: '#FFF',
    fontSize: 16,
    marginLeft: 5,
  },
  noteContainer: {
    backgroundColor: '#F0F8FF',
    borderRadius: 10,
    padding: 15,
    marginBottom: 10,
  },
  note: {
    fontSize: 16,
    color: '#333',
  },
  noDataText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginTop: 10,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalImage: {
    width: '90%',
    height: '80%',
    borderRadius: 10,
  },
  closeButton: {
    backgroundColor: '#FF5C5C',
    padding: 10,
    borderRadius: 5,
    marginTop: 20,
  },
  closeButtonText: {
    color: '#FFF',
    fontSize: 16,
  },
  modalDescription: {
    marginTop: 10,
    fontSize: 18,
    color: 'white',
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
  },
  pickerText: {
    fontSize: 16,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 20,
  },
  selectedDiseaseText: {
    fontSize: 18,
    fontWeight: 'bold',
    marginVertical: 10,
    marginTop: 20,
  },
  medicationContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 5,
  },
  deleteText: {
    color: 'red',
    fontWeight: 'bold',
  },
  bottomSpacing: {
    height: 100,
  },
  rowContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  halfWidth: {
    width: '48%',
  },
  xrayDescriptionInput: {
    marginBottom: 15,
  },
});

export default AppointmentDetailScreen;

