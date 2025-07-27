import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface TimePickerModalProps {
  visible: boolean;
  onClose: () => void;
  onConfirm: (time: Date) => void;
  initialTime?: Date;
  title?: string;
}

const TimePickerModal: React.FC<TimePickerModalProps> = ({
  visible,
  onClose,
  onConfirm,
  initialTime = new Date(),
  title = 'Select Time',
}) => {
  console.log('TimePickerModal rendered with visible:', visible, 'title:', title);
  if (visible) {
    console.log('TimePickerModal is visible, should show modal');
  }
  const [selectedTime, setSelectedTime] = useState(initialTime);

  const hours = Array.from({ length: 12 }, (_, i) => i + 1);
  const minutes = Array.from({ length: 60 }, (_, i) => i);
  const periods = ['AM', 'PM'];

  const handleConfirm = () => {
    onConfirm(selectedTime);
  };

  const updateTime = (type: 'hour' | 'minute' | 'period', value: number | string) => {
    const newTime = new Date(selectedTime);
    let currentHour = newTime.getHours();
    let currentMinute = newTime.getMinutes();

    switch (type) {
      case 'hour':
        const isPM = currentHour >= 12;
        const hourValue = typeof value === 'number' ? value : parseInt(value as string);
        newTime.setHours(hourValue + (isPM ? 12 : 0));
        break;
      case 'minute':
        const minuteValue = typeof value === 'number' ? value : parseInt(value as string);
        newTime.setMinutes(minuteValue);
        break;
      case 'period':
        const currentPeriod = currentHour >= 12 ? 'PM' : 'AM';
        if (value === 'PM' && currentPeriod === 'AM') {
          newTime.setHours(currentHour + 12);
        } else if (value === 'AM' && currentPeriod === 'PM') {
          newTime.setHours(currentHour - 12);
        }
        break;
    }
    setSelectedTime(newTime);
  };

  const getDisplayHour = () => {
    const hour = selectedTime.getHours();
    return hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
  };

  const getDisplayPeriod = () => {
    return selectedTime.getHours() >= 12 ? 'PM' : 'AM';
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modalContent}>
          <View style={styles.header}>
            <TouchableOpacity onPress={onClose}>
              <Text style={styles.cancelButton}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.title}>{title}</Text>
            <TouchableOpacity onPress={handleConfirm}>
              <Text style={styles.confirmButton}>Done</Text>
            </TouchableOpacity>
          </View>
          
          <View style={styles.pickerContainer}>
            <View style={styles.pickerColumn}>
              <Text style={styles.pickerLabel}>Hour</Text>
              <ScrollView style={styles.pickerScroll} showsVerticalScrollIndicator={false}>
                {hours.map((hour) => (
                  <TouchableOpacity
                    key={hour}
                    style={[
                      styles.pickerItem,
                      getDisplayHour() === hour && styles.selectedItem
                    ]}
                    onPress={() => updateTime('hour', hour)}
                  >
                    <Text style={[
                      styles.pickerItemText,
                      getDisplayHour() === hour && styles.selectedItemText
                    ]}>
                      {hour}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            <View style={styles.pickerColumn}>
              <Text style={styles.pickerLabel}>Minute</Text>
              <ScrollView style={styles.pickerScroll} showsVerticalScrollIndicator={false}>
                {minutes.map((minute) => (
                  <TouchableOpacity
                    key={minute}
                    style={[
                      styles.pickerItem,
                      selectedTime.getMinutes() === minute && styles.selectedItem
                    ]}
                    onPress={() => updateTime('minute', minute)}
                  >
                    <Text style={[
                      styles.pickerItemText,
                      selectedTime.getMinutes() === minute && styles.selectedItemText
                    ]}>
                      {minute.toString().padStart(2, '0')}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            <View style={styles.pickerColumn}>
              <Text style={styles.pickerLabel}>Period</Text>
              <ScrollView style={styles.pickerScroll} showsVerticalScrollIndicator={false}>
                {periods.map((period) => (
                  <TouchableOpacity
                    key={period}
                    style={[
                      styles.pickerItem,
                      getDisplayPeriod() === period && styles.selectedItem
                    ]}
                    onPress={() => updateTime('period', period)}
                  >
                    <Text style={[
                      styles.pickerItemText,
                      getDisplayPeriod() === period && styles.selectedItemText
                    ]}>
                      {period}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 16,
    width: '90%',
    maxHeight: '70%',
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 5 },
    elevation: 10,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  cancelButton: {
    color: '#E74C3C',
    fontSize: 16,
    fontWeight: '600',
  },
  confirmButton: {
    color: '#3CB371',
    fontSize: 16,
    fontWeight: '600',
  },
  pickerContainer: {
    flexDirection: 'row',
    padding: 20,
  },
  pickerColumn: {
    flex: 1,
    alignItems: 'center',
  },
  pickerLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    marginBottom: 10,
  },
  pickerScroll: {
    height: 200,
  },
  pickerItem: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginVertical: 2,
    minWidth: 60,
    alignItems: 'center',
  },
  selectedItem: {
    backgroundColor: '#3CB371',
  },
  pickerItemText: {
    fontSize: 16,
    color: '#333',
  },
  selectedItemText: {
    color: '#fff',
    fontWeight: '600',
  },
});

export default TimePickerModal; 