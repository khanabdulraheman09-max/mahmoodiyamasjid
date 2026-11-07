import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { App as CapApp } from '@capacitor/app';
import { Capacitor } from '@capacitor/core';
import { NativeService } from '../services/nativeService';

interface BackHandlerRegistration {
  id: string;
  priority: number;
  handler: () => boolean; // Returns true if back action was handled (e.g. closed modal)
}

interface NavigationContextType {
  currentTab: string;
  history: string[];
  navigateTo: (tab: string, replace?: boolean) => void;
  goBack: () => boolean;
  registerBackHandler: (id: string, handler: () => boolean, priority?: number) => () => void;
  isExitPromptVisible: boolean;
}

const NavigationContext = createContext<NavigationContextType | undefined>(undefined);

export const NavigationProvider: React.FC<{ children: React.ReactNode; initialTab?: string }> = ({
  children,
  initialTab = 'dashboard',
}) => {
  const [currentTab, setCurrentTab] = useState<string>(initialTab);
  const [history, setHistory] = useState<string[]>([initialTab]);
  const [isExitPromptVisible, setIsExitPromptVisible] = useState<boolean>(false);

  // Stack of active back handlers (modals, drawers, bottom sheets)
  const backHandlersRef = useRef<BackHandlerRegistration[]>([]);
  const lastBackPressTimeRef = useRef<number>(0);
  const exitPromptTimerRef = useRef<any>(null);

  /**
   * Register a modal/sheet/drawer dismiss handler for the Android back button.
   * Priority: higher number means evaluated first (e.g., nested dialog = 100, drawer = 50).
   */
  const registerBackHandler = useCallback((id: string, handler: () => boolean, priority: number = 50) => {
    // Remove any existing handler with same ID
    backHandlersRef.current = backHandlersRef.current.filter((item) => item.id !== id);
    backHandlersRef.current.push({ id, priority, handler });

    // Return unregister callback
    return () => {
      backHandlersRef.current = backHandlersRef.current.filter((item) => item.id !== id);
    };
  }, []);

  /**
   * Navigate to a screen tab while keeping history
   */
  const navigateTo = useCallback((tab: string, replace: boolean = false) => {
    NativeService.hapticTap();
    setCurrentTab((prevTab) => {
      if (prevTab === tab) return prevTab;

      setHistory((prevHistory) => {
        if (replace) {
          const newHistory = [...prevHistory];
          newHistory[newHistory.length - 1] = tab;
          return newHistory;
        } else {
          // Avoid pushing same tab repeatedly
          if (prevHistory[prevHistory.length - 1] === tab) return prevHistory;
          // If navigating back to root dashboard, reset stack to root
          if (tab === 'dashboard') {
            return ['dashboard'];
          }
          return [...prevHistory, tab];
        }
      });

      return tab;
    });
  }, []);

  /**
   * Go back in navigation stack
   */
  const goBack = useCallback((): boolean => {
    // 1. Check if any modal / drawer handler is active
    if (backHandlersRef.current.length > 0) {
      // Sort by priority descending
      const sorted = [...backHandlersRef.current].sort((a, b) => b.priority - a.priority);
      for (const item of sorted) {
        try {
          const handled = item.handler();
          if (handled) {
            NativeService.hapticTap();
            return true;
          }
        } catch (e) {
          console.warn(`[NavigationContext] Error in back handler ${item.id}:`, e);
        }
      }
    }

    // 2. Check tab history stack
    if (history.length > 1) {
      const newHistory = [...history];
      newHistory.pop(); // Remove current
      const prevTab = newHistory[newHistory.length - 1] || 'dashboard';
      setHistory(newHistory);
      setCurrentTab(prevTab);
      NativeService.hapticTap();
      return true;
    }

    // 3. User is at root ('dashboard')
    const now = Date.now();
    if (now - lastBackPressTimeRef.current < 2000) {
      // Second back press within 2 seconds: exit app
      NativeService.hapticMedium();
      if (Capacitor.isNativePlatform()) {
        CapApp.exitApp();
      }
      return true;
    } else {
      // First back press at root: show "Press back again to exit" toast
      lastBackPressTimeRef.current = now;
      NativeService.hapticTap();
      setIsExitPromptVisible(true);

      if (exitPromptTimerRef.current) clearTimeout(exitPromptTimerRef.current);
      exitPromptTimerRef.current = setTimeout(() => {
        setIsExitPromptVisible(false);
      }, 2000);
      return false;
    }
  }, [history]);

  // Unified Android Back Button Listener via Capacitor App plugin
  useEffect(() => {
    let listenerHandle: any = null;

    const setupListener = async () => {
      try {
        listenerHandle = await CapApp.addListener('backButton', () => {
          goBack();
        });
      } catch (err) {
        console.warn('[NavigationContext] Could not attach Capacitor backButton listener:', err);
      }
    };

    setupListener();

    return () => {
      if (listenerHandle && typeof listenerHandle.remove === 'function') {
        listenerHandle.remove();
      }
      if (exitPromptTimerRef.current) {
        clearTimeout(exitPromptTimerRef.current);
      }
    };
  }, [goBack]);

  return (
    <NavigationContext.Provider
      value={{
        currentTab,
        history,
        navigateTo,
        goBack,
        registerBackHandler,
        isExitPromptVisible,
      }}
    >
      {children}

      {/* Native Android "Press back again to exit" Toast notification */}
      {isExitPromptVisible && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 pointer-events-none animate-fade-in">
          <div className="bg-[#1A2420]/95 backdrop-blur-md text-white px-5 py-2.5 rounded-full shadow-2xl border border-white/10 text-xs font-medium flex items-center space-x-2">
            <span className="w-2 h-2 rounded-full bg-[#D4AF37] animate-ping" />
            <span>Press back again to exit</span>
          </div>
        </div>
      )}
    </NavigationContext.Provider>
  );
};

export const useNavigation = (): NavigationContextType => {
  const context = useContext(NavigationContext);
  if (!context) {
    throw new Error('useNavigation must be used within a NavigationProvider');
  }
  return context;
};
