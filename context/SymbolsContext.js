// context/SymbolsContext.js
import React, { createContext, useState, useContext, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../firebaseConfig';

const SymbolsContext = createContext();

export const useSymbols = () => {
  const context = useContext(SymbolsContext);
  if (!context) {
    throw new Error('useSymbols must be used within a SymbolsProvider');
  }
  return context;
};

export const SymbolsProvider = ({ children }) => {
  const [symbols, setSymbols] = useState([]);
  const [lastResetDate, setLastResetDate] = useState(new Date());
  const [isLoaded, setIsLoaded] = useState(false);
  const [storageOwnerId, setStorageOwnerId] = useState(null);

  const getSymbolsKey = (userId) => `symbols:${userId}`;
  const getLastResetDateKey = (userId) => `lastResetDate:${userId}`;

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      const nextUserId = user?.uid || null;
      setStorageOwnerId(nextUserId);
      setIsLoaded(false);
      await loadInitialData(nextUserId);
    });

    return unsubscribe;
  }, []);

  // Check for weekly reset whenever symbols or lastResetDate changes
  useEffect(() => {
    if (isLoaded) {
      checkAndResetWeekly();
    }
  }, [isLoaded, symbols, lastResetDate]);

  const loadInitialData = async (userId) => {
    if (!userId) {
      setSymbols([]);
      setLastResetDate(new Date());
      setIsLoaded(true);
      return;
    }

    try {
      const storedSymbols = await AsyncStorage.getItem(getSymbolsKey(userId));
      if (storedSymbols) {
        setSymbols(JSON.parse(storedSymbols));
      } else {
        setSymbols([]);
      }

      const storedResetDate = await AsyncStorage.getItem(getLastResetDateKey(userId));
      if (storedResetDate) {
        setLastResetDate(new Date(storedResetDate));
      } else {
        const now = new Date();
        setLastResetDate(now);
        await AsyncStorage.setItem(getLastResetDateKey(userId), now.toISOString());
      }

      setIsLoaded(true);
    } catch (error) {
      console.error('Error loading data from storage:', error);
      setSymbols([]);
      setLastResetDate(new Date());
      setIsLoaded(true);
    }
  };

  const saveSymbolsToStorage = async (symbolsToSave) => {
    if (!storageOwnerId) return;

    try {
      await AsyncStorage.setItem(getSymbolsKey(storageOwnerId), JSON.stringify(symbolsToSave));
    } catch (error) {
      console.error('Error saving symbols to storage:', error);
    }
  };

  const saveLastResetDateToStorage = async (date) => {
    if (!storageOwnerId) return;

    try {
      await AsyncStorage.setItem(getLastResetDateKey(storageOwnerId), date.toISOString());
    } catch (error) {
      console.error('Error saving reset date to storage:', error);
    }
  };

  // Check if we need to reset (weekly) - runs automatically
  const checkAndResetWeekly = async () => {
    if (!isLoaded || symbols.length === 0) return;

    const now = new Date();
    const lastReset = new Date(lastResetDate);
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    if (lastReset < oneWeekAgo) {
      console.log('🔄 Weekly reset triggered!');
      await resetUsageCounts();
    }
  };

  // Add a new symbol
  const addSymbol = (symbol) => {
    const newSymbol = {
      ...symbol,
      id: symbol.id || Date.now().toString(),
      usageCount: 0,
      createdAt: new Date().toISOString()
    };
    
    setSymbols(prevSymbols => {
      const updatedSymbols = [...prevSymbols, newSymbol];
      saveSymbolsToStorage(updatedSymbols);
      return updatedSymbols;
    });
    
    return newSymbol;
  };

  // Remove a symbol
  const removeSymbol = (symbolId) => {
    setSymbols(prevSymbols => {
      const updatedSymbols = prevSymbols.filter(symbol => symbol.id !== symbolId);
      saveSymbolsToStorage(updatedSymbols);
      return updatedSymbols;
    });
  };

  // Update symbol usage
  const updateSymbolUsage = (symbolId) => {
    setSymbols(prevSymbols => {
      const updatedSymbols = prevSymbols.map(symbol => 
        symbol.id === symbolId 
          ? { ...symbol, usageCount: (symbol.usageCount || 0) + 1 }
          : symbol
      );
      saveSymbolsToStorage(updatedSymbols);
      return updatedSymbols;
    });
  };

  // Reset all usage counts
  const resetUsageCounts = async () => {
    const now = new Date();
    setSymbols(prevSymbols => {
      const resetSymbols = prevSymbols.map(symbol => ({
        ...symbol,
        usageCount: 0
      }));
      saveSymbolsToStorage(resetSymbols);
      return resetSymbols;
    });
    
    setLastResetDate(now);
    await saveLastResetDateToStorage(now);
    console.log('✅ All usage counts reset for new week');
  };

  // Get symbol by ID
  const getSymbolById = (symbolId) => {
    return symbols.find(symbol => symbol.id === symbolId);
  };

  // Update symbol data
  const updateSymbol = (symbolId, updates) => {
    setSymbols(prevSymbols => {
      const updatedSymbols = prevSymbols.map(symbol =>
        symbol.id === symbolId ? { ...symbol, ...updates } : symbol
      );
      saveSymbolsToStorage(updatedSymbols);
      return updatedSymbols;
    });
  };

  // Clear all symbols
  const clearAllSymbols = () => {
    setSymbols([]);
    saveSymbolsToStorage([]);
  };

  const value = {
    symbols,
    setSymbols,
    lastResetDate,
    addSymbol,
    removeSymbol,
    updateSymbolUsage,
    incrementUsage: updateSymbolUsage,
    deleteSymbol: removeSymbol,
    resetUsageCounts,
    getSymbolById,
    updateSymbol,
    clearAllSymbols,
  };

  return (
    <SymbolsContext.Provider value={value}>
      {children}
    </SymbolsContext.Provider>
  );
};
