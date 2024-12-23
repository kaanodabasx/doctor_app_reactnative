import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, FlatList, Pressable, Alert, Image, Modal, TouchableOpacity, ScrollView } from 'react-native';
import { useSQLiteContext } from 'expo-sqlite';
import { Swipeable } from 'react-native-gesture-handler';
import { Ionicons } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';
import { ICD10Codes } from '../data/ICD10Codes'; // Import ICD-10 codes

const PatientDetailScreen = ({ route, navigation }) => {
  const { patient } = route.params;
  const db = useSQLiteContext();
  const [visits, setVisits] = useState([]);
  const [xrays, setXrays] = useState([]);
  const [selectedXray, setSelectedXray] = useState(null);
  const [medications, setMedications] = useState([]);
  const [showHistory, setShowHistory] = useState(false);
  const [visitHistory, setVisitHistory] = useState([]);
  const [selectedICD10, setSelectedICD10] = useState('');
  const [icd10Codes, setIcd10Codes] = useState([]);
  const [showMedicalHistoryModal, setShowMedicalHistoryModal] = useState(false);
  const [medicalHistory, setMedicalHistory] = useState([]);

  const fetchVisits = async () => {
    try {
      const result = await db.getAllAsync(
        'SELECT * FROM appointments WHERE HastaID = ? ORDER BY Date DESC, Hour DESC LIMIT 2',
        [patient.HastaID]
      );
      setVisits(result || []);
    } catch (error) {
      console.log('Error fetching visits: ', error);
      setVisits([]);
    }
  };

  const fetchXrays = async () => {
    try {
      const result = await db.getAllAsync('SELECT * FROM xray WHERE HastaID = ?', [patient.HastaID]);
      setXrays(result);
    } catch (error) {
      console.log('Error fetching X-rays: ', error);
    }
  };

  const fetchMedications = async () => {
    try {
      const result = await db.getAllAsync('SELECT Medication FROM appointments WHERE HastaID = ?', [patient.HastaID]);
      const uniqueMedications = [...new Set(result
        .map(item => item.Medication)
        .flatMap(med => med ? med.split(',') : [])
        .map(med => med.trim())
        .filter(Boolean)
      )];
      setMedications(uniqueMedications);
    } catch (error) {
      console.log('Error fetching medications: ', error);
    }
  };

  const fetchVisitHistory = async () => {
    try {
      const result = await db.getAllAsync(
        'SELECT AppointmentID, Date, Hour, VisitDisease, PatientName FROM appointments WHERE HastaID = ? ORDER BY Date DESC, Hour DESC',
        [patient.HastaID]
      );
      setVisitHistory(result);
    } catch (error) {
      console.log('Error fetching visit history: ', error);
    }
  };

  const fetchMedicalHistory = async () => {
    try {
      const appointmentsResult = await db.getAllAsync(
        'SELECT DISTINCT VisitDisease FROM appointments WHERE HastaID = ?',
        [patient.HastaID]
      );
      const historyResult = await db.getAllAsync(
        'SELECT Diseases FROM history WHERE HastaID = ?',
        [patient.HastaID]
      );

      const cleanDisease = (disease) => disease.replace(/[\[\]"]/g, '').trim();

      const visitDiseases = appointmentsResult
        .map(item => cleanDisease(item.VisitDisease))
        .filter(Boolean);
      const historyDiseases = historyResult
        .map(item => cleanDisease(item.Diseases))
        .filter(Boolean);

      setMedicalHistory({ visitDiseases, historyDiseases });
    } catch (error) {
      console.log('Error fetching medical history: ', error);
    }
  };

  useEffect(() => {
    fetchVisits();
    fetchXrays();
    fetchMedications();
    fetchVisitHistory();
    fetchMedicalHistory();

    navigation.setOptions({
      headerRight: () => (
        <View style={styles.headerButtons}>
          <TouchableOpacity
            onPress={() => navigation.navigate('AppointmentsList', { patientID: patient.HastaID })}
            style={styles.headerButton}
          >
            <Text style={styles.headerButtonText}>Visits</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => navigation.navigate('PatientHistory', { patientID: patient.HastaID })}
            style={styles.headerButton}
          >
            <Ionicons name="time-outline" size={18} color="white" />
            <Text style={styles.headerButtonText}>Patient History</Text>
          </TouchableOpacity>
        </View>
      ),
    });

    // Load ICD10Codes
    if (Array.isArray(ICD10Codes)) {
      setIcd10Codes(ICD10Codes);
    } else {
      console.error('ICD10Codes is not an array or is undefined');
      setIcd10Codes([]);
    }
  }, [db, patient.HastaID, navigation]);


  const handleDeleteVisit = async (visitID) => {
    try {
      await db.runAsync('DELETE FROM appointments WHERE AppointmentID = ?', [visitID]);
      Alert.alert('Success', 'Visit deleted successfully!');
      fetchVisits();
    } catch (error) {
      console.log('Error deleting visit: ', error);
      Alert.alert('Error', 'An error occurred while deleting the visit.');
    }
  };

  const handleXrayPress = (xray) => {
    setSelectedXray(xray);
  };

  const handleModalClose = () => {
    setSelectedXray(null);
  };

  const handleVisitPress = (appointmentID) => {
    navigation.navigate('AppointmentDetail', { appointmentID });
  };

  const handleICD10Change = (itemValue) => {
    setSelectedICD10(itemValue);
    // Filter visit history based on the selected ICD-10 code
    // Example: filterVisitHistory(itemValue);
  };

  return (
    <ScrollView contentContainerStyle={{ paddingBottom: '5%' }}>
      <View style={styles.container}>
        <Text style={styles.title}>Patient Details</Text>

        <View style={styles.infoRow}>
          <View style={styles.infoColumn}>
            <View style={styles.sectionContainer}>
              <Text style={styles.sectionTitle}>Personal Information</Text>
              <View style={styles.infoContainer}>
                <InfoCard label="Name:" text={`${patient.firstName} ${patient.lastName}`} />
                <InfoCard label="AMKA Number:" text={patient.AMKANumber} />
                <InfoCard label="Sex:" text={patient.Sex} />
                <InfoCard label="Date of Birth:" text={patient.dob} />
                <View style={styles.medicalHistoryContainer}>
                  <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>All Diseases History</Text>
                    <TouchableOpacity
                      onPress={() => {
                        fetchMedicalHistory();
                        setShowMedicalHistoryModal(true);
                      }}
                      style={styles.medicalHistoryButton}
                    >
                      <Text style={styles.medicalHistoryButtonText}>View All Diseases</Text>
                    </TouchableOpacity>
                  </View>
                  <Text style={styles.diseaseTitle}>Main Disease</Text>
                  <Text style={styles.diseaseText}>{patient.Disease}</Text>
                </View>
              </View>
            </View>
          </View>

          <View style={styles.infoColumn}>
            <View style={styles.sectionContainer}>
              <Text style={styles.sectionTitle}>Contact Information</Text>
              <View style={styles.infoContainer}>
                <InfoCard label="Address:" text={patient.Address} />
                <InfoCard label="City:" text={patient.City} />
                <InfoCard label="Postal Code:" text={patient.PostalCode} />
                <InfoCard label="Phone:" text={patient.Telefon} />
                <InfoCard label="Email:" text={patient.Email} />
              </View>
            </View>
          </View>
        </View>

        <View style={styles.visitsHeader}>
          <Text style={styles.visitsTitle}>Recent Visits</Text>
        </View>

        {visits.length > 0 ? (
          visits.map((item) => (
            <TouchableOpacity
              key={item.AppointmentID}
              onPress={() => handleVisitPress(item.AppointmentID)}
            >
              <View style={styles.visitItem}>
                <View style={styles.visitRow}>
                  <View style={styles.visitColumn}>
                    <Text style={styles.visitLabel}>Date:</Text>
                    <Text style={styles.visitText}>
                      {item.Date ? `${item.Date} ${item.Hour || ''}` : 'Date not available'}
                    </Text>
                  </View>
                  <View style={styles.visitColumn}>
                    <Text style={styles.visitLabel}>Disease:</Text>
                    <Text style={styles.visitText}>{item.VisitDisease || 'Not specified'}</Text>
                  </View>
                </View>
                <View style={styles.visitRow}>
                  <View style={styles.visitColumn}>
                    <Text style={styles.visitLabel}>Description:</Text>
                    <Text style={styles.visitText}>{item.Description || 'No description'}</Text>
                  </View>
                  <View style={styles.visitColumn}>
                    <Text style={styles.visitLabel}>Medications:</Text>
                    <Text style={styles.visitText}>{item.Medication || 'None'}</Text>
                  </View>
                </View>
              </View>
            </TouchableOpacity>
          ))
        ) : (
          <Text style={styles.noVisitsText}>No recent visits available.</Text>
        )}

        {medications.length > 0 && (
          <>
            <Text style={styles.visitsTitle}>Medications</Text>
            {medications.map((medication, index) => (
              <View key={index} style={styles.medicationCard}>
                <Text style={styles.medicationText}>{medication}</Text>
              </View>
            ))}
          </>
        )}

        <Text style={styles.xraysTitle}>X-Rays</Text>
        <FlatList
          data={xrays}
          keyExtractor={(item) => item.XrayID.toString()}
          renderItem={({ item }) => (
            <TouchableOpacity onPress={() => handleXrayPress(item)}>
              <View style={styles.xrayItem}>
                <Image
                  source={{ uri: item.FileName }}
                  style={styles.xrayImage}
                  resizeMode="cover"
                />
                <Text style={styles.xrayDescription}>{item.Description}</Text>
              </View>
            </TouchableOpacity>
          )}
          horizontal={true}
          contentContainerStyle={styles.xraysContainer}
        />

        <Modal
          visible={!!selectedXray}
          transparent={true}
          animationType="fade"
          onRequestClose={handleModalClose}
        >
          <View style={styles.modalContainer}>
            <TouchableOpacity style={styles.modalOverlay} onPress={handleModalClose} />
            <View style={styles.modalContent}>
              {selectedXray && (
                <>
                  <Image
                    source={{ uri: selectedXray.FileName }}
                    style={styles.modalImage}
                  />
                  <Text style={styles.modalDescription}>{selectedXray.Description}</Text>
                </>
              )}
            </View>
          </View>
        </Modal>

        <Modal
          visible={showHistory}
          transparent={true}
          animationType="slide"
          onRequestClose={() => setShowHistory(false)}
        >
          <View style={styles.modalContainer}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Visit History</Text>

              <View style={styles.pickerContainer}>
                <Picker
                  selectedValue={selectedICD10}
                  onValueChange={handleICD10Change}
                  style={styles.picker}
                >
                  <Picker.Item label="Select ICD-10 Code" value="" />
                  {icd10Codes.map((code) => (
                    <Picker.Item key={code.code} label={`${code.code} - ${code.description}`} value={code.code} />
                  ))}
                </Picker>
              </View>

              <FlatList
                data={visitHistory}
                keyExtractor={(item) => item.AppointmentID.toString()}
                renderItem={({ item }) => (
                  <TouchableOpacity onPress={() => {
                    setShowHistory(false);
                    handleVisitPress(item.AppointmentID);
                  }}>
                    <View style={styles.historyItem}>
                      <Text style={styles.historyDate}>{item.Date} {item.Hour}</Text>
                      <Text style={styles.historyDisease}>{item.VisitDisease}</Text>
                      <Text style={styles.historyMedication}>Medications: {item.Medication || 'Not specified'}</Text>
                    </View>
                  </TouchableOpacity>
                )}
              />
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setShowHistory(false)}
              >
                <Text style={styles.closeButtonText}>Close</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        <Modal
          visible={showMedicalHistoryModal}
          transparent={true}
          animationType="slide"
          onRequestClose={() => setShowMedicalHistoryModal(false)}
        >
          <View style={styles.modalContainer}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Medical History</Text>
              <ScrollView style={styles.modalScrollView}>
                <View style={styles.historySection}>
                  <Text style={styles.historySectionTitle}>Main Disease</Text>
                  <Text style={styles.historyDisease}>• {patient.Disease}</Text>
                </View>
                <View style={styles.historySection}>
                  <Text style={styles.historySectionTitle}>Visit Diseases</Text>
                  {medicalHistory.visitDiseases && medicalHistory.visitDiseases.length > 0 ? (
                    medicalHistory.visitDiseases.map((disease, index) => (
                      <Text key={index} style={styles.historyDisease}>• {disease}</Text>
                    ))
                  ) : (
                    <Text style={styles.noDataText}>No visit disease records found.</Text>
                  )}
                </View>
                <View style={styles.historySection}>
                  <Text style={styles.historySectionTitle}>Past Diseases</Text>
                  {medicalHistory.historyDiseases && medicalHistory.historyDiseases.length > 0 ? (
                    medicalHistory.historyDiseases.map((disease, index) => (
                      <Text key={index} style={styles.historyDisease}>• {disease}</Text>
                    ))
                  ) : (
                    <Text style={styles.noDataText}>No past disease records found.</Text>
                  )}
                </View>
              </ScrollView>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setShowMedicalHistoryModal(false)}
              >
                <Text style={styles.closeButtonText}>Close</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </View>
    </ScrollView>
  );
};

