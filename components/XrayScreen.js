import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, FlatList, Image, TextInput, Alert, Pressable } from 'react-native';
import { useSQLiteContext } from 'expo-sqlite';
import { Ionicons } from '@expo/vector-icons'; // Expo'dan Ionicons kullanabilirsiniz

const XrayScreen = ({ route, navigation }) => {
  const { xrays } = route.params;
  const db = useSQLiteContext();
  const [newXray, setNewXray] = useState({ fileName: '', description: '', appointmentDate: '' });
  const [showForm, setShowForm] = useState(false);

  const fetchXrays = async () => {
    try {
      const result = await db.getAllAsync(
        'SELECT xray.*, appointments.Date as AppointmentDate FROM xray LEFT JOIN appointments ON xray.AppointmentID = appointments.AppointmentID WHERE xray.HastaID = ?',
        [route.params.patientID]
      );
      setXrays(result);
    } catch (error) {
      console.log('Error fetching X-rays: ', error);
    }
  };

  useEffect(() => {
    fetchXrays(); // X-ray'ları çek
  }, [db, route.params.patientID]);

  const handleAddXray = async () => {
    const { fileName, description, appointmentDate } = newXray;
    if (!fileName || !description || !appointmentDate) {
      Alert.alert('Error', 'Please fill in all fields.');
      return;
    }
    try {
      await db.runAsync(
        'INSERT INTO xray (FileName, Description, AppointmentDate, HastaID) VALUES (?, ?, ?, ?)',
        [fileName, description, appointmentDate, route.params.patientID]
      );
      Alert.alert('Success', 'X-ray added successfully!');
      setNewXray({ fileName: '', description: '', appointmentDate: '' });
      setShowForm(false); // Formu kapat
      fetchXrays(); // Güncellenmiş X-ray'ları çek
    } catch (error) {
      console.log('Error adding X-ray: ', error);
      Alert.alert('Error', 'An error occurred while adding the X-ray.');
    }
  };

  const renderXrayItem = ({ item }) => (
    <View style={styles.xrayItem}>
      <Image source={{ uri: item.FileName }} style={styles.xrayImage} />
      <Text style={styles.xrayDate}>Appointment Date: {item.AppointmentDate}</Text>
      <Text style={styles.xrayDescription}>{item.Description}</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>X-ray Images</Text>
      <FlatList
        data={xrays}
        keyExtractor={(item) => item.XrayID.toString()}
        renderItem={renderXrayItem}
        contentContainerStyle={styles.xrayContainer}
      />
      {showForm && (
        <View style={styles.formContainer}>
          <TextInput
            style={styles.input}
            placeholder="Image URL"
            value={newXray.fileName}
            onChangeText={(text) => setNewXray({ ...newXray, fileName: text })}
          />
          <TextInput
            style={styles.input}
            placeholder="Description"
            value={newXray.description}
            onChangeText={(text) => setNewXray({ ...newXray, description: text })}
          />
          <TextInput
            style={styles.input}
            placeholder="Appointment Date (YYYY-MM-DD)"
            value={newXray.appointmentDate}
            onChangeText={(text) => setNewXray({ ...newXray, appointmentDate: text })}
          />
          <Pressable style={styles.button} onPress={handleAddXray}>
            <Text style={styles.buttonText}>Add X-ray</Text>
          </Pressable>
        </View>
      )}
      <Pressable style={styles.addButton} onPress={() => setShowForm(!showForm)}>
        <Ionicons name="add-circle" size={50} color="#19A7CE" />
      </Pressable>
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
  xrayContainer: {
    marginTop: 20,
  },
  xrayItem: {
    padding: 15,
    marginVertical: 8,
    borderWidth: 0.2,
    borderColor: '#ccc',
    borderRadius: 15,
    backgroundColor: '#e8e8e8',
    alignItems: 'center',
  },
  xrayImage: {
    width: 100,
    height: 100,
    borderRadius: 10,
    marginBottom: 10,
  },
  xrayDate: {
    fontSize: 14,
    color: '#333',
    marginBottom: 5,
  },
  xrayDescription: {
    fontSize: 14,
    color: '#666',
  },
  formContainer: {
    position: 'absolute',
    bottom: 20,
    left: 0,
    right: 0,
    backgroundColor: '#f8f8f8',
    padding: 20,
    borderRadius: 15,
    borderWidth: 0.2,
    borderColor: '#ccc',
  },
  input: {
    width: '100%',
    padding: 15,
    marginVertical: 6,
    borderWidth: 0.2,
    borderColor: '#ccc',
    borderRadius: 15,
    backgroundColor: '#e8e8e8',
  },
  button: {
    backgroundColor: '#19A7CE',
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 15,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  addButton: {
    position: 'absolute',
    bottom: 80,
    right: 20,
  },
});

export default XrayScreen;
 