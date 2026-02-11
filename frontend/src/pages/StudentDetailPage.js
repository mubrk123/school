import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getStudent, updateStudent, getStudentFees, getStudentAttendance } from '../lib/api';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Badge } from '../components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { ArrowLeft, User, Phone, MapPin, Calendar, Edit2, Save, X, CreditCard, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';

export const StudentDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isPrincipal } = useAuth();
  const [student, setStudent] = useState(null);
  const [fees, setFees] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [editData, setEditData] = useState({});

  useEffect(() => {
    fetchData();
  }, [id]);

  const fetchData = async () => {
    try {
      const [studentRes, feesRes, attendanceRes] = await Promise.all([
        getStudent(id),
        getStudentFees(id),
        getStudentAttendance(id, 60)
      ]);
      setStudent(studentRes.data);
      setFees(feesRes.data);
      setAttendance(attendanceRes.data);
      setEditData(studentRes.data);
    } catch (error) {
      toast.error('Failed to fetch student details');
      navigate('/students');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      await updateStudent(id, {
        name: editData.name,
        father_name: editData.father_name,
        mother_name: editData.mother_name,
        address: editData.address,
        parent_contact: editData.parent_contact,
        parent_email: editData.parent_email
      });
      setStudent(editData);
      setEditing(false);
      toast.success('Student updated successfully');
    } catch (error) {
      toast.error('Failed to update student');
    }
  };

  const attendanceStats = {
    total: attendance.length,
    present: attendance.filter(a => a.status === 'present').length,
    absent: attendance.filter(a => a.status === 'absent').length,
    rate: attendance.length > 0 
      ? Math.round((attendance.filter(a => a.status === 'present').length / attendance.length) * 100) 
      : 0
  };

  const feeStats = {
    total: fees.length,
    paid: fees.filter(f => f.status === 'paid').length,
    unpaid: fees.filter(f => f.status === 'unpaid').length,
    totalAmount: fees.reduce((sum, f) => sum + f.amount, 0),
    paidAmount: fees.filter(f => f.status === 'paid').reduce((sum, f) => sum + f.amount, 0)
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="spinner" />
      </div>
    );
  }

  if (!student) {
    return (
      <div className="text-center py-12">
        <p className="text-slate-500">Student not found</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 fade-in" data-testid="student-detail-page">
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

      {/* Student Info Card */}
      <Card className="border-slate-200">
        <CardHeader className="flex flex-row items-center justify-between pb-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
              <User className="w-8 h-8 text-blue-600" />
            </div>
            <div>
              <CardTitle className="text-xl text-slate-900">{student.name}</CardTitle>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="secondary" className="bg-blue-100 text-blue-700">
                  {student.class_name}
                </Badge>
                <span className="text-sm text-slate-500 font-mono">{student.admission_number}</span>
              </div>
            </div>
          </div>
          {isPrincipal && !editing && (
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setEditing(true)}
              className="border-slate-200"
              data-testid="edit-student-btn"
            >
              <Edit2 className="w-4 h-4 mr-2" />
              Edit
            </Button>
          )}
          {editing && (
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => {
                  setEditing(false);
                  setEditData(student);
                }}
                className="border-slate-200"
                data-testid="cancel-edit-btn"
              >
                <X className="w-4 h-4 mr-2" />
                Cancel
              </Button>
              <Button 
                size="sm"
                onClick={handleSave}
                className="bg-blue-600 hover:bg-blue-700 text-white"
                data-testid="save-student-btn"
              >
                <Save className="w-4 h-4 mr-2" />
                Save
              </Button>
            </div>
          )}
        </CardHeader>
        <CardContent>
          {editing ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Name</Label>
                <Input
                  value={editData.name || ''}
                  onChange={(e) => setEditData({ ...editData, name: e.target.value })}
                  className="bg-white border-slate-200"
                />
              </div>
              <div className="space-y-2">
                <Label>Father's Name</Label>
                <Input
                  value={editData.father_name || ''}
                  onChange={(e) => setEditData({ ...editData, father_name: e.target.value })}
                  className="bg-white border-slate-200"
                />
              </div>
              <div className="space-y-2">
                <Label>Mother's Name</Label>
                <Input
                  value={editData.mother_name || ''}
                  onChange={(e) => setEditData({ ...editData, mother_name: e.target.value })}
                  className="bg-white border-slate-200"
                />
              </div>
              <div className="space-y-2">
                <Label>Parent Contact</Label>
                <Input
                  value={editData.parent_contact || ''}
                  onChange={(e) => setEditData({ ...editData, parent_contact: e.target.value })}
                  className="bg-white border-slate-200"
                />
              </div>
              <div className="space-y-2">
                <Label>Parent Email</Label>
                <Input
                  value={editData.parent_email || ''}
                  onChange={(e) => setEditData({ ...editData, parent_email: e.target.value })}
                  className="bg-white border-slate-200"
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label>Address</Label>
                <Input
                  value={editData.address || ''}
                  onChange={(e) => setEditData({ ...editData, address: e.target.value })}
                  className="bg-white border-slate-200"
                />
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <InfoItem icon={User} label="Father's Name" value={student.father_name} />
              <InfoItem icon={User} label="Mother's Name" value={student.mother_name} />
              <InfoItem icon={Phone} label="Parent Contact" value={student.parent_contact} />
              <InfoItem icon={MapPin} label="Address" value={student.address} />
              <InfoItem icon={Calendar} label="Date of Birth" value={student.date_of_birth ? format(new Date(student.date_of_birth), 'dd MMM yyyy') : '-'} />
              <InfoItem icon={Calendar} label="Admission Date" value={format(new Date(student.date_of_admission), 'dd MMM yyyy')} />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs defaultValue="attendance" className="w-full">
        <TabsList className="bg-slate-100 p-1">
          <TabsTrigger value="attendance" className="data-[state=active]:bg-white" data-testid="attendance-tab">
            <CheckCircle className="w-4 h-4 mr-2" />
            Attendance
          </TabsTrigger>
          <TabsTrigger value="fees" className="data-[state=active]:bg-white" data-testid="fees-tab">
            <CreditCard className="w-4 h-4 mr-2" />
            Fees
          </TabsTrigger>
        </TabsList>

        <TabsContent value="attendance" className="mt-4">
          <Card className="border-slate-200">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Attendance History (Last 60 Days)</CardTitle>
                <Badge variant="secondary" className={`${attendanceStats.rate >= 75 ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                  {attendanceStats.rate}% Attendance Rate
                </Badge>
              </div>
              <div className="flex gap-4 mt-2 text-sm">
                <span className="text-green-600">Present: {attendanceStats.present}</span>
                <span className="text-red-600">Absent: {attendanceStats.absent}</span>
              </div>
            </CardHeader>
            <CardContent>
              {attendance.length === 0 ? (
                <p className="text-slate-500 text-center py-8">No attendance records found</p>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {attendance.slice(0, 30).map((record) => (
                        <TableRow key={record.id}>
                          <TableCell>{format(new Date(record.date), 'EEEE, dd MMM yyyy')}</TableCell>
                          <TableCell>
                            <Badge className={record.status === 'present' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}>
                              {record.status.charAt(0).toUpperCase() + record.status.slice(1)}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="fees" className="mt-4">
          <Card className="border-slate-200">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Fee History</CardTitle>
                <div className="flex gap-2">
                  <Badge variant="secondary" className="bg-green-100 text-green-700">
                    Paid: ₹{feeStats.paidAmount.toLocaleString()}
                  </Badge>
                  <Badge variant="secondary" className="bg-red-100 text-red-700">
                    Pending: ₹{(feeStats.totalAmount - feeStats.paidAmount).toLocaleString()}
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {fees.length === 0 ? (
                <p className="text-slate-500 text-center py-8">No fee records found</p>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Fee Type</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Paid On</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {fees.map((fee) => (
                        <TableRow key={fee.id}>
                          <TableCell className="font-medium">{fee.fee_bill_name}</TableCell>
                          <TableCell>₹{fee.amount.toLocaleString()}</TableCell>
                          <TableCell>
                            <Badge className={fee.status === 'paid' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}>
                              {fee.status.charAt(0).toUpperCase() + fee.status.slice(1)}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {fee.paid_at ? format(new Date(fee.paid_at), 'dd MMM yyyy') : '-'}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

const InfoItem = ({ icon: Icon, label, value }) => (
  <div className="flex items-start gap-3">
    <div className="p-2 bg-slate-100 rounded-lg">
      <Icon className="w-4 h-4 text-slate-600" />
    </div>
    <div>
      <p className="text-sm text-slate-500">{label}</p>
      <p className="font-medium text-slate-900">{value || '-'}</p>
    </div>
  </div>
);
