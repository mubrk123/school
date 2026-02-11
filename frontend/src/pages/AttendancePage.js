import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { getStudents, getClasses, markAttendance, getAttendance } from '../lib/api';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Calendar } from '../components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '../components/ui/popover';
import { Badge } from '../components/ui/badge';
import { CalendarIcon, Check, X, Loader2, Users, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { cn } from '../lib/utils';

export const AttendancePage = () => {
  const { user } = useAuth();
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [students, setStudents] = useState([]);
  const [attendanceRecords, setAttendanceRecords] = useState({});
  const [existingAttendance, setExistingAttendance] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [classes, setClasses] = useState([]);

  useEffect(() => {
    fetchClasses();
  }, []);

  useEffect(() => {
    if (selectedClass) {
      fetchStudents();
    }
  }, [selectedClass, selectedDate]);

  const fetchClasses = async () => {
    try {
      const response = await getClasses();
      setClasses(response.data.classes);
    } catch (error) {
      console.error('Failed to fetch classes');
    }
  };

  const fetchStudents = async () => {
    setLoading(true);
    try {
      const [studentsRes, attendanceRes] = await Promise.all([
        getStudents({ class_name: selectedClass }),
        getAttendance(format(selectedDate, 'yyyy-MM-dd'), selectedClass)
      ]);
      
      setStudents(studentsRes.data);
      setExistingAttendance(attendanceRes.data);
      
      // Initialize attendance records from existing data
      const records = {};
      attendanceRes.data.forEach(record => {
        records[record.student_id] = record.status;
      });
      setAttendanceRecords(records);
    } catch (error) {
      toast.error('Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  const handleAttendanceChange = (studentId, status) => {
    setAttendanceRecords(prev => ({
      ...prev,
      [studentId]: status
    }));
  };

  const handleSubmit = async () => {
    if (Object.keys(attendanceRecords).length !== students.length) {
      toast.error('Please mark attendance for all students');
      return;
    }

    setSubmitting(true);
    try {
      const records = Object.entries(attendanceRecords).map(([studentId, status]) => ({
        student_id: studentId,
        status
      }));

      await markAttendance({
        date: format(selectedDate, 'yyyy-MM-dd'),
        records
      });

      toast.success('Attendance saved successfully!');
    } catch (error) {
      toast.error('Failed to save attendance');
    } finally {
      setSubmitting(false);
    }
  };

  const stats = {
    total: students.length,
    marked: Object.keys(attendanceRecords).length,
    present: Object.values(attendanceRecords).filter(s => s === 'present').length,
    absent: Object.values(attendanceRecords).filter(s => s === 'absent').length
  };

  return (
    <div className="space-y-6 fade-in" data-testid="attendance-page">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Daily Attendance</h1>
        <p className="text-slate-500 mt-1">Mark attendance for your class</p>
      </div>

      {/* Filters */}
      <Card className="border-slate-200">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <label className="text-sm font-medium text-slate-700 mb-2 block">Select Class</label>
              <Select value={selectedClass} onValueChange={setSelectedClass}>
                <SelectTrigger className="bg-white border-slate-200" data-testid="attendance-class-select">
                  <SelectValue placeholder="Choose a class" />
                </SelectTrigger>
                <SelectContent>
                  {classes.map((cls) => (
                    <SelectItem key={cls} value={cls}>{cls}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex-1">
              <label className="text-sm font-medium text-slate-700 mb-2 block">Select Date</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal bg-white border-slate-200",
                      !selectedDate && "text-muted-foreground"
                    )}
                    data-testid="attendance-date-picker"
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {selectedDate ? format(selectedDate, "PPP") : <span>Pick a date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={(date) => date && setSelectedDate(date)}
                    disabled={(date) => date > new Date()}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Attendance List */}
      {!selectedClass ? (
        <Card className="border-slate-200">
          <CardContent className="p-12 text-center">
            <Users className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-slate-900 mb-2">Select a Class</h3>
            <p className="text-slate-500">Choose a class to start marking attendance</p>
          </CardContent>
        </Card>
      ) : loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="spinner" />
        </div>
      ) : students.length === 0 ? (
        <Card className="border-slate-200">
          <CardContent className="p-12 text-center">
            <Users className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-slate-900 mb-2">No Students Found</h3>
            <p className="text-slate-500">There are no students in {selectedClass}</p>
          </CardContent>
        </Card>
      ) : (
        <Card className="border-slate-200">
          <CardHeader className="pb-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <CardTitle className="text-lg flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-blue-600" />
                  {selectedClass} - {format(selectedDate, 'dd MMM yyyy')}
                </CardTitle>
                <CardDescription>
                  {stats.marked}/{stats.total} students marked
                </CardDescription>
              </div>
              <div className="flex gap-2">
                <Badge variant="secondary" className="bg-green-100 text-green-700">
                  Present: {stats.present}
                </Badge>
                <Badge variant="secondary" className="bg-red-100 text-red-700">
                  Absent: {stats.absent}
                </Badge>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {students.map((student, index) => (
                <div 
                  key={student.id}
                  className="flex items-center justify-between p-4 bg-slate-50 rounded-lg border border-slate-100"
                  data-testid={`student-attendance-row-${student.id}`}
                >
                  <div className="flex items-center gap-4">
                    <span className="text-sm font-mono text-slate-500 w-8">{index + 1}.</span>
                    <div>
                      <p className="font-medium text-slate-900">{student.name}</p>
                      <p className="text-sm text-slate-500">{student.admission_number}</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => handleAttendanceChange(student.id, 'present')}
                      className={cn(
                        "attendance-btn attendance-present",
                        attendanceRecords[student.id] === 'present' && "active"
                      )}
                      data-testid={`present-btn-${student.id}`}
                    >
                      <Check className="w-4 h-4 inline mr-1" />
                      Present
                    </button>
                    <button
                      type="button"
                      onClick={() => handleAttendanceChange(student.id, 'absent')}
                      className={cn(
                        "attendance-btn attendance-absent",
                        attendanceRecords[student.id] === 'absent' && "active"
                      )}
                      data-testid={`absent-btn-${student.id}`}
                    >
                      <X className="w-4 h-4 inline mr-1" />
                      Absent
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Submit Button */}
            <div className="mt-6 pt-6 border-t border-slate-200">
              <Button
                onClick={handleSubmit}
                className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white btn-scale"
                disabled={submitting || stats.marked !== stats.total}
                data-testid="submit-attendance-btn"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Submit Attendance
                  </>
                )}
              </Button>
              {stats.marked !== stats.total && (
                <p className="text-sm text-amber-600 mt-2">
                  Please mark attendance for all students before submitting
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
