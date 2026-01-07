import { View, Text, StyleSheet, TouchableOpacity, Modal } from 'react-native'
import React, { useState } from 'react'
import { FlatList } from 'react-native';
import RoutinesIcon from '@/assets/tsxicons/routinesnavbaricon';
import { ScrollView } from 'react-native';

interface popUpProps {
    Title: string;
    Routines: Routine[];
    visible: boolean;
    onConfirm: (routineId: number) => void;
    onCancel: () => void;
}

interface Routine {
    id: number;
    name: string;
    description?: string;
    is_public: boolean;
    created_at: string;
    updated_at: string;
  }

  const popUp: React.FC<popUpProps> = ({
    Title,
    Routines,
    visible,
    onConfirm,
    onCancel
}) => {
    const [selectedRoutineId, setSelectedRoutineId] = useState<number | null>(null);

    return (
        <Modal
            transparent={true}
            visible={visible}
            animationType="fade"
            onRequestClose={onCancel}
        >
            <View style={styles.overlay}>
                <View style={styles.container}>
                    <Text style={styles.titleText}>{Title}</Text>
                    
                    <FlatList
                        data={Routines}
                        style={styles.routinesList}  
                        contentContainerStyle={{ paddingHorizontal: 20 }}
                        keyExtractor={(item) => item.id.toString()}
                        showsVerticalScrollIndicator={true} 
                        renderItem={({ item }) => (
                            <TouchableOpacity 
                                style={[
                                    styles.routineItem,
                                    selectedRoutineId === item.id && styles.selectedRoutine
                                ]}
                                onPress={() => setSelectedRoutineId(item.id)}
                            >
                                <RoutinesIcon width={24} height={24} color={"black"} />
                                <Text style={{ fontSize: 16, marginLeft: 8 }}>{item.name}</Text>
                            </TouchableOpacity>
                        )}
                    />

                    <View style={styles.option}>
                        <TouchableOpacity 
                            style={[
                                styles.confirmButton,
                                !selectedRoutineId && styles.disabledButton
                            ]} 
                            onPress={() => {
                                if (selectedRoutineId) {
                                    onConfirm(selectedRoutineId);
                                    setSelectedRoutineId(null); 
                                }
                            }}
                            disabled={!selectedRoutineId}
                        >
                            <Text>✅Confirm</Text>
                        </TouchableOpacity>

                        <TouchableOpacity 
                            style={styles.cancelButton} 
                            onPress={() => {
                                setSelectedRoutineId(null); 
                                onCancel();
                            }}
                        >
                            <Text>❌Cancel</Text>
                        </TouchableOpacity>
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
    container: {
        backgroundColor: 'white',
        padding: 20,
        borderRadius: 10,
        alignItems: 'center',
        marginHorizontal: 20,
        width: '90%', 
        maxHeight: '80%', 
    },
    titleText: {
        fontSize: 20,
        fontWeight: '600',
        marginBottom: 10,
    },
    routinesList: {
        maxHeight: 300,  
        width: '100%',
        marginTop: 10,
    },
    option: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between', 
        marginTop: 20,
        width: '100%', 
        paddingHorizontal: 20,
    },
    confirmButton: {
        flex: 1, 
        borderColor: '#C1E1C1',
        borderWidth: 3,
        padding: 10,
        borderRadius: 10,
        marginRight: 10, 
        alignItems: 'center', 
    },
    cancelButton: {
        flex: 1, 
        borderColor: '#FAA0A0',
        borderWidth: 2,
        padding: 10,
        borderRadius: 10,
        marginLeft: 10, 
        alignItems: 'center', 
    },
    routineItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
        marginVertical: 5,
        borderRadius: 8,
        backgroundColor: '#f5f5f5',
    },
    selectedRoutine: {
        backgroundColor: '#E8DEFF',
        borderWidth: 2,
        borderColor: '#6E49EB',
    },
    disabledButton: {
        opacity: 0.5,
    },
});

export default popUp