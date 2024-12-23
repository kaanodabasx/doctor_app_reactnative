import React, { useState } from 'react';
import { StyleSheet, View, TextInput, Text, Pressable, Alert } from 'react-native';
import { useSQLiteContext } from 'expo-sqlite'; // SQLite context'in nasıl çalıştığı varsayılıyor

const AddNoteScreen = ({ navigation }) => {
  const db = useSQLiteContext();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');

  const handleAddNote = async () => {
    if (!title || !description) {
      Alert.alert('Error', 'Both Title and Description are required.');
      return;
    }

    try {
      // Notu veritabanına ekleyin
      await db.runAsync(
        'INSERT INTO notes (Title, Description) VALUES (?, ?)',
        [title, description]
      );
      Alert.alert('Success', 'Note added successfully!');
      
      // Not ekleme işlemi tamamlandıktan sonra NotesListScreen'e yönlendir
      navigation.navigate('NoteList');
    } catch (error) {
      console.log('Error while adding note:', error);
      Alert.alert('Error', 'An error occurred while adding the note.');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Title</Text>
      <TextInput
        style={styles.input}
        placeholder="Enter note title"
        value={title}
        onChangeText={setTitle}
      />
      <Text style={styles.label}>Description</Text>
      <TextInput
        style={styles.input}
        placeholder="Enter note description"
        value={description}
        onChangeText={setDescription}
        multiline
      />
      <Pressable style={styles.button} onPress={handleAddNote}>
        <Text style={styles.buttonText}>Add Note</Text>
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
  label: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#333',
  },
  input: {
    width: '100%',
    padding: 15,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 10,
  },
  button: {
    backgroundColor: '#19A7CE',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
});

export default AddNoteScreen;
