import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, FlatList, SafeAreaView, Modal, Alert } from 'react-native';
import { Calendar } from 'react-native-calendars';
import { useSQLiteContext } from 'expo-sqlite';
import { Ionicons } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';

const AddVisitScreen = ({ navigation }) => {
  const [selectedDate, setSelectedDate] = useState('');
  const [markedDates, setMarkedDates] = useState({});
  const [appointments, setAppointments] = useState([]);
  const [patients, setPatients] = useState([]);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [showPatientPicker, setShowPatientPicker] = useState(false);
  const db = useSQLiteContext();

  useEffect(() => {
    fetchAppointments();
    fetchPatients();
  }, []);

  const fetchAppointments = async () => {
    try {
      const result = await db.getAllAsync(`
        SELECT a.*, p.firstName, p.lastName 
        FROM appointments a
        LEFT JOIN patients p ON a.HastaID = p.HastaID
      `);
      setAppointments(result);

      const marked = {};
      result.forEach(appointment => {
        const date = appointment.Date.split('T')[0];
        marked[date] = { marked: true, dotColor: '#19A7CE' };
      });
      setMarkedDates(marked);
    } catch (error) {
      console.error('Error loading appointments:', error);
    }
  };

  const fetchPatients = async () => {
    try {
      const result = await db.getAllAsync('SELECT * FROM patients');
      setPatients(result);
    } catch (error) {
      console.error('Error loading patients:', error);
    }
  };

  const onDayPress = (day) => {
    setSelectedDate(day.dateString);
  };

  const renderAppointment = ({ item }) => (
    <TouchableOpacity
      style={styles.appointmentItem}
      onPress={() => navigation.navigate('AppointmentDetail', { appointmentID: item.AppointmentID })}
    >
      <View style={styles.appointmentTimeContainer}>
        <Text style={styles.appointmentTime}>{item.Hour}</Text>
      </View>
      <View style={styles.appointmentDetails}>
        <Text style={styles.patientName}>{item.firstName} {item.lastName}</Text>
        <Text style={styles.appointmentDescription} numberOfLines={2}>{item.Description}</Text>
      </View>
      <Ionicons name="chevron-forward" size={24} color="#19A7CE" />
    </TouchableOpacity>
  );

  const filteredAppointments = appointments.filter(
    appointment => appointment.Date.startsWith(selectedDate)
  );

  const handleSelectPatient = (patient) => {
    setSelectedPatient(patient);
    setShowPatientPicker(false);
  };

  const handleAddVisit = () => {
    if (!selectedPatient) {
      Alert.alert('Error', 'Please select a patient first');
      return;
    }
    navigation.navigate('Appointments', { patientID: selectedPatient.HastaID });
  };

  return (
    <SafeAreaView style={styles.container}>
      <Calendar
        style={styles.calendar}
        markedDates={{
          ...markedDates,
          [selectedDate]: { selected: true, selectedColor: '#19A7CE', marked: markedDates[selectedDate]?.marked }
        }}
        onDayPress={onDayPress}
        theme={{
          selectedDayBackgroundColor: '#19A7CE',
          todayTextColor: '#19A7CE',
          arrowColor: '#19A7CE',
          monthTextColor: '#146C94',
          textMonthFontWeight: 'bold',
          textDayFontSize: 16,
          textMonthFontSize: 18,
        }}
      />
      {selectedDate && (
        <View style={styles.appointmentsContainer}>
          <Text style={styles.appointmentsTitle}>
            Visits on {selectedDate}
          </Text>
          {filteredAppointments.length > 0 ? (
            <FlatList
              data={filteredAppointments}
              renderItem={renderAppointment}
              keyExtractor={(item) => item.AppointmentID.toString()}
            />
          ) : (
            <Text style={styles.noAppointmentsText}>No appointments on this date.</Text>
          )}
        </View>
      )}
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={styles.selectPatientButton}
          onPress={() => setShowPatientPicker(true)}
        >
          <Ionicons name="person" size={24} color="white" />
          <Text style={styles.buttonText}>
            {selectedPatient ? `Selected: ${selectedPatient.firstName} ${selectedPatient.lastName}` : 'Select Patient'}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.addButton, !selectedPatient && styles.disabledButton]}
          onPress={handleAddVisit}
          disabled={!selectedPatient}
        >
          <Ionicons name="add" size={24} color="white" />
          <Text style={styles.buttonText}>Add Visit</Text>
        </TouchableOpacity>
      </View>

      <Modal
        transparent={true}
        visible={showPatientPicker}
        onRequestClose={() => setShowPatientPicker(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Select Patient</Text>
            <FlatList
              data={patients}
              keyExtractor={(item) => item.HastaID.toString()}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.patientItem}
                  onPress={() => handleSelectPatient(item)}
                >
                  <Text style={styles.patientItemText}>{item.firstName} {item.lastName}</Text>
                </TouchableOpacity>
              )}
            />
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setShowPatientPicker(false)}
            >
              <Text style={styles.closeButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
  },
  calendar: {
    borderRadius: 10,
    elevation: 4,
    margin: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  appointmentsContainer: {
    flex: 1,
    paddingHorizontal: 20,
  },
  appointmentsTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#146C94',
    marginBottom: 15,
  },
  appointmentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderRadius: 10,
    backgroundColor: '#F6F6F6',
    marginBottom: 10,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  appointmentTimeContainer: {
    backgroundColor: '#19A7CE',
    borderRadius: 5,
    padding: 5,
    marginRight: 15,
  },
  appointmentTime: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'white',
  },
  appointmentDetails: {
    flex: 1,
  },
  patientName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  appointmentDescription: {
    fontSize: 14,
    color: '#666',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 20,
  },
  selectPatientButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#146C94',
    borderRadius: 25,
    paddingVertical: 10,
    paddingHorizontal: 20,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    marginBottom: 10,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#19A7CE',
    borderRadius: 25,
    paddingVertical: 10,
    paddingHorizontal: 20,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 5,
  },
  noAppointmentsText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginTop: 20,
  },
  modalOverlay: {
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
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
  },
  patientItem: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
  },
  patientItemText: {
    fontSize: 16,
  },
  closeButton: {
    backgroundColor: '#146C94',
    padding: 10,
    borderRadius: 5,
    alignItems: 'center',
    marginTop: 20,
  },
  closeButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  disabledButton: {
    opacity: 0.5,
  },
});

export default AddVisitScreen;
