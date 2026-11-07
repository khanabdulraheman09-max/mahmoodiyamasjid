import React, { createContext, useContext, useState, useEffect } from 'react';
import { syncEngine, SyncStatus } from '../services/syncEngine';
import { dbService } from '../services/databaseService';

interface SyncContextType extends SyncStatus {
  triggerSync: () => Promise<boolean>;
  formatLastSyncTime: () => string;
}

const SyncContext = createContext<SyncContextType>({} as SyncContextType);

export const SyncProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [status, setStatus] = useState<SyncStatus>(syncEngine.getStatus());

  useEffect(() => {
    // 1. Initialize local SQLite / database
    dbService.init().then(() => {
      // 2. Initialize sync engine once DB is ready
      syncEngine.init();
    });

    // 3. Subscribe to real-time sync updates
    const unsubscribe = syncEngine.subscribe((newStatus) => {
      setStatus(newStatus);
    });

    return () => unsubscribe();
  }, []);

  const triggerSync = async () => {
    return await syncEngine.triggerSync('user_manual');
  };

  const formatLastSyncTime = (): string => {
    if (!status.lastSyncTime) return 'Never synced';
    const diffSec = Math.floor((Date.now() - status.lastSyncTime) / 1000);
    if (diffSec < 60) return 'Just now';
    const diffMin = Math.floor(diffSec / 60);
    if (diffMin < 60) return `${diffMin}m ago`;
    const diffHr = Math.floor(diffMin / 60);
    if (diffHr < 24) return `${diffHr}h ago`;
    return new Date(status.lastSyncTime).toLocaleDateString('en-IN', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <SyncContext.Provider
      value={{
        ...status,
        triggerSync,
        formatLastSyncTime,
      }}
    >
      {children}
    </SyncContext.Provider>
  );
};

export const useSync = () => useContext(SyncContext);
