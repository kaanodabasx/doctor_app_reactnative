// AppointmentsScreen.js

import React, { useState, useEffect, useCallback } from 'react';
import { StyleSheet, View, Text, TextInput, Alert, ScrollView, TouchableOpacity, Modal } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Picker } from '@react-native-picker/picker';
import { useSQLiteContext } from 'expo-sqlite';
import { useFocusEffect } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialIcons';

const AppointmentsScreen = ({ navigation, route }) => {
  const db = useSQLiteContext();
  const { patientID } = route.params || {};
  const [patientName, setPatientName] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(new Date());
  const [hour, setHour] = useState(new Date().getHours().toString().padStart(2, '0'));
  const [minute, setMinute] = useState(new Date().getMinutes().toString().padStart(2, '0'));
  const [hastaID, setHastaID] = useState(null);
  const [location, setLocation] = useState('Clinic');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [showLocationPicker, setShowLocationPicker] = useState(false);

  const fetchPatientName = useCallback(async (id) => {
    try {
      const patient = await db.getFirstAsync('SELECT firstName, lastName FROM patients WHERE HastaID = ?', [id]);
      if (patient) {
        setPatientName(`${patient.firstName} ${patient.lastName}`);
      }
    } catch (error) {
      console.error('Error fetching patient name:', error);
    }
  }, [db]);

  useFocusEffect(
    useCallback(() => {
      if (patientID) {
        setHastaID(patientID);
        fetchPatientName(patientID);
      }
    }, [patientID, fetchPatientName])
  );

  const handleAddAppointment = async () => {
    if (!description || !hour || !minute || hastaID === null) {
      Alert.alert('Attention!', 'Please fill all fields.');
      return;
    }

    const appointmentTime = `${hour}:${minute}`;

    try {
      await db.runAsync(
        'INSERT INTO appointments (PatientName, Description, Date, Hour, HastaID, Location) VALUES (?, ?, ?, ?, ?, ?)',
        [patientName, description, date.toISOString().split('T')[0], appointmentTime, hastaID, location]
      );
      navigation.navigate('AppointmentsList', { patientID: hastaID });
    } catch (error) {
      console.log('Error while adding appointment: ', error);
      Alert.alert('Error', 'An error occurred while adding the appointment.');
    }
  };

  const renderTimePicker = () => (
    <View style={styles.timePickerContainer}>
      <View style={styles.pickerWrapper}>
        <Text style={styles.pickerLabel}>Hour</Text>
        <Picker
          selectedValue={hour}
          style={styles.timePicker}
          onValueChange={(itemValue) => setHour(itemValue)}
        >
          {Array.from({ length: 24 }, (_, index) => (
            <Picker.Item key={index} label={`${index.toString().padStart(2, '0')}`} value={index.toString().padStart(2, '0')} />
          ))}
        </Picker>
      </View>
      <View style={styles.pickerWrapper}>
        <Text style={styles.pickerLabel}>Minute</Text>
        <Picker
          selectedValue={minute}
          style={styles.timePicker}
          onValueChange={(itemValue) => setMinute(itemValue)}
        >
          {Array.from({ length: 60 }, (_, index) => (
            <Picker.Item key={index} label={`${index.toString().padStart(2, '0')}`} value={index.toString().padStart(2, '0')} />
          ))}
        </Picker>
      </View>
    </View>
  );

  const renderLocationPicker = () => (
    <View style={styles.locationPickerWrapper}>
      <Text style={styles.pickerLabel}>Location</Text>
      <Picker
        selectedValue={location}
        style={styles.locationPicker}
        onValueChange={(itemValue) => setLocation(itemValue)}
      >
        <Picker.Item label="Clinic" value="Clinic" />
        <Picker.Item label="Hospital" value="Hospital" />
      </Picker>
    </View>
  );

  const onDateChange = (event, selectedDate) => {
    setShowDatePicker(false);
    if (selectedDate) {
      setDate(selectedDate);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Add New Visit</Text>

      {patientName ? (
        <Text style={styles.patientName}>Patient: {patientName}</Text>
      ) : (
        <Text style={styles.patientName}>No patient selected</Text>
      )}

      <View style={styles.inputContainer}>
        <Icon name="description" size={24} color={'#3498db'} style={styles.iconDescription} />
        <TextInput
          style={styles.input}
          placeholder='Description'
          value={description}
          onChangeText={setDescription}
        />
      </View>

      <TouchableOpacity style={styles.pickerButton} onPress={() => setShowDatePicker(true)}>
        <Icon name="event" size={24} color={'#3498db'} style={styles.icon} />
        <Text style={styles.pickerButtonText}>Select Date: {date.toDateString()}</Text>
      </TouchableOpacity>

      {showDatePicker && (
        <View style={styles.datePickerContainer}>
          <DateTimePicker
            value={date}
            mode="date"
            display="default"
            onChange={onDateChange}
          />
        </View>
      )}

      <TouchableOpacity style={styles.pickerButton} onPress={() => setShowTimePicker(true)}>
        <Icon name="access-time" size={24} color={'#3498db'} style={styles.icon} />
        <Text style={styles.pickerButtonText}>Select Time: {hour}:{minute}</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.pickerButton} onPress={() => setShowLocationPicker(true)}>
        <Icon name="location-on" size={24} color={'#3498db'} style={styles.icon} />
        <Text style={styles.pickerButtonText}>Select Location: {location}</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.addButton} onPress={handleAddAppointment} disabled={!patientID}>
        <Text style={styles.addButtonText}>Add Visit</Text>
      </TouchableOpacity>

      <Modal
        transparent={true}
        animationType="slide"
        visible={showTimePicker}
        onRequestClose={() => setShowTimePicker(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalViewBottom}>
            <Text style={styles.modalTitle}>Select Time</Text>
            {renderTimePicker()}
            <TouchableOpacity style={styles.doneButton} onPress={() => setShowTimePicker(false)}>
              <Text style={styles.doneButtonText}>Done</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal
        transparent={true}
        animationType="slide"
        visible={showLocationPicker}
        onRequestClose={() => setShowLocationPicker(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalViewBottom}>
            <Text style={styles.modalTitle}>Select Location</Text>
            {renderLocationPicker()}
            <TouchableOpacity style={styles.doneButton} onPress={() => setShowLocationPicker(false)}>
              <Text style={styles.doneButtonText}>Done</Text>
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
    backgroundColor: '#ecf0f1',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#3498db',
    textAlign: 'center',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 10,
    marginBottom: 15,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  icon: {
    marginLeft: 10,
    marginRight: 10,
  },
  iconDescription: {
    marginLeft: 10,
    marginRight: 10,
    alignSelf: 'center',
  },
  input: {
    flex: 1,
    padding: 15,
    fontSize: 16,
  },
  pickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 13,
    padding: 15,
    marginBottom: 15,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  pickerButtonText: {
    fontSize: 16,
    color: '#333',
  },
  addButton: {
    backgroundColor: '#3498db',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 20,
  },
  addButtonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalViewBottom: {
    backgroundColor: '#ffffff',
    padding: 20,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    width: '100%',
    alignItems: 'center',
  },
  doneButton: {
    backgroundColor: '#3498db',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 20,
    width: '100%',
  },
  doneButtonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  timePickerContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    width: '100%',
  },
  pickerWrapper: {
    flex: 1,
    marginHorizontal: 5,
    backgroundColor: '#F0F0F0',
    borderRadius: 10,
    overflow: 'hidden',
    marginBottom: 10,
  },
  timePicker: {
    width: '100%',
    height: 170,
    justifyContent: 'center',
  },
  locationPickerWrapper: {
    backgroundColor: '#F0F0F0',
    borderRadius: 10,
    overflow: 'hidden',
    marginBottom: 10,
    width: '100%',
  },
  locationPicker: {
    width: '100%',
    height: 150,
    justifyContent: 'center',
  },
  pickerLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#3498db',
    paddingHorizontal: 10,
    paddingVertical: 5,
    backgroundColor: '#E0E0E0',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#3498db',
    marginBottom: 15,
  },
  datePickerContainer: {
    marginBottom: 15,
  },
  patientName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#3498db',
    marginBottom: 20,
    textAlign: 'center',
  },
});

export default AppointmentsScreen;
