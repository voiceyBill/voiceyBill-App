import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native';
import { X, Trash2, CheckCheck, AlertTriangle, AlertCircle, CheckCircle, Info } from 'lucide-react-native';
import { useTheme } from '../../context/ThemeContext';
import { useNotification } from '../../context/NotificationContext';
import { colors, spacing } from '../../theme/colors';
import type { MainTabParamList } from '../../navigation/MainNavigator';

const NotificationsScreen = ({ navigation, route }: any) => {
  const { activeTheme } = useTheme();
  const themeColors = colors[activeTheme];
  const { notifications, removeNotification, clearNotifications } = useNotification();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const returnTo = (route?.params?.returnTo ?? 'Overview') as keyof MainTabParamList;

  const getIcon = (type: string) => {
    const iconProps = { size: 20 };
    switch (type) {
      case 'success':
        return <CheckCircle {...iconProps} color={themeColors.primary} />;
      case 'error':
        return <AlertCircle {...iconProps} color={themeColors.destructive} />;
      case 'warning':
        return <AlertTriangle {...iconProps} color="#d97706" />;
      case 'budget_alert':
        return <AlertTriangle {...iconProps} color="#d97706" />;
      default:
        return <Info {...iconProps} color={themeColors.primary} />;
    }
  };

  const getBgColor = (type: string) => {
    switch (type) {
      case 'success':
        return themeColors.background;
      case 'error':
        return themeColors.background;
      case 'warning':
        return themeColors.background;
      case 'budget_alert':
        return themeColors.background;
      default:
        return themeColors.background;
    }
  };

  const getBorderColor = (type: string) => {
    switch (type) {
      case 'success':
        return '#10b981';
      case 'error':
        return themeColors.destructive;
      case 'warning':
        return '#d97706';
      case 'budget_alert':
        return '#d97706';
      default:
        return themeColors.primary;
    }
  };

  const renderNotification = ({ item }: any) => {
    const isSelected = selectedId === item.id;
    return (
      <View
        style={[
          styles.notificationItem,
          {
            backgroundColor: getBgColor(item.type),
            borderLeftColor: getBorderColor(item.type),
            borderColor: themeColors.border,
          },
          isSelected && { borderWidth: 1.5 },
        ]}
      >
        <View style={styles.iconContainer}>
          {getIcon(item.type)}
        </View>

        <TouchableOpacity
          style={styles.contentArea}
          onPress={() => setSelectedId(isSelected ? null : item.id)}
          activeOpacity={0.7}
        >
          <Text
            style={[
              styles.title,
              { color: themeColors.foreground },
            ]}
          >
            {item.title || 'Notification'}
          </Text>
          <Text
            style={[
              styles.message,
              { color: themeColors.mutedForeground },
            ]}
            numberOfLines={isSelected ? 0 : 2}
          >
            {item.message}
          </Text>
          <Text
            style={[
              styles.timestamp,
              { color: themeColors.mutedForeground },
            ]}
          >
            {new Date(item.timestamp).toLocaleTimeString()}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => removeNotification(item.id)}
          style={styles.deleteButton}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <X size={18} color={themeColors.mutedForeground} />
        </TouchableOpacity>
      </View>
    );
  };

  const emptyComponent = (
    <View style={styles.emptyContainer}>
      <CheckCheck size={48} color={themeColors.mutedForeground} strokeWidth={1} />
      <Text
        style={[
          styles.emptyTitle,
          { color: themeColors.foreground },
        ]}
      >
        All caught up!
      </Text>
      <Text
        style={[
          styles.emptyMessage,
          { color: themeColors.mutedForeground },
        ]}
      >
        You have no notifications right now.
      </Text>
    </View>
  );

  return (
    <SafeAreaView
      style={[
        styles.container,
        { backgroundColor: themeColors.background },
      ]}
    >
      {/* Header */}
      <View
        style={[
          styles.header,
          { borderBottomColor: themeColors.border },
        ]}
      >
        <View>
          <Text
            style={[
              styles.headerTitle,
              { color: themeColors.foreground },
            ]}
          >
            Notifications
          </Text>
          <Text
            style={[
              styles.headerSubtitle,
              { color: themeColors.mutedForeground },
            ]}
          >
            {notifications.length} notification{notifications.length !== 1 ? 's' : ''}
          </Text>
        </View>

        <TouchableOpacity
          onPress={() => navigation.navigate(returnTo)}
          style={[
            styles.closeButton,
            { backgroundColor: themeColors.muted },
          ]}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <X size={24} color={themeColors.foreground} />
        </TouchableOpacity>
      </View>

      {/* Notifications List */}
      {notifications.length > 0 ? (
        <>
          <FlatList
            data={notifications}
            renderItem={renderNotification}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContainer}
            scrollEnabled
          />

          {/* Clear All Button */}
          <TouchableOpacity
            onPress={clearNotifications}
            style={[
              styles.clearButton,
              { backgroundColor: themeColors.destructive },
            ]}
          >
            <Text style={styles.clearButtonText}>Clear All Notifications</Text>
          </TouchableOpacity>
        </>
      ) : (
        emptyComponent
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 13,
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContainer: {
    padding: spacing.md,
    paddingBottom: spacing.xl,
  },
  notificationItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    borderLeftWidth: 4,
    borderRadius: 8,
    marginBottom: spacing.md,
    borderWidth: 1,
  },
  iconContainer: {
    marginRight: spacing.md,
    marginTop: 2,
  },
  contentArea: {
    flex: 1,
  },
  title: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  message: {
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 6,
  },
  timestamp: {
    fontSize: 12,
  },
  deleteButton: {
    padding: 8,
    marginLeft: spacing.sm,
  },
  clearButton: {
    marginHorizontal: spacing.md,
    marginBottom: spacing.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  clearButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: spacing.md,
    marginBottom: spacing.sm,
  },
  emptyMessage: {
    fontSize: 14,
    textAlign: 'center',
  },
});

export default NotificationsScreen;
