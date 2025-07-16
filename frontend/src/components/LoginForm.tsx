import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Eye, EyeOff, Loader2 } from 'lucide-react';

export const LoginForm: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { signIn, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Get the intended destination from the location state, or default to dashboard
  const from = location.state?.from?.pathname || '/dashboard';

  // This effect will run when the user state changes.
  // If the user is authenticated, it will navigate to the correct page.
  useEffect(() => {
    if (user) {
      navigate(from, { replace: true });
    }
  }, [user, navigate, from]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await signIn(email, password);
      // Navigation is now handled by the useEffect hook.
    } catch (err: any) {
      setError(err.message || 'An error occurred during login');
      setLoading(false); // Stop loading only on error.
    }
  };

  const handleDemoLogin = async (demoEmail: string, demoPassword: string) => {
    setEmail(demoEmail);
    setPassword(demoPassword);
    setLoading(true);
    setError('');

    try {
      await signIn(demoEmail, demoPassword);
      // Navigation is now handled by the useEffect hook.
    } catch (err: any) {
      setError(err.message || 'An error occurred during login');
      setLoading(false); // Stop loading only on error.
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">SwiftBooks Login</CardTitle>
          <CardDescription>
            Please sign in to your SwiftBooks account
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  disabled={loading}
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            <Button 
              type="submit" 
              className="w-full" 
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Signing in...
                </>
              ) : (
                'Sign In'
              )}
            </Button>
          </form>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">Or try demo accounts</span>
            </div>
          </div>

          <div className="space-y-2">
            <div className="p-4 bg-blue-50 rounded-lg">
              <h3 className="font-medium text-blue-900 mb-3">Demo Accounts:</h3>
              <div className="space-y-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDemoLogin('admin@swiftbooks.com', 'admin123')}
                  disabled={loading}
                  className="w-full text-left justify-start"
                >
                  <span className="font-medium">Admin:</span>
                  <span className="ml-2 text-sm text-gray-600">admin@swiftbooks.com</span>
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDemoLogin('accountant@swiftbooks.com', 'accountant123')}
                  disabled={loading}
                  className="w-full text-left justify-start"
                >
                  <span className="font-medium">Accountant:</span>
                  <span className="ml-2 text-sm text-gray-600">accountant@swiftbooks.com</span>
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDemoLogin('client@swiftbooks.com', 'client123')}
                  disabled={loading}
                  className="w-full text-left justify-start"
                >
                  <span className="font-medium">Client:</span>
                  <span className="ml-2 text-sm text-gray-600">client@swiftbooks.com</span>
                </Button>
              </div>
              <p className="text-xs text-blue-700 mt-2">
                💡 Click any demo account to login instantly
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}; 