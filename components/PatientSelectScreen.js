// PatientSelectScreen.js

import React, { useEffect, useState } from 'react';
import { StyleSheet, View, Text, FlatList, Pressable, ActivityIndicator } from 'react-native';
import { useSQLiteContext } from 'expo-sqlite';
import AsyncStorage from '@react-native-async-storage/async-storage';


const PatientSelectScreen = ({ navigation, route }) => {
  const db = useSQLiteContext();
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPatients = async () => {
      try {
        const doctorID = await AsyncStorage.getItem('DoctorID');
        const result = await db.getAllAsync('SELECT * FROM patients WHERE DoctorID = ?', [doctorID]);
        setPatients(result);
      } catch (error) {
        console.log('Error fetching patients: ', error);
      } finally {
        setLoading(false);
      }
    };

    fetchPatients();
  }, [db]);

  const handleSelectPatient = (id) => {
    navigation.navigate('Appointments', { selectedPatientId: id });
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#19A7CE" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
      <Text style={styles.title}>Select a Patient</Text>
      <Pressable style={styles.button} onPress={() => navigation.navigate('NewPatient',  { fromScreen: 'ScreenA' })}>
          <Text style={styles.buttonText}>Add Patient</Text>
        </Pressable>
        </View>
      <FlatList
        data={patients}
        keyExtractor={(item) => item.HastaID.toString()}
        renderItem={({ item }) => (
          <Pressable style={styles.item} onPress={() => handleSelectPatient(item.HastaID)}>
            <Text style={styles.itemText}>{`${item.firstName} ${item.lastName}`}</Text>
            <Text style={styles.itemText}>{`DOB: ${item.dob}`}</Text>
            <Text style={styles.itemText}>{`Contact: ${item.contact}`}</Text>
          </Pressable>
        )}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: 'white',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#146C94',
  },
  item: {
    padding: 15,
    marginVertical: 8,
    borderWidth: 0.2,
    borderColor: '#ccc',
    borderRadius: 15,
    backgroundColor: '#e8e8e8',
  },
  itemText: {
    fontSize: 16,
    color: '#333',
  },
  button: {
    backgroundColor: '#19A7CE',
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 5,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
});

export default PatientSelectScreen;
