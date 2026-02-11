import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../lib/api';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { GraduationCap, Building2, Mail, Lock, User, Phone, MapPin, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export const RegisterPage = () => {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const [schoolData, setSchoolData] = useState({
    name: '',
    address: '',
    phone: '',
    email: ''
  });

  const [userData, setUserData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  });

  const handleSchoolChange = (e) => {
    setSchoolData({ ...schoolData, [e.target.name]: e.target.value });
  };

  const handleUserChange = (e) => {
    setUserData({ ...userData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (userData.password !== userData.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    setLoading(true);
    
    try {
      const response = await api.post('/auth/register-school', {
        school_name: schoolData.name,
        school_address: schoolData.address,
        school_phone: schoolData.phone,
        school_email: schoolData.email,
        user_name: userData.name,
        user_email: userData.email,
        user_password: userData.password
      });
      
      login(response.data);
      toast.success('School registered successfully!');
      navigate('/');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Left side - Image */}
      <div className="hidden lg:flex lg:w-1/2 relative">
        <img 
          src="https://images.unsplash.com/photo-1580582932707-520aed937b7b?w=1200&q=80" 
          alt="School Building"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/80 to-blue-800/60" />
        <div className="absolute inset-0 flex flex-col justify-center items-center text-white p-12">
          <GraduationCap className="w-20 h-20 mb-6" />
          <h1 className="text-4xl font-bold mb-4 text-center">Scholify</h1>
          <p className="text-xl text-blue-100 text-center max-w-md">
            Register your school and start managing everything in one place
          </p>
        </div>
      </div>

      {/* Right side - Register Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12 overflow-y-auto">
        <Card className="w-full max-w-md border-slate-200 shadow-lg">
          <CardHeader className="space-y-1 pb-4">
            <div className="flex items-center gap-3 mb-2 lg:hidden">
              <GraduationCap className="w-8 h-8 text-blue-600" />
              <span className="text-xl font-bold text-slate-900">Scholify</span>
            </div>
            <CardTitle className="text-2xl font-bold text-slate-900">Register School</CardTitle>
            <CardDescription className="text-slate-500">
              {step === 1 ? 'Enter your school details' : 'Create your principal account'}
            </CardDescription>
            <div className="flex gap-2 pt-2">
              <div className={`h-1 flex-1 rounded ${step >= 1 ? 'bg-blue-600' : 'bg-slate-200'}`} />
              <div className={`h-1 flex-1 rounded ${step >= 2 ? 'bg-blue-600' : 'bg-slate-200'}`} />
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {step === 1 ? (
                <>
                  <div className="space-y-2">
                    <Label className="text-slate-700 font-medium">School Name *</Label>
                    <div className="relative">
                      <Building2 className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
                      <Input
                        name="name"
                        placeholder="Enter school name"
                        value={schoolData.name}
                        onChange={handleSchoolChange}
                        className="pl-10 h-11 bg-white border-slate-200"
                        data-testid="school-name-input"
                        required
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-slate-700 font-medium">School Address</Label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-3 w-5 h-5 text-slate-400" />
                      <Input
                        name="address"
                        placeholder="Enter school address"
                        value={schoolData.address}
                        onChange={handleSchoolChange}
                        className="pl-10 h-11 bg-white border-slate-200"
                        data-testid="school-address-input"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-slate-700 font-medium">School Phone</Label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
                      <Input
                        name="phone"
                        placeholder="Enter phone number"
                        value={schoolData.phone}
                        onChange={handleSchoolChange}
                        className="pl-10 h-11 bg-white border-slate-200"
                        data-testid="school-phone-input"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-slate-700 font-medium">School Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
                      <Input
                        name="email"
                        type="email"
                        placeholder="Enter school email"
                        value={schoolData.email}
                        onChange={handleSchoolChange}
                        className="pl-10 h-11 bg-white border-slate-200"
                        data-testid="school-email-input"
                      />
                    </div>
                  </div>
                  <Button 
                    type="button"
                    onClick={() => setStep(2)}
                    className="w-full h-11 bg-blue-600 hover:bg-blue-700 text-white font-semibold btn-scale mt-4"
                    disabled={!schoolData.name}
                    data-testid="next-step-btn"
                  >
                    Continue
                  </Button>
                </>
              ) : (
                <>
                  <div className="space-y-2">
                    <Label className="text-slate-700 font-medium">Your Name *</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
                      <Input
                        name="name"
                        placeholder="Enter your name"
                        value={userData.name}
                        onChange={handleUserChange}
                        className="pl-10 h-11 bg-white border-slate-200"
                        data-testid="user-name-input"
                        required
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-slate-700 font-medium">Email *</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
                      <Input
                        name="email"
                        type="email"
                        placeholder="Enter your email"
                        value={userData.email}
                        onChange={handleUserChange}
                        className="pl-10 h-11 bg-white border-slate-200"
                        data-testid="user-email-input"
                        required
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-slate-700 font-medium">Password *</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
                      <Input
                        name="password"
                        type="password"
                        placeholder="Create password"
                        value={userData.password}
                        onChange={handleUserChange}
                        className="pl-10 h-11 bg-white border-slate-200"
                        data-testid="user-password-input"
                        required
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-slate-700 font-medium">Confirm Password *</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
                      <Input
                        name="confirmPassword"
                        type="password"
                        placeholder="Confirm password"
                        value={userData.confirmPassword}
                        onChange={handleUserChange}
                        className="pl-10 h-11 bg-white border-slate-200"
                        data-testid="user-confirm-password-input"
                        required
                      />
                    </div>
                  </div>
                  <div className="flex gap-3 mt-4">
                    <Button 
                      type="button"
                      variant="outline"
                      onClick={() => setStep(1)}
                      className="flex-1 h-11 border-slate-200"
                      data-testid="back-step-btn"
                    >
                      Back
                    </Button>
                    <Button 
                      type="submit"
                      className="flex-1 h-11 bg-blue-600 hover:bg-blue-700 text-white font-semibold btn-scale"
                      disabled={loading || !userData.name || !userData.email || !userData.password}
                      data-testid="register-submit-btn"
                    >
                      {loading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Registering...
                        </>
                      ) : (
                        'Register'
                      )}
                    </Button>
                  </div>
                </>
              )}
            </form>
            <div className="mt-6 text-center">
              <p className="text-slate-500">
                Already registered?{' '}
                <Link to="/login" className="text-blue-600 hover:text-blue-700 font-medium" data-testid="login-link">
                  Sign in
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
