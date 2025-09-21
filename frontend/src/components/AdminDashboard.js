import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  BarChart3, 
  Users, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  TrendingUp,
  LogOut,
  Settings,
  Filter,
  Search,
  MapPin
} from 'lucide-react';
import IssueMap from './IssueMap';

const AdminDashboard = ({ user }) => {
  const navigate = useNavigate();
  const [selectedView, setSelectedView] = useState('overview');
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  const handleLogout = () => {
    localStorage.removeItem('civicconnect_admin');
    navigate('/');
  };

  // Mock data for admin dashboard
  const stats = {
    totalIssues: 156,
    reported: 45,
    inProgress: 67,
    resolved: 44,
    slaBreaches: 8,
    avgResolutionTime: '3.2 days'
  };

  const mockIssues = [
    {
      id: '1',
      title: 'Broken Street Light',
      location: 'MG Road, Bhopal',
      coordinates: [23.2599, 77.4126],
      status: 'reported',
      upvotes: 15,
      description: 'Street light has been broken for 3 days',
      category: 'Street Lighting',
      priority: 'high',
      assignedTo: 'Unassigned',
      reportedBy: 'Citizen #1234',
      timestamp: '2025-01-18T10:30:00Z'
    },
    {
      id: '2',
      title: 'Pothole on Main Road',
      location: 'DB City Mall Road',
      coordinates: [23.2456, 77.4200],
      status: 'in-progress',
      upvotes: 28,
      description: 'Large pothole causing traffic issues',
      category: 'Road & Traffic',
      priority: 'medium',
      assignedTo: 'Ward Officer A',
      reportedBy: 'Citizen #5678',
      timestamp: '2025-01-15T14:20:00Z'
    },
    {
      id: '3',
      title: 'Garbage Overflow',
      location: 'Arera Colony',
      coordinates: [23.2300, 77.4300],
      status: 'resolved',
      upvotes: 42,
      description: 'Garbage bin overflowing since Monday',
      category: 'Garbage & Sanitation',
      priority: 'low',
      assignedTo: 'Sanitation Team B',
      reportedBy: 'Citizen #9012',
      timestamp: '2025-01-10T09:15:00Z'
    }
  ];

  const filteredIssues = mockIssues.filter(issue => {
    const matchesStatus = statusFilter === 'all' || issue.status === statusFilter;
    const matchesSearch = issue.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         issue.location.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const StatCard = ({ title, value, icon: Icon, color, subtitle }) => (
    <div className="stat-card">
      <div className="stat-header">
        <span className="stat-title">{title}</span>
        <Icon size={20} color={color} />
      </div>
      <div className="stat-value">{value}</div>
      {subtitle && (
        <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '0.5rem' }}>
          {subtitle}
        </div>
      )}
    </div>
  );

  const getPriorityBadge = (priority) => {
    const priorityConfig = {
      'high': { bg: '#fef2f2', color: '#dc2626', text: 'High' },
      'medium': { bg: '#fef3c7', color: '#d97706', text: 'Medium' },
      'low': { bg: '#f0f9ff', color: '#2563eb', text: 'Low' }
    };
    
    const config = priorityConfig[priority] || priorityConfig['medium'];
    return (
      <span style={{
        background: config.bg,
        color: config.color,
        padding: '0.2rem 0.6rem',
        borderRadius: '12px',
        fontSize: '0.7rem',
        fontWeight: '600',
        textTransform: 'uppercase'
      }}>
        {config.text}
      </span>
    );
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      'reported': { class: 'status-reported', text: 'Reported' },
      'in-progress': { class: 'status-in-progress', text: 'In Progress' },
      'resolved': { class: 'status-resolved', text: 'Resolved' }
    };
    
    const config = statusConfig[status] || statusConfig['reported'];
    return <span className={`status-badge ${config.class}`}>{config.text}</span>;
  };

  const handleAssignIssue = (issueId, e) => {
    e.stopPropagation();
    alert(`Assign issue ${issueId} to officer (Mock functionality)`);
  };

  const handleUpdateStatus = (issueId, newStatus, e) => {
    e.stopPropagation();
    alert(`Update issue ${issueId} status to ${newStatus} (Mock functionality)`);
  };

  return (
    <div className="admin-container">
      {/* Header */}
      <div className="admin-header">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
          <h1 className="admin-title">Admin Dashboard</h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <span style={{ color: '#64748b', fontSize: '0.9rem' }}>
              Welcome, {user.name}
            </span>
            <button 
              onClick={() => setSelectedView(selectedView === 'settings' ? 'overview' : 'settings')}
              style={{ 
                background: 'none', 
                border: 'none', 
                color: '#64748b',
                cursor: 'pointer',
                padding: '0.5rem'
              }}
            >
              <Settings size={20} />
            </button>
            <button 
              onClick={handleLogout}
              style={{ 
                background: 'none', 
                border: 'none', 
                color: '#64748b',
                cursor: 'pointer',
                padding: '0.5rem'
              }}
            >
              <LogOut size={20} />
            </button>
          </div>
        </div>
      </div>

      <div className="admin-content">
        {/* Navigation Tabs */}
        <div style={{ 
          display: 'flex', 
          gap: '0.5rem',
          marginBottom: '2rem',
          borderBottom: '1px solid #e2e8f0',
          paddingBottom: '1rem'
        }}>
          {[
            { key: 'overview', label: 'Overview', icon: BarChart3 },
            { key: 'issues', label: 'Issues Management', icon: AlertTriangle },
            { key: 'map', label: 'Map View', icon: MapPin },
            { key: 'analytics', label: 'Analytics', icon: TrendingUp }
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setSelectedView(tab.key)}
              style={{
                background: selectedView === tab.key ? '#667eea' : 'transparent',
                color: selectedView === tab.key ? 'white' : '#64748b',
                border: '1px solid #e2e8f0',
                padding: '0.6rem 1.2rem',
                borderRadius: '8px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                fontSize: '0.9rem',
                fontWeight: '500'
              }}
            >
              <tab.icon size={16} />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Overview Stats */}
        {selectedView === 'overview' && (
          <>
            <div className="stats-grid">
              <StatCard 
                title="Total Issues" 
                value={stats.totalIssues}
                icon={AlertTriangle}
                color="#667eea"
                subtitle="All time reports"
              />
              <StatCard 
                title="Reported" 
                value={stats.reported}
                icon={AlertTriangle}
                color="#f59e0b"
                subtitle="Awaiting assignment"
              />
              <StatCard 
                title="In Progress" 
                value={stats.inProgress}
                icon={Clock}
                color="#3b82f6"
                subtitle="Being resolved"
              />
              <StatCard 
                title="Resolved" 
                value={stats.resolved}
                icon={CheckCircle}
                color="#10b981"
                subtitle="Successfully completed"
              />
              <StatCard 
                title="SLA Breaches" 
                value={stats.slaBreaches}
                icon={AlertTriangle}
                color="#ef4444"
                subtitle="Overdue issues"
              />
              <StatCard 
                title="Avg Resolution Time" 
                value={stats.avgResolutionTime}
                icon={TrendingUp}
                color="#8b5cf6"
                subtitle="Current performance"
              />
            </div>

            {/* Recent Issues */}
            <div style={{ marginTop: '2rem' }}>
              <h3 style={{ fontSize: '1.2rem', fontWeight: '600', marginBottom: '1rem', color: '#1e293b' }}>
                Recent Issues
              </h3>
              <div className="issues-grid">
                {mockIssues.slice(0, 3).map((issue) => (
                  <div 
                    key={issue.id} 
                    className="issue-card"
                    onClick={() => navigate(`/issue/${issue.id}`)}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '1rem' }}>
                      <div>
                        <h4 style={{ fontSize: '1.1rem', fontWeight: '600', color: '#1e293b', marginBottom: '0.5rem' }}>
                          {issue.title}
                        </h4>
                        <div style={{ fontSize: '0.8rem', color: '#64748b', marginBottom: '0.3rem' }}>
                          📍 {issue.location}
                        </div>
                        <div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
                          Reported by: {issue.reportedBy}
                        </div>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', alignItems: 'end' }}>
                        {getStatusBadge(issue.status)}
                        {getPriorityBadge(issue.priority)}
                      </div>
                    </div>

                    <p style={{ color: '#64748b', fontSize: '0.9rem', marginBottom: '1rem' }}>
                      {issue.description}
                    </p>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
                        Assigned to: <strong>{issue.assignedTo}</strong>
                      </div>
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        {issue.status === 'reported' && (
                          <button 
                            className="btn-secondary"
                            style={{ fontSize: '0.7rem', padding: '0.3rem 0.8rem' }}
                            onClick={(e) => handleAssignIssue(issue.id, e)}
                          >
                            Assign
                          </button>
                        )}
                        {issue.status === 'in-progress' && (
                          <button 
                            className="btn-primary"
                            style={{ fontSize: '0.7rem', padding: '0.3rem 0.8rem' }}
                            onClick={(e) => handleUpdateStatus(issue.id, 'resolved', e)}
                          >
                            Mark Resolved
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {/* Issues Management */}
        {selectedView === 'issues' && (
          <>
            {/* Filters and Search */}
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              marginBottom: '1.5rem',
              gap: '1rem'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div style={{ position: 'relative' }}>
                  <Search 
                    size={16} 
                    style={{ 
                      position: 'absolute', 
                      left: '0.8rem', 
                      top: '50%', 
                      transform: 'translateY(-50%)',
                      color: '#94a3b8'
                    }} 
                  />
                  <input
                    type="text"
                    placeholder="Search issues..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    style={{
                      padding: '0.6rem 0.8rem 0.6rem 2.5rem',
                      border: '1px solid #e2e8f0',
                      borderRadius: '8px',
                      fontSize: '0.9rem',
                      minWidth: '300px'
                    }}
                  />
                </div>

                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  style={{
                    padding: '0.6rem 0.8rem',
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px',
                    fontSize: '0.9rem',
                    background: 'white'
                  }}
                >
                  <option value="all">All Status</option>
                  <option value="reported">Reported</option>
                  <option value="in-progress">In Progress</option>
                  <option value="resolved">Resolved</option>
                </select>
              </div>

              <div style={{ fontSize: '0.9rem', color: '#64748b' }}>
                Showing {filteredIssues.length} of {mockIssues.length} issues
              </div>
            </div>

            {/* Issues Table */}
            <div style={{ 
              background: 'white',
              borderRadius: '12px',
              overflow: 'hidden',
              boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
            }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                    <th style={{ padding: '0.8rem', textAlign: 'left', fontSize: '0.8rem', fontWeight: '600', color: '#374151' }}>Issue</th>
                    <th style={{ padding: '0.8rem', textAlign: 'left', fontSize: '0.8rem', fontWeight: '600', color: '#374151' }}>Location</th>
                    <th style={{ padding: '0.8rem', textAlign: 'left', fontSize: '0.8rem', fontWeight: '600', color: '#374151' }}>Status</th>
                    <th style={{ padding: '0.8rem', textAlign: 'left', fontSize: '0.8rem', fontWeight: '600', color: '#374151' }}>Priority</th>
                    <th style={{ padding: '0.8rem', textAlign: 'left', fontSize: '0.8rem', fontWeight: '600', color: '#374151' }}>Assigned To</th>
                    <th style={{ padding: '0.8rem', textAlign: 'left', fontSize: '0.8rem', fontWeight: '600', color: '#374151' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredIssues.map((issue) => (
                    <tr 
                      key={issue.id}
                      style={{ 
                        borderBottom: '1px solid #f1f5f9',
                        cursor: 'pointer'
                      }}
                      onClick={() => navigate(`/issue/${issue.id}`)}
                    >
                      <td style={{ padding: '1rem 0.8rem' }}>
                        <div>
                          <div style={{ fontWeight: '500', color: '#1e293b', marginBottom: '0.2rem' }}>
                            {issue.title}
                          </div>
                          <div style={{ fontSize: '0.8rem', color: '#64748b' }}>
                            {issue.category}
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: '1rem 0.8rem', fontSize: '0.9rem', color: '#64748b' }}>
                        {issue.location}
                      </td>
                      <td style={{ padding: '1rem 0.8rem' }}>
                        {getStatusBadge(issue.status)}
                      </td>
                      <td style={{ padding: '1rem 0.8rem' }}>
                        {getPriorityBadge(issue.priority)}
                      </td>
                      <td style={{ padding: '1rem 0.8rem', fontSize: '0.9rem', color: '#64748b' }}>
                        {issue.assignedTo}
                      </td>
                      <td style={{ padding: '1rem 0.8rem' }}>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                          {issue.status === 'reported' && (
                            <button 
                              className="btn-secondary"
                              style={{ fontSize: '0.7rem', padding: '0.3rem 0.6rem' }}
                              onClick={(e) => handleAssignIssue(issue.id, e)}
                            >
                              Assign
                            </button>
                          )}
                          {issue.status === 'in-progress' && (
                            <button 
                              className="btn-primary"
                              style={{ fontSize: '0.7rem', padding: '0.3rem 0.6rem' }}
                              onClick={(e) => handleUpdateStatus(issue.id, 'resolved', e)}
                            >
                              Resolve
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}

        {/* Map View */}
        {selectedView === 'map' && (
          <div>
            <h3 style={{ fontSize: '1.2rem', fontWeight: '600', marginBottom: '1rem', color: '#1e293b' }}>
              Issues Map Overview
            </h3>
            <div style={{ height: '600px' }}>
              <IssueMap issues={mockIssues} onMarkerClick={(issue) => navigate(`/issue/${issue.id}`)} />
            </div>
          </div>
        )}

        {/* Analytics */}
        {selectedView === 'analytics' && (
          <div>
            <h3 style={{ fontSize: '1.2rem', fontWeight: '600', marginBottom: '1.5rem', color: '#1e293b' }}>
              Analytics Dashboard
            </h3>
            
            <div style={{ 
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
              gap: '1.5rem'
            }}>
              {/* Category Distribution */}
              <div style={{ 
                background: 'white',
                padding: '1.5rem',
                borderRadius: '12px',
                boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
              }}>
                <h4 style={{ fontSize: '1rem', fontWeight: '600', marginBottom: '1rem', color: '#1e293b' }}>
                  Issues by Category
                </h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                  {[
                    { category: 'Road & Traffic', count: 45, percentage: 35 },
                    { category: 'Street Lighting', count: 32, percentage: 25 },
                    { category: 'Water & Drainage', count: 28, percentage: 22 },
                    { category: 'Garbage & Sanitation', count: 23, percentage: 18 }
                  ].map((item) => (
                    <div key={item.category}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.3rem' }}>
                        <span style={{ fontSize: '0.9rem', color: '#64748b' }}>{item.category}</span>
                        <span style={{ fontSize: '0.9rem', fontWeight: '600', color: '#1e293b' }}>{item.count}</span>
                      </div>
                      <div style={{ 
                        width: '100%', 
                        height: '6px', 
                        background: '#f1f5f9', 
                        borderRadius: '3px',
                        overflow: 'hidden'
                      }}>
                        <div style={{ 
                          width: `${item.percentage}%`, 
                          height: '100%', 
                          background: '#667eea',
                          transition: 'width 0.5s ease'
                        }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Resolution Trends */}
              <div style={{ 
                background: 'white',
                padding: '1.5rem',
                borderRadius: '12px',
                boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
              }}>
                <h4 style={{ fontSize: '1rem', fontWeight: '600', marginBottom: '1rem', color: '#1e293b' }}>
                  Resolution Trends (Last 7 Days)
                </h4>
                <div style={{ textAlign: 'center', padding: '2rem' }}>
                  <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>📊</div>
                  <p style={{ color: '#64748b', fontSize: '0.9rem' }}>
                    Chart visualization would be implemented with a charting library like Chart.js or Recharts
                  </p>
                  <div style={{ marginTop: '1rem', fontSize: '0.8rem', color: '#94a3b8' }}>
                    Mock Data: 85% resolution rate this week
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;