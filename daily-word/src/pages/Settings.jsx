import React, { useState } from 'react';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import { useAuth } from '../hooks/useAuth';
import { useNotifications } from '../hooks/useNotifications';
import useAppStore from '../store/appStore';
import { useEntries } from '../hooks/useEntries';
import { jsPDF } from 'jspdf';

const BIBLE_VERSIONS = ['NIV', 'KJV', 'ESV', 'NLT'];

export default function Settings() {
  const { profile, updateProfile, uploadAvatar, signOut, deleteAccount } = useAuth();
  const { requestPermission, subscribeToPush, scheduleReminder } = useNotifications();
  const { fetchAllEntries } = useEntries();
  const { user } = useAppStore();

  const [name, setName] = useState(profile?.name || '');
  const [church, setChurch] = useState(profile?.church || '');
  const [bibleVersion, setBibleVersion] = useState(profile?.bible_version || 'NIV');
  const [isPublic, setIsPublic] = useState(profile?.is_public || false);
  const [reminderTime, setReminderTime] = useState(profile?.reminder_time || '08:00');
  const [saving, setSaving] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [exporting, setExporting] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    await updateProfile({
      name, church,
      bible_version: bibleVersion,
      is_public: isPublic,
      reminder_time: reminderTime,
    });
    setSaving(false);
  };

  const handleAvatarChange = async (e) => {
    const file = e.target.files?.[0];
    if (file) {
      await uploadAvatar(file);
    }
  };

  const handleEnableNotifications = async () => {
    const perm = await requestPermission();
    if (perm === 'granted') {
      await subscribeToPush();
      await scheduleReminder(reminderTime);
    }
  };

  const handleExportPDF = async () => {
    setExporting(true);
    try {
      const entries = await fetchAllEntries({ limit: 5000 });
      const doc = new jsPDF();
      let y = 20;

      // Title
      doc.setFontSize(20);
      doc.setFont('helvetica', 'bold');
      doc.text('Daily Word — Journal Export', 20, y);
      y += 10;
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text(`Exported on ${new Date().toLocaleDateString('en-US', { dateStyle: 'long' })}`, 20, y);
      doc.text(`${entries.length} entries`, 20, y + 5);
      y += 15;

      doc.setDrawColor(200);
      doc.line(20, y, 190, y);
      y += 8;

      entries.forEach((entry) => {
        if (y > 270) {
          doc.addPage();
          y = 20;
        }

        const date = new Date(entry.date + 'T00:00:00').toLocaleDateString('en-US', { dateStyle: 'long' });

        doc.setFontSize(11);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(entry.type === 'read' ? 34 : 180, entry.type === 'read' ? 139 : 130, entry.type === 'read' ? 34 : 0);
        doc.text(`${entry.type === 'read' ? '📖' : '⏭️'} ${date}`, 20, y);
        y += 6;

        doc.setFont('helvetica', 'normal');
        doc.setTextColor(60);
        if (entry.type === 'read') {
          doc.setFontSize(10);
          doc.text(`${entry.book} ${entry.chapter}${entry.verse ? ':' + entry.verse : ''}`, 25, y);
          y += 5;
          if (entry.notes) {
            doc.setFontSize(9);
            doc.setTextColor(100);
            const lines = doc.splitTextToSize(`"${entry.notes}"`, 160);
            doc.text(lines, 25, y);
            y += lines.length * 4.5;
          }
        } else {
          doc.setFontSize(10);
          doc.text(`Reason: ${entry.skip_reason || 'No reason'}`, 25, y);
          y += 5;
        }
        y += 4;
      });

      doc.save('daily-word-journal.pdf');
    } catch (error) {
      console.error('PDF export failed:', error);
    }
    setExporting(false);
  };

  const handleDelete = async () => {
    await deleteAccount();
    setShowDeleteModal(false);
  };

  return (
    <div className="space-y-5 animate-fade-in">
      <div>
        <h2 className="text-xl font-bold text-surface-50">⚙️ Settings</h2>
        <p className="text-sm text-surface-400 mt-1">Customize your experience</p>
      </div>

      {/* Profile */}
      <Card>
        <h3 className="text-sm font-semibold text-surface-300 mb-4">Profile</h3>

        {/* Avatar */}
        <div className="flex items-center gap-4 mb-4">
          <label className="cursor-pointer group">
            {profile?.avatar_url ? (
              <img src={profile.avatar_url} alt="" className="w-16 h-16 rounded-full object-cover group-hover:ring-2 ring-brand-500 transition-all" />
            ) : (
              <div className="w-16 h-16 rounded-full gradient-brand flex items-center justify-center text-surface-950 text-xl font-bold group-hover:ring-2 ring-brand-500 transition-all">
                {name ? name.charAt(0).toUpperCase() : '?'}
              </div>
            )}
            <input type="file" accept="image/*" onChange={handleAvatarChange} className="hidden" />
          </label>
          <div>
            <p className="text-sm font-medium text-surface-200">Profile Photo</p>
            <p className="text-xs text-surface-500">Tap to change</p>
          </div>
        </div>

        <div className="space-y-3">
          <div>
            <label className="block text-xs text-surface-400 mb-1">Name</label>
            <input
              value={name} onChange={(e) => setName(e.target.value)}
              className="w-full bg-surface-800 border border-surface-700 rounded-xl px-4 py-2.5 text-sm text-surface-50 focus:outline-none focus:border-brand-500 transition-colors"
              id="settings-name"
            />
          </div>
          <div>
            <label className="block text-xs text-surface-400 mb-1">Church</label>
            <input
              value={church} onChange={(e) => setChurch(e.target.value)}
              placeholder="Your church name"
              className="w-full bg-surface-800 border border-surface-700 rounded-xl px-4 py-2.5 text-sm text-surface-50 placeholder-surface-500 focus:outline-none focus:border-brand-500 transition-colors"
              id="settings-church"
            />
          </div>
        </div>
      </Card>

      {/* Preferences */}
      <Card>
        <h3 className="text-sm font-semibold text-surface-300 mb-4">Preferences</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-xs text-surface-400 mb-1">Bible Version</label>
            <div className="flex gap-2">
              {BIBLE_VERSIONS.map(v => (
                <button
                  key={v}
                  onClick={() => setBibleVersion(v)}
                  className={`
                    flex-1 py-2 rounded-xl text-sm font-medium transition-all duration-200
                    ${bibleVersion === v ? 'gradient-brand text-surface-950' : 'glass-light text-surface-300'}
                  `}
                >
                  {v}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-surface-200">Public Recaps</p>
              <p className="text-xs text-surface-500">Share monthly recaps in Explore</p>
            </div>
            <button
              onClick={() => setIsPublic(!isPublic)}
              className={`
                w-12 h-6 rounded-full transition-all duration-200 relative
                ${isPublic ? 'bg-brand-500' : 'bg-surface-700'}
              `}
            >
              <span className={`
                absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all duration-200
                ${isPublic ? 'left-6' : 'left-0.5'}
              `} />
            </button>
          </div>
        </div>
      </Card>

      {/* Notifications */}
      <Card>
        <h3 className="text-sm font-semibold text-surface-300 mb-4">🔔 Daily Reminder</h3>
        <div className="space-y-3">
          <div>
            <label className="block text-xs text-surface-400 mb-1">Reminder Time</label>
            <input
              type="time"
              value={reminderTime}
              onChange={(e) => setReminderTime(e.target.value)}
              className="w-full bg-surface-800 border border-surface-700 rounded-xl px-4 py-2.5 text-sm text-surface-50 focus:outline-none focus:border-brand-500 transition-colors"
              id="settings-reminder-time"
            />
          </div>
          <Button variant="outline" size="md" className="w-full" onClick={handleEnableNotifications}>
            Enable Push Notifications
          </Button>
        </div>
      </Card>

      {/* Save */}
      <Button variant="primary" size="lg" className="w-full" onClick={handleSave} loading={saving} id="save-settings-btn">
        Save Changes
      </Button>

      {/* Export */}
      <Card>
        <h3 className="text-sm font-semibold text-surface-300 mb-3">📤 Export</h3>
        <Button variant="secondary" size="md" className="w-full" onClick={handleExportPDF} loading={exporting}>
          📄 Export Journal as PDF
        </Button>
      </Card>

      {/* Account */}
      <Card>
        <h3 className="text-sm font-semibold text-surface-300 mb-3">Account</h3>
        <div className="space-y-2">
          <p className="text-xs text-surface-500">{user?.email}</p>
          <Button variant="ghost" size="md" className="w-full" onClick={signOut}>
            Logout
          </Button>
          <Button variant="danger" size="md" className="w-full" onClick={() => setShowDeleteModal(true)}>
            Delete Account
          </Button>
        </div>
      </Card>

      {/* Delete confirmation modal */}
      <Modal isOpen={showDeleteModal} onClose={() => setShowDeleteModal(false)} title="Delete Account">
        <div className="space-y-4">
          <p className="text-sm text-surface-300">
            This will permanently delete your account and all your journal entries. This action cannot be undone.
          </p>
          <div className="flex gap-2">
            <Button variant="secondary" size="md" className="flex-1" onClick={() => setShowDeleteModal(false)}>
              Cancel
            </Button>
            <Button variant="danger" size="md" className="flex-1" onClick={handleDelete}>
              Delete Forever
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
