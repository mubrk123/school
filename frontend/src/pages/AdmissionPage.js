import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createStudent, getClasses } from '../lib/api';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { ArrowLeft, UserPlus, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export const AdmissionPage = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    admission_number: '',
    name: '',
    class_name: '',
    father_name: '',
    mother_name: '',
    date_of_birth: '',
    gender: '',
    address: '',
    parent_contact: '',
    parent_email: '',
    date_of_admission: new Date().toISOString().split('T')[0]
  });

  const classes = Array.from({ length: 12 }, (_, i) => `Class ${i + 1}`);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSelectChange = (name, value) => {
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.admission_number || !formData.name || !formData.class_name || !formData.parent_contact || !formData.date_of_admission) {
      toast.error('Please fill in all required fields');
      return;
    }

    setLoading(true);
    
    try {
      await createStudent({
        ...formData,
        date_of_birth: formData.date_of_birth || null,
        date_of_admission: formData.date_of_admission
      });
      toast.success('Student admitted successfully!');
      navigate('/students');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to admit student');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 fade-in max-w-3xl mx-auto" data-testid="admission-page">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button 
          variant="ghost" 
          size="sm"
          onClick={() => navigate('/students')}
          className="text-slate-600"
          data-testid="back-btn"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
      </div>

      <Card className="border-slate-200">
        <CardHeader className="pb-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-blue-100 rounded-lg">
              <UserPlus className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <CardTitle className="text-xl text-slate-900">New Student Admission</CardTitle>
              <CardDescription className="text-slate-500">
                Fill in the details to register a new student
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Info */}
            <div>
              <h3 className="text-sm font-semibold text-slate-900 mb-4 uppercase tracking-wide">
                Basic Information
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-slate-700">Admission Number *</Label>
                  <Input
                    name="admission_number"
                    placeholder="e.g., ADM2024001"
                    value={formData.admission_number}
                    onChange={handleChange}
                    className="bg-white border-slate-200"
                    data-testid="admission-number-input"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-slate-700">Student Name *</Label>
                  <Input
                    name="name"
                    placeholder="Full name"
                    value={formData.name}
                    onChange={handleChange}
                    className="bg-white border-slate-200"
                    data-testid="student-name-input"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-slate-700">Class *</Label>
                  <Select 
                    value={formData.class_name} 
                    onValueChange={(value) => handleSelectChange('class_name', value)}
                  >
                    <SelectTrigger className="bg-white border-slate-200" data-testid="class-select">
                      <SelectValue placeholder="Select class" />
                    </SelectTrigger>
                    <SelectContent>
                      {classes.map((cls) => (
                        <SelectItem key={cls} value={cls}>{cls}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-slate-700">Gender</Label>
                  <Select 
                    value={formData.gender} 
                    onValueChange={(value) => handleSelectChange('gender', value)}
                  >
                    <SelectTrigger className="bg-white border-slate-200" data-testid="gender-select">
                      <SelectValue placeholder="Select gender" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="male">Male</SelectItem>
                      <SelectItem value="female">Female</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-slate-700">Date of Birth</Label>
                  <Input
                    name="date_of_birth"
                    type="date"
                    value={formData.date_of_birth}
                    onChange={handleChange}
                    className="bg-white border-slate-200"
                    data-testid="dob-input"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-slate-700">Date of Admission *</Label>
                  <Input
                    name="date_of_admission"
                    type="date"
                    value={formData.date_of_admission}
                    onChange={handleChange}
                    className="bg-white border-slate-200"
                    data-testid="doa-input"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Parent Info */}
            <div>
              <h3 className="text-sm font-semibold text-slate-900 mb-4 uppercase tracking-wide">
                Parent/Guardian Information
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-slate-700">Father's Name</Label>
                  <Input
                    name="father_name"
                    placeholder="Father's name"
                    value={formData.father_name}
                    onChange={handleChange}
                    className="bg-white border-slate-200"
                    data-testid="father-name-input"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-slate-700">Mother's Name</Label>
                  <Input
                    name="mother_name"
                    placeholder="Mother's name"
                    value={formData.mother_name}
                    onChange={handleChange}
                    className="bg-white border-slate-200"
                    data-testid="mother-name-input"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-slate-700">Parent Contact *</Label>
                  <Input
                    name="parent_contact"
                    placeholder="Phone number"
                    value={formData.parent_contact}
                    onChange={handleChange}
                    className="bg-white border-slate-200"
                    data-testid="parent-contact-input"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-slate-700">Parent Email</Label>
                  <Input
                    name="parent_email"
                    type="email"
                    placeholder="Email address"
                    value={formData.parent_email}
                    onChange={handleChange}
                    className="bg-white border-slate-200"
                    data-testid="parent-email-input"
                  />
                </div>
              </div>
            </div>

            {/* Address */}
            <div>
              <h3 className="text-sm font-semibold text-slate-900 mb-4 uppercase tracking-wide">
                Address
              </h3>
              <div className="space-y-2">
                <Label className="text-slate-700">Full Address</Label>
                <Input
                  name="address"
                  placeholder="Enter complete address"
                  value={formData.address}
                  onChange={handleChange}
                  className="bg-white border-slate-200"
                  data-testid="address-input"
                />
              </div>
            </div>

            {/* Submit */}
            <div className="flex gap-3 pt-4">
              <Button 
                type="button"
                variant="outline"
                onClick={() => navigate('/students')}
                className="flex-1 sm:flex-none border-slate-200"
                data-testid="cancel-btn"
              >
                Cancel
              </Button>
              <Button 
                type="submit"
                className="flex-1 sm:flex-none bg-blue-600 hover:bg-blue-700 text-white btn-scale"
                disabled={loading}
                data-testid="submit-admission-btn"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Registering...
                  </>
                ) : (
                  <>
                    <UserPlus className="w-4 h-4 mr-2" />
                    Register Student
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};
