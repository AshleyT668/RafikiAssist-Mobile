// context/AccessibilityContext.js
import React, { createContext, useState, useContext, useEffect } from 'react';
import { AccessibilityInfo } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const AccessibilityContext = createContext();

export const useAccessibility = () => {
  const context = useContext(AccessibilityContext);
  if (!context) {
    console.error('❌ useAccessibility must be used within an AccessibilityProvider');
    throw new Error('useAccessibility must be used within an AccessibilityProvider');
  }
  return context;
};

export const AccessibilityProvider = ({ children }) => {
  const [highContrast, setHighContrast] = useState(false);
  const [largerText, setLargerText] = useState(false);

  console.log('🎯 [AccessibilityProvider] Rendering with state:', {
    highContrast,
    largerText
  });

  useEffect(() => {
    console.log('📥 [AccessibilityProvider] useEffect running - loading preferences');
    loadAccessibilityPreferences();
  }, []);

  const loadAccessibilityPreferences = async () => {
    try {
      console.log('🔍 [AccessibilityContext] Loading preferences from storage...');
      const preferences = await AsyncStorage.getItem('accessibilityPreferences');
      console.log('📄 [AccessibilityContext] Raw preferences from storage:', preferences);
      
      if (preferences) {
        const parsed = JSON.parse(preferences);
        console.log('📋 [AccessibilityContext] Parsed preferences:', parsed);
        
        // Update state with loaded preferences
        setHighContrast(parsed.highContrast || false);
        setLargerText(parsed.largerText || false);
        
        console.log('🔄 [AccessibilityContext] State updated from storage');
      } else {
        console.log('ℹ️ [AccessibilityContext] No preferences found in storage, using defaults');
      }
    } catch (error) {
      console.log('❌ [AccessibilityContext] Error loading preferences:', error);
    }
  };

  const saveAccessibilityPreferences = async (updates = {}) => {
    try {
      console.log('💾 [AccessibilityContext] Saving preferences with updates:', updates);
      
      const preferences = {
        highContrast: updates.highContrast !== undefined ? updates.highContrast : highContrast,
        largerText: updates.largerText !== undefined ? updates.largerText : largerText,
      };
      
      console.log('📝 [AccessibilityContext] Full preferences to save:', preferences);
      
      await AsyncStorage.setItem('accessibilityPreferences', JSON.stringify(preferences));
      console.log('✅ [AccessibilityContext] Preferences saved to AsyncStorage');
      
      // Verify it was saved by reading it back
      const verify = await AsyncStorage.getItem('accessibilityPreferences');
      console.log('🔍 [AccessibilityContext] Verification read from storage:', verify);
      
      // Update state if provided
      if (updates.highContrast !== undefined) {
        console.log('🔄 [AccessibilityContext] Setting highContrast state to:', updates.highContrast);
        setHighContrast(updates.highContrast);
      }
      if (updates.largerText !== undefined) {
        console.log('🔄 [AccessibilityContext] Setting largerText state to:', updates.largerText);
        setLargerText(updates.largerText);
      }
      
    } catch (error) {
      console.log('❌ [AccessibilityContext] Error saving preferences:', error);
    }
  };

  const value = {
    highContrast,
    largerText,
    saveAccessibilityPreferences,
  };

  console.log('🎁 [AccessibilityProvider] Providing context value:', value);

  return (
    <AccessibilityContext.Provider value={value}>
      {children}
    </AccessibilityContext.Provider>
  );
};