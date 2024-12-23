import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, Pressable, StyleSheet, Animated, Image, TouchableOpacity, SafeAreaView, Dimensions } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import moment from 'moment';
import { useSQLiteContext } from 'expo-sqlite';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width, height } = Dimensions.get('window');

const HomeScreen = ({ navigation, route }) => {
  const { user, email, password, userId } = route.params;
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const slideAnim = useState(new Animated.Value(-300))[0];
  const [upcomingAppointments, setUpcomingAppointments] = useState([]);
  const [recentAppointments, setRecentAppointments] = useState([]);
  const [doctorID, setDoctorID] = useState(null);
  const [profileImage, setProfileImage] = useState('');

  const db = useSQLiteContext();
  const HeaderDate = moment().format('MMMM DD, YYYY');

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

  useEffect(() => {
    if (doctorID) {
      fetchUserProfile();
      fetchAppointments();
      const appointmentIntervalId = setInterval(fetchAppointments, 5000);
      const profileIntervalId = setInterval(fetchUserProfile, 5000); // Her 8 saniye profil bilgilerini güncelle
      return () => {
        clearInterval(appointmentIntervalId);
        clearInterval(profileIntervalId);
      };
    } else {
      fetchDoctorID(); // doctorID ayarlanmamışsa, fetchDoctorID fonksiyonunu çağırın
    }
  }, [doctorID]);

  const fetchUserProfile = async () => {
    try {
      const result = await db.getFirstAsync(
        'SELECT firstName, lastName, email, password, pp FROM doctors WHERE DoctorID = ?',
        [doctorID]
      );
      if (result) {
        setFirstName(result.firstName);
        setLastName(result.lastName);
        setProfileImage(result.pp);
      }
    } catch (error) {
      console.log('Error fetching user profile: ', error);
    }
  };

  const fetchAppointments = async () => {
    try {
      const today = moment().format('YYYY-MM-DD');
      const result = await db.getAllAsync(`
        SELECT a.*, p.firstName, p.lastName 
        FROM appointments a
        LEFT JOIN patients p ON a.HastaID = p.HastaID
        WHERE a.Date >= ? OR a.Date < ?
        ORDER BY a.Date, a.Hour
      `, [today, today]);

      const upcoming = result.filter(app => app.Date >= today).slice(0, 3);
      const recent = result.filter(app => app.Date < today).slice(0, 3);

      setUpcomingAppointments(upcoming);
      setRecentAppointments(recent);
    } catch (error) {
      console.error('Error fetching appointments:', error);
    }
  };

  const openModal = () => {
    setModalVisible(true);
    Animated.timing(slideAnim, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start();
  };

  const closeModal = () => {
    Animated.timing(slideAnim, {
      toValue: -300,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      setModalVisible(false);
    });
  };

  const renderAppointment = (appointment) => (
    <TouchableOpacity
      key={appointment.AppointmentID}
      style={styles.appointmentCard}
      onPress={() => navigation.navigate('AppointmentDetail', { appointmentID: appointment.AppointmentID })}
    >
      <View style={styles.appointmentLeftContent}>
        <Text style={styles.appointmentDate}>{moment(appointment.Date).format('MMM DD')}</Text>
        <Text style={styles.appointmentTime}>{appointment.Hour}</Text>
      </View>
      <View style={styles.appointmentRightContent}>
        <View style={styles.patientNameContainer}>
          <Ionicons name="person-outline" size={16} color="#146C94" style={styles.appointmentIcon} />
          <Text style={styles.appointmentPatient}>{`${appointment.firstName} ${appointment.lastName}`}</Text>
        </View>
        <Text style={styles.appointmentType}>{`${appointment.Description}`}</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <Pressable style={styles.menuButton} onPress={openModal}>
          <Ionicons name="menu-outline" size={30} color={'#3498db'} />
        </Pressable>

        <View style={styles.headerContainer}>
          <View style={styles.header}>
            <Image
              source={profileImage ? { uri: profileImage } : require('../assets/pp.jpg')}
              style={styles.profileImage}
            />
            <View style={styles.headerTextContainer}>
              <Text style={styles.title}>Dr. {firstName} {lastName}</Text>
              <Text style={styles.date}>{HeaderDate}</Text>
            </View>
            <TouchableOpacity
              style={styles.editButton}
              onPress={() => navigation.navigate('Profile', { user, firstName, lastName, email, password, userId })}
            >
              <Ionicons name="pencil" size={24} color="white" />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.contentContainer}>
          <View style={styles.appointmentsContainer}>
            <View style={styles.appointmentColumn}>
              <Text style={styles.appointmentTitle}>Upcoming Visits</Text>
              <View style={styles.appointmentList}>
                {upcomingAppointments.length > 0 ? (
                  upcomingAppointments.map(renderAppointment)
                ) : (
                  <Text style={styles.noAppointmentText}>No upcoming appointments.</Text>
                )}
              </View>
            </View>
            <View style={styles.appointmentColumn}>
              <Text style={styles.appointmentTitle}>Recent Visits</Text>
              <View style={styles.appointmentList}>
                {recentAppointments.length > 0 ? (
                  recentAppointments.map(renderAppointment)
                ) : (
                  <Text style={styles.noAppointmentText}>No recent appointments.</Text>
                )}
              </View>
            </View>
          </View>
        </View>

        <View style={styles.buttonsContainer}>
          <TouchableOpacity style={styles.button} onPress={() => navigation.navigate('NoteList')}>
            <Ionicons name="document-text-outline" size={24} color="white" />
            <Text style={styles.buttonText}>Notes</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.button} onPress={() => navigation.navigate('PatientList')}>
            <Ionicons name="people-outline" size={24} color="white" />
            <Text style={styles.buttonText}>Patients</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.button} onPress={() => navigation.navigate('AddVisitScreen')}>
            <Ionicons name="calendar-outline" size={24} color="white" />
            <Text style={styles.buttonText}>Appointments</Text>
          </TouchableOpacity>
        </View>

        {modalVisible && (
          <Animated.View style={[
            styles.modalView,
            { transform: [{ translateX: slideAnim }] },
            { height: height } // Ekran yüksekliğini burada kullanıyoruz
          ]}>
            <Pressable style={styles.closeButton} onPress={closeModal}>
              <Ionicons name="close" size={30} color={'#3498db'} />
            </Pressable>
            <View style={styles.menuHeader}>
              <Image
                source={profileImage ? { uri: profileImage } : require('../assets/pp.jpg')}
                style={styles.menuProfileImage}
              />
              <Text style={styles.menuName}>Dr. {firstName} {lastName}</Text>
            </View>
            <TouchableOpacity style={styles.menuOption} onPress={() => {
              closeModal();
              navigation.navigate('Profile', { user, firstName, lastName, email, password, userId });
            }}>
              <Ionicons name="person-outline" size={24} color={'#3498db'} />
              <Text style={styles.menuOptionText}>My Profile</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.menuOption} onPress={() => {
              closeModal();
              navigation.navigate('PatientList');
            }}>
              <Ionicons name="people-outline" size={24} color={'#3498db'} />
              <Text style={styles.menuOptionText}>Patients</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.menuOption} onPress={() => {
              closeModal();
              navigation.navigate('AddVisitScreen');
            }}>
              <Ionicons name="calendar-outline" size={24} color={'#3498db'} />
              <Text style={styles.menuOptionText}>Appointments</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.menuOption} onPress={() => {
              closeModal();
              navigation.navigate('NoteList');
            }}>
              <Ionicons name="document-text-outline" size={24} color={'#3498db'} />
              <Text style={styles.menuOptionText}>Notes</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.menuOption} onPress={() => {
              closeModal();
              navigation.navigate('Login');
            }}>
              <Ionicons name="log-out-outline" size={24} color={'#3498db'} />
              <Text style={styles.menuOptionText}>Logout</Text>
            </TouchableOpacity>
          </Animated.View>
        )}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#ffffff',
  },
  menuButton: {
    position: 'absolute',
    top: 20,
    left: 20,
    zIndex: 1,
  },
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 30,
    marginTop: 50,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#146C94',
    borderRadius: 15,
    padding: 20,
    width: '100%',
  },
  profileImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 3,
    borderColor: '#ffffff',
  },
  headerTextContainer: {
    flex: 1,
    marginLeft: 20,
  },
  title: {
    fontSize: 24,
    color: '#ffffff',
    fontWeight: 'bold',
  },
  date: {
    fontSize: 16,
    color: '#ffffff',
    opacity: 0.9,
  },
  editButton: {
    padding: 10,
    marginLeft: 'auto',
    alignSelf: 'flex-start',
    marginTop: -5,
  },
  contentContainer: {
    flex: 1,
    marginBottom: 80, // Butonlar için alan bırak
  },
  appointmentsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    flex: 1,
  },
  appointmentColumn: {
    flex: 1,
    marginHorizontal: 5,
  },
  appointmentTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#146C94',
  },
  appointmentList: {
    flex: 1,
  },
  appointmentCard: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    borderRadius: 10,
    padding: 15,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 3,
    borderLeftWidth: 4,
    borderLeftColor: '#19A7CE',
  },
  appointmentLeftContent: {
    marginRight: 15,
    justifyContent: 'center',
    alignItems: 'center',
  },
  appointmentRightContent: {
    flex: 1,
    justifyContent: 'center',
  },
  patientNameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 5,
  },
  appointmentIcon: {
    marginRight: 5,
  },
  appointmentPatient: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2c3e50',
  },
  appointmentType: {
    fontSize: 14,
    color: '#146C94',
  },
  appointmentDate: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#146C94',
    marginBottom: 5,
  },
  appointmentTime: {
    fontSize: 14,
    color: '#19A7CE',
  },
  noAppointmentText: {
    fontSize: 14,
    color: '#2c3e50',
    textAlign: 'center',
  },
  buttonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
  },
  button: {
    backgroundColor: '#19A7CE',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    flex: 1,
    marginHorizontal: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 3,
  },
  buttonText: {
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 14,
    marginTop: 5,
  },
  modalView: {
    position: 'absolute',
    left: 0,
    top: 0,
    width: width * 0.3,
    backgroundColor: '#ffffff',
    padding: 20,
    paddingTop: 50,
    shadowColor: '#000',
    shadowOffset: { width: 4, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  closeButton: {
    alignSelf: 'flex-end',
    marginBottom: 30,
  },
  menuHeader: {
    alignItems: 'center',
    marginBottom: 30,
  },
  menuProfileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 10,
  },
  menuName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#146C94',
  },
  menuOption: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  menuOptionText: {
    fontSize: 18,
    color: '#2c3e50',
    marginLeft: 15,
  },
});

export default HomeScreen;
