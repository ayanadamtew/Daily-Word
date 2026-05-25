import { create } from 'zustand';

const useAppStore = create((set, get) => ({
  // User state
  user: null,
  profile: null,
  setUser: (user) => set({ user }),
  setProfile: (profile) => set({ profile }),

  // Entry state
  todayEntry: null,
  recentEntries: [],
  setTodayEntry: (entry) => set({ todayEntry: entry }),
  setRecentEntries: (entries) => set({ recentEntries: entries }),

  // UI state
  loading: false,
  setLoading: (loading) => set({ loading }),

  activeModal: null,
  openModal: (modal) => set({ activeModal: modal }),
  closeModal: () => set({ activeModal: null }),

  // Entry flow
  entryMode: null, // 'read' | 'skip' | null
  setEntryMode: (mode) => set({ entryMode: mode }),
  resetEntryMode: () => set({ entryMode: null }),

  // Selected passage (for prefilling from suggestions)
  selectedPassage: null,
  setSelectedPassage: (passage) => set({ selectedPassage: passage }),
  clearSelectedPassage: () => set({ selectedPassage: null }),

  // Notification permission
  notificationPermission: 'default',
  setNotificationPermission: (perm) => set({ notificationPermission: perm }),

  // Streak
  currentStreak: 0,
  longestStreak: 0,
  setStreaks: (current, longest) => set({ currentStreak: current, longestStreak: longest }),
}));

export default useAppStore;
