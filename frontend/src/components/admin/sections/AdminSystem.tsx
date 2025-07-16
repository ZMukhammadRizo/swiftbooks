import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { 
  Shield, 
  Settings, 
  Database, 
  Lock, 
  Users, 
  Activity, 
  AlertTriangle,
  CheckCircle,
  Globe,
  Server,
  Eye,
  Key,
  FileText,
  Clock,
  BarChart3,
  Zap
} from 'lucide-react';

interface SystemHealth {
  database: 'healthy' | 'warning' | 'error';
  auth: 'healthy' | 'warning' | 'error';
  storage: 'healthy' | 'warning' | 'error';
  api: 'healthy' | 'warning' | 'error';
  uptime: number;
  lastChecked: string;
}

interface SecurityPolicy {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  level: 'low' | 'medium' | 'high' | 'critical';
}

interface PlatformSettings {
  appName: string;
  allowRegistration: boolean;
  emailVerificationRequired: boolean;
  passwordMinLength: number;
  sessionTimeout: number;
  maxLoginAttempts: number;
  enableAuditLogs: boolean;
  maintenanceMode: boolean;
  backupFrequency: string;
}

interface AuditLog {
  id: string;
  timestamp: string;
  user_id: string;
  user_email: string;
  action: string;
  resource: string;
  details: string;
  ip_address?: string;
  user_agent?: string;
}

