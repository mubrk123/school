import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { getTeachers, createTeacher, createTeacherSalary, getTeacherSalaries, deleteUser, getClasses } from '../lib/api';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '../components/ui/alert-dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { Badge } from '../components/ui/badge';
import { Checkbox } from '../components/ui/checkbox';
import { Plus, UserCog, Trash2, IndianRupee, Loader2, Eye, Phone, Mail, BookOpen } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';

export const TeachersPage = () => {
  const { isPrincipal } = useAuth();
  const [teachers, setTeachers] = useState([]);
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [salaryDialogOpen, setSalaryDialogOpen] = useState(false);
  const [historyDialogOpen, setHistoryDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedTeacher, setSelectedTeacher] = useState(null);
  const [salaryHistory, setSalaryHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [newTeacher, setNewTeacher] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
    address: '',
    assigned_classes: []
  });

  const [newSalary, setNewSalary] = useState({
    amount: '',
    remark: ''
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [teachersRes, classesRes] = await Promise.all([
        getTeachers(),
        getClasses()
      ]);
      setTeachers(teachersRes.data);
      setClasses(classesRes.data.classes);
    } catch (error) {
      toast.error('Failed to fetch teachers');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTeacher = async () => {
    if (!newTeacher.name || !newTeacher.email || !newTeacher.password || newTeacher.assigned_classes.length === 0) {
      toast.error('Please fill in all required fields and assign at least one class');
      return;
    }

    setSubmitting(true);
    try {
      await createTeacher(newTeacher);
      toast.success('Teacher account created successfully!');
      setCreateDialogOpen(false);
      setNewTeacher({ name: '', email: '', password: '', phone: '', address: '', assigned_classes: [] });
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to create teacher');
    } finally {
      setSubmitting(false);
    }
  };

  const handleClassToggle = (className) => {
    setNewTeacher(prev => ({
      ...prev,
      assigned_classes: prev.assigned_classes.includes(className)
        ? prev.assigned_classes.filter(c => c !== className)
        : [...prev.assigned_classes, className]
    }));
  };

  const handlePaySalary = async () => {
    if (!newSalary.amount || !selectedTeacher) {
      toast.error('Please enter amount');
      return;
    }

    setSubmitting(true);
    try {
      await createTeacherSalary({
        teacher_id: selectedTeacher.id,
        amount: parseFloat(newSalary.amount),
        remark: newSalary.remark
      });
      toast.success('Salary payment recorded!');
      setSalaryDialogOpen(false);
      setNewSalary({ amount: '', remark: '' });
      setSelectedTeacher(null);
    } catch (error) {
      toast.error('Failed to record payment');
    } finally {
      setSubmitting(false);
    }
  };

  const handleViewHistory = async (teacher) => {
    setSelectedTeacher(teacher);
    setHistoryDialogOpen(true);
    setLoadingHistory(true);
    try {
      const response = await getTeacherSalaries(teacher.id);
      setSalaryHistory(response.data);
    } catch (error) {
      toast.error('Failed to fetch salary history');
    } finally {
      setLoadingHistory(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedTeacher) return;
    try {
      await deleteUser(selectedTeacher.id);
      toast.success('Teacher deleted');
      setDeleteDialogOpen(false);
      setSelectedTeacher(null);
      fetchData();
    } catch (error) {
      toast.error('Failed to delete teacher');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="spinner" />
      </div>
    );
  }

  return (
    <div className="space-y-6 fade-in" data-testid="teachers-page">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Teacher Management</h1>
          <p className="text-slate-500 mt-1">Manage teacher accounts and salary payments</p>
        </div>
        {isPrincipal && (
          <Button 
            onClick={() => setCreateDialogOpen(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white btn-scale"
            data-testid="add-teacher-btn"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Teacher
          </Button>
        )}
      </div>

      {/* Teachers List */}
      {teachers.length === 0 ? (
        <Card className="border-slate-200">
          <CardContent className="p-12 text-center">
            <UserCog className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-slate-900 mb-2">No Teachers</h3>
            <p className="text-slate-500 mb-4">Add your first teacher to get started</p>
            {isPrincipal && (
              <Button 
                onClick={() => setCreateDialogOpen(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Teacher
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {teachers.map((teacher) => (
            <Card key={teacher.id} className="border-slate-200 card-hover" data-testid={`teacher-card-${teacher.id}`}>
              <CardContent className="p-5">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                      <span className="text-blue-600 font-semibold text-lg">
                        {teacher.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <h3 className="font-semibold text-slate-900">{teacher.name}</h3>
                      <p className="text-sm text-slate-500">{teacher.email}</p>
                    </div>
                  </div>
                </div>
                
                {teacher.phone && (
                  <div className="flex items-center gap-2 text-sm text-slate-600 mb-2">
                    <Phone className="w-4 h-4" />
                    {teacher.phone}
                  </div>
                )}
                
                <div className="flex items-center gap-2 text-sm text-slate-600 mb-4">
                  <BookOpen className="w-4 h-4" />
                  <span className="truncate">
                    {teacher.assigned_classes ? teacher.assigned_classes.split(',').join(', ') : 'No classes assigned'}
                  </span>
                </div>

                <div className="flex gap-2 pt-3 border-t border-slate-100">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSelectedTeacher(teacher);
                      setSalaryDialogOpen(true);
                    }}
                    className="flex-1 border-slate-200"
                    data-testid={`pay-salary-btn-${teacher.id}`}
                  >
                    <IndianRupee className="w-4 h-4 mr-1" />
                    Pay Salary
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleViewHistory(teacher)}
                    className="border-slate-200"
                    data-testid={`view-history-btn-${teacher.id}`}
                  >
                    <Eye className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSelectedTeacher(teacher);
                      setDeleteDialogOpen(true);
                    }}
                    className="border-slate-200 text-red-600 hover:text-red-700"
                    data-testid={`delete-teacher-btn-${teacher.id}`}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create Teacher Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-slate-900">Add New Teacher</DialogTitle>
            <DialogDescription>
              Create a teacher account with login credentials and assigned classes
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label className="text-slate-700">Full Name *</Label>
              <Input
                placeholder="Enter teacher name"
                value={newTeacher.name}
                onChange={(e) => setNewTeacher({ ...newTeacher, name: e.target.value })}
                className="bg-white border-slate-200"
                data-testid="teacher-name-input"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-slate-700">Email (Login ID) *</Label>
              <Input
                type="email"
                placeholder="teacher@school.com"
                value={newTeacher.email}
                onChange={(e) => setNewTeacher({ ...newTeacher, email: e.target.value })}
                className="bg-white border-slate-200"
                data-testid="teacher-email-input"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-slate-700">Password *</Label>
              <Input
                type="password"
                placeholder="Create password"
                value={newTeacher.password}
                onChange={(e) => setNewTeacher({ ...newTeacher, password: e.target.value })}
                className="bg-white border-slate-200"
                data-testid="teacher-password-input"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-slate-700">Phone Number</Label>
              <Input
                placeholder="Contact number"
                value={newTeacher.phone}
                onChange={(e) => setNewTeacher({ ...newTeacher, phone: e.target.value })}
                className="bg-white border-slate-200"
                data-testid="teacher-phone-input"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-slate-700">Address</Label>
              <Input
                placeholder="Address"
                value={newTeacher.address}
                onChange={(e) => setNewTeacher({ ...newTeacher, address: e.target.value })}
                className="bg-white border-slate-200"
                data-testid="teacher-address-input"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-slate-700">Assign Classes *</Label>
              <p className="text-xs text-slate-500 mb-2">Teacher can only mark attendance for assigned classes</p>
              <div className="grid grid-cols-3 gap-2 p-3 bg-slate-50 rounded-lg border border-slate-200">
                {classes.map((cls) => (
                  <div key={cls} className="flex items-center space-x-2">
                    <Checkbox
                      id={cls}
                      checked={newTeacher.assigned_classes.includes(cls)}
                      onCheckedChange={() => handleClassToggle(cls)}
                      data-testid={`class-checkbox-${cls}`}
                    />
                    <label htmlFor={cls} className="text-sm text-slate-700 cursor-pointer">
                      {cls}
                    </label>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setCreateDialogOpen(false)}
              className="border-slate-200"
            >
              Cancel
            </Button>
            <Button 
              onClick={handleCreateTeacher}
              className="bg-blue-600 hover:bg-blue-700 text-white"
              disabled={submitting}
              data-testid="submit-teacher-btn"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                'Create Teacher'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Pay Salary Dialog */}
      <Dialog open={salaryDialogOpen} onOpenChange={setSalaryDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-slate-900">Record Salary Payment</DialogTitle>
            <DialogDescription>
              Pay salary to {selectedTeacher?.name}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label className="text-slate-700">Amount (₹) *</Label>
              <Input
                type="number"
                placeholder="Enter amount"
                value={newSalary.amount}
                onChange={(e) => setNewSalary({ ...newSalary, amount: e.target.value })}
                className="bg-white border-slate-200"
                data-testid="salary-amount-input"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-slate-700">Payment Remark</Label>
              <Textarea
                placeholder="e.g., January 2026 Salary, Bonus, etc."
                value={newSalary.remark}
                onChange={(e) => setNewSalary({ ...newSalary, remark: e.target.value })}
                className="bg-white border-slate-200"
                data-testid="salary-remark-input"
              />
            </div>
            <p className="text-xs text-slate-500">
              Date & time will be recorded automatically
            </p>
          </div>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => {
                setSalaryDialogOpen(false);
                setNewSalary({ amount: '', remark: '' });
              }}
              className="border-slate-200"
            >
              Cancel
            </Button>
            <Button 
              onClick={handlePaySalary}
              className="bg-green-600 hover:bg-green-700 text-white"
              disabled={submitting}
              data-testid="submit-salary-btn"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Recording...
                </>
              ) : (
                <>
                  <IndianRupee className="w-4 h-4 mr-2" />
                  Record Payment
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Salary History Dialog */}
      <Dialog open={historyDialogOpen} onOpenChange={setHistoryDialogOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-slate-900">Salary History</DialogTitle>
            <DialogDescription>
              Payment records for {selectedTeacher?.name}
            </DialogDescription>
          </DialogHeader>
          
          {loadingHistory ? (
            <div className="flex items-center justify-center h-32">
              <div className="spinner" />
            </div>
          ) : salaryHistory.length === 0 ? (
            <p className="text-center text-slate-500 py-8">No salary payments recorded yet</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date & Time</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Remark</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {salaryHistory.map((salary) => (
                    <TableRow key={salary.id}>
                      <TableCell className="font-mono text-sm">
                        {format(new Date(salary.paid_at), 'dd MMM yyyy, hh:mm a')}
                      </TableCell>
                      <TableCell className="font-semibold text-green-600">
                        ₹{salary.amount.toLocaleString()}
                      </TableCell>
                      <TableCell className="text-slate-600">
                        {salary.remark || '-'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <div className="mt-4 p-3 bg-slate-50 rounded-lg">
                <p className="text-sm font-semibold text-slate-700">
                  Total Paid: ₹{salaryHistory.reduce((sum, s) => sum + s.amount, 0).toLocaleString()}
                </p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Teacher</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete <strong>{selectedTeacher?.name}</strong>? 
              This will also delete their salary records.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
