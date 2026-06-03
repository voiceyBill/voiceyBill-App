import React, { useEffect, useRef } from 'react';
import {
  Animated,
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { AlertTriangle, AlertCircle, CheckCircle, Info, X } from 'lucide-react-native';
import { useTheme } from '../../context/ThemeContext';
import { colors } from '../../theme/colors';
import { useNotification, type Notification } from '../../context/NotificationContext';

const NotificationBar: React.FC = () => {
  const { activeTheme } = useTheme();
  const themeColors = colors[activeTheme];
  const { notifications, removeNotification } = useNotification();
  const slideAnim = useRef(new Animated.Value(-100)).current;

  const currentNotification = notifications[0];

  useEffect(() => {
    if (currentNotification) {
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
        tension: 50,
        friction: 8,
      }).start();
    } else {
      Animated.timing(slideAnim, {
        toValue: -100,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  }, [currentNotification, slideAnim]);

  if (!currentNotification) return null;

  const getIcon = (type: Notification['type']) => {
    const iconProps = { size: 20, color: '#fff' };
    switch (type) {
      case 'success':
        return <CheckCircle {...iconProps} />;
      case 'error':
        return <AlertCircle {...iconProps} />;
      case 'warning':
        return <AlertTriangle {...iconProps} />;
      case 'budget_alert':
        return <AlertTriangle {...iconProps} />;
      default:
        return <Info {...iconProps} />;
    }
  };

  const getBackgroundColor = (type: Notification['type']) => {
    switch (type) {
      case 'success':
        return '#10b981';
      case 'error':
        return '#ef4444';
      case 'warning':
        return '#f59e0b';
      case 'budget_alert':
        return '#f59e0b';
      default:
        return '#3b82f6';
    }
  };

  const backgroundColor = getBackgroundColor(currentNotification.type);

  return (
    <Animated.View
      style={[
        styles.container,
        {
          transform: [{ translateY: slideAnim }],
          paddingTop: Platform.OS === 'ios' ? 12 : 8,
        },
      ]}
    >
      <View
        style={[
          styles.notification,
          { backgroundColor },
        ]}
      >
        <View style={styles.content}>
          <View style={styles.iconContainer}>
            {getIcon(currentNotification.type)}
          </View>
          <View style={styles.textContainer}>
            {currentNotification.title && (
              <Text style={styles.title}>{currentNotification.title}</Text>
            )}
            <Text
              style={[
                styles.message,
                {
                  marginTop: currentNotification.title ? 2 : 0,
                },
              ]}
              numberOfLines={2}
            >
              {currentNotification.message}
            </Text>
          </View>
          <TouchableOpacity
            onPress={() => removeNotification(currentNotification.id)}
            style={styles.closeButton}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <X size={18} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
    paddingHorizontal: 12,
  },
  notification: {
    borderRadius: 8,
    overflow: 'hidden',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 14,
    gap: 12,
  },
  iconContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  message: {
    fontSize: 13,
    color: '#fff',
    lineHeight: 18,
  },
  closeButton: {
    padding: 4,
  },
});

export default NotificationBar;
