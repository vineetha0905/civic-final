import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { LanguageContext } from '../App';
import { ArrowLeft, Calendar, MapPin, ThumbsUp, Eye } from 'lucide-react';

const MyReports = ({ user }) => {
  const navigate = useNavigate();
  const { t } = useContext(LanguageContext);
  const [userIssues, setUserIssues] = useState([]);

  useEffect(() => {
    // Load user's issues from localStorage
    const savedIssues = JSON.parse(localStorage.getItem('user_issues') || '[]');
    const filteredIssues = savedIssues.filter(issue => issue.userId === user.id);
    
    // Add some mock issues for demo if none exist
    if (filteredIssues.length === 0) {
      const mockUserIssues = [
        {
          id: 'user_1',
          title: 'Broken Street Light',
          description: 'Street light pole is broken and hanging dangerously',
          category: 'Street Lighting',
          location: 'Near my house, MG Road',
          coordinates: [23.2599, 77.4126],
          status: 'in-progress',
          timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
          upvotes: 12,
          userId: user.id
        },
        {
          id: 'user_2',
          title: 'Pothole on Road',
          description: 'Large pothole causing problems for vehicles',
          category: 'Road & Traffic',
          location: 'DB City Mall Road',
          coordinates: [23.2456, 77.4200],
          status: 'reported',
          timestamp: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
          upvotes: 8,
          userId: user.id
        },
        {
          id: 'user_3',
          title: 'Water Pipeline Leak',
          description: 'Water is continuously flowing from a broken pipeline',
          category: 'Water & Drainage',
          location: 'Arera Colony Main Road',
          coordinates: [23.2300, 77.4300],
          status: 'resolved',
          timestamp: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
          upvotes: 25,
          userId: user.id
        }
      ];
      setUserIssues(mockUserIssues);
    } else {
      setUserIssues(filteredIssues);
    }
  }, [user.id]);

  const getStatusBadge = (status) => {
    const statusConfig = {
      'reported': { class: 'status-reported', text: 'Reported' },
      'in-progress': { class: 'status-in-progress', text: 'In Progress' },
      'resolved': { class: 'status-resolved', text: 'Resolved' }
    };
    
    const config = statusConfig[status] || statusConfig['reported'];
    return <span className={`status-badge ${config.class}`}>{config.text}</span>;
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getTimeSince = (dateString) => {
    const now = new Date();
    const date = new Date(dateString);
    const diffTime = Math.abs(now - date);
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    return `${diffDays} days ago`;
  };

  return (
    <div className="form-container">
      <div className="form-card" style={{ maxWidth: '800px' }}>
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '2rem' }}>
          <button 
            onClick={() => navigate('/citizen')}
            style={{ 
              background: 'none', 
              border: 'none', 
              color: '#667eea', 
              cursor: 'pointer',
              marginRight: '1rem'
            }}
          >
            <ArrowLeft size={20} />
          </button>
          <h1 className="form-title">{t('myReports')}</h1>
        </div>

        {userIssues.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem 1rem' }}>
            <div style={{ 
              fontSize: '3rem', 
              marginBottom: '1rem',
              opacity: 0.5
            }}>📋</div>
            <h3 style={{ 
              color: '#64748b', 
              marginBottom: '0.5rem',
              fontWeight: '500'
            }}>
              No Reports Yet
            </h3>
            <p style={{ color: '#94a3b8', marginBottom: '1.5rem' }}>
              You haven't reported any issues yet. Start by reporting your first issue!
            </p>
            <button 
              className="btn-primary" 
              onClick={() => navigate('/report-issue')}
            >
              Report Your First Issue
            </button>
          </div>
        ) : (
          <div className="issues-grid" style={{ gridTemplateColumns: '1fr' }}>
            {userIssues.map((issue) => (
              <div 
                key={issue.id} 
                className="issue-card"
                onClick={() => navigate(`/issue/${issue.id}`)}
              >
                {issue.image && (
                  <div 
                    className="issue-image"
                    style={{ backgroundImage: `url(${issue.image})` }}
                  />
                )}
                
                <div className="issue-header">
                  <div>
                    <h3 className="issue-title">{issue.title}</h3>
                    <div className="issue-location">
                      <MapPin size={12} style={{ display: 'inline', marginRight: '0.3rem' }} />
                      {issue.location}
                    </div>
                    <div style={{ 
                      fontSize: '0.8rem', 
                      color: '#94a3b8',
                      marginTop: '0.3rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.3rem'
                    }}>
                      <Calendar size={12} />
                      {formatDate(issue.timestamp)} • {getTimeSince(issue.timestamp)}
                    </div>
                  </div>
                  {getStatusBadge(issue.status)}
                </div>

                <div className="issue-description" style={{ marginBottom: '1rem' }}>
                  {issue.description}
                </div>

                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  paddingTop: '1rem',
                  borderTop: '1px solid #f1f5f9'
                }}>
                  <div style={{ 
                    fontSize: '0.8rem', 
                    color: '#64748b',
                    background: '#f8fafc',
                    padding: '0.3rem 0.8rem',
                    borderRadius: '12px'
                  }}>
                    {issue.category}
                  </div>

                  <div className="issue-actions">
                    <div style={{ 
                      display: 'flex', 
                      alignItems: 'center',
                      gap: '0.5rem',
                      fontSize: '0.8rem',
                      color: '#64748b'
                    }}>
                      <ThumbsUp size={14} />
                      {issue.upvotes} upvotes
                    </div>
                  </div>
                </div>

                {/* Progress Timeline for In-Progress Items */}
                {issue.status === 'in-progress' && (
                  <div style={{ 
                    marginTop: '1rem',
                    padding: '1rem',
                    background: '#f8fafc',
                    borderRadius: '8px',
                    border: '1px solid #e2e8f0'
                  }}>
                    <h4 style={{ 
                      fontSize: '0.9rem', 
                      fontWeight: '600', 
                      marginBottom: '0.8rem',
                      color: '#1e293b'
                    }}>
                      Progress Timeline
                    </h4>
                    <div style={{ 
                      display: 'flex', 
                      alignItems: 'center',
                      gap: '1rem',
                      fontSize: '0.8rem'
                    }}>
                      <div style={{ 
                        display: 'flex', 
                        alignItems: 'center',
                        gap: '0.5rem'
                      }}>
                        <div style={{ 
                          width: '8px', 
                          height: '8px', 
                          borderRadius: '50%', 
                          background: '#10b981' 
                        }} />
                        <span style={{ color: '#10b981' }}>Reported</span>
                      </div>
                      <div style={{ 
                        width: '20px', 
                        height: '2px', 
                        background: '#10b981' 
                      }} />
                      <div style={{ 
                        display: 'flex', 
                        alignItems: 'center',
                        gap: '0.5rem'
                      }}>
                        <div style={{ 
                          width: '8px', 
                          height: '8px', 
                          borderRadius: '50%', 
                          background: '#3b82f6' 
                        }} />
                        <span style={{ color: '#3b82f6' }}>In Progress</span>
                      </div>
                      <div style={{ 
                        width: '20px', 
                        height: '2px', 
                        background: '#e5e7eb' 
                      }} />
                      <div style={{ 
                        display: 'flex', 
                        alignItems: 'center',
                        gap: '0.5rem'
                      }}>
                        <div style={{ 
                          width: '8px', 
                          height: '8px', 
                          borderRadius: '50%', 
                          background: '#e5e7eb' 
                        }} />
                        <span style={{ color: '#9ca3af' }}>Resolved</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Resolution Confirmation for Resolved Items */}
                {issue.status === 'resolved' && (
                  <div style={{ 
                    marginTop: '1rem',
                    padding: '1rem',
                    background: '#f0fdf4',
                    borderRadius: '8px',
                    border: '1px solid #bbf7d0'
                  }}>
                    <h4 style={{ 
                      fontSize: '0.9rem', 
                      fontWeight: '600', 
                      marginBottom: '0.8rem',
                      color: '#15803d'
                    }}>
                      ✅ Issue Resolved!
                    </h4>
                    <p style={{ 
                      fontSize: '0.8rem', 
                      color: '#16a34a',
                      marginBottom: '1rem'
                    }}>
                      This issue has been marked as resolved. Are you satisfied with the resolution?
                    </p>
                    <div style={{ 
                      display: 'flex', 
                      gap: '0.5rem' 
                    }}>
                      <button 
                        className="btn-primary" 
                        style={{ 
                          fontSize: '0.8rem',
                          padding: '0.5rem 1rem'
                        }}
                      >
                        Yes, Satisfied
                      </button>
                      <button 
                        className="btn-secondary" 
                        style={{ 
                          fontSize: '0.8rem',
                          padding: '0.5rem 1rem'
                        }}
                      >
                        Not Satisfied
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default MyReports;