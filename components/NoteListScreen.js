import React, { useEffect, useState, useCallback } from 'react';
import { StyleSheet, View, Text, FlatList, Pressable, Alert } from 'react-native';
import { useSQLiteContext } from 'expo-sqlite'; // SQLite context'in nasıl çalıştığı varsayılıyor
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';

const NotesListScreen = ({ navigation }) => {
  const db = useSQLiteContext();
  const [notes, setNotes] = useState([]);

  const fetchNotes = useCallback(async () => {
    try {
      const result = await db.getAllAsync('SELECT * FROM notes ORDER BY NoteID DESC');
      setNotes(result);
    } catch (error) {
      console.log('Error fetching notes: ', error);
      Alert.alert('Hata', 'Notlar alınırken bir hata oluştu.');
    }
  }, [db]);

  useFocusEffect(
    useCallback(() => {
      fetchNotes();
    }, [fetchNotes])
  );

  const renderItem = ({ item }) => (
    <Pressable
      style={styles.noteItem}
      onPress={() => navigation.navigate('NoteDetailScreen', { note: item })}
    >
      <Text style={styles.noteTitle}>{item.Title}</Text>
      <Text style={styles.noteDescription} numberOfLines={2}>{item.Description}</Text>
    </Pressable>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Notlar</Text>
      <FlatList
        data={notes}
        renderItem={renderItem}
        keyExtractor={(item) => item.NoteID.toString()}
        contentContainerStyle={styles.listContent}
      />
      <Pressable
        style={styles.addButton}
        onPress={() => navigation.navigate('AddNoteScreen')}
      >
        <Ionicons name="add" size={24} color="white" />
      </Pressable>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#ecf0f1', // Çok açık gri
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#146C94', // Canlı mavi
  },
  listContent: {
    paddingBottom: 80,
  },
  noteItem: {
    backgroundColor: '#ffffff', // Beyaz
    padding: 15,
    marginBottom: 15,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  noteTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#3498db', // Canlı mavi
    marginBottom: 5,
  },
  noteDescription: {
    fontSize: 14,
    color: '#7f8c8d', // Açık gri
  },
  addButton: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    width: 60,
    height: 60,
    backgroundColor: '#3498db', // Canlı yeşil
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
  },
});

export default NotesListScreen;
