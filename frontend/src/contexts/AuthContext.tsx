import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { User as SupabaseUser } from '@supabase/supabase-js';
import type { AuthUser, Business, UserRole, AuthContext as AuthContextType } from '@/types';

// Mock auth mode for testing when Supabase auth doesn't work
const MOCK_AUTH_MODE = false; // Set to true for testing without real Supabase auth

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// Custom hook that combines auth with navigation
export const useAuthWithNavigation = () => {
  const auth = useAuth();
  
  return {
    ...auth,
    signOutWithRedirect: async () => {
      try {
        console.log('🔑 Signing out with redirect...');
        await auth.signOut();
        // Clear any cached data
        localStorage.clear();
        sessionStorage.clear();
        // Force a complete page reload to ensure clean state
        window.location.href = '/login';
      } catch (error) {
        console.error('🚨 Error during sign out:', error);
        // Even if sign out fails, redirect to login
        window.location.href = '/login';
      }
    }
  };
};

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [currentBusiness, setCurrentBusiness] = useState<Business | null>(null);
  const [loading, setLoading] = useState(true);
  const mountedRef = useRef(true);

  useEffect(() => {
    // Reset mounted ref when component mounts
    mountedRef.current = true;
    
    const getInitialSession = async () => {
      console.log('🔍 Checking for existing session...');
      
      try {
        // Simple session check without timeout - let Supabase handle its own timeouts
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.warn('⚠️ Session check error (continuing anyway):', error);
        }
        
        if (session?.user && mountedRef.current) {
          console.log('✅ Found existing session:', session.user.email);
          // Load user data and keep loading=true until complete
          loadUserData(session.user).catch(err => {
            console.warn('⚠️ Background user data loading failed:', err);
            // Even if loading fails, stop loading state
            if (mountedRef.current) {
              setLoading(false);
            }
          });
        } else {
          console.log('ℹ️ No existing session found');
          // No session, safe to stop loading
          if (mountedRef.current) {
            setLoading(false);
          }
        }
      } catch (error) {
        console.warn('⚠️ Session check failed (continuing anyway):', error);
        // Session check failed, stop loading
        if (mountedRef.current) {
          setLoading(false);
        }
      }
    };

    getInitialSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('🔔 Auth state change:', event, session?.user?.email);
        
        if (!mountedRef.current) return;
        
        if (event === 'SIGNED_IN' && session?.user) {
          // Set loading true during sign in process
          setLoading(true);
          // Load user data and handle completion
          loadUserData(session.user).catch(err => {
            console.warn('⚠️ Background user data loading failed on sign in:', err);
            // Create a temporary user so the app can still work
            const email = session.user.email || '';
            const role = email.includes('admin') ? 'admin' : 
                         email.includes('accountant') ? 'accountant' : 'client';
            
            const tempUser: AuthUser = {
              id: session.user.id,
              email: email,
              role: role,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
              metadata: { firstName: email.split('@')[0] || 'User', lastName: 'User', isTemporary: true },
              businesses: []
            };
            
            console.log('🚨 Using temporary user due to loading failure:', tempUser);
            setUser(tempUser);
            setLoading(false); // Stop loading after fallback user is set
          });
        } else if (event === 'SIGNED_OUT') {
          setUser(null);
          setCurrentBusiness(null);
          setLoading(false); // Ensure loading is false after sign out
        }
      }
    );

    return () => {
      mountedRef.current = false;
      subscription.unsubscribe();
    };
  }, []);

  const loadUserData = async (supabaseUser: SupabaseUser) => {
    if (!mountedRef.current) return;
    
    console.log('👤 Loading user data for:', supabaseUser.email);
    
    try {
      // First, try to get user data
      console.log('🔍 Checking if user exists in database...');
      
      let { data: userData, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', supabaseUser.id)
        .single();

      // If user doesn't exist, create one
      if (error && error.code === 'PGRST116') {
        console.log('👤 User not found in database, creating new user...');
        
        const email = supabaseUser.email || '';
        const role = email.includes('admin') ? 'admin' : 
                     email.includes('accountant') ? 'accountant' : 'client';
        
        try {
          const { data: newUser, error: createError } = await supabase
            .from('users')
            .insert({
              id: supabaseUser.id,
              email: email,
              role: role,
              metadata: { 
                firstName: email.split('@')[0] || 'User', 
                lastName: 'User' 
              }
            })
            .select()
            .single();

          if (createError) {
            console.error('❌ Error creating user:', createError);
            // If we can't create user in DB, use temporary user
            throw new Error('Cannot create user in database');
          }
          
          userData = newUser;
        } catch (createErr) {
          console.warn('⚠️ Failed to create user in database, using temporary user');
          // Fallback to temporary user
          userData = {
            id: supabaseUser.id,
            email: email,
            role: role as any,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            address: null,
            company: null,
            full_name: email.split('@')[0] || 'User',
            last_sign_in_at: null,
            phone: null,
            metadata: { 
              firstName: email.split('@')[0] || 'User', 
              lastName: 'User',
              isTemporary: true
            }
          };
        }
      } else if (error) {
        console.error('❌ Database error:', error);
        // If we can't read from database, create temporary user
        const email = supabaseUser.email || '';
        const role = email.includes('admin') ? 'admin' : 
                     email.includes('accountant') ? 'accountant' : 'client';
        userData = {
          id: supabaseUser.id,
          email: email,
          role: role as any,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          address: null,
          company: null,
          full_name: email.split('@')[0] || 'User',
          last_sign_in_at: null,
          phone: null,
          metadata: { 
            firstName: email.split('@')[0] || 'User', 
            lastName: 'User',
            isTemporary: true
          }
        };
      }

      if (!mountedRef.current || !userData) return;

      console.log('✅ User data loaded successfully:', userData);
      console.log('🔍 User metadata from database:', userData.metadata);

      // Now load businesses separately to avoid complex joins
      console.log('🏢 Loading user businesses...');
      let businesses: any[] = [];
      
      try {
        const { data: businessData, error: businessError } = await supabase
          .from('businesses')
          .select('*')
          .eq('owner_id', userData.id);

        if (businessError) {
          console.warn('⚠️ Error loading businesses:', businessError);
        } else {
          businesses = businessData || [];
        }
      } catch (businessErr) {
        console.warn('⚠️ Failed to load businesses (continuing anyway):', businessErr);
      }

      // Ensure metadata is properly handled and preserved
      const userMetadata = userData.metadata || {};
      console.log('📋 Processing metadata:', userMetadata);
      
      // Also check Supabase auth user metadata as fallback
      const supabaseAuthMetadata = supabaseUser.user_metadata || {};
      console.log('🔐 Supabase auth metadata:', supabaseAuthMetadata);
      
      // Merge metadata with auth metadata as fallback
      const finalMetadata = {
        ...supabaseAuthMetadata,
        ...userMetadata
      };
      console.log('🔗 Final merged metadata:', finalMetadata);

      const authUser: AuthUser = {
        id: userData.id,
        email: userData.email,
        role: userData.role,
        created_at: userData.created_at,
        updated_at: userData.updated_at,
        metadata: finalMetadata,
        businesses: businesses
      };

      console.log('✅ Setting user with metadata:', authUser.metadata);
      console.log('🖼️ Avatar URL in metadata:', authUser.metadata.avatarUrl);
      setUser(authUser);

      // Set current business if user has businesses
      if (authUser.businesses.length > 0) {
        setCurrentBusiness(authUser.businesses[0]);
      }

      console.log('🎉 Authentication completed successfully for:', authUser.email);

    } catch (error) {
      console.error('🚨 Failed to load user data:', error);
      // Create a basic fallback user instead of using the complex fallback function
      const email = supabaseUser.email || '';
      const role = email.includes('admin') ? 'admin' : 
                   email.includes('accountant') ? 'accountant' : 'client';
      
      const fallbackUser: AuthUser = {
        id: supabaseUser.id,
        email: email,
        role: role,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        metadata: { firstName: email.split('@')[0] || 'User', lastName: 'User', isTemporary: true },
        businesses: []
      };
      
      console.log('🚨 Using simple fallback user:', fallbackUser);
      setUser(fallbackUser);
    } finally {
      // Always stop loading when user data loading is complete
      if (mountedRef.current) {
        setLoading(false);
      }
    }
  };

  const createFallbackUser = async (supabaseUser: SupabaseUser) => {
    if (!mountedRef.current) return;
    
    console.log('🔄 Creating fallback user...');
    
    try {
      // Determine role based on email
      const email = supabaseUser.email || '';
      const role = email.includes('admin') ? 'admin' : 
                   email.includes('accountant') ? 'accountant' : 'client';
      
      const tempUser: AuthUser = {
        id: supabaseUser.id,
        email: email,
        role: role,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        metadata: { firstName: 'Test', lastName: 'User', isTemporary: true },
        businesses: []
      };

      console.log('🚨 Fallback: Creating temporary user due to error:', tempUser);
      
      if (mountedRef.current) {
        setUser(tempUser);
      }
    } catch (error) {
      console.error('💥 Even fallback failed:', error);
      
      // Last resort - create basic user object with minimal data
      const email = supabaseUser.email || 'unknown@example.com';
      const role = email.includes('admin') ? 'admin' : 
                   email.includes('accountant') ? 'accountant' : 'client';
      
      const basicUser: AuthUser = {
        id: supabaseUser.id || 'fallback-' + Date.now(),
        email: email,
        role: role,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        metadata: { firstName: 'Fallback', lastName: 'User', isTemporary: true, isFallback: true },
        businesses: []
      };

      console.log('🆘 Last resort: Creating basic fallback user:', basicUser);
      
      if (mountedRef.current) {
        setUser(basicUser);
      }
    }
  };

  const signIn = async (email: string, password: string) => {
    console.log('🔐 Attempting to sign in with:', email);
    
    // MOCK AUTH MODE - for testing when Supabase auth fails
    if (MOCK_AUTH_MODE) {
      console.log('🎭 Using MOCK AUTH MODE');
      
      // Simple mock authentication
      if (email && password) {
        console.log('✅ Mock authentication successful!');
        
        // Create mock user based on email
        const mockRole = email.includes('admin') ? 'admin' : 
                         email.includes('accountant') ? 'accountant' : 'client';
        
        const mockUser: AuthUser = {
          id: 'mock-' + Date.now(),
          email: email,
          role: mockRole,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          metadata: { firstName: 'Mock', lastName: 'User', isMock: true },
          businesses: []
        };
        
        console.log('🎯 Mock user created:', mockUser);
        setUser(mockUser);
        return;
      } else {
        throw new Error('Please enter email and password');
      }
    }
    
    // REAL SUPABASE AUTH (original code)
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      console.error('🚨 Authentication error:', error);
      console.error('Error code:', error.status);
      console.error('Error message:', error.message);
      
      // Provide more helpful error messages
      if (error.status === 400) {
        if (error.message.includes('Invalid login credentials')) {
          throw new Error('Invalid email or password. Please check your credentials.');
        } else if (error.message.includes('Email not confirmed')) {
          throw new Error('Please confirm your email address before signing in.');
        } else {
          throw new Error(`Authentication failed: ${error.message}`);
        }
      }
      
      throw error;
    }
    
    console.log('✅ Authentication successful!');
  };

  const signUp = async (email: string, password: string, role: UserRole, businessName?: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) {
      throw error;
    }

    if (data.user) {
      // Create user profile
      const { error: profileError } = await supabase
        .from('users')
        .insert({
          id: data.user.id,
          email,
          role,
          metadata: {}
        });

      if (profileError) {
        throw profileError;
      }

      // If client role and business name provided, create business
      if (role === 'client' && businessName) {
        const { data: business, error: businessError } = await supabase
          .from('businesses')
          .insert({
            name: businessName,
            owner_id: data.user.id,
            settings: '{}'
          })
          .select()
          .single();

        if (businessError) {
          throw businessError;
        }

        // Business already has owner_id set, no need for separate relationship table
      }
    }
  };

  const signOut = async () => {
    console.log('🔑 Signing out...');
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('🚨 Error signing out:', error);
        throw error;
      }
      console.log('✅ Sign out successful. Clearing local state.');
      
      // Clear all state
      setUser(null);
      setCurrentBusiness(null);
      setLoading(false);
      
      // Clear any cached data
      localStorage.removeItem('supabase-auth-token');
      
    } catch (error) {
      console.error('🚨 Error during sign out:', error);
      // Even if there's an error, clear the local state
      setUser(null);
      setCurrentBusiness(null);
      setLoading(false);
      throw error;
    }
  };

  const switchBusiness = (businessId: string) => {
    if (user) {
      const userBusiness = user.businesses.find(business => business.id === businessId);
      if (userBusiness) {
        setCurrentBusiness(userBusiness);
        console.log('✅ Switched to business:', userBusiness.name);
      } else {
        console.warn('⚠️ Business not found:', businessId);
      }
    }
  };

  const hasPermission = (resource: string, action: string): boolean => {
    if (!user || !currentBusiness) return false;

    // Admin has all permissions
    if (user.role === 'admin') return true;

    // Check if user has access to current business
    const userBusiness = user.businesses.find(business => business.id === currentBusiness.id);
    if (!userBusiness) return false;

    // Business owner has all permissions for their business
    if (currentBusiness.owner_id === user.id) return true;

    // Check specific permissions based on role
    const userRole = user.role;
    // For owned businesses, the user role is the business role
    const businessRole = userRole;

    // Define role-based permissions
    const rolePermissions: Record<string, Record<string, string[]>> = {
      client: {
        financial_data: ['read'],
        documents: ['create', 'read'],
        meetings: ['create', 'read'],
        billing: ['read'],
        transactions: ['create', 'read'],
        reports: ['read']
      },
      accountant: {
        financial_data: ['read', 'update'],
        transactions: ['create', 'read', 'update'],
        reports: ['create', 'read', 'update'],
        documents: ['read'],
        meetings: ['create', 'read', 'update'],
        clients: ['read']
      },
      admin: {
        '*': ['*'] // Admin has all permissions
      }
    };

    const permissions = rolePermissions[userRole] || {};
    const resourcePermissions = permissions[resource] || permissions['*'] || [];

    return resourcePermissions.includes(action) || resourcePermissions.includes('*');
  };

  const refreshUserData = async () => {
    if (user?.id) {
      console.log('🔄 Refreshing user data...');
      await loadUserData({ id: user.id, email: user.email } as SupabaseUser);
    }
  };

  const value: AuthContextType = {
    user,
    currentBusiness,
    loading,
    authenticated: !!user,
    signIn,
    signUp,
    signOut,
    switchBusiness,
    hasPermission,
    refreshUserData,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}; 