import React, { useState, useCallback, useRef } from 'react';
import {
  X, Camera, Save, User, Mail, Hash, Calendar,
  Shield, AlertCircle, Sparkles, Edit3, Lock, Eye, EyeOff
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
  const [showPassword, setShowPassword] = useState(false);

  // Helper to get full image URL for uploads
  const getImageUrl = (url?: string) => {
    if (!url) return undefined;
    if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('data:')) {
      return url;
    }
    const apiUrl = import.meta.env.VITE_API_URL || (import.meta.env.PROD ? 'https://n0tmot.com/api' : 'http://localhost:5000');
    return `${apiUrl}${url.startsWith('/') ? url : `/${url}`}`;
  };

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
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl max-h-[90vh] bg-gradient-to-b from-mot-surface/95 to-mot-surface-subtle/95 backdrop-blur-xl rounded-3xl shadow-2xl border border-mot-gold/20 overflow-hidden animate-scale-in flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Banner with Animated Gradient */}
        <div className="relative h-36 overflow-hidden flex-shrink-0">
          {/* Animated gradient background */}
          <div className="absolute inset-0 bg-gradient-to-r from-mot-gold via-amber-500 to-mot-gold-deep animate-gradient-x" />
          {/* Overlay pattern */}
          <div className="absolute inset-0 opacity-30 bg-[radial-gradient(circle_at_50%_120%,rgba(0,0,0,0.4),transparent_70%)]" />
          {/* Shimmer effect */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full animate-shimmer" />

          {(bannerPreview || profileData.banner_url) && (
            <img
              src={bannerPreview || getImageUrl(profileData.banner_url)}
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
            className="absolute top-4 right-4 p-2.5 bg-black/40 text-white hover:bg-mot-gold hover:text-mot-black rounded-xl transition-all duration-300 backdrop-blur-sm group"
          >
            <Camera className="w-5 h-5 group-hover:scale-110 transition-transform" />
          </button>

          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 left-4 p-2.5 bg-black/40 text-white hover:bg-red-500 rounded-xl transition-all duration-300 backdrop-blur-sm group"
          >
            <X className="w-5 h-5 group-hover:rotate-90 transition-transform duration-300" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto px-8 pb-8 custom-scrollbar">
          {/* Header with Avatar */}
          <div className="flex items-end gap-5 -mt-14 mb-8">
            {/* Avatar with glow */}
            <div className="relative group">
              <div className="absolute -inset-1 bg-gradient-to-r from-mot-gold to-amber-500 rounded-full blur-md opacity-50 group-hover:opacity-100 transition-opacity" />
              <div className="relative w-28 h-28 rounded-full bg-mot-surface border-4 border-mot-surface-subtle overflow-hidden ring-2 ring-mot-gold/50">
                {(avatarPreview || profileData.avatar_url) ? (
                  <img
                    src={avatarPreview || getImageUrl(profileData.avatar_url)}
                    alt="Avatar"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-mot-gold to-mot-gold-deep">
                    <User className="w-14 h-14 text-white" />
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
                className="absolute bottom-1 right-1 p-2 bg-mot-gold text-mot-black hover:bg-mot-gold-light rounded-full transition-all duration-300 shadow-lg hover:scale-110"
              >
                <Camera className="w-4 h-4" />
              </button>
            </div>

            {/* Title section */}
            <div className="pb-2">
              <div className="flex items-center gap-2 mb-1">
                <Sparkles className="w-5 h-5 text-mot-gold" />
                <h2 className="text-2xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
                  Edit Profile
                </h2>
              </div>
              <p className="text-sm text-gray-400 flex items-center gap-1">
                <Hash className="w-3 h-3" />
                {user?.username}
              </p>
            </div>
          </div>

          {/* Form with card sections */}
          <div className="space-y-6">
            {/* Personalization Card */}
            <div className="p-6 bg-mot-surface/50 backdrop-blur-sm rounded-2xl border border-mot-border/50 space-y-5">
              <div className="flex items-center gap-2 mb-4">
                <Edit3 className="w-5 h-5 text-mot-gold" />
                <h3 className="text-lg font-semibold text-white">Personalization</h3>
              </div>

              {/* Display Name */}
              <div className="group">
                <label className="block text-sm font-medium text-gray-400 mb-2 group-focus-within:text-mot-gold transition-colors">
                  Display Name
                </label>
                <div className="relative">
                  <Input
                    value={profileData.display_name}
                    onChange={(e) => setProfileData(prev => ({ ...prev, display_name: e.target.value }))}
                    placeholder="How should we call you?"
                    maxLength={32}
                    className="!bg-mot-surface-subtle !border-mot-border/50 focus:!border-mot-gold/50 focus:!ring-mot-gold/20 transition-all"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-500">
                    {profileData.display_name.length}/32
                  </span>
                </div>
              </div>

              {/* Bio */}
              <div className="group">
                <label className="block text-sm font-medium text-gray-400 mb-2 group-focus-within:text-mot-gold transition-colors">
                  About Me
                </label>
                <Textarea
                  value={profileData.bio}
                  onChange={(e) => setProfileData(prev => ({ ...prev, bio: e.target.value }))}
                  placeholder="Tell others about yourself..."
                  rows={3}
                  maxLength={190}
                  className="!bg-mot-surface-subtle !border-mot-border/50 focus:!border-mot-gold/50 focus:!ring-mot-gold/20 transition-all resize-none"
                />
                <p className="mt-1.5 text-xs text-gray-500 text-right">
                  {profileData.bio.length}/190 characters
                </p>
              </div>

              {/* Custom Status */}
              <div className="group">
                <label className="block text-sm font-medium text-gray-400 mb-2 group-focus-within:text-mot-gold transition-colors">
                  Custom Status
                </label>
                <Input
                  value={profileData.status_text}
                  onChange={(e) => setProfileData(prev => ({ ...prev, status_text: e.target.value }))}
                  placeholder="What are you up to? 💭"
                  maxLength={128}
                  className="!bg-mot-surface-subtle !border-mot-border/50 focus:!border-mot-gold/50 focus:!ring-mot-gold/20 transition-all"
                />
              </div>
            </div>

            {/* Account Info Card */}
            <div className="p-6 bg-mot-surface/50 backdrop-blur-sm rounded-2xl border border-mot-border/50">
              <div className="flex items-center gap-2 mb-5">
                <User className="w-5 h-5 text-mot-gold" />
                <h3 className="text-lg font-semibold text-white">Account Information</h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Username */}
                <div className="p-4 bg-mot-surface-subtle/50 rounded-xl border border-mot-border/30">
                  <div className="flex items-center gap-2 text-gray-400 mb-1">
                    <Hash className="w-4 h-4" />
                    <span className="text-xs font-medium uppercase tracking-wide">Username</span>
                  </div>
                  <p className="text-white font-medium">{profileData.username}</p>
                  <p className="text-xs text-gray-500 mt-1">Cannot be changed</p>
                </div>

                {/* Email */}
                <div className="p-4 bg-mot-surface-subtle/50 rounded-xl border border-mot-border/30">
                  <div className="flex items-center gap-2 text-gray-400 mb-1">
                    <Mail className="w-4 h-4" />
                    <span className="text-xs font-medium uppercase tracking-wide">Email</span>
                  </div>
                  <p className="text-white font-medium truncate">{profileData.email}</p>
                </div>

                {/* Member Since */}
                <div className="p-4 bg-mot-surface-subtle/50 rounded-xl border border-mot-border/30 md:col-span-2">
                  <div className="flex items-center gap-2 text-gray-400 mb-1">
                    <Calendar className="w-4 h-4" />
                    <span className="text-xs font-medium uppercase tracking-wide">Member Since</span>
                  </div>
                  <p className="text-white font-medium">
                    {new Date(user?.created_at || Date.now()).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </p>
                </div>
              </div>
            </div>

            {/* Security Card */}
            <div className="p-6 bg-mot-surface/50 backdrop-blur-sm rounded-2xl border border-mot-border/50">
              <div className="flex items-center gap-2 mb-5">
                <Shield className="w-5 h-5 text-mot-gold" />
                <h3 className="text-lg font-semibold text-white">Security</h3>
              </div>

              {!showPasswordChange ? (
                <button
                  onClick={() => setShowPasswordChange(true)}
                  className="flex items-center gap-3 w-full p-4 bg-mot-surface-subtle/50 hover:bg-mot-gold/10 rounded-xl border border-mot-border/30 hover:border-mot-gold/30 transition-all group"
                >
                  <div className="p-2 bg-mot-gold/10 rounded-lg group-hover:bg-mot-gold/20 transition-colors">
                    <Lock className="w-5 h-5 text-mot-gold" />
                  </div>
                  <div className="text-left">
                    <p className="text-white font-medium">Change Password</p>
                    <p className="text-xs text-gray-500">Update your account password</p>
                  </div>
                </button>
              ) : (
                <div className="space-y-4 p-5 bg-mot-surface-subtle/30 rounded-xl border border-mot-gold/20">
                  <div className="relative">
                    <label className="block text-sm font-medium text-gray-400 mb-2">Current Password</label>
                    <Input
                      type={showPassword ? "text" : "password"}
                      value={passwordData.current}
                      onChange={(e) => setPasswordData(prev => ({ ...prev, current: e.target.value }))}
                      placeholder="Enter current password"
                      className="!bg-mot-surface !border-mot-border/50 pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-9 text-gray-400 hover:text-mot-gold"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">New Password</label>
                    <Input
                      type={showPassword ? "text" : "password"}
                      value={passwordData.new}
                      onChange={(e) => setPasswordData(prev => ({ ...prev, new: e.target.value }))}
                      placeholder="Enter new password"
                      className="!bg-mot-surface !border-mot-border/50"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">Confirm Password</label>
                    <Input
                      type={showPassword ? "text" : "password"}
                      value={passwordData.confirm}
                      onChange={(e) => setPasswordData(prev => ({ ...prev, confirm: e.target.value }))}
                      placeholder="Confirm new password"
                      className="!bg-mot-surface !border-mot-border/50"
                    />
                  </div>
                  <div className="flex gap-3 pt-2">
                    <Button
                      variant="primary"
                      onClick={handlePasswordChange}
                      loading={loading}
                      disabled={!passwordData.current || !passwordData.new || !passwordData.confirm}
                      className="flex-1"
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
        </div>

        {/* Footer - Sticky */}
        <div className="flex-shrink-0 px-8 py-5 bg-mot-surface/80 backdrop-blur-sm border-t border-mot-border/50">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <AlertCircle className="w-4 h-4" />
              <span>Changes require saving</span>
            </div>
            <div className="flex gap-3">
              <Button
                variant="secondary"
                onClick={onClose}
                className="px-5"
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={handleSave}
                loading={loading}
                className="px-6 flex items-center gap-2 bg-gradient-to-r from-mot-gold to-amber-500 hover:from-mot-gold-light hover:to-amber-400"
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