const InfoCard = ({ label, text }) => (
  <View style={styles.infoCard}>
    <Text style={styles.infoLabel}>{label}</Text>
    <Text style={styles.infoText}>{text}</Text>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f5f5f5',
    paddingBottom: 40, // Added padding at the bottom of the screen
  },
  title: {
    fontSize: 26, // Increased title size
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#146C94',
    textAlign: 'center',
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  infoColumn: {
    width: '48%',
  },
  sectionContainer: {
    marginBottom: 20,
    backgroundColor: '#f9f9f9',
    borderRadius: 10,
    padding: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#146C94',
    marginBottom: 10,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  infoContainer: {
    flexDirection: 'column',
  },
  infoCard: {
    backgroundColor: '#ffffff',
    borderRadius: 8,
    padding: 10,
    marginVertical: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  infoLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#555',
    marginBottom: 3,
  },
  infoText: {
    fontSize: 14,
    color: '#333',
  },
  diseaseText: {
    fontSize: 16,
    color: '#333',
    lineHeight: 22,
  },
  diseaseTitle: {
    fontSize: 16,
    color: '#333',
    lineHeight: 22,
    fontWeight: 'bold',
  },
  visitsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#146C94',
    marginVertical: 10,
    marginTop: 10,
  },
  visitsContainer: {
    marginTop: 20,
  },
  visitItem: {
    padding: 10,
    marginVertical: 8,
    borderWidth: 0.5,
    borderColor: '#ccc',
    borderRadius: 15,
    backgroundColor: '#f0f8ff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  visitRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 5,
  },
  visitColumn: {
    flex: 1,
  },
  visitLabel: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#666',
  },
  visitText: {
    fontSize: 14,
    color: '#333',
  },
  xraysTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#146C94',
    marginVertical: 10,
    marginTop: 20,
  },
  xraysContainer: {
    paddingVertical: 10,
  },
  xrayItem: {
    marginRight: 10,
  },
  xrayImage: {
    width: 100,
    height: 100,
    borderRadius: 10,
  },
  xrayDescription: {
    textAlign: 'center',
    fontSize: 12,
    color: '#666',
    marginTop: 5,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalOverlay: {
    ...StyleSheet.absoluteFillObject,
  },
  modalContent: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 10,
    width: '90%',
    maxHeight: '80%',
    alignItems: 'center',
  },
  modalImage: {
    width: '100%',
    height: 300,
    borderRadius: 10,
  },
  modalDescription: {
    marginTop: 10,
    fontSize: 14,
    color: '#333',
  },
  noVisitsText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginTop: 10,
  },
  medicationCard: {
    backgroundColor: '#e0f7fa',
    borderRadius: 10,
    padding: 15,
    marginVertical: 5,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  medicationText: {
    marginTop: 10,
    fontSize: 16,
    color: '#333',
    fontWeight: 'bold',
  },
  visitsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 30,
    marginBottom: 10,
  },
  historyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#19A7CE',
    padding: 12,
    borderRadius: 8,
    marginTop: 15,
    alignSelf: 'center',
  },
  historyButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  historyModalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  historyModalContent: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 10,
    width: '90%',
    maxHeight: '90%',
  },
  historyModalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#146C94',
    textAlign: 'center',
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    marginBottom: 20,
  },
  picker: {
    height: 50,
    width: '100%',
  },
  historyItem: {
    backgroundColor: '#f0f8ff',
    borderRadius: 10,
    padding: 15,
    marginBottom: 10,
    borderLeftWidth: 4,
    borderLeftColor: '#19A7CE',
  },
  historyDate: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  historyDisease: {
    fontSize: 15,
    color: '#444',
    marginBottom: 5,
  },
  historyMedication: {
    fontSize: 14,
    color: '#666',
    fontStyle: 'italic',
  },
  closeButton: {
    backgroundColor: '#19A7CE',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 15,
  },
  closeButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  medicalHistoryContainer: {
    marginTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    paddingTop: 10,
  },
  headerButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 20,
  },
  headerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 5,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#19A7CE',
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  headerButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 14,
    marginLeft: 5,
  },
  medicalHistoryButton: {
    padding: 10,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: '#19A7CE',
  },
  medicalHistoryButtonText: {
    color: '#19A7CE',
    fontWeight: 'bold',
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
    borderRadius: 10,
    width: '90%',
    maxHeight: '80%',
  },
  modalScrollView: {
    maxHeight: '80%',
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#19A7CE',
    textAlign: 'center',
  },
  historySection: {
    marginBottom: 20,
  },
  historySectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#146C94',
    marginBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    paddingBottom: 5,
  },
  historyDisease: {
    fontSize: 16,
    color: '#333',
    marginBottom: 8,
    paddingLeft: 10,
  },
  noDataText: {
    fontSize: 14,
    color: '#666',
    fontStyle: 'italic',
    paddingLeft: 10,
  },
  closeButton: {
    backgroundColor: '#19A7CE',
    padding: 10,
    borderRadius: 5,
    alignItems: 'center',
    marginTop: 15,
  },
  closeButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
});

export default PatientDetailScreen;
