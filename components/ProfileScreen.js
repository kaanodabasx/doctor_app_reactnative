import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, Modal, TextInput } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSQLiteContext } from 'expo-sqlite';
import { useFocusEffect } from '@react-navigation/native';
import Feather from '@expo/vector-icons/Feather';
import Entypo from '@expo/vector-icons/Entypo';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import * as ImagePicker from 'expo-image-picker';

const ProfileScreen = ({ navigation }) => {
  const db = useSQLiteContext();

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [doctorID, setDoctorID] = useState(null);
  const [profileImage, setProfileImage] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const fetchUserProfile = async () => {
    try {
      const result = await db.getFirstAsync(
        'SELECT firstName, lastName, email, password, pp FROM doctors WHERE DoctorID = ?',
        [doctorID]
      );
      if (result) {
        setFirstName(result.firstName);
        setLastName(result.lastName);
        setEmail(result.email);
        setPassword(result.password);
        setProfileImage(result.pp);
      }
    } catch (error) {
      console.log('Error fetching user profile: ', error);
    }
  };

  const fetchDoctorID = useCallback(async () => {
    try {
      const id = await AsyncStorage.getItem('DoctorID');
      if (id) {
        setDoctorID(id);
      }
    } catch (error) {
      console.log('Error fetching DoctorID from AsyncStorage: ', error);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchDoctorID();
    }, [fetchDoctorID])
  );

  useEffect(() => {
    if (doctorID) {
      fetchUserProfile();
    }
  }, [doctorID]);

  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });

    if (!result.canceled) {
      setProfileImage(result.assets[0].uri);
    }
  };

  const handleEditProfile = () => {
    setIsEditing(true);
    setShowPassword(true);
  };

  const handleSaveProfile = async () => {
    try {
      await db.runAsync(
        'UPDATE doctors SET firstName = ?, lastName = ?, email = ?, password = ?, pp = ? WHERE DoctorID = ?',
        [firstName, lastName, email, password, profileImage, doctorID]
      );
      alert('Profile updated successfully');
      setIsEditing(false);
      setShowPassword(false);
    } catch (error) {
      console.log('Error updating profile: ', error);
    }
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setShowPassword(false);
    fetchUserProfile();
  };

  return (
    <View style={styles.container}>
      <View style={styles.profileCard}>
        <TouchableOpacity onPress={pickImage} style={styles.profileImageContainer}>
          <Image
            source={profileImage ? { uri: profileImage } : require('../assets/pp.jpg')}
            style={styles.profileImage}
          />
          <View style={styles.editIconContainer}>
            <Feather name="edit-2" size={20} color="white" />
          </View>
        </TouchableOpacity>

        {isEditing ? (
          <View style={styles.editContainer}>
            <TextInput
              style={styles.input}
              value={firstName}
              onChangeText={setFirstName}
              placeholder="First Name"
            />
            <TextInput
              style={styles.input}
              value={lastName}
              onChangeText={setLastName}
              placeholder="Last Name"
            />
            <TextInput
              style={styles.input}
              value={email}
              onChangeText={setEmail}
              placeholder="Email"
            />
            <TextInput
              style={styles.input}
              value={password}
              onChangeText={setPassword}
              placeholder="Password"
              secureTextEntry={!showPassword}
            />
            <View style={styles.buttonContainer}>
              <TouchableOpacity style={styles.saveButton} onPress={handleSaveProfile}>
                <Text style={styles.buttonText}>Save</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.cancelButton} onPress={handleCancelEdit}>
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <>
            <Text style={styles.usernameText}>{firstName} {lastName}</Text>
            <View style={styles.infoContainer}>
              <View style={styles.infoItem}>
                <Feather name="user" size={24} color="#19A7CE" />
                <Text style={styles.infoText}>{firstName} {lastName}</Text>
              </View>
              <View style={styles.infoItem}>
                <Entypo name="mail" size={24} color="#19A7CE" />
                <Text style={styles.infoText}>{email}</Text>
              </View>
              <View style={styles.infoItem}>
                <MaterialIcons name="password" size={24} color="#19A7CE" />
                <Text style={styles.infoText}>••••••••</Text>
              </View>
            </View>
            <TouchableOpacity style={styles.editProfileButton} onPress={handleEditProfile}>
              <Text style={styles.editProfileButtonText}>Edit Profile</Text>
            </TouchableOpacity>
          </>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#ecf0f1', // Çok açık gri
  },
  profileCard: {
    backgroundColor: '#ffffff', // Beyaz
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  profileImageContainer: {
    alignSelf: 'center',
    marginBottom: 20,
  },
  profileImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 3,
    borderColor: '#146C94', // Canlı mavi
  },
  editIconContainer: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    backgroundColor: '#146C94', // Canlı mavi
    borderRadius: 20,
    padding: 8,
  },
  usernameText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#2c3e50', // Koyu lacivert
    textAlign: 'center',
    marginBottom: 20,
  },
  infoContainer: {
    marginTop: 20,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#bdc3c7', // Açık gri
  },
  infoText: {
    fontSize: 18,
    color: '#2c3e50', // Koyu lacivert
    marginLeft: 15,
  },
  editProfileButton: {
    marginTop: 30,
    padding: 15,
    backgroundColor: '#146C94', // Canlı mavi
    borderRadius: 25,
    alignItems: 'center',
  },
  editProfileButtonText: {
    color: '#ffffff', // Beyaz
    fontSize: 18,
    fontWeight: 'bold',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.9)',
  },
  modalContent: {
    width: 300,
    padding: 20,
    backgroundColor: '#ffffff', // Beyaz
    borderRadius: 10,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
    color: '#2c3e50', // Koyu lacivert
  },
  input: {
    marginTop: 10,
    padding: 10,
    borderWidth: 1,
    borderColor: '#bdc3c7', // Açık gri
    borderRadius: 5,
    fontSize: 18,
    color: '#2c3e50', // Koyu lacivert
  },
  saveButton: {
    backgroundColor: '#3498db', // Canlı mavi
    padding: 15,
    borderRadius: 25,
    flex: 3,
    alignItems: 'center',
    marginRight: 10,
  },
  saveButtonText: {
    color: '#ffffff', // Beyaz
    fontSize: 18,
    fontWeight: 'bold',
  },
  cancelButton: {
    backgroundColor: '#bdc3c7', // Açık gri
    padding: 10,
    borderRadius: 25,
    flex: 1,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#2c3e50', // Koyu lacivert
    fontSize: 14,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 15,
    marginBottom: -5,
    color: '#2c3e50', // Koyu lacivert
  },
  editContainer: {
    marginTop: 20,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  buttonText: {
    color: '#ffffff', // Beyaz
    fontSize: 18,
    fontWeight: 'bold',
  },
  cancelButtonText: {
    color: '#2c3e50', // Koyu lacivert
    fontSize: 14,
  },
});

export default ProfileScreen;
