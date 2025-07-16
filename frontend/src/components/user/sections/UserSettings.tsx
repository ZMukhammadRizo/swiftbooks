import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { UserAvatar } from '@/components/ui/user-avatar';
import { Settings, User, Bell, Shield, Upload, Camera, Check, X } from 'lucide-react';

export const UserSettings: React.FC = () => {
  const { user, refreshUserData } = useAuth();
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
    firstName: '',
    lastName: '',
    phone: '',
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

      // Load user data from database
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single();

      if (userError && userError.code !== 'PGRST116') {
        console.error('Error fetching user data:', userError);
      }

      const userMetadata = (userData?.metadata || user?.metadata || {}) as any;
      
      setFormData({
        email: user?.email || '',
        firstName: userMetadata.firstName || '',
        lastName: userMetadata.lastName || '',
        phone: userMetadata.phone || '',
        address: userMetadata.address || '',
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
        firstName: userMetadata.firstName || '',
        lastName: userMetadata.lastName || '',
        phone: userMetadata.phone || '',
        address: userMetadata.address || '',
        avatarUrl: userMetadata.avatarUrl || '',
        browserNotifications: true
      });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handlePasswordChange = (field: string, value: string) => {
    setPasswordData(prev => ({ ...prev, [field]: value }));
  };

  const saveSettings = async () => {
    if (!user?.id) return;

    try {
      setSaving(true);
      setError(null);
      setSuccess(null);

      // Prepare metadata
      const metadata = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        phone: formData.phone,
        address: formData.address,
        avatarUrl: formData.avatarUrl,
        browserNotifications: formData.browserNotifications
      };

      // Update user metadata in database
      const { error: updateError } = await supabase
        .from('users')
        .update({ 
          metadata: metadata,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id);

      if (updateError) {
        throw updateError;
      }

      // Also update Supabase auth user metadata as backup
      try {
        const { error: authUpdateError } = await supabase.auth.updateUser({
          data: metadata
        });
        
        if (authUpdateError) {
          console.warn('⚠️ Failed to update auth metadata:', authUpdateError);
        } else {
          console.log('✅ Auth metadata updated successfully');
        }
      } catch (authErr) {
        console.warn('⚠️ Auth metadata update failed:', authErr);
      }

      setSuccess('Settings saved successfully!');
      setIsEditing(false);

      // Refresh user data to update header information
      if (refreshUserData) {
        await refreshUserData();
      }

      // Force a small delay then reload to get fresh data
      setTimeout(() => {
        loadUserSettings();
      }, 500);

    } catch (err: any) {
      console.error('Error saving settings:', err);
      setError('Failed to save settings: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleAvatarUpload = async (file: File) => {
    if (!user?.id) return;

    try {
      // Validate file
      const maxSize = 5 * 1024 * 1024; // 5MB
      if (file.size > maxSize) {
        setError('Avatar file size must be less than 5MB');
        return;
      }

      const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
      if (!validTypes.includes(file.type)) {
        setError('Please upload a valid image file (JPEG, PNG, GIF, or WebP)');
        return;
      }

      setUploadingAvatar(true);
      setError(null);

      // Create file name
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/avatar.${fileExt}`;

      // Try to upload to Supabase storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, file, { upsert: true });

      if (uploadError) {
        console.warn('Supabase storage upload failed:', uploadError);
        
        // Fallback: use local URL for preview
        const avatarUrl = URL.createObjectURL(file);
        setFormData(prev => ({ ...prev, avatarUrl }));

        // Save fallback avatar URL to user metadata
        const metadata = {
          firstName: formData.firstName,
          lastName: formData.lastName,
          phone: formData.phone,
          address: formData.address,
          avatarUrl: avatarUrl,
          avatarFallback: true // Mark as fallback URL
        };

        const { error: metadataError } = await supabase
          .from('users')
          .update({ 
            metadata: metadata,
            updated_at: new Date().toISOString()
          })
          .eq('id', user.id);

        // Also save to auth metadata as backup
        try {
          await supabase.auth.updateUser({
            data: metadata
          });
          console.log('✅ Avatar saved to auth metadata as backup');
        } catch (authErr) {
          console.warn('⚠️ Failed to save avatar to auth metadata:', authErr);
        }

        if (!metadataError) {
          setSuccess('Avatar uploaded successfully! (Using local storage until bucket is created)');
          // Refresh user data to update header avatar
          if (refreshUserData) {
            await refreshUserData();
          }
        } else {
          console.warn('Failed to save avatar to metadata:', metadataError);
          setSuccess('Avatar preview updated! (Create avatars bucket for persistent storage)');
        }
      } else {
        console.log('Avatar uploaded successfully:', uploadData);

        // Get public URL
        const { data: urlData } = supabase.storage
          .from('avatars')
          .getPublicUrl(fileName);

        setFormData(prev => ({ ...prev, avatarUrl: urlData.publicUrl }));

        // Save avatar URL to user metadata immediately
        const metadata = {
          firstName: formData.firstName,
          lastName: formData.lastName,
          phone: formData.phone,
          address: formData.address,
          avatarUrl: urlData.publicUrl
        };

        const { error: metadataError } = await supabase
          .from('users')
          .update({ 
            metadata: metadata,
            updated_at: new Date().toISOString()
          })
          .eq('id', user.id);

        // Also save to auth metadata as backup
        try {
          await supabase.auth.updateUser({
            data: metadata
          });
          console.log('✅ Avatar saved to auth metadata as backup');
        } catch (authErr) {
          console.warn('⚠️ Failed to save avatar to auth metadata:', authErr);
        }

        if (!metadataError) {
          setSuccess('Avatar uploaded successfully!');
          // Refresh user data to update header avatar
          if (refreshUserData) {
            await refreshUserData();
          }
        } else {
          setError('Avatar uploaded but failed to save to profile');
        }
      }

    } catch (err: any) {
      console.error('Avatar upload error:', err);
      setError('Failed to upload avatar');
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      handleAvatarUpload(file);
    }
  };

  const changePassword = async () => {
    if (!passwordData.newPassword || !passwordData.confirmPassword) {
      setError('Please fill in all password fields');
      return;
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setError('New passwords do not match');
      return;
    }

    if (passwordData.newPassword.length < 6) {
      setError('Password must be at least 6 characters long');
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

    } catch (err: any) {
      setError('Failed to change password: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="animate-pulse">
                  <div className="h-4 bg-gray-200 rounded mb-4"></div>
                  <div className="h-20 bg-gray-200 rounded"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert>
          <Check className="h-4 w-4" />
          <AlertDescription>{success}</AlertDescription>
        </Alert>
      )}

      {/* Profile Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <User className="h-5 w-5 mr-2" />
            Profile Information
          </CardTitle>
          <CardDescription>
            Manage your personal information and profile picture
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Avatar Section */}
          <div className="flex items-center space-x-6">
            <div className="flex flex-col items-center space-y-2">
              <UserAvatar size="lg" showName={false} />
              <p className="text-sm text-gray-600">Profile Picture</p>
            </div>
            
            <div className="flex-1">
              <div className="flex flex-col space-y-2">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileSelect}
                  className="hidden"
                />
                <Button
                  onClick={() => fileInputRef.current?.click()}
                  variant="outline"
                  size="sm"
                  disabled={uploadingAvatar}
                >
                  <Camera className="h-4 w-4 mr-2" />
                  {uploadingAvatar ? 'Uploading...' : 'Change Picture'}
                </Button>
                <p className="text-xs text-gray-500">
                  JPG, PNG, GIF or WebP. Max 5MB.
                </p>
              </div>
            </div>
          </div>

          {/* Profile Form */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="firstName">First Name</Label>
              <Input
                id="firstName"
                value={formData.firstName}
                onChange={(e) => handleInputChange('firstName', e.target.value)}
                disabled={!isEditing}
              />
            </div>
            <div>
              <Label htmlFor="lastName">Last Name</Label>
              <Input
                id="lastName"
                value={formData.lastName}
                onChange={(e) => handleInputChange('lastName', e.target.value)}
                disabled={!isEditing}
              />
            </div>
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                value={formData.email}
                disabled
                className="bg-gray-50"
              />
              <p className="text-xs text-gray-500 mt-1">
                Email cannot be changed
              </p>
            </div>
            <div>
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => handleInputChange('phone', e.target.value)}
                disabled={!isEditing}
              />
            </div>
            <div className="md:col-span-2">
              <Label htmlFor="address">Address</Label>
              <Input
                id="address"
                value={formData.address}
                onChange={(e) => handleInputChange('address', e.target.value)}
                disabled={!isEditing}
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-between">
            <div className="space-x-2">
              {!isEditing ? (
                <Button onClick={() => setIsEditing(true)}>
                  Edit Profile
                </Button>
              ) : (
                <>
                  <Button 
                    onClick={saveSettings} 
                    disabled={saving}
                  >
                    {saving ? 'Saving...' : 'Save Changes'}
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      setIsEditing(false);
                      loadUserSettings(); // Reset form
                    }}
                  >
                    Cancel
                  </Button>
                </>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Security Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Shield className="h-5 w-5 mr-2" />
            Security
          </CardTitle>
          <CardDescription>
            Manage your account security and password
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {!showPasswordChange ? (
            <Button
              variant="outline"
              onClick={() => setShowPasswordChange(true)}
            >
              Change Password
            </Button>
          ) : (
            <div className="space-y-4">
              <div>
                <Label htmlFor="newPassword">New Password</Label>
                <Input
                  id="newPassword"
                  type="password"
                  value={passwordData.newPassword}
                  onChange={(e) => handlePasswordChange('newPassword', e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="confirmPassword">Confirm New Password</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={passwordData.confirmPassword}
                  onChange={(e) => handlePasswordChange('confirmPassword', e.target.value)}
                />
              </div>
              <div className="flex space-x-2">
                <Button
                  onClick={changePassword}
                  disabled={saving}
                >
                  {saving ? 'Changing...' : 'Change Password'}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowPasswordChange(false);
                    setPasswordData({
                      currentPassword: '',
                      newPassword: '',
                      confirmPassword: ''
                    });
                  }}
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Notification Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Bell className="h-5 w-5 mr-2" />
            Notifications
          </CardTitle>
          <CardDescription>
            Configure your notification preferences
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Browser Notifications</p>
              <p className="text-sm text-gray-500">
                Receive notifications in your browser
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleInputChange('browserNotifications', !formData.browserNotifications)}
            >
              {formData.browserNotifications ? 'Enabled' : 'Disabled'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}; 