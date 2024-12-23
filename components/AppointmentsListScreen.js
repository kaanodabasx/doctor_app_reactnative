import React, { useEffect, useState } from 'react';
import { StyleSheet, View, Text, FlatList, ActivityIndicator, Pressable, Animated, Modal, TouchableOpacity } from 'react-native';
import { useSQLiteContext } from 'expo-sqlite';
import { Swipeable } from 'react-native-gesture-handler';
import DateTimePickerModal from 'react-native-modal-datetime-picker';
import { Picker } from '@react-native-picker/picker';
import { Ionicons } from '@expo/vector-icons'; // New import

const AppointmentsListScreen = ({ route, navigation }) => {
  const db = useSQLiteContext();
  const { patientID } = route.params; // Get patientID from route params
  const [appointments, setAppointments] = useState([]);
  const [filteredAppointments, setFilteredAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterDate, setFilterDate] = useState('');
  const [sortOrder, setSortOrder] = useState('asc');
  const [locationFilter, setLocationFilter] = useState(''); // Location filter state
  const [modalVisible, setModalVisible] = useState(false);
  const [isDatePickerVisible, setDatePickerVisibility] = useState(false);

  useEffect(() => {
    const fetchAppointments = async () => {
      try {
        const result = await db.getAllAsync('SELECT * FROM appointments WHERE HastaID = ? ORDER BY Date ASC, Hour ASC', [patientID]);
        setAppointments(result);
      } catch (error) {
        console.log('Error fetching appointments: ', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAppointments(); // Initial fetch

    // Set interval to fetch appointments every 0.5 seconds
    const intervalId = setInterval(() => {
      fetchAppointments();
    }, 500);

    // Clear interval on component unmount
    return () => clearInterval(intervalId);
  }, [db, patientID]);

  useEffect(() => {
    const filterAndSortAppointments = () => {
      let filtered = appointments;

      // Filter by date if provided
      if (filterDate) {
        filtered = filtered.filter(app => app.Date === filterDate);
      }

      // Filter by location if provided
      if (locationFilter) {
        filtered = filtered.filter(app => app.Location === locationFilter);
      }

      // Sort appointments
      filtered.sort((a, b) => {
        if (sortOrder === 'asc') {
          return new Date(a.Date) - new Date(b.Date) || a.Hour.localeCompare(b.Hour);
        } else {
          return new Date(b.Date) - new Date(a.Date) || b.Hour.localeCompare(a.Hour);
        }
      });

      setFilteredAppointments(filtered);
    };

    filterAndSortAppointments();
  }, [appointments, filterDate, sortOrder, locationFilter]);

  const deleteAppointment = async (appointmentID) => {
    try {
      await db.runAsync('DELETE FROM appointments WHERE AppointmentID = ?', [appointmentID]);
    } catch (error) {
      console.log('Error deleting appointment: ', error);
    }
  };

  const renderRightActions = (dragX, appointmentID) => {
    const scale = dragX.interpolate({
      inputRange: [-100, 0],
      outputRange: [1, 0.8],
      extrapolate: 'clamp'
    });

    return (
      <Animated.View style={[styles.rightAction, { transform: [{ scale }] }]}>
        <Pressable onPress={() => deleteAppointment(appointmentID)}>
          <Ionicons name="trash-outline" size={24} color="white" />
        </Pressable>
      </Animated.View>
    );
  };

  const showDatePicker = () => {
    setDatePickerVisibility(true);
  };

  const hideDatePicker = () => {
    setDatePickerVisibility(false);
  };

  const handleConfirm = (date) => {
    const selectedDate = date.toISOString().split('T')[0]; // Get in YYYY-MM-DD format
    setFilterDate(selectedDate);
    hideDatePicker();
  };

  const resetFilters = () => {
    setFilterDate('');
    setSortOrder('asc');
    setLocationFilter(''); // Reset location filter
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
        <Text style={styles.title}>Visit List</Text>
        <Pressable style={styles.addButton} onPress={() => navigation.navigate('Appointments', { patientID })}>
          <Ionicons name="add" size={24} color="white" />
        </Pressable>
      </View>

      <View style={styles.filterContainer}>
        <Pressable style={styles.filterButton} onPress={() => setModalVisible(true)}>
          <Ionicons name="filter" size={20} color="#19A7CE" />
          <Text style={styles.filterButtonText}>Filter & Sort</Text>
        </Pressable>
        {(filterDate || locationFilter || sortOrder !== 'asc') && (
          <Pressable style={styles.resetButton} onPress={resetFilters}>
            <Ionicons name="refresh" size={20} color="#FF6B6B" />
          </Pressable>
        )}
      </View>

      {/* Modal content */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Filter & Sort</Text>

            <TouchableOpacity style={styles.modalButton} onPress={showDatePicker}>
              <Ionicons name="calendar-outline" size={24} color="white" />
              <Text style={styles.modalButtonText}>Date: {filterDate || 'All'}</Text>
            </TouchableOpacity>

            <DateTimePickerModal
              isVisible={isDatePickerVisible}
              mode="date"
              onConfirm={handleConfirm}
              onCancel={hideDatePicker}
            />

            <View style={styles.filterRow}>
              <View style={[styles.pickerContainer, styles.halfWidth]}>
                <Text style={styles.pickerLabel}>Sort by Time:</Text>
                <Picker
                  selectedValue={sortOrder}
                  style={styles.picker}
                  onValueChange={(itemValue) => setSortOrder(itemValue)}
                >
                  <Picker.Item label="Ascending" value="asc" />
                  <Picker.Item label="Descending" value="desc" />
                </Picker>
              </View>

              <View style={[styles.pickerContainer, styles.halfWidth]}>
                <Text style={styles.pickerLabel}>Filter by Location:</Text>
                <Picker
                  selectedValue={locationFilter}
                  style={styles.picker}
                  onValueChange={(itemValue) => setLocationFilter(itemValue)}
                >
                  <Picker.Item label="All" value="" />
                  <Picker.Item label="Clinic" value="Clinic" />
                  <Picker.Item label="Hospital" value="Hospital" />
                </Picker>
              </View>
            </View>

            <TouchableOpacity style={styles.closeButton} onPress={() => setModalVisible(false)}>
              <Text style={styles.closeButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <FlatList
        data={filteredAppointments}
        keyExtractor={(item) => item.AppointmentID.toString()}
        renderItem={({ item }) => (
          <Swipeable renderRightActions={(dragX) => renderRightActions(dragX, item.AppointmentID)}>
            <Pressable
              style={styles.item}
              onPress={() => navigation.navigate('AppointmentDetail', { appointmentID: item.AppointmentID })}
            >
              <View style={styles.itemHeader}>
                <Text style={styles.itemTitle}>{item.Description}</Text>
                <Text style={styles.itemDate}>{item.Date}</Text>
              </View>
              <View style={styles.itemDetails}>
                <Ionicons name="time-outline" size={16} color="#146C94" />
                <Text style={styles.itemText}>{item.Hour}</Text>
                <Ionicons name="location-outline" size={16} color="#146C94" />
                <Text style={styles.itemText}>{item.Location}</Text>
              </View>
            </Pressable>
          </Swipeable>
        )}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#F8F8F8',
  },
  header: {
    flexDirection: "row",
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#146C94',
  },
  addButton: {
    backgroundColor: '#19A7CE',
    padding: 10,
    borderRadius: 25,
    elevation: 3,
  },
  filterContainer: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E0F7FA',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    marginRight: 10,
  },
  filterButtonText: {
    color: '#19A7CE',
    marginLeft: 5,
    fontWeight: '600',
  },
  resetButton: {
    backgroundColor: '#FFE0E0',
    padding: 8,
    borderRadius: 20,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContent: {
    backgroundColor: 'white',
    padding: 22,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 15,
    textAlign: 'center',
  },
  modalButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#19A7CE',
    padding: 12,
    borderRadius: 10,
    marginBottom: 15,
  },
  modalButtonText: {
    color: 'white',
    fontSize: 16,
    marginLeft: 10,
  },
  filterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  halfWidth: {
    width: '48%',
  },
  pickerContainer: {
    marginBottom: 15,
  },
  pickerLabel: {
    fontSize: 14,
    marginBottom: 5,
    color: '#146C94',
  },
  picker: {
    backgroundColor: '#E0F7FA',
    borderRadius: 10,
  },
  closeButton: {
    backgroundColor: '#FF6B6B',
    padding: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  closeButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  item: {
    backgroundColor: 'white',
    padding: 16,
    marginBottom: 10,
    borderRadius: 10,
    elevation: 2,
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  itemTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#146C94',
  },
  itemDate: {
    fontSize: 14,
    color: '#19A7CE',
  },
  itemDetails: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  itemText: {
    fontSize: 14,
    marginRight: 10,
    marginLeft: 4,
  },
  rightAction: {
    backgroundColor: '#FF6B6B',
    justifyContent: 'center',
    alignItems: 'center',
    width: 80,
    borderTopRightRadius: 10,
    borderBottomRightRadius: 10,
  },
});

export default AppointmentsListScreen;
