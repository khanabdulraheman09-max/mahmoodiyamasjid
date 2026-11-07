import React, { useState, useEffect } from 'react';
import { useSync } from '../context/SyncContext';
import { useNavigation } from '../context/NavigationContext';
import { NativeService } from '../services/nativeService';
import { Wifi, WifiOff, RefreshCw, CheckCircle2, AlertTriangle, CloudUpload, X } from 'lucide-react';

export const SyncStatusBadge: React.FC = () => {
  const {
    isOnline,
    isSyncing,
    pendingCount,
    lastSyncMessage,
    error,
    triggerSync,
    formatLastSyncTime,
  } = useSync();

  const { registerBackHandler } = useNavigation();
  const [modalOpen, setModalOpen] = useState(false);

  // Close sync status modal on Android back button
  useEffect(() => {
    if (!modalOpen) return;
    return registerBackHandler(
      'sync_status_modal',
      () => {
        setModalOpen(false);
        return true;
      },
      80
    );
  }, [modalOpen, registerBackHandler]);

  return (
    <>
      {/* Compact Header Pill */}
      <button
        type="button"
        onClick={() => setModalOpen(true)}
        className={`flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold border transition-all active:scale-95 shadow-sm ${
          !isOnline
            ? 'bg-amber-500/20 text-amber-200 border-amber-400/40'
            : isSyncing
            ? 'bg-blue-500/20 text-blue-200 border-blue-400/40 animate-pulse'
            : pendingCount > 0
            ? 'bg-emerald-500/25 text-[#D4AF37] border-[#D4AF37]/50'
            : 'bg-emerald-600/25 text-emerald-100 border-emerald-400/30 hover:bg-emerald-600/40'
        }`}
        title="Network & Offline Synchronization Status"
      >
        {!isOnline ? (
          <>
            <WifiOff className="w-3.5 h-3.5 text-amber-300" />
            <span className="hidden sm:inline">Offline</span>
            {pendingCount > 0 && (
              <span className="bg-amber-400 text-gray-900 rounded-full px-1.5 py-0.2 text-[9px] font-black">
                {pendingCount}
              </span>
            )}
          </>
        ) : isSyncing ? (
          <>
            <RefreshCw className="w-3.5 h-3.5 text-blue-300 animate-spin" />
            <span className="hidden sm:inline">Syncing</span>
          </>
        ) : pendingCount > 0 ? (
          <>
            <CloudUpload className="w-3.5 h-3.5 text-[#D4AF37]" />
            <span className="hidden sm:inline">{pendingCount} Pending</span>
          </>
        ) : (
          <>
            <Wifi className="w-3.5 h-3.5 text-emerald-300" />
            <span className="hidden sm:inline">Online</span>
          </>
        )}
      </button>

      {/* Sync Status Details Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border-2 border-[#D4AF37]/50 text-gray-800 space-y-4 animate-scale-up">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <div className="flex items-center space-x-2">
                <div
                  className={`p-2 rounded-xl ${
                    isOnline ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
                  }`}
                >
                  {isOnline ? <Wifi className="w-5 h-5" /> : <WifiOff className="w-5 h-5" />}
                </div>
                <div>
                  <h3 className="text-sm font-bold text-gray-900">Offline & Sync Status</h3>
                  <p className="text-[11px] text-gray-500">Masjid Mehmoodiya Local Engine</p>
                </div>
              </div>
              <button
                onClick={() => setModalOpen(false)}
                className="p-1 rounded-full text-gray-400 hover:text-gray-600 bg-gray-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Status Information Cards */}
            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-2xl border border-gray-100">
                <span className="text-gray-500 font-medium">Connectivity:</span>
                <span
                  className={`font-bold flex items-center space-x-1 ${
                    isOnline ? 'text-emerald-700' : 'text-amber-700'
                  }`}
                >
                  {isOnline ? (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Connected (Internet Active)</span>
                    </>
                  ) : (
                    <>
                      <AlertTriangle className="w-3.5 h-3.5" />
                      <span>Offline (Local Database Active)</span>
                    </>
                  )}
                </span>
              </div>

              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-2xl border border-gray-100">
                <span className="text-gray-500 font-medium">Pending Offline Queue:</span>
                <span className="font-bold text-gray-900">
                  {pendingCount === 0 ? '0 changes' : `${pendingCount} changes waiting to sync`}
                </span>
              </div>

              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-2xl border border-gray-100">
                <span className="text-gray-500 font-medium">Last Synchronized:</span>
                <span className="font-bold text-gray-900">{formatLastSyncTime()}</span>
              </div>

              {lastSyncMessage && (
                <div className="p-3 bg-emerald-50 rounded-2xl border border-emerald-200 text-emerald-800 text-[11px]">
                  {lastSyncMessage}
                </div>
              )}

              {error && (
                <div className="p-3 bg-red-50 rounded-2xl border border-red-200 text-red-700 text-[11px]">
                  {error}
                </div>
              )}
            </div>

            {/* Sync Now Action */}
            <div className="pt-1">
              <button
                type="button"
                onClick={async () => {
                  await triggerSync();
                }}
                disabled={isSyncing}
                className="w-full py-3 px-4 bg-[#075B3A] hover:bg-[#043A25] text-white rounded-2xl text-xs font-bold transition-all shadow-md flex items-center justify-center space-x-2 disabled:opacity-50 active:scale-[0.98]"
              >
                <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
                <span>{isSyncing ? 'Synchronizing Records...' : 'Synchronize Now'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
