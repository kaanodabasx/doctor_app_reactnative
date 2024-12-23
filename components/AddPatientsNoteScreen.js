import React, { useState } from 'react';
import { StyleSheet, View, Text, TextInput, Pressable, Alert } from 'react-native';
import { useSQLiteContext } from 'expo-sqlite';

const AddPatientsNoteScreen = ({ route, navigation }) => {
  const { patientID } = route.params;
  const db = useSQLiteContext();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');

  const handleSaveNote = async () => {
    if (!title || !description) {
      Alert.alert('Error', 'Please enter both title and description.');
      return;
    }

    try {
      await db.runAsync(
        'INSERT INTO patientNotes (Title, Description, HastaID) VALUES (?, ?, ?)',
        [title, description, patientID]
      );
      Alert.alert('Success', 'Note added successfully!');

      // Trigger navigation with flag to indicate a note was added
      navigation.navigate('PatientDetailScreen', { noteAdded: true });
    } catch (error) {
      console.log('Error adding note: ', error);
      Alert.alert('Error', 'An error occurred while adding the note.');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Add Note</Text>
      <TextInput
        style={styles.input}
        placeholder="Title"
        value={title}
        onChangeText={setTitle}
      />
      <TextInput
        style={styles.input}
        placeholder="Description"
        value={description}
        onChangeText={setDescription}
        multiline={true}
      />
      <Pressable style={styles.button} onPress={handleSaveNote}>
        <Text style={styles.buttonText}>Save Note</Text>
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
  input: {
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 10,
    padding: 10,
    marginBottom: 15,
    fontSize: 16,
    backgroundColor: '#f8f8f8',
  },
  button: {
    backgroundColor: '#19A7CE',
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default AddPatientsNoteScreen;
