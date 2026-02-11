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
import { Plus, CreditCard, Users, CheckCircle, Loader2, Eye, IndianRupee } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';

export const FeesPage = () => {
  const { isPrincipal } = useAuth();
  const [feeBills, setFeeBills] = useState([]);
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [selectedBill, setSelectedBill] = useState(null);
  const [billStudents, setBillStudents] = useState([]);
  const [selectedFee, setSelectedFee] = useState(null);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [markingPaid, setMarkingPaid] = useState(false);

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
    setViewDialogOpen(true);
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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="spinner" />
      </div>
    );
  }

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

      {/* Fee Bills List */}
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {feeBills.map((bill) => (
            <Card 
              key={bill.id} 
              className="border-slate-200 card-hover cursor-pointer"
              onClick={() => handleViewBill(bill)}
              data-testid={`fee-bill-card-${bill.id}`}
            >
              <CardContent className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <IndianRupee className="w-5 h-5 text-blue-600" />
                  </div>
                  <Badge variant="secondary" className="bg-slate-100 text-slate-700">
                    {bill.target_class || 'All Classes'}
                  </Badge>
                </div>
                <h3 className="font-semibold text-slate-900 mb-1">{bill.name}</h3>
                <p className="text-2xl font-bold text-blue-600 mb-2">₹{bill.amount.toLocaleString()}</p>
                {bill.description && (
                  <p className="text-sm text-slate-500 mb-3 line-clamp-2">{bill.description}</p>
                )}
                <div className="flex items-center justify-between text-sm text-slate-500">
                  <span>{format(new Date(bill.created_at), 'dd MMM yyyy')}</span>
                  <Button variant="ghost" size="sm" className="text-blue-600 hover:text-blue-700 p-0">
                    <Eye className="w-4 h-4 mr-1" />
                    View
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
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
                value={newBill.target_class} 
                onValueChange={(value) => setNewBill({ ...newBill, target_class: value })}
              >
                <SelectTrigger className="bg-white border-slate-200" data-testid="fee-class-select">
                  <SelectValue placeholder="All Classes" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Classes</SelectItem>
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

      {/* View Bill Dialog */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="sm:max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-slate-900">{selectedBill?.name}</DialogTitle>
            <DialogDescription>
              ₹{selectedBill?.amount.toLocaleString()} • {selectedBill?.target_class || 'All Classes'}
            </DialogDescription>
          </DialogHeader>
          
          {loadingStudents ? (
            <div className="flex items-center justify-center h-48">
              <div className="spinner" />
            </div>
          ) : (
            <Tabs defaultValue="unpaid" className="w-full">
              <TabsList className="bg-slate-100">
                <TabsTrigger value="unpaid" className="data-[state=active]:bg-white">
                  Unpaid ({billStudents.filter(s => s.status === 'unpaid').length})
                </TabsTrigger>
                <TabsTrigger value="paid" className="data-[state=active]:bg-white">
                  Paid ({billStudents.filter(s => s.status === 'paid').length})
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="unpaid" className="mt-4">
                {billStudents.filter(s => s.status === 'unpaid').length === 0 ? (
                  <p className="text-center text-slate-500 py-8">All fees have been paid!</p>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Student</TableHead>
                          <TableHead>Class</TableHead>
                          <TableHead>Amount</TableHead>
                          <TableHead className="text-right">Action</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {billStudents.filter(s => s.status === 'unpaid').map((fee) => (
                          <TableRow key={fee.id}>
                            <TableCell className="font-medium">{fee.student_name}</TableCell>
                            <TableCell>{fee.student_class}</TableCell>
                            <TableCell>₹{fee.amount.toLocaleString()}</TableCell>
                            <TableCell className="text-right">
                              <Button
                                size="sm"
                                onClick={() => handleMarkPaid(fee)}
                                className="bg-green-600 hover:bg-green-700 text-white"
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
              </TabsContent>
              
              <TabsContent value="paid" className="mt-4">
                {billStudents.filter(s => s.status === 'paid').length === 0 ? (
                  <p className="text-center text-slate-500 py-8">No payments yet</p>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Student</TableHead>
                          <TableHead>Class</TableHead>
                          <TableHead>Amount</TableHead>
                          <TableHead>Paid On</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {billStudents.filter(s => s.status === 'paid').map((fee) => (
                          <TableRow key={fee.id}>
                            <TableCell className="font-medium">{fee.student_name}</TableCell>
                            <TableCell>{fee.student_class}</TableCell>
                            <TableCell>₹{fee.amount.toLocaleString()}</TableCell>
                            <TableCell>
                              {fee.paid_at ? format(new Date(fee.paid_at), 'dd MMM yyyy') : '-'}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          )}
        </DialogContent>
      </Dialog>

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
};
