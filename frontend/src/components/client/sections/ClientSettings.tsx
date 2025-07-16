import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Settings, User, Building, Bell, Shield, CreditCard, Upload, Camera, Check, X } from 'lucide-react';

export const ClientSettings: React.FC = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [showPasswordChange, setShowPasswordChange] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [formData, setFormData] = useState({
    email: '',
    fullName: '',
    phone: '',
    company: '',
    address: '',
    avatarUrl: '',
    browserNotifications: true
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  // Load user settings when user is available
  useEffect(() => {
    if (user?.id) {
      loadUserSettings();
    } else if (user === null) {
      setLoading(false);
      setError('User not authenticated');
    }
  }, [user]);

  const loadUserSettings = async () => {
    try {
      setLoading(true);
      setError(null);
      
      if (!user?.id) {
        setError('User not authenticated');
        return;
      }

      // Load user data from database using existing users table
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single();

      if (userError && userError.code !== 'PGRST116') {
        console.error('Error fetching user data:', userError);
      }

      const userMetadata = (userData?.metadata || user?.metadata || {}) as any;
      const userRecord = userData as any; // Type assertion for database columns
      
      setFormData({
        email: user?.email || '',
        fullName: userRecord?.full_name || '',
        phone: userRecord?.phone || '',
        company: userRecord?.company || '',
        address: userRecord?.address || '',
        avatarUrl: userMetadata.avatarUrl || '',
        browserNotifications: userMetadata.browserNotifications ?? true
      });

    } catch (err: any) {
      console.error('Error loading user settings:', err);
      setError('Failed to load user settings');
      
      // Fallback to basic user data
      const userMetadata = user?.metadata || {};
      setFormData({
        email: user?.email || '',
        fullName: '',
        phone: '',
        company: '',
        address: '',
        avatarUrl: userMetadata.avatarUrl || '',
        browserNotifications: true
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!user?.id) {
      setError('User not authenticated');
      return;
    }

    try {
      setSaving(true);
      setError(null);
      setSuccess(null);

      // Get current metadata to preserve existing values
      const { data: currentUser } = await supabase
        .from('users')
        .select('metadata')
        .eq('id', user.id)
        .single();

      const currentMetadata = (currentUser?.metadata || {}) as Record<string, any>;

      // Update user data using existing table structure
      const { error: userError } = await supabase
        .from('users')
        .update({
          full_name: formData.fullName,
          phone: formData.phone,
          company: formData.company,
          address: formData.address,
          metadata: {
            ...currentMetadata,
            avatarUrl: formData.avatarUrl,
            browserNotifications: formData.browserNotifications
          }
        })
        .eq('id', user.id);

      if (userError) {
        console.error('Error updating user:', userError);
        throw new Error('Failed to update profile');
      }

      setSuccess('Settings saved successfully!');
      setIsEditing(false);
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(null), 3000);

    } catch (err: any) {
      console.error('Save error:', err);
      setError(err.message || 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const handleAvatarUpload = async (file: File) => {
    if (!user?.id) {
      setError('User not authenticated');
      return;
    }

    if (file.size > 5 * 1024 * 1024) { // 5MB limit
      setError('Avatar file size must be less than 5MB');
      return;
    }

    if (!file.type.startsWith('image/')) {
      setError('Please upload an image file');
      return;
    }

    try {
      setUploadingAvatar(true);
      setError(null);

      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/avatar.${fileExt}`;

      // Upload to Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, file, { upsert: true });

      if (uploadError) {
        console.warn('Supabase Storage upload failed, using fallback:', uploadError);
        
        // For demo purposes, create a local object URL and save to metadata
        const avatarUrl = URL.createObjectURL(file);
        setFormData(prev => ({ ...prev, avatarUrl }));
        
        // Save fallback avatar URL to user metadata
        try {
          const { data: currentUser } = await supabase
            .from('users')
            .select('metadata')
            .eq('id', user.id)
            .single();

          const currentMetadata = (currentUser?.metadata || {}) as Record<string, any>;
          
          await supabase
            .from('users')
            .update({
              metadata: {
                ...currentMetadata,
                avatarUrl: avatarUrl,
                avatarFallback: true // Mark as fallback URL
              }
            })
            .eq('id', user.id);
            
          setSuccess('Avatar uploaded successfully! (Using local storage until bucket is created)');
          setTimeout(() => setSuccess(null), 5000);
        } catch (metadataError) {
          console.warn('Failed to save avatar to metadata:', metadataError);
          setSuccess('Avatar preview updated! (Create avatars bucket for persistent storage)');
          setTimeout(() => setSuccess(null), 5000);
        }
        return;
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName);

      if (urlData?.publicUrl) {
        setFormData(prev => ({ ...prev, avatarUrl: urlData.publicUrl }));
        
        // Save avatar URL to user metadata immediately
        const { data: currentUser } = await supabase
          .from('users')
          .select('metadata')
          .eq('id', user.id)
          .single();

        const currentMetadata = (currentUser?.metadata || {}) as Record<string, any>;
        
        await supabase
          .from('users')
          .update({
            metadata: {
              ...currentMetadata,
              avatarUrl: urlData.publicUrl
            }
          })
          .eq('id', user.id);
        
        setSuccess('Avatar uploaded successfully!');
        setTimeout(() => setSuccess(null), 3000);
      }

    } catch (err: any) {
      console.error('Avatar upload error:', err);
      setError('Failed to upload avatar');
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handlePasswordChange = async () => {
    if (!passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword) {
      setError('Please fill in all password fields');
      return;
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setError('New passwords do not match');
      return;
    }

    if (passwordData.newPassword.length < 8) {
      setError('New password must be at least 8 characters long');
      return;
    }

    try {
      setSaving(true);
      setError(null);

      const { error } = await supabase.auth.updateUser({
        password: passwordData.newPassword
      });

      if (error) {
        throw error;
      }

      setSuccess('Password changed successfully!');
      setShowPasswordChange(false);
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
      
      setTimeout(() => setSuccess(null), 3000);

    } catch (err: any) {
      console.error('Password change error:', err);
      setError(err.message || 'Failed to change password');
    } finally {
      setSaving(false);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleAvatarUpload(file);
    }
  };

  const handleNotificationToggle = async () => {
    if (!user?.id) {
      setError('User not authenticated');
      return;
    }

    const newValue = !formData.browserNotifications;
    
    // Update local state immediately
    setFormData(prev => ({ ...prev, browserNotifications: newValue }));

    try {
      // Get current metadata to preserve existing values
      const { data: currentUser } = await supabase
        .from('users')
        .select('metadata')
        .eq('id', user.id)
        .single();

      const currentMetadata = (currentUser?.metadata || {}) as Record<string, any>;

      // Save notification preference immediately
      const { error: updateError } = await supabase
        .from('users')
        .update({
          metadata: {
            ...currentMetadata,
            browserNotifications: newValue
          }
        })
        .eq('id', user.id);

      if (updateError) {
        console.error('Error updating notification preference:', updateError);
        // Revert local state if save failed
        setFormData(prev => ({ ...prev, browserNotifications: !newValue }));
        setError('Failed to save notification preference');
      } else {
        setSuccess(`Browser notifications ${newValue ? 'enabled' : 'disabled'}!`);
        setTimeout(() => setSuccess(null), 2000);
      }

    } catch (err: any) {
      console.error('Notification toggle error:', err);
      // Revert local state if save failed
      setFormData(prev => ({ ...prev, browserNotifications: !newValue }));
      setError('Failed to save notification preference');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="text-lg text-gray-600 mb-2">Loading settings...</div>
          <div className="text-sm text-gray-500">Fetching your account preferences</div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {error && (
        <Alert className="border-red-200 bg-red-50">
          <X className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-700">
            {error}
          </AlertDescription>
        </Alert>
      )}
      
      {success && (
        <Alert className="border-green-200 bg-green-50">
          <Check className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-700">
            {success}
          </AlertDescription>
        </Alert>
      )}
      {/* Header */}
      <div className="bg-gradient-to-r from-gray-50 to-slate-50 p-6 rounded-lg">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 bg-gray-600 rounded-lg flex items-center justify-center">
            <Settings className="h-6 w-6 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Account Settings</h2>
            <p className="text-gray-600">Manage your account and business preferences</p>
          </div>
        </div>
      </div>

      {/* Profile Settings */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center space-x-2">
              <User className="h-5 w-5" />
              <span>Profile Information</span>
            </CardTitle>
            <CardDescription>
              Update your personal information and contact details
            </CardDescription>
          </div>
          <Button 
            variant={isEditing ? "default" : "outline"}
            onClick={() => isEditing ? handleSave() : setIsEditing(true)}
            disabled={saving || uploadingAvatar}
          >
            {saving ? 'Saving...' : isEditing ? 'Save Changes' : 'Edit Profile'}
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Avatar Upload */}
          <div className="flex items-center space-x-4">
            <div className="relative">
              <div className="w-20 h-20 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
                {formData.avatarUrl ? (
                  <img 
                    src={formData.avatarUrl} 
                    alt="Profile" 
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <User className="h-8 w-8 text-gray-400" />
                )}
              </div>
              {isEditing && (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadingAvatar}
                  className="absolute -bottom-1 -right-1 bg-green-600 hover:bg-green-700 text-white rounded-full p-2 shadow-lg transition-colors"
                >
                  {uploadingAvatar ? (
                    <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
                  ) : (
                    <Camera className="h-4 w-4" />
                  )}
                </button>
              )}
            </div>
            <div>
              <p className="font-medium text-gray-900">Profile Picture</p>
              <p className="text-sm text-gray-500">
                {isEditing ? 'Click the camera icon to upload a new photo' : 'Your profile photo'}
              </p>
              {isEditing && (
                <p className="text-xs text-gray-400 mt-1">
                  Recommended: Square image, max 5MB (JPG, PNG)
                </p>
              )}
            </div>
          </div>

          {/* Hidden file input */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileInputChange}
            className="hidden"
          />

          <div>
            <Label htmlFor="fullName">Full Name</Label>
            <Input
              id="fullName"
              value={formData.fullName}
              onChange={(e) => setFormData({...formData, fullName: e.target.value})}
              disabled={!isEditing}
              placeholder="Enter your full name"
            />
          </div>
          <div>
            <Label htmlFor="email">Email Address</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({...formData, email: e.target.value})}
              disabled={!isEditing}
            />
          </div>
          <div>
            <Label htmlFor="phone">Phone Number</Label>
            <Input
              id="phone"
              value={formData.phone}
              onChange={(e) => setFormData({...formData, phone: e.target.value})}
              disabled={!isEditing}
              placeholder="(555) 123-4567"
            />
          </div>
        </CardContent>
      </Card>

      {/* Business Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Building className="h-5 w-5" />
            <span>Company Information</span>
          </CardTitle>
          <CardDescription>
            Update your company details and address
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="company">Company Name</Label>
            <Input
              id="company"
              value={formData.company}
              onChange={(e) => setFormData({...formData, company: e.target.value})}
              disabled={!isEditing}
              placeholder="Your company or business name"
            />
          </div>
          <div>
            <Label htmlFor="address">Address</Label>
            <Input
              id="address"
              value={formData.address}
              onChange={(e) => setFormData({...formData, address: e.target.value})}
              disabled={!isEditing}
              placeholder="123 Main St, City, State 12345"
            />
          </div>
        </CardContent>
      </Card>

      {/* Notification Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Bell className="h-5 w-5" />
            <span>Notification Preferences</span>
          </CardTitle>
          <CardDescription>
            Manage your browser notification preferences
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div>
              <p className="font-medium">Browser Notifications</p>
              <p className="text-sm text-gray-500">Receive notifications in your browser</p>
            </div>
            <Button 
              variant={formData.browserNotifications ? "default" : "outline"}
              size="sm"
              onClick={handleNotificationToggle}
              disabled={saving}
            >
              {saving ? 'Saving...' : formData.browserNotifications ? 'Enabled' : 'Disabled'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Security Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Shield className="h-5 w-5" />
            <span>Security & Privacy</span>
          </CardTitle>
          <CardDescription>
            Manage your account security settings
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-4 border rounded-lg">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="font-medium">Change Password</p>
                <p className="text-sm text-gray-500">Update your account password</p>
              </div>
              <Button 
                variant="outline"
                onClick={() => setShowPasswordChange(!showPasswordChange)}
              >
                {showPasswordChange ? 'Cancel' : 'Change Password'}
              </Button>
            </div>

            {showPasswordChange && (
              <div className="space-y-4 border-t pt-4">
                <div>
                  <Label htmlFor="currentPassword">Current Password</Label>
                  <Input
                    id="currentPassword"
                    type="password"
                    value={passwordData.currentPassword}
                    onChange={(e) => setPasswordData({...passwordData, currentPassword: e.target.value})}
                    placeholder="Enter current password"
                  />
                </div>
                <div>
                  <Label htmlFor="newPassword">New Password</Label>
                  <Input
                    id="newPassword"
                    type="password"
                    value={passwordData.newPassword}
                    onChange={(e) => setPasswordData({...passwordData, newPassword: e.target.value})}
                    placeholder="Enter new password (min 8 characters)"
                  />
                </div>
                <div>
                  <Label htmlFor="confirmPassword">Confirm New Password</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    value={passwordData.confirmPassword}
                    onChange={(e) => setPasswordData({...passwordData, confirmPassword: e.target.value})}
                    placeholder="Confirm new password"
                  />
                </div>
                <div className="flex space-x-2">
                  <Button 
                    onClick={handlePasswordChange}
                    disabled={saving}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    {saving ? 'Updating...' : 'Update Password'}
                  </Button>
                  <Button 
                    variant="outline"
                    onClick={() => {
                      setShowPasswordChange(false);
                      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Billing Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <CreditCard className="h-5 w-5" />
            <span>Billing & Subscription</span>
          </CardTitle>
          <CardDescription>
            Manage your subscription and payment methods
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-blue-900">Current Plan: Free Trial</p>
                <p className="text-sm text-blue-700">14 days remaining</p>
              </div>
              <Button className="bg-blue-600 hover:bg-blue-700">
                Upgrade Plan
              </Button>
            </div>
          </div>
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div>
              <p className="font-medium">Payment Method</p>
              <p className="text-sm text-gray-500">No payment method on file</p>
            </div>
            <Button variant="outline">
              Add Payment Method
            </Button>
          </div>
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div>
              <p className="font-medium">Billing History</p>
              <p className="text-sm text-gray-500">View your past invoices and payments</p>
            </div>
            <Button variant="outline">
              View History
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}; 