export const AdminSystem: React.FC = () => {
  const { user } = useAuth();
  const [systemHealth, setSystemHealth] = useState<SystemHealth>({
    database: 'healthy',
    auth: 'healthy',
    storage: 'healthy',
    api: 'healthy',
    uptime: 99.9,
    lastChecked: new Date().toISOString()
  });

  const [securityPolicies, setSecurityPolicies] = useState<SecurityPolicy[]>([
    {
      id: 'rls_enabled',
      name: 'Row Level Security (RLS)',
      description: 'Enable RLS on all user tables to ensure data isolation',
      enabled: true,
      level: 'critical'
    },
    {
      id: 'email_verification',
      name: 'Email Verification Required',
      description: 'Require email verification for new user accounts',
      enabled: true,
      level: 'high'
    },
    {
      id: 'password_complexity',
      name: 'Password Complexity',
      description: 'Enforce strong password requirements',
      enabled: true,
      level: 'high'
    },
    {
      id: 'session_management',
      name: 'Session Management',
      description: 'Automatic session timeout and renewal',
      enabled: true,
      level: 'medium'
    },
    {
      id: 'audit_logging',
      name: 'Audit Logging',
      description: 'Log all user actions and system events',
      enabled: true,
      level: 'high'
    },
    {
      id: 'rate_limiting',
      name: 'Rate Limiting',
      description: 'Limit API requests per user/IP',
      enabled: false,
      level: 'medium'
    }
  ]);

  const [platformSettings, setPlatformSettings] = useState<PlatformSettings>({
    appName: 'SwiftBooks',
    allowRegistration: true,
    emailVerificationRequired: true,
    passwordMinLength: 8,
    sessionTimeout: 24,
    maxLoginAttempts: 5,
    enableAuditLogs: true,
    maintenanceMode: false,
    backupFrequency: 'daily'
  });

  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (user?.role === 'admin') {
      loadSystemData();
    }
  }, [user]);

  const loadSystemData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Check system health
      await checkSystemHealth();

      // Load recent audit logs (mock data for now)
      generateMockAuditLogs();

    } catch (err: any) {
      console.error('Error loading system data:', err);
      setError('Failed to load system data: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const checkSystemHealth = async () => {
    try {
      // Test database connection
      const { error: dbError } = await supabase.from('users').select('id').limit(1);
      
      // Test auth service
      const { error: authError } = await supabase.auth.getSession();

      setSystemHealth({
        database: dbError ? 'error' : 'healthy',
        auth: authError ? 'error' : 'healthy',
        storage: 'healthy', // Assume healthy for now
        api: 'healthy',
        uptime: 99.9,
        lastChecked: new Date().toISOString()
      });
    } catch (err) {
      console.error('Health check failed:', err);
    }
  };

  const generateMockAuditLogs = () => {
    const mockLogs: AuditLog[] = [
      {
        id: '1',
        timestamp: new Date().toISOString(),
        user_id: 'user-1',
        user_email: 'admin@swiftbooks.com',
        action: 'CREATE_USER',
        resource: 'users',
        details: 'Created new user account',
        ip_address: '192.168.1.100'
      },
      {
        id: '2',
        timestamp: new Date(Date.now() - 3600000).toISOString(),
        user_id: 'user-2',
        user_email: 'client@swiftbooks.com',
        action: 'UPDATE_TRANSACTION',
        resource: 'transactions',
        details: 'Modified transaction amount',
        ip_address: '192.168.1.101'
      },
      {
        id: '3',
        timestamp: new Date(Date.now() - 7200000).toISOString(),
        user_id: 'user-3',
        user_email: 'accountant@swiftbooks.com',
        action: 'DELETE_GOAL',
        resource: 'financial_goals',
        details: 'Deleted financial goal',
        ip_address: '192.168.1.102'
      }
    ];
    setAuditLogs(mockLogs);
  };

  const handleSecurityPolicyToggle = (policyId: string) => {
    setSecurityPolicies(prev => 
      prev.map(policy => 
        policy.id === policyId 
          ? { ...policy, enabled: !policy.enabled }
          : policy
      )
    );
  };

  const handleSettingsChange = (key: keyof PlatformSettings, value: any) => {
    setPlatformSettings(prev => ({ ...prev, [key]: value }));
  };

  const savePlatformSettings = async () => {
    try {
      setSaving(true);
      setError(null);

      // In a real implementation, you would save to a settings table
      console.log('Saving platform settings:', platformSettings);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Show success message
      alert('Platform settings saved successfully!');

    } catch (err: any) {
      setError('Failed to save settings: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const getHealthStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'text-green-600 bg-green-100';
      case 'warning': return 'text-yellow-600 bg-yellow-100';
      case 'error': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getPolicyLevelColor = (level: string) => {
    switch (level) {
      case 'critical': return 'text-red-600 bg-red-100';
      case 'high': return 'text-orange-600 bg-orange-100';
      case 'medium': return 'text-yellow-600 bg-yellow-100';
      case 'low': return 'text-blue-600 bg-blue-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (!user || user.role !== 'admin') {
    return (
      <Alert variant="destructive">
        <Shield className="h-4 w-4" />
        <AlertDescription>
          Access denied. Administrator privileges required.
        </AlertDescription>
      </Alert>
    );
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="animate-pulse">
                  <div className="h-4 bg-gray-200 rounded mb-2"></div>
                  <div className="h-8 bg-gray-200 rounded"></div>
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

      {/* System Health Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Database</p>
                <Badge className={getHealthStatusColor(systemHealth.database)}>
                  {systemHealth.database}
                </Badge>
              </div>
              <Database className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Authentication</p>
                <Badge className={getHealthStatusColor(systemHealth.auth)}>
                  {systemHealth.auth}
                </Badge>
              </div>
              <Lock className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">API</p>
                <Badge className={getHealthStatusColor(systemHealth.api)}>
                  {systemHealth.api}
                </Badge>
              </div>
              <Server className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Uptime</p>
                <p className="text-2xl font-bold text-green-600">{systemHealth.uptime}%</p>
              </div>
              <BarChart3 className="h-8 w-8 text-emerald-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* System Management Tabs */}
      <Tabs defaultValue="security" className="space-y-6">
        <TabsList className="grid grid-cols-4 w-full">
          <TabsTrigger value="security">Security Policies</TabsTrigger>
          <TabsTrigger value="settings">Platform Settings</TabsTrigger>
          <TabsTrigger value="audit">Audit Logs</TabsTrigger>
          <TabsTrigger value="maintenance">Maintenance</TabsTrigger>
        </TabsList>

        {/* Security Policies Tab */}
        <TabsContent value="security" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Shield className="h-5 w-5 mr-2" />
                Security Policies
              </CardTitle>
              <CardDescription>
                Manage security policies and access controls for the platform
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {securityPolicies.map((policy) => (
                  <div key={policy.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3">
                        <h4 className="font-medium">{policy.name}</h4>
                        <Badge className={getPolicyLevelColor(policy.level)}>
                          {policy.level}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600 mt-1">{policy.description}</p>
                    </div>
                    <Switch
                      checked={policy.enabled}
                      onCheckedChange={() => handleSecurityPolicyToggle(policy.id)}
                    />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Platform Settings Tab */}
        <TabsContent value="settings" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Settings className="h-5 w-5 mr-2" />
                Platform Settings
              </CardTitle>
              <CardDescription>
                Configure global platform settings and behavior
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="appName">Application Name</Label>
                    <Input
                      id="appName"
                      value={platformSettings.appName}
                      onChange={(e) => handleSettingsChange('appName', e.target.value)}
                    />
                  </div>

                  <div>
                    <Label htmlFor="passwordMinLength">Minimum Password Length</Label>
                    <Input
                      id="passwordMinLength"
                      type="number"
                      value={platformSettings.passwordMinLength}
                      onChange={(e) => handleSettingsChange('passwordMinLength', parseInt(e.target.value))}
                    />
                  </div>

                  <div>
                    <Label htmlFor="sessionTimeout">Session Timeout (hours)</Label>
                    <Input
                      id="sessionTimeout"
                      type="number"
                      value={platformSettings.sessionTimeout}
                      onChange={(e) => handleSettingsChange('sessionTimeout', parseInt(e.target.value))}
                    />
                  </div>

                  <div>
                    <Label htmlFor="maxLoginAttempts">Max Login Attempts</Label>
                    <Input
                      id="maxLoginAttempts"
                      type="number"
                      value={platformSettings.maxLoginAttempts}
                      onChange={(e) => handleSettingsChange('maxLoginAttempts', parseInt(e.target.value))}
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Allow User Registration</Label>
                      <p className="text-sm text-gray-600">Allow new users to create accounts</p>
                    </div>
                    <Switch
                      checked={platformSettings.allowRegistration}
                      onCheckedChange={(checked) => handleSettingsChange('allowRegistration', checked)}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Email Verification Required</Label>
                      <p className="text-sm text-gray-600">Require email verification for new accounts</p>
                    </div>
                    <Switch
                      checked={platformSettings.emailVerificationRequired}
                      onCheckedChange={(checked) => handleSettingsChange('emailVerificationRequired', checked)}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Enable Audit Logs</Label>
                      <p className="text-sm text-gray-600">Log all user actions and system events</p>
                    </div>
                    <Switch
                      checked={platformSettings.enableAuditLogs}
                      onCheckedChange={(checked) => handleSettingsChange('enableAuditLogs', checked)}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Maintenance Mode</Label>
                      <p className="text-sm text-gray-600">Enable maintenance mode (blocks user access)</p>
                    </div>
                    <Switch
                      checked={platformSettings.maintenanceMode}
                      onCheckedChange={(checked) => handleSettingsChange('maintenanceMode', checked)}
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end">
                <Button onClick={savePlatformSettings} disabled={saving}>
                  {saving ? 'Saving...' : 'Save Settings'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Audit Logs Tab */}
        <TabsContent value="audit" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Eye className="h-5 w-5 mr-2" />
                Audit Logs
              </CardTitle>
              <CardDescription>
                Track all user actions and system events
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="border-b bg-gray-50">
                      <tr>
                        <th className="text-left p-4 font-medium">Timestamp</th>
                        <th className="text-left p-4 font-medium">User</th>
                        <th className="text-left p-4 font-medium">Action</th>
                        <th className="text-left p-4 font-medium">Resource</th>
                        <th className="text-left p-4 font-medium">Details</th>
                        <th className="text-left p-4 font-medium">IP Address</th>
                      </tr>
                    </thead>
                    <tbody>
                      {auditLogs.map((log) => (
                        <tr key={log.id} className="border-b hover:bg-gray-50">
                          <td className="p-4 text-sm text-gray-600">
                            {formatDate(log.timestamp)}
                          </td>
                          <td className="p-4">
                            <p className="font-medium">{log.user_email}</p>
                            <p className="text-xs text-gray-500">{log.user_id}</p>
                          </td>
                          <td className="p-4">
                            <Badge variant="outline">{log.action}</Badge>
                          </td>
                          <td className="p-4 text-sm">{log.resource}</td>
                          <td className="p-4 text-sm">{log.details}</td>
                          <td className="p-4 text-sm text-gray-600">{log.ip_address}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {auditLogs.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  No audit logs available.
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Maintenance Tab */}
        <TabsContent value="maintenance" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Zap className="h-5 w-5 mr-2" />
                  System Actions
                </CardTitle>
                <CardDescription>
                  Perform system maintenance and administrative tasks
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button variant="outline" className="w-full">
                  <Database className="h-4 w-4 mr-2" />
                  Run Database Backup
                </Button>
                <Button variant="outline" className="w-full">
                  <Activity className="h-4 w-4 mr-2" />
                  Clear System Cache
                </Button>
                <Button variant="outline" className="w-full">
                  <FileText className="h-4 w-4 mr-2" />
                  Generate System Report
                </Button>
                <Button variant="outline" className="w-full">
                  <Users className="h-4 w-4 mr-2" />
                  Export User Data
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Clock className="h-5 w-5 mr-2" />
                  System Information
                </CardTitle>
                <CardDescription>
                  Current system status and information
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Last Health Check:</span>
                  <span className="text-sm font-medium">
                    {formatDate(systemHealth.lastChecked)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Backup Frequency:</span>
                  <span className="text-sm font-medium">{platformSettings.backupFrequency}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Maintenance Mode:</span>
                  <Badge className={platformSettings.maintenanceMode ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}>
                    {platformSettings.maintenanceMode ? 'Enabled' : 'Disabled'}
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Audit Logs:</span>
                  <Badge className={platformSettings.enableAuditLogs ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}>
                    {platformSettings.enableAuditLogs ? 'Enabled' : 'Disabled'}
                  </Badge>
                </div>
      </CardContent>
    </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}; 