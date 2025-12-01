import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/auth-context';
import { loginUser } from '../services/api';
import { loginSchema } from '../lib/validators';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Mail, Lock } from 'lucide-react';

export const LoginPage = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      setError("");
      
      // validate inputs with Zod
      const validation = loginSchema.safeParse({
        username: email,
        password: password,
      });

      if (!validation.success) {
        const firstError = validation.error.issues[0];
        setError(firstError.message);
        return;
      }

      setIsSubmitting(true);
      try {
        const data = await loginUser(email, password);
        login(data.access_token);
        navigate("/");
      } catch {
        setError("Invalid username or password. Please try again.");
      } finally {
        setIsSubmitting(false);
      }
    };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-900">
      <div className="w-full max-w-md p-8 space-y-6 bg-gray-800 rounded-lg shadow-lg">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-white">LicenseGuard</h1>
          <p className="text-gray-400">Welcome back! Please sign in to your account.</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* TODO: change this to accept an username instead of an email */}
          <div>
            <label className="block mb-2 text-sm font-medium text-gray-300">Username</label>
            <Input
              type="text"
              placeholder="Enter your username"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              leftIcon={<Mail className="w-4 h-4 text-gray-400" />}
              disabled={isSubmitting}
            />
          </div>
          <div>
            <div className="flex justify-between">
              <label className="block mb-2 text-sm font-medium text-gray-300">Password</label>
              <Link to="#" className="text-sm text-blue-400 hover:underline">Forgot password?</Link>
            </div>
            <Input
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              leftIcon={<Lock className="w-4 h-4 text-gray-400" />}
              disabled={isSubmitting}
            />
          </div>
          {error && <p className="text-sm text-red-500">{error}</p>}
          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? 'Signing In...' : 'Sign In'}
          </Button>
        </form>
        <p className="text-sm text-center text-gray-400">
          Don't have an account? <Link to="/register" className="font-medium text-blue-400 hover:underline">Sign Up</Link>
        </p>
      </div>
    </div>
  );
};
