// components/ChallengePopUp.tsx
import { View, Text, StyleSheet, TouchableOpacity, Modal, FlatList } from 'react-native';
import React, { useState } from 'react';
import RoutinesIcon from '@/assets/tsxicons/routinesnavbaricon';

interface Challenge {
  id: number;
  from_user: {
    id: number;
    name: string;
    username: string;
  };
  routine: {
    id: number;
    name: string;
    description: string;
  };
  created_at: string;
}

interface ChallengePopUpProps {
  challenges: Challenge[];
  visible: boolean;
  onAccept: (challengeId: number) => void;
  onDecline: (challengeId: number) => void;
  onClose: () => void;
}

const ChallengePopUp: React.FC<ChallengePopUpProps> = ({
  challenges,
  visible,
  onAccept,
  onDecline,
  onClose
}) => {
  const [selectedChallengeId, setSelectedChallengeId] = useState<number | null>(null);

  const selectedChallenge = challenges.find(c => c.id === selectedChallengeId);

  return (
    <Modal
      transparent={true}
      visible={visible}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          <Text style={styles.titleText}>
            You have been challenged!
          </Text>

          <FlatList
            data={challenges}
            style={styles.challengesList}
            contentContainerStyle={{ paddingHorizontal: 20 }}
            keyExtractor={(item) => item.id.toString()}
            showsVerticalScrollIndicator={true}
            renderItem={({ item }) => (
              <TouchableOpacity 
                style={[
                  styles.challengeItem,
                  selectedChallengeId === item.id && styles.selectedChallenge
                ]}
                onPress={() => setSelectedChallengeId(item.id)}
              >
                <View style={styles.challengeHeader}>
                  <RoutinesIcon width={24} height={24} color={"#6E49EB"} />
                  <View style={styles.challengeInfo}>
                    <Text style={styles.routineName}>{item.routine.name}</Text>
                    <Text style={styles.fromUser}>from @{item.from_user.username}</Text>
                    {item.routine.description && (
                      <Text style={styles.description} numberOfLines={2}>
                        {item.routine.description}
                      </Text>
                    )}
                  </View>
                </View>
              </TouchableOpacity>
            )}
            ListEmptyComponent={
              <Text style={styles.emptyText}>No pending challenges</Text>
            }
          />

          <View style={styles.buttonContainer}>
            <TouchableOpacity 
              style={[
                styles.acceptButton,
                !selectedChallengeId && styles.disabledButton
              ]} 
              onPress={() => {
                if (selectedChallengeId) {
                  onAccept(selectedChallengeId);
                  setSelectedChallengeId(null);
                }
              }}
              disabled={!selectedChallengeId}
            >
              <Text style={styles.acceptButtonText}>✅ Accept</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[
                styles.declineButton,
                !selectedChallengeId && styles.disabledButton
              ]} 
              onPress={() => {
                if (selectedChallengeId) {
                  onDecline(selectedChallengeId);
                  setSelectedChallengeId(null);
                }
              }}
              disabled={!selectedChallengeId}
            >
              <Text style={styles.declineButtonText}>❌ Decline</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity 
            style={styles.closeButton}
            onPress={() => {
              setSelectedChallengeId(null);
              onClose();
            }}
          >
            <Text style={styles.closeButtonText}>Close</Text>
          </TouchableOpacity>
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
  container: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 15,
    alignItems: 'center',
    marginHorizontal: 20,
    width: '90%',
    maxHeight: '80%',
  },
  titleText: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 15,
    color: '#000',
  },
  usernameText: {
    color: '#6E49EB',
    fontWeight: '700',
  },
  subtitleText: {
    fontSize: 14,
    color: '#A4A4A8',
    marginBottom: 15,
  },
  challengesList: {
    maxHeight: 400,
    width: '100%',
    marginTop: 10,
  },
  challengeItem: {
    padding: 15,
    marginVertical: 8,
    borderRadius: 12,
    backgroundColor: '#f5f5f5',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  selectedChallenge: {
    backgroundColor: '#E8DEFF',
    borderColor: '#6E49EB',
  },
  challengeHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  challengeInfo: {
    flex: 1,
    marginLeft: 12,
  },
  routineName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
    marginBottom: 4,
  },
  fromUser: {
    fontSize: 14,
    color: '#6E49EB',
    fontWeight: '500',
    marginBottom: 4,
  },
  description: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  buttonContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 20,
    width: '100%',
    paddingHorizontal: 20,
  },
  acceptButton: {
    flex: 1,
    backgroundColor: '#C1E1C1',
    padding: 12,
    borderRadius: 10,
    marginRight: 10,
    alignItems: 'center',
  },
  acceptButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2D5F2D',
  },
  declineButton: {
    flex: 1,
    backgroundColor: '#FAA0A0',
    padding: 12,
    borderRadius: 10,
    marginLeft: 10,
    alignItems: 'center',
  },
  declineButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#8B0000',
  },
  disabledButton: {
    opacity: 0.5,
  },
  closeButton: {
    marginTop: 15,
    padding: 10,
  },
  closeButtonText: {
    color: '#A4A4A8',
    fontSize: 14,
  },
  emptyText: {
    textAlign: 'center',
    color: '#A4A4A8',
    fontSize: 16,
    marginTop: 20,
  },
});

export default ChallengePopUp;