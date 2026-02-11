import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { getDashboardStats, getStudents, getFeeBills } from '../lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Users, BookOpen, CreditCard, CheckCircle, UserPlus, TrendingUp } from 'lucide-react';

export const DashboardPage = () => {
  const { school, isPrincipal } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await getDashboardStats();
        setStats(response.data);
      } catch (error) {
        console.error('Error fetching stats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  const statCards = [
    {
      title: 'Total Students',
      value: stats?.total_students || 0,
      icon: Users,
      color: 'text-blue-600',
      bg: 'bg-blue-50',
      border: 'border-blue-100'
    },
    {
      title: 'Active Classes',
      value: stats?.total_classes || 0,
      icon: BookOpen,
      color: 'text-emerald-600',
      bg: 'bg-emerald-50',
      border: 'border-emerald-100'
    },
    {
      title: 'Pending Fees',
      value: stats?.pending_fees || 0,
      icon: CreditCard,
      color: 'text-amber-600',
      bg: 'bg-amber-50',
      border: 'border-amber-100'
    },
    {
      title: 'Today\'s Attendance',
      value: `${stats?.today_attendance_rate || 0}%`,
      icon: CheckCircle,
      color: 'text-violet-600',
      bg: 'bg-violet-50',
      border: 'border-violet-100'
    },
    {
      title: 'New Admissions',
      value: stats?.recent_admissions || 0,
      subtitle: 'Last 30 days',
      icon: UserPlus,
      color: 'text-rose-600',
      bg: 'bg-rose-50',
      border: 'border-rose-100'
    }
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="spinner" />
      </div>
    );
  }

  return (
    <div className="space-y-8 fade-in" data-testid="dashboard-page">
      {/* Welcome Section */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 sm:p-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-2">
              Welcome to {school?.name || 'Your School'}
            </h1>
            <p className="text-slate-500">
              Here's what's happening at your school today
            </p>
          </div>
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <TrendingUp className="w-4 h-4" />
            <span>Dashboard Overview</span>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 sm:gap-6">
        {statCards.map((stat, index) => (
          <Card 
            key={index} 
            className={`border ${stat.border} card-hover bg-white`}
            data-testid={`stat-card-${stat.title.toLowerCase().replace(/\s+/g, '-')}`}
          >
            <CardContent className="p-5 sm:p-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-500 mb-1">{stat.title}</p>
                  <p className="text-2xl sm:text-3xl font-bold text-slate-900">{stat.value}</p>
                  {stat.subtitle && (
                    <p className="text-xs text-slate-400 mt-1">{stat.subtitle}</p>
                  )}
                </div>
                <div className={`${stat.bg} p-3 rounded-lg`}>
                  <stat.icon className={`w-5 h-5 sm:w-6 sm:h-6 ${stat.color}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick Actions */}
      {isPrincipal && (
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <QuickActionCard 
              title="Add Student" 
              href="/students/new"
              icon={UserPlus}
              color="blue"
            />
            <QuickActionCard 
              title="Create Bill" 
              href="/fees"
              icon={CreditCard}
              color="emerald"
            />
            <QuickActionCard 
              title="Take Attendance" 
              href="/attendance"
              icon={CheckCircle}
              color="violet"
            />
            <QuickActionCard 
              title="Send Notification" 
              href="/notifications"
              icon={Users}
              color="amber"
            />
          </div>
        </div>
      )}
    </div>
  );
};

const QuickActionCard = ({ title, href, icon: Icon, color }) => {
  const colors = {
    blue: 'bg-blue-50 text-blue-600 hover:bg-blue-100 border-blue-100',
    emerald: 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100 border-emerald-100',
    violet: 'bg-violet-50 text-violet-600 hover:bg-violet-100 border-violet-100',
    amber: 'bg-amber-50 text-amber-600 hover:bg-amber-100 border-amber-100',
  };

  return (
    <a
      href={href}
      className={`flex flex-col items-center justify-center p-4 rounded-lg border transition-colors ${colors[color]}`}
      data-testid={`quick-action-${title.toLowerCase().replace(/\s+/g, '-')}`}
    >
      <Icon className="w-6 h-6 mb-2" />
      <span className="text-sm font-medium text-center">{title}</span>
    </a>
  );
};
