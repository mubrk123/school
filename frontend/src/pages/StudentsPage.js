import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getStudents, deleteStudent, getClasses } from '../lib/api';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { Badge } from '../components/ui/badge';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '../components/ui/alert-dialog';
import { Plus, Search, Eye, Trash2, Phone, Calendar, Users } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';

export const StudentsPage = () => {
  const navigate = useNavigate();
  const { isPrincipal } = useAuth();
  const [students, setStudents] = useState([]);
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClass, setSelectedClass] = useState('all');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [studentToDelete, setStudentToDelete] = useState(null);

  useEffect(() => {
    fetchData();
  }, [selectedClass, searchTerm]);

  const fetchData = async () => {
    try {
      const [studentsRes, classesRes] = await Promise.all([
        getStudents({ 
          class_name: selectedClass !== 'all' ? selectedClass : undefined,
          search: searchTerm || undefined
        }),
        getClasses()
      ]);
      setStudents(studentsRes.data);
      setClasses(classesRes.data.classes);
    } catch (error) {
      toast.error('Failed to fetch students');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!studentToDelete) return;
    
    try {
      await deleteStudent(studentToDelete.id);
      toast.success('Student deleted successfully');
      fetchData();
    } catch (error) {
      toast.error('Failed to delete student');
    } finally {
      setDeleteDialogOpen(false);
      setStudentToDelete(null);
    }
  };

  const groupedStudents = students.reduce((acc, student) => {
    if (!acc[student.class_name]) {
      acc[student.class_name] = [];
    }
    acc[student.class_name].push(student);
    return acc;
  }, {});

  return (
    <div className="space-y-6 fade-in" data-testid="students-page">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Students</h1>
          <p className="text-slate-500 mt-1">Manage student records and information</p>
        </div>
        {isPrincipal && (
          <Button 
            onClick={() => navigate('/students/new')}
            className="bg-blue-600 hover:bg-blue-700 text-white btn-scale"
            data-testid="add-student-btn"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Student
          </Button>
        )}
      </div>

      {/* Filters */}
      <Card className="border-slate-200">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                placeholder="Search students..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-white border-slate-200"
                data-testid="search-students-input"
              />
            </div>
            <Select value={selectedClass} onValueChange={setSelectedClass}>
              <SelectTrigger className="w-full sm:w-48 bg-white border-slate-200" data-testid="class-filter-select">
                <SelectValue placeholder="All Classes" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Classes</SelectItem>
                {classes.map((cls) => (
                  <SelectItem key={cls} value={cls}>{cls}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Students List */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="spinner" />
        </div>
      ) : students.length === 0 ? (
        <Card className="border-slate-200">
          <CardContent className="p-12 text-center">
            <Users className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-slate-900 mb-2">No students found</h3>
            <p className="text-slate-500 mb-4">
              {searchTerm || selectedClass !== 'all' 
                ? 'Try adjusting your search or filters'
                : 'Get started by adding your first student'}
            </p>
            {isPrincipal && !searchTerm && selectedClass === 'all' && (
              <Button 
                onClick={() => navigate('/students/new')}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Student
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {selectedClass === 'all' ? (
            // Grouped by class
            Object.entries(groupedStudents)
              .sort(([a], [b]) => {
                const numA = parseInt(a.replace('Class ', ''));
                const numB = parseInt(b.replace('Class ', ''));
                return numA - numB;
              })
              .map(([className, classStudents]) => (
                <Card key={className} className="border-slate-200 overflow-hidden">
                  <CardHeader className="bg-slate-50 border-b border-slate-200 py-4">
                    <CardTitle className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                      <Users className="w-5 h-5 text-blue-600" />
                      {className}
                      <Badge variant="secondary" className="ml-2 bg-blue-100 text-blue-700">
                        {classStudents.length} students
                      </Badge>
                    </CardTitle>
                  </CardHeader>
                  <StudentTable 
                    students={classStudents} 
                    isPrincipal={isPrincipal}
                    onView={(id) => navigate(`/students/${id}`)}
                    onDelete={(student) => {
                      setStudentToDelete(student);
                      setDeleteDialogOpen(true);
                    }}
                  />
                </Card>
              ))
          ) : (
            // Single class
            <Card className="border-slate-200 overflow-hidden">
              <CardHeader className="bg-slate-50 border-b border-slate-200 py-4">
                <CardTitle className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                  <Users className="w-5 h-5 text-blue-600" />
                  {selectedClass}
                  <Badge variant="secondary" className="ml-2 bg-blue-100 text-blue-700">
                    {students.length} students
                  </Badge>
                </CardTitle>
              </CardHeader>
              <StudentTable 
                students={students} 
                isPrincipal={isPrincipal}
                onView={(id) => navigate(`/students/${id}`)}
                onDelete={(student) => {
                  setStudentToDelete(student);
                  setDeleteDialogOpen(true);
                }}
              />
            </Card>
          )}
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Student</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete <strong>{studentToDelete?.name}</strong>? 
              This action cannot be undone and will remove all associated records.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="cancel-delete-btn">Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700"
              data-testid="confirm-delete-btn"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

const StudentTable = ({ students, isPrincipal, onView, onDelete }) => {
  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow className="bg-slate-50">
            <TableHead className="font-semibold text-slate-700">Adm. No.</TableHead>
            <TableHead className="font-semibold text-slate-700">Name</TableHead>
            <TableHead className="font-semibold text-slate-700 hidden sm:table-cell">Parent Contact</TableHead>
            <TableHead className="font-semibold text-slate-700 hidden md:table-cell">Admission Date</TableHead>
            <TableHead className="font-semibold text-slate-700 text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {students.map((student) => (
            <TableRow key={student.id} className="table-row-hover">
              <TableCell className="font-mono text-sm text-slate-600">{student.admission_number}</TableCell>
              <TableCell className="font-medium text-slate-900">{student.name}</TableCell>
              <TableCell className="hidden sm:table-cell">
                <div className="flex items-center gap-1 text-slate-600">
                  <Phone className="w-3 h-3" />
                  {student.parent_contact}
                </div>
              </TableCell>
              <TableCell className="hidden md:table-cell">
                <div className="flex items-center gap-1 text-slate-600">
                  <Calendar className="w-3 h-3" />
                  {format(new Date(student.date_of_admission), 'dd MMM yyyy')}
                </div>
              </TableCell>
              <TableCell className="text-right">
                <div className="flex items-center justify-end gap-2">
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => onView(student.id)}
                    className="text-slate-600 hover:text-blue-600"
                    data-testid={`view-student-${student.id}`}
                  >
                    <Eye className="w-4 h-4" />
                  </Button>
                  {isPrincipal && (
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => onDelete(student)}
                      className="text-slate-600 hover:text-red-600"
                      data-testid={`delete-student-${student.id}`}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};
