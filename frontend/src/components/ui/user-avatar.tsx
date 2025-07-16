import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Avatar, AvatarFallback, AvatarImage } from './avatar';
import { User } from 'lucide-react';

interface UserAvatarProps {
  size?: 'sm' | 'md' | 'lg';
  showName?: boolean;
  className?: string;
}

export const UserAvatar: React.FC<UserAvatarProps> = ({ 
  size = 'md', 
  showName = false,
  className = '' 
}) => {
  const { user } = useAuth();

  const sizeClasses = {
    sm: 'h-8 w-8',
    md: 'h-10 w-10',
    lg: 'h-12 w-12'
  };

  const getInitials = (email: string, metadata?: any) => {
    // Try to get from user metadata first
    if (metadata?.firstName && metadata?.lastName) {
      return `${metadata.firstName[0]}${metadata.lastName[0]}`.toUpperCase();
    }
    
    // Fallback to email
    if (email) {
      const parts = email.split('@')[0].split('.');
      if (parts.length >= 2) {
        return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
      }
      return email.substring(0, 2).toUpperCase();
    }
    
    return 'U';
  };

  const getUserDisplayName = (email: string, metadata?: any) => {
    if (metadata?.firstName && metadata?.lastName) {
      return `${metadata.firstName} ${metadata.lastName}`;
    }
    
    if (metadata?.firstName) {
      return metadata.firstName;
    }
    
    return email?.split('@')[0] || 'User';
  };

  const avatarUrl = user?.metadata?.avatarUrl;
  const initials = getInitials(user?.email || '', user?.metadata);
  const displayName = getUserDisplayName(user?.email || '', user?.metadata);

  return (
    <div className={`flex items-center space-x-3 ${className}`}>
      <Avatar className={sizeClasses[size]}>
        {avatarUrl && (
          <AvatarImage 
            src={avatarUrl} 
            alt={`${displayName}'s avatar`}
            onError={(e) => {
              // Hide broken images gracefully
              e.currentTarget.style.display = 'none';
            }}
          />
        )}
        <AvatarFallback className="bg-blue-600 text-white font-medium">
          {avatarUrl ? (
            // If we have an avatar URL but it failed to load, show user icon
            <User className="h-4 w-4" />
          ) : (
            // If no avatar URL, show initials
            initials
          )}
        </AvatarFallback>
      </Avatar>
      
      {showName && (
        <div className="flex flex-col">
          <span className="text-sm font-medium text-gray-900">{displayName}</span>
          <span className="text-xs text-gray-500">{user?.email}</span>
        </div>
      )}
    </div>
  );
}; 