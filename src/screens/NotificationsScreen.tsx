import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import React from 'react';
import {
  FlatList,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { HeaderBack } from '../components/HeaderBack';
import { useNotifications } from '../providers/NotificationsProvider';

export default function NotificationsScreen() {
  const { notifications, deleteNotification, markAsRead, markAllAsRead } = useNotifications();
  const navigation = useNavigation<any>();

  const handlePress = (notification: any) => {
    markAsRead(notification.id);
    if (notification.route?.screen) {
      const screenName = notification.route.screen;
      const params = notification.route.params;

      if (screenName === "Agenda" || screenName === "Admin") {
        navigation.navigate("Main", { screen: screenName, params });
      } else {
        navigation.navigate(screenName, params);
      }
    }
  };

  const renderItem = ({ item }: { item: any }) => {
    const date = item.createdAt?.seconds 
      ? new Date(item.createdAt.seconds * 1000).toLocaleDateString() 
      : '';

    return (
      <View style={[styles.card, !item.read && styles.unreadCard]}>
        {!item.read && <View style={styles.unreadDot} />}
        
        <TouchableOpacity 
          style={styles.contentContainer} 
          onPress={() => handlePress(item)}
          activeOpacity={0.7}
        >
          <View style={styles.headerRow}>
            <Text style={[styles.title, !item.read && styles.unreadText]}>
              {item.title}
            </Text>
            <Text style={styles.dateText}>{date}</Text>
          </View>
          <Text style={styles.message} numberOfLines={2}>
            {item.message}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity 
          onPress={() => deleteNotification(item.id)}
          style={styles.deleteButton}
          hitSlop={15}
        >
          <Ionicons name="trash-outline" size={20} color="#a1a1aa" />
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <HeaderBack title="Notificaciones" />

      {notifications.length > 0 && (
        <View style={styles.screenHeader}>
          <TouchableOpacity onPress={markAllAsRead} style={styles.markAllButton}>
            <Text style={styles.markAllText}>Leer todas</Text>
          </TouchableOpacity>
        </View>
      )}

      <FlatList
        data={notifications}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="notifications-off-outline" size={64} color="#d4d4d8" />
            <Text style={styles.emptyTitle}>Todo al día</Text>
            <Text style={styles.emptySubtitle}>No tienes notificaciones nuevas por ahora.</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 10,
    flex: 1,
    backgroundColor: '#f5f5f7',
  },
  screenHeader: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    alignItems: 'flex-end',
    backgroundColor: 'transparent',
  },
  markAllButton: {
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  markAllText: {
    color: '#6b7280',
    fontWeight: '500',
    fontSize: 13,
    textDecorationLine: 'underline',
  },
  listContent: {
    padding: 16,
    paddingBottom: 40,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  unreadCard: {
    backgroundColor: '#f9f9f9',
    borderLeftWidth: 3,
    borderLeftColor: '#4b5563',
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#4b5563',
    position: 'absolute',
    left: 8,
    top: 20,
  },
  contentContainer: {
    flex: 1,
    marginLeft: 12,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 4,
  },
  title: {
    fontSize: 15,
    fontWeight: '600',
    color: '#374151',
    flex: 1,
    marginRight: 8,
  },
  unreadText: {
    color: '#111827',
    fontWeight: '700',
  },
  dateText: {
    fontSize: 11,
    color: '#9ca3af',
  },
  message: {
    fontSize: 14,
    color: '#6b7280',
    lineHeight: 20,
  },
  deleteButton: {
    padding: 6,
    marginLeft: 10,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 120,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#4b5563',
    marginTop: 16,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#9ca3af',
    marginTop: 6,
    textAlign: 'center',
    paddingHorizontal: 40,
  },
});
