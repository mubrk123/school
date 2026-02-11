import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { getFeeBills, createFeeBill, getFeeBillStudents, markFeePaid, getClasses } from '../lib/api';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '../components/ui/alert-dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { Badge } from '../components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Plus, CreditCard, CheckCircle, Loader2, ArrowLeft, IndianRupee, Filter, Users } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';

export const FeesPage = () => {
  const { isPrincipal } = useAuth();
  const [feeBills, setFeeBills] = useState([]);
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [selectedBill, setSelectedBill] = useState(null);
  const [billStudents, setBillStudents] = useState([]);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [selectedFee, setSelectedFee] = useState(null);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [markingPaid, setMarkingPaid] = useState(false);
  const [classFilter, setClassFilter] = useState('all');

  const [newBill, setNewBill] = useState({
    name: '',
    amount: '',
    description: '',
    target_class: '',
    due_date: ''
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [billsRes, classesRes] = await Promise.all([
        getFeeBills(),
        getClasses()
      ]);
      setFeeBills(billsRes.data);
      setClasses(classesRes.data.classes);
    } catch (error) {
      toast.error('Failed to fetch fee bills');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateBill = async () => {
    if (!newBill.name || !newBill.amount) {
      toast.error('Please fill in required fields');
      return;
    }

    try {
      await createFeeBill({
        ...newBill,
        amount: parseFloat(newBill.amount),
        target_class: newBill.target_class || null,
        due_date: newBill.due_date || null
      });
      toast.success('Fee bill created and assigned to students!');
      setCreateDialogOpen(false);
      setNewBill({ name: '', amount: '', description: '', target_class: '', due_date: '' });
      fetchData();
    } catch (error) {
      toast.error('Failed to create fee bill');
    }
  };

  const handleViewBill = async (bill) => {
    setSelectedBill(bill);
    setClassFilter('all');
    setLoadingStudents(true);
    
    try {
      const response = await getFeeBillStudents(bill.id);
      setBillStudents(response.data);
    } catch (error) {
      toast.error('Failed to fetch students');
    } finally {
      setLoadingStudents(false);
    }
  };

  const handleMarkPaid = (fee) => {
    setSelectedFee(fee);
    setConfirmDialogOpen(true);
  };

  const confirmMarkPaid = async () => {
    if (!selectedFee) return;
    
    setMarkingPaid(true);
    try {
      await markFeePaid(selectedFee.id, { remarks: '' });
      toast.success('Fee marked as paid!');
      
      // Update local state
      setBillStudents(prev => prev.map(f => 
        f.id === selectedFee.id ? { ...f, status: 'paid', paid_at: new Date().toISOString() } : f
      ));
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to mark as paid');
    } finally {
      setMarkingPaid(false);
      setConfirmDialogOpen(false);
      setSelectedFee(null);
    }
  };

  const feeTypes = [
    'Monthly Fee',
    'Registration Fee',
    'Annual Fee',
    'Examination Fee',
    'Sports Fee',
    'Library Fee',
    'Lab Fee',
    'Republic Day Fee',
    'Independence Day Fee',
    'Other'
  ];

  // Filter students by class
  const filteredStudents = billStudents.filter(s => {
    if (classFilter === 'all') return true;
    return s.student_class === classFilter;
  });

  const unpaidStudents = filteredStudents.filter(s => s.status === 'unpaid');
  const paidStudents = filteredStudents.filter(s => s.status === 'paid');

  // Get unique classes from students
  const studentClasses = [...new Set(billStudents.map(s => s.student_class))].sort((a, b) => {
    const numA = parseInt(a?.replace('Class ', '') || '0');
    const numB = parseInt(b?.replace('Class ', '') || '0');
    return numA - numB;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="spinner" />
      </div>
    );
  }

  // Detail View
  if (selectedBill) {
    return (
      <div className="space-y-6 fade-in" data-testid="fee-detail-page">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => {
              setSelectedBill(null);
              setBillStudents([]);
            }}
            className="text-slate-600"
            data-testid="back-to-fees-btn"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Fees
          </Button>
        </div>

        {/* Fee Info */}
        <Card className="border-slate-200">
          <CardContent className="p-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h1 className="text-2xl font-bold text-slate-900">{selectedBill.name}</h1>
                <p className="text-slate-500 mt-1">{selectedBill.description || 'No description'}</p>
              </div>
              <div className="flex items-center gap-4">
                <Badge variant="secondary" className="bg-blue-100 text-blue-700 text-lg px-4 py-2">
                  ₹{selectedBill.amount.toLocaleString()}
                </Badge>
                <Badge variant="secondary" className="bg-slate-100 text-slate-700">
                  {selectedBill.target_class || 'All Classes'}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Filter */}
        <Card className="border-slate-200">
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row sm:items-center gap-4">
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-slate-500" />
                <span className="text-sm font-medium text-slate-700">Filter by Class:</span>
              </div>
              <Select value={classFilter} onValueChange={setClassFilter}>
                <SelectTrigger className="w-full sm:w-48 bg-white border-slate-200" data-testid="fee-class-filter">
                  <SelectValue placeholder="All Classes" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Classes</SelectItem>
                  {studentClasses.map((cls) => (
                    <SelectItem key={cls} value={cls}>{cls}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div className="flex gap-2 ml-auto">
                <Badge variant="secondary" className="bg-red-100 text-red-700">
                  Unpaid: {unpaidStudents.length}
                </Badge>
                <Badge variant="secondary" className="bg-green-100 text-green-700">
                  Paid: {paidStudents.length}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Students List */}
        {loadingStudents ? (
          <div className="flex items-center justify-center h-48">
            <div className="spinner" />
          </div>
        ) : (
          <Tabs defaultValue="unpaid" className="w-full">
            <TabsList className="bg-slate-100">
              <TabsTrigger value="unpaid" className="data-[state=active]:bg-white" data-testid="unpaid-tab">
                Unpaid ({unpaidStudents.length})
              </TabsTrigger>
              <TabsTrigger value="paid" className="data-[state=active]:bg-white" data-testid="paid-tab">
                Paid ({paidStudents.length})
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="unpaid" className="mt-4">
              <Card className="border-slate-200">
                {unpaidStudents.length === 0 ? (
                  <CardContent className="p-8 text-center">
                    <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
                    <p className="text-slate-500">All fees collected for this filter!</p>
                  </CardContent>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-slate-50">
                          <TableHead className="font-semibold">Student Name</TableHead>
                          <TableHead className="font-semibold">Class</TableHead>
                          <TableHead className="font-semibold">Amount</TableHead>
                          <TableHead className="font-semibold text-right">Action</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {unpaidStudents.map((fee) => (
                          <TableRow key={fee.id} className="table-row-hover">
                            <TableCell className="font-medium text-slate-900">{fee.student_name}</TableCell>
                            <TableCell>
                              <Badge variant="secondary" className="bg-slate-100 text-slate-700">
                                {fee.student_class}
                              </Badge>
                            </TableCell>
                            <TableCell className="font-semibold">₹{fee.amount.toLocaleString()}</TableCell>
                            <TableCell className="text-right">
                              <Button
                                size="sm"
                                onClick={() => handleMarkPaid(fee)}
                                className="bg-green-600 hover:bg-green-700 text-white btn-scale"
                                data-testid={`mark-paid-btn-${fee.id}`}
                              >
                                <CheckCircle className="w-4 h-4 mr-1" />
                                Mark Paid
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </Card>
            </TabsContent>
            
            <TabsContent value="paid" className="mt-4">
              <Card className="border-slate-200">
                {paidStudents.length === 0 ? (
                  <CardContent className="p-8 text-center">
                    <p className="text-slate-500">No payments yet for this filter</p>
                  </CardContent>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-slate-50">
                          <TableHead className="font-semibold">Student Name</TableHead>
                          <TableHead className="font-semibold">Class</TableHead>
                          <TableHead className="font-semibold">Amount</TableHead>
                          <TableHead className="font-semibold">Paid On</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {paidStudents.map((fee) => (
                          <TableRow key={fee.id} className="table-row-hover">
                            <TableCell className="font-medium text-slate-900">{fee.student_name}</TableCell>
                            <TableCell>
                              <Badge variant="secondary" className="bg-slate-100 text-slate-700">
                                {fee.student_class}
                              </Badge>
                            </TableCell>
                            <TableCell className="font-semibold text-green-600">₹{fee.amount.toLocaleString()}</TableCell>
                            <TableCell className="text-slate-600">
                              {fee.paid_at ? format(new Date(fee.paid_at), 'dd MMM yyyy, hh:mm a') : '-'}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </Card>
            </TabsContent>
          </Tabs>
        )}

        {/* Confirm Mark Paid Dialog */}
        <AlertDialog open={confirmDialogOpen} onOpenChange={setConfirmDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Confirm Payment</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to mark this fee as <strong>PAID</strong> for{' '}
                <strong>{selectedFee?.student_name}</strong>?
                <br /><br />
                <span className="text-amber-600 font-medium">
                  ⚠️ This action cannot be undone. Once marked as paid, the status cannot be changed.
                </span>
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel data-testid="cancel-mark-paid-btn">Cancel</AlertDialogCancel>
              <AlertDialogAction 
                onClick={confirmMarkPaid}
                className="bg-green-600 hover:bg-green-700"
                disabled={markingPaid}
                data-testid="confirm-mark-paid-btn"
              >
                {markingPaid ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Confirm Payment
                  </>
                )}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    );
  }

  // Main List View
  return (
    <div className="space-y-6 fade-in" data-testid="fees-page">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Fee Management</h1>
          <p className="text-slate-500 mt-1">Create and manage fee bills for students</p>
        </div>
        {isPrincipal && (
          <Button 
            onClick={() => setCreateDialogOpen(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white btn-scale"
            data-testid="create-bill-btn"
          >
            <Plus className="w-4 h-4 mr-2" />
            Create Fee Bill
          </Button>
        )}
      </div>

      {/* Active Fee Bills */}
      {feeBills.length === 0 ? (
        <Card className="border-slate-200">
          <CardContent className="p-12 text-center">
            <CreditCard className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-slate-900 mb-2">No Fee Bills</h3>
            <p className="text-slate-500 mb-4">Create your first fee bill to get started</p>
            {isPrincipal && (
              <Button 
                onClick={() => setCreateDialogOpen(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                <Plus className="w-4 h-4 mr-2" />
                Create Fee Bill
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-slate-900">Active Fee Bills</h2>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50">
                  <TableHead className="font-semibold">Fee Type</TableHead>
                  <TableHead className="font-semibold">Amount</TableHead>
                  <TableHead className="font-semibold">Target Class</TableHead>
                  <TableHead className="font-semibold">Created On</TableHead>
                  <TableHead className="font-semibold">Due Date</TableHead>
                  <TableHead className="font-semibold text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {feeBills.map((bill) => (
                  <TableRow 
                    key={bill.id} 
                    className="table-row-hover cursor-pointer"
                    onClick={() => handleViewBill(bill)}
                    data-testid={`fee-bill-row-${bill.id}`}
                  >
                    <TableCell className="font-medium text-slate-900">{bill.name}</TableCell>
                    <TableCell className="font-semibold text-blue-600">₹{bill.amount.toLocaleString()}</TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="bg-slate-100 text-slate-700">
                        {bill.target_class || 'All Classes'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-slate-600">
                      {format(new Date(bill.created_at), 'dd MMM yyyy')}
                    </TableCell>
                    <TableCell className="text-slate-600">
                      {bill.due_date ? format(new Date(bill.due_date), 'dd MMM yyyy') : '-'}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleViewBill(bill);
                        }}
                        className="border-slate-200"
                        data-testid={`view-bill-btn-${bill.id}`}
                      >
                        <Users className="w-4 h-4 mr-1" />
                        View Students
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      )}

      {/* Create Bill Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-slate-900">Create Fee Bill</DialogTitle>
            <DialogDescription>
              Create a new fee bill that will be assigned to students
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label className="text-slate-700">Fee Type *</Label>
              <Select 
                value={newBill.name} 
                onValueChange={(value) => setNewBill({ ...newBill, name: value })}
              >
                <SelectTrigger className="bg-white border-slate-200" data-testid="fee-type-select">
                  <SelectValue placeholder="Select fee type" />
                </SelectTrigger>
                <SelectContent>
                  {feeTypes.map((type) => (
                    <SelectItem key={type} value={type}>{type}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-slate-700">Amount (₹) *</Label>
              <Input
                type="number"
                placeholder="Enter amount"
                value={newBill.amount}
                onChange={(e) => setNewBill({ ...newBill, amount: e.target.value })}
                className="bg-white border-slate-200"
                data-testid="fee-amount-input"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-slate-700">Target Class</Label>
              <Select 
                value={newBill.target_class || 'all'} 
                onValueChange={(value) => setNewBill({ ...newBill, target_class: value === 'all' ? '' : value })}
              >
                <SelectTrigger className="bg-white border-slate-200" data-testid="fee-class-select">
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
            <div className="space-y-2">
              <Label className="text-slate-700">Due Date</Label>
              <Input
                type="date"
                value={newBill.due_date}
                onChange={(e) => setNewBill({ ...newBill, due_date: e.target.value })}
                className="bg-white border-slate-200"
                data-testid="fee-due-date-input"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-slate-700">Description</Label>
              <Textarea
                placeholder="Add any additional details..."
                value={newBill.description}
                onChange={(e) => setNewBill({ ...newBill, description: e.target.value })}
                className="bg-white border-slate-200"
                data-testid="fee-description-input"
              />
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
              onClick={handleCreateBill}
              className="bg-blue-600 hover:bg-blue-700 text-white"
              data-testid="submit-fee-bill-btn"
            >
              Create Bill
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
