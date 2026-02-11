import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API_URL = `${BACKEND_URL}/api`;

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      localStorage.removeItem('school');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth
export const registerSchool = (schoolData, userData) => 
  api.post('/auth/register-school', null, { params: { ...schoolData, ...userData } });

export const registerSchoolFull = (data) => 
  api.post('/auth/register-school', data, {
    params: {
      name: data.school_name,
      address: data.school_address,
      phone: data.school_phone,
      email: data.school_email
    }
  });

export const login = (email, password) => 
  api.post('/auth/login', { email, password });

export const getMe = () => api.get('/auth/me');

// Users
export const createUser = (data) => api.post('/users', data);
export const getUsers = () => api.get('/users');
export const deleteUser = (id) => api.delete(`/users/${id}`);

// Students
export const createStudent = (data) => api.post('/students', data);
export const getStudents = (params) => api.get('/students', { params });
export const getStudent = (id) => api.get(`/students/${id}`);
export const updateStudent = (id, data) => api.put(`/students/${id}`, data);
export const deleteStudent = (id) => api.delete(`/students/${id}`);

// Fee Bills
export const createFeeBill = (data) => api.post('/fee-bills', data);
export const getFeeBills = () => api.get('/fee-bills');
export const getFeeBillStudents = (id, status) => 
  api.get(`/fee-bills/${id}/students`, { params: { status } });
export const markFeePaid = (feeId, data) => 
  api.put(`/student-fees/${feeId}/mark-paid`, data);
export const getStudentFees = (studentId) => 
  api.get(`/students/${studentId}/fees`);

// Attendance
export const markAttendance = (data) => api.post('/attendance', data);
export const getAttendance = (date, className) => 
  api.get('/attendance', { params: { date, class_name: className } });
export const getStudentAttendance = (studentId, days = 60) => 
  api.get(`/students/${studentId}/attendance`, { params: { days } });

// Notifications
export const createNotification = (data) => api.post('/notifications', data);
export const getNotifications = () => api.get('/notifications');
export const getNotificationContacts = (id) => 
  api.get(`/notifications/${id}/contacts`);

// Dashboard
export const getDashboardStats = () => api.get('/dashboard/stats');

// Classes
export const getClasses = () => api.get('/classes');

export default api;
