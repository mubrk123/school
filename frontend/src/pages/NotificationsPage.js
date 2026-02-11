import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { getNotifications, createNotification, getNotificationContacts, getClasses } from '../lib/api';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { Badge } from '../components/ui/badge';
import { Plus, Bell, MessageSquare, Send, ExternalLink, Loader2, Users } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';

export const NotificationsPage = () => {
  const { isPrincipal, school } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [selectedNotification, setSelectedNotification] = useState(null);
  const [contacts, setContacts] = useState([]);
  const [loadingContacts, setLoadingContacts] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [newNotification, setNewNotification] = useState({
    title: '',
    message: '',
    target_class: ''
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [notificationsRes, classesRes] = await Promise.all([
        getNotifications(),
        getClasses()
      ]);
      setNotifications(notificationsRes.data);
      setClasses(classesRes.data.classes);
    } catch (error) {
      toast.error('Failed to fetch notifications');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!newNotification.title || !newNotification.message) {
      toast.error('Please fill in all required fields');
      return;
    }

    setSubmitting(true);
    try {
      await createNotification({
        ...newNotification,
        target_class: newNotification.target_class || null
      });
      toast.success('Notification created!');
      setCreateDialogOpen(false);
      setNewNotification({ title: '', message: '', target_class: '' });
      fetchData();
    } catch (error) {
      toast.error('Failed to create notification');
    } finally {
      setSubmitting(false);
    }
  };

  const handleView = async (notification) => {
    setSelectedNotification(notification);
    setViewDialogOpen(true);
    setLoadingContacts(true);
    
    try {
      const response = await getNotificationContacts(notification.id);
      setContacts(response.data.contacts);
    } catch (error) {
      toast.error('Failed to fetch contacts');
    } finally {
      setLoadingContacts(false);
    }
  };

  const openWhatsApp = (link) => {
    window.open(link, '_blank');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="spinner" />
      </div>
    );
  }

  return (
    <div className="space-y-6 fade-in" data-testid="notifications-page">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Notifications</h1>
          <p className="text-slate-500 mt-1">Send announcements to students via WhatsApp</p>
        </div>
        {isPrincipal && (
          <Button 
            onClick={() => setCreateDialogOpen(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white btn-scale"
            data-testid="create-notification-btn"
          >
            <Plus className="w-4 h-4 mr-2" />
            New Notification
          </Button>
        )}
      </div>

      {/* Notifications List */}
      {notifications.length === 0 ? (
        <Card className="border-slate-200">
          <CardContent className="p-12 text-center">
            <Bell className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-slate-900 mb-2">No Notifications</h3>
            <p className="text-slate-500 mb-4">Create your first notification to reach parents</p>
            {isPrincipal && (
              <Button 
                onClick={() => setCreateDialogOpen(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                <Plus className="w-4 h-4 mr-2" />
                Create Notification
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {notifications.map((notification) => (
            <Card 
              key={notification.id} 
              className="border-slate-200 card-hover cursor-pointer"
              onClick={() => handleView(notification)}
              data-testid={`notification-card-${notification.id}`}
            >
              <CardContent className="p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-4 flex-1">
                    <div className="p-2 bg-blue-100 rounded-lg shrink-0">
                      <MessageSquare className="w-5 h-5 text-blue-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-slate-900">{notification.title}</h3>
                        <Badge variant="secondary" className="bg-slate-100 text-slate-700">
                          {notification.target_class || 'All Classes'}
                        </Badge>
                      </div>
                      <p className="text-slate-600 line-clamp-2">{notification.message}</p>
                      <p className="text-sm text-slate-400 mt-2">
                        {format(new Date(notification.created_at), 'dd MMM yyyy, hh:mm a')}
                      </p>
                    </div>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="text-blue-600 hover:text-blue-700 shrink-0"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleView(notification);
                    }}
                  >
                    <Send className="w-4 h-4 mr-1" />
                    Send
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create Notification Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-slate-900">Create Notification</DialogTitle>
            <DialogDescription>
              Send an announcement to students and parents via WhatsApp
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label className="text-slate-700">Title *</Label>
              <Input
                placeholder="e.g., School Holiday Announcement"
                value={newNotification.title}
                onChange={(e) => setNewNotification({ ...newNotification, title: e.target.value })}
                className="bg-white border-slate-200"
                data-testid="notification-title-input"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-slate-700">Target Class</Label>
              <Select 
                value={newNotification.target_class || 'all'} 
                onValueChange={(value) => setNewNotification({ ...newNotification, target_class: value === 'all' ? '' : value })}
              >
                <SelectTrigger className="bg-white border-slate-200" data-testid="notification-class-select">
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
              <Label className="text-slate-700">Message *</Label>
              <Textarea
                placeholder="Enter your message..."
                value={newNotification.message}
                onChange={(e) => setNewNotification({ ...newNotification, message: e.target.value })}
                className="bg-white border-slate-200 min-h-[120px]"
                data-testid="notification-message-input"
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
              onClick={handleCreate}
              className="bg-blue-600 hover:bg-blue-700 text-white"
              disabled={submitting}
              data-testid="submit-notification-btn"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Bell className="w-4 h-4 mr-2" />
                  Create
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Notification & Send Dialog */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-slate-900">{selectedNotification?.title}</DialogTitle>
            <DialogDescription>
              {selectedNotification?.target_class || 'All Classes'} • {selectedNotification && format(new Date(selectedNotification.created_at), 'dd MMM yyyy')}
            </DialogDescription>
          </DialogHeader>
          
          <div className="bg-slate-50 rounded-lg p-4 my-4">
            <p className="text-slate-700">{selectedNotification?.message}</p>
          </div>
          
          <div>
            <h4 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
              <Users className="w-4 h-4" />
              Recipients ({contacts.length})
            </h4>
            
            {loadingContacts ? (
              <div className="flex items-center justify-center h-32">
                <div className="spinner" />
              </div>
            ) : contacts.length === 0 ? (
              <p className="text-center text-slate-500 py-8">No recipients found</p>
            ) : (
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {contacts.map((contact, index) => (
                  <div 
                    key={index}
                    className="flex items-center justify-between p-3 bg-white rounded-lg border border-slate-200"
                  >
                    <div>
                      <p className="font-medium text-slate-900">{contact.student_name}</p>
                      <p className="text-sm text-slate-500">{contact.parent_contact}</p>
                    </div>
                    <Button
                      size="sm"
                      onClick={() => openWhatsApp(contact.whatsapp_link)}
                      className="bg-green-600 hover:bg-green-700 text-white"
                      data-testid={`whatsapp-btn-${index}`}
                    >
                      <ExternalLink className="w-4 h-4 mr-1" />
                      WhatsApp
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="mt-4 p-4 bg-amber-50 rounded-lg border border-amber-200">
            <p className="text-sm text-amber-800">
              <strong>Note:</strong> Click the WhatsApp button to open a pre-filled message in WhatsApp Web/App. 
              You'll need to send each message individually.
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
