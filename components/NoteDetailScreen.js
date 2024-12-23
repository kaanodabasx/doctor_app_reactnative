import React from 'react';
import { StyleSheet, View, Text, ScrollView } from 'react-native';

const NoteDetailScreen = ({ route }) => {
  const { note } = route.params;

  return (
    <ScrollView style={styles.container}>
      <View style={styles.noteContainer}>
        <Text style={styles.title}>{note.Title}</Text>
        <Text style={styles.description}>{note.Description}</Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#ecf0f1', // Çok açık gri
  },
  noteContainer: {
    backgroundColor: '#ffffff', // Beyaz
    borderRadius: 10,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#3498db', // Canlı mavi
  },
  description: {
    fontSize: 16,
    color: '#2c3e50', // Koyu lacivert
    lineHeight: 24,
  },
});

export default NoteDetailScreen;
