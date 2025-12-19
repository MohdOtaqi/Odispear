import React, { useState, useCallback, useRef } from 'react';
import {
  X, Camera, Save, User, Mail, Hash, Calendar,
  Shield, AlertCircle
} from 'lucide-react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Textarea } from '../ui/Textarea';
import { useAuthStore } from '../../store/authStore';
import api from '../../lib/api';
import toast from 'react-hot-toast';

interface ProfileEditorProps {
  isOpen: boolean;
  onClose: () => void;
}

interface ProfileData {
  username: string;
  display_name: string;
  email: string;
  bio: string;
  status_text: string;
  avatar_url?: string;
  banner_url?: string;
}

export const ProfileEditor: React.FC<ProfileEditorProps> = ({ isOpen, onClose }) => {
  const { user, updateUser } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [profileData, setProfileData] = useState<ProfileData>({
    username: user?.username || '',
    display_name: user?.display_name || '',
    email: user?.email || '',
    bio: user?.bio || '',
    status_text: user?.status_text || '',
    avatar_url: user?.avatar_url,
    banner_url: user?.banner_url,
  });

  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [bannerPreview, setBannerPreview] = useState<string | null>(null);
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const bannerInputRef = useRef<HTMLInputElement>(null);

  // Handle avatar upload
  const handleAvatarChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Avatar must be less than 5MB');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setAvatarPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  }, []);

  // Handle banner upload
  const handleBannerChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      toast.error('Banner must be less than 10MB');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setBannerPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  }, []);

  // Upload image to server
  const uploadImage = useCallback(async (file: File, type: 'avatar' | 'banner') => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('type', type);

    try {
      const { data } = await api.post('/users/upload-image', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      return data.url;
    } catch (error) {
      throw new Error(`Failed to upload ${type}`);
    }
  }, []);

  // Save profile changes
  const handleSave = useCallback(async () => {
    setLoading(true);

    try {
      const updates: any = {
        display_name: profileData.display_name,
        bio: profileData.bio,
        status_text: profileData.status_text,
      };

      // Upload avatar if changed
      if (avatarPreview && avatarInputRef.current?.files?.[0]) {
        const avatarUrl = await uploadImage(avatarInputRef.current.files[0], 'avatar');
        updates.avatar_url = avatarUrl;
      }

      // Upload banner if changed
      if (bannerPreview && bannerInputRef.current?.files?.[0]) {
        const bannerUrl = await uploadImage(bannerInputRef.current.files[0], 'banner');
        updates.banner_url = bannerUrl;
      }

      // Update profile
      const { data } = await api.patch('/users/profile', updates);
      updateUser(data);

      toast.success('Profile updated successfully');
      onClose();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  }, [profileData, avatarPreview, bannerPreview, updateUser, uploadImage, onClose]);

  // Change password
  const [showPasswordChange, setShowPasswordChange] = useState(false);
  const [passwordData, setPasswordData] = useState({
    current: '',
    new: '',
    confirm: ''
  });

  const handlePasswordChange = useCallback(async () => {
    if (passwordData.new !== passwordData.confirm) {
      toast.error('Passwords do not match');
      return;
    }

    if (passwordData.new.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    setLoading(true);
    try {
      await api.post('/users/change-password', {
        currentPassword: passwordData.current,
        newPassword: passwordData.new
      });

      toast.success('Password changed successfully');
      setPasswordData({ current: '', new: '', confirm: '' });
      setShowPasswordChange(false);
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to change password');
    } finally {
      setLoading(false);
    }
  }, [passwordData]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in"
      onClick={onClose}
    >
      <div
        className="w-full max-w-3xl max-h-[90vh] bg-mot-surface-subtle rounded-2xl shadow-2xl border border-mot-border overflow-hidden animate-scale-in flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Banner - Fixed height, doesn't scroll */}
        <div className="relative h-32 bg-gradient-to-r from-mot-gold-deep via-mot-gold to-mot-gold-light overflow-hidden flex-shrink-0">
          {(bannerPreview || profileData.banner_url) && (
            <img
              src={bannerPreview || profileData.banner_url}
              alt="Banner"
              className="absolute inset-0 w-full h-full object-cover"
            />
          )}
          <input
            ref={bannerInputRef}
            type="file"
            accept="image/*"
            onChange={handleBannerChange}
            className="hidden"
          />
          <button
            onClick={() => bannerInputRef.current?.click()}
            className="absolute top-4 right-4 p-2 bg-black/50 text-white hover:bg-black/70 rounded-lg transition-all backdrop-blur-sm"
          >
            <Camera className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
          {/* Header with Avatar */}
          <div className="flex items-start justify-between -mt-12 mb-8">
            <div className="flex items-end gap-4">
              <div className="relative">
                <div className="w-24 h-24 rounded-full bg-mot-surface border-4 border-mot-surface-subtle overflow-hidden">
                  {(avatarPreview || profileData.avatar_url) ? (
                    <img
                      src={avatarPreview || profileData.avatar_url}
                      alt="Avatar"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-mot-gold to-mot-gold-deep">
                      <User className="w-12 h-12 text-white" />
                    </div>
                  )}
                </div>
                <input
                  ref={avatarInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarChange}
                  className="hidden"
                />
                <button
                  onClick={() => avatarInputRef.current?.click()}
                  className="absolute bottom-0 right-0 p-1.5 bg-mot-gold text-mot-black hover:bg-mot-gold-light rounded-full transition-all"
                >
                  <Camera className="w-4 h-4" />
                </button>
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white">Edit Profile</h2>
                <p className="text-sm text-gray-400">@{user?.username}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-mot-gold hover:bg-mot-gold/10 rounded-lg transition-all"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Form */}
          <div className="space-y-6">
            {/* Display Name */}
            <div>
              <label className="block text-sm font-semibold text-gray-300 mb-2">
                Display Name
              </label>
              <Input
                value={profileData.display_name}
                onChange={(e) => setProfileData(prev => ({ ...prev, display_name: e.target.value }))}
                placeholder="How should we call you?"
                maxLength={32}
              />
              <p className="mt-1 text-xs text-gray-500">
                {profileData.display_name.length}/32 characters
              </p>
            </div>

            {/* Bio */}
            <div>
              <label className="block text-sm font-semibold text-gray-300 mb-2">
                About Me
              </label>
              <Textarea
                value={profileData.bio}
                onChange={(e) => setProfileData(prev => ({ ...prev, bio: e.target.value }))}
                placeholder="Tell us about yourself"
                rows={3}
                maxLength={190}
              />
              <p className="mt-1 text-xs text-gray-500">
                {profileData.bio.length}/190 characters
              </p>
            </div>

            {/* Custom Status */}
            <div>
              <label className="block text-sm font-semibold text-gray-300 mb-2">
                Custom Status
              </label>
              <Input
                value={profileData.status_text}
                onChange={(e) => setProfileData(prev => ({ ...prev, status_text: e.target.value }))}
                placeholder="What are you up to?"
                maxLength={128}
              />
            </div>

            {/* Account Info */}
            <div className="pt-6 border-t border-mot-border space-y-4">
              <h3 className="text-lg font-semibold text-white">Account Information</h3>

              {/* Username (read-only) */}
              <div>
                <label className="block text-sm font-semibold text-gray-300 mb-2">
                  <Hash className="w-4 h-4 inline mr-1" />
                  Username
                </label>
                <Input
                  value={profileData.username}
                  disabled
                  className="opacity-50"
                />
                <p className="mt-1 text-xs text-gray-500">
                  Username cannot be changed
                </p>
              </div>

              {/* Email (read-only) */}
              <div>
                <label className="block text-sm font-semibold text-gray-300 mb-2">
                  <Mail className="w-4 h-4 inline mr-1" />
                  Email
                </label>
                <Input
                  value={profileData.email}
                  disabled
                  className="opacity-50"
                />
              </div>

              {/* Join Date */}
              <div>
                <label className="block text-sm font-semibold text-gray-300 mb-2">
                  <Calendar className="w-4 h-4 inline mr-1" />
                  Member Since
                </label>
                <Input
                  value={new Date(user?.created_at || Date.now()).toLocaleDateString()}
                  disabled
                  className="opacity-50"
                />
              </div>
            </div>

            {/* Security */}
            <div className="pt-6 border-t border-mot-border">
              <h3 className="text-lg font-semibold text-white mb-4">Security</h3>

              {!showPasswordChange ? (
                <Button
                  variant="secondary"
                  onClick={() => setShowPasswordChange(true)}
                  className="flex items-center gap-2"
                >
                  <Shield className="w-4 h-4" />
                  Change Password
                </Button>
              ) : (
                <div className="space-y-4 p-4 bg-mot-surface rounded-lg border border-mot-border">
                  <div>
                    <label className="block text-sm font-semibold text-gray-300 mb-2">
                      Current Password
                    </label>
                    <Input
                      type="password"
                      value={passwordData.current}
                      onChange={(e) => setPasswordData(prev => ({ ...prev, current: e.target.value }))}
                      placeholder="Enter current password"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-300 mb-2">
                      New Password
                    </label>
                    <Input
                      type="password"
                      value={passwordData.new}
                      onChange={(e) => setPasswordData(prev => ({ ...prev, new: e.target.value }))}
                      placeholder="Enter new password"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-300 mb-2">
                      Confirm New Password
                    </label>
                    <Input
                      type="password"
                      value={passwordData.confirm}
                      onChange={(e) => setPasswordData(prev => ({ ...prev, confirm: e.target.value }))}
                      placeholder="Confirm new password"
                    />
                  </div>
                  <div className="flex gap-3">
                    <Button
                      variant="primary"
                      onClick={handlePasswordChange}
                      loading={loading}
                      disabled={!passwordData.current || !passwordData.new || !passwordData.confirm}
                    >
                      Update Password
                    </Button>
                    <Button
                      variant="secondary"
                      onClick={() => {
                        setShowPasswordChange(false);
                        setPasswordData({ current: '', new: '', confirm: '' });
                      }}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="flex justify-between items-center mt-8 pt-6 border-t border-mot-border">
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <AlertCircle className="w-4 h-4" />
              <span>Changes are saved automatically</span>
            </div>
            <div className="flex gap-3">
              <Button variant="secondary" onClick={onClose}>
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={handleSave}
                loading={loading}
                className="flex items-center gap-2"
              >
                <Save className="w-4 h-4" />
                Save Changes
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileEditor;
