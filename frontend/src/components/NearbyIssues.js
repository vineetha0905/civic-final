import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { LanguageContext } from '../App';
import { ArrowLeft, Map, List, Filter, ThumbsUp, MessageCircle, MapPin } from 'lucide-react';
import IssueMap from './IssueMap';

const NearbyIssues = ({ user }) => {
  const navigate = useNavigate();
  const { t } = useContext(LanguageContext);
  const [viewMode, setViewMode] = useState('map'); // 'map' or 'list'
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [upvotedIssues, setUpvotedIssues] = useState(new Set());

  const mockIssues = [
    {
      id: '1',
      title: 'Broken Street Light',
      location: 'MG Road, Bhopal',
      coordinates: [23.2599, 77.4126],
      status: 'reported',
      upvotes: 15,
      description: 'Street light has been broken for 3 days causing safety concerns',
      category: 'Street Lighting',
      timestamp: '2025-01-15T10:30:00Z',
      userId: 'other_user_1'
    },
    {
      id: '2',
      title: 'Pothole on Main Road',
      location: 'DB City Mall Road',
      coordinates: [23.2456, 77.4200],
      status: 'in-progress',
      upvotes: 28,
      description: 'Large pothole causing traffic issues and vehicle damage',
      category: 'Road & Traffic',
      timestamp: '2025-01-12T14:20:00Z',
      userId: 'other_user_2'
    },
    {
      id: '3',
      title: 'Garbage Overflow',
      location: 'Arera Colony',
      coordinates: [23.2300, 77.4300],
      status: 'resolved',
      upvotes: 42,
      description: 'Garbage bin overflowing since Monday, creating unhygienic conditions',
      category: 'Garbage & Sanitation',
      timestamp: '2025-01-10T09:15:00Z',
      userId: 'other_user_3'
    },
    {
      id: '4',
      title: 'Water Leakage',
      location: 'New Market Area',
      coordinates: [23.2650, 77.4100],
      status: 'reported',
      upvotes: 8,
      description: 'Water pipe leaking on footpath, causing waterlogging',
      category: 'Water & Drainage',
      timestamp: '2025-01-16T16:45:00Z',
      userId: 'other_user_4'
    },
    {
      id: '5',
      title: 'Traffic Signal Malfunction',
      location: 'Bittan Market Chowk',
      coordinates: [23.2500, 77.4250],
      status: 'in-progress',
      upvotes: 35,
      description: 'Traffic signal not working properly, causing congestion',
      category: 'Road & Traffic',
      timestamp: '2025-01-14T11:30:00Z',
      userId: 'other_user_5'
    },
    {
      id: '6',
      title: 'Broken Footpath',
      location: 'MP Nagar Zone 1',
      coordinates: [23.2400, 77.4080],
      status: 'reported',
      upvotes: 12,
      description: 'Footpath tiles are broken and dangerous for pedestrians',
      category: 'Road & Traffic',
      timestamp: '2025-01-17T08:20:00Z',
      userId: 'other_user_6'
    }
  ];

  const filteredIssues = selectedStatus === 'all' 
    ? mockIssues 
    : mockIssues.filter(issue => issue.status === selectedStatus);

  const getStatusBadge = (status) => {
    const statusConfig = {
      'reported': { class: 'status-reported', text: 'Reported' },
      'in-progress': { class: 'status-in-progress', text: 'In Progress' },
      'resolved': { class: 'status-resolved', text: 'Resolved' }
    };
    
    const config = statusConfig[status] || statusConfig['reported'];
    return <span className={`status-badge ${config.class}`}>{config.text}</span>;
  };

  const handleUpvote = (issueId, e) => {
    e.stopPropagation();
    setUpvotedIssues(prev => {
      const newSet = new Set(prev);
      if (newSet.has(issueId)) {
        newSet.delete(issueId);
      } else {
        newSet.add(issueId);
      }
      return newSet;
    });
  };

  const handleMarkerClick = (issue) => {
    navigate(`/issue/${issue.id}`);
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div className="form-container" style={{ padding: '0' }}>
      {/* Header */}
      <div style={{ 
        background: 'white',
        padding: '1rem 2rem',
        borderBottom: '1px solid #e2e8f0',
        position: 'sticky',
        top: 0,
        zIndex: 10
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center' }}>
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
            <h1 style={{ 
              fontSize: '1.3rem', 
              fontWeight: '700', 
              color: '#1e293b',
              margin: 0
            }}>
              {t('nearbyIssues')}
            </h1>
          </div>

          {/* View Toggle */}
          <div style={{ 
            display: 'flex', 
            background: '#f1f5f9',
            borderRadius: '8px',
            padding: '0.25rem'
          }}>
            <button
              onClick={() => setViewMode('map')}
              style={{
                background: viewMode === 'map' ? 'white' : 'transparent',
                border: 'none',
                padding: '0.5rem 0.8rem',
                borderRadius: '6px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                color: viewMode === 'map' ? '#667eea' : '#64748b',
                fontSize: '0.9rem',
                fontWeight: '500',
                boxShadow: viewMode === 'map' ? '0 1px 2px rgba(0,0,0,0.1)' : 'none'
              }}
            >
              <Map size={16} />
              Map
            </button>
            <button
              onClick={() => setViewMode('list')}
              style={{
                background: viewMode === 'list' ? 'white' : 'transparent',
                border: 'none',
                padding: '0.5rem 0.8rem',
                borderRadius: '6px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                color: viewMode === 'list' ? '#667eea' : '#64748b',
                fontSize: '0.9rem',
                fontWeight: '500',
                boxShadow: viewMode === 'list' ? '0 1px 2px rgba(0,0,0,0.1)' : 'none'
              }}
            >
              <List size={16} />
              List
            </button>
          </div>
        </div>

        {/* Status Filter */}
        <div style={{ 
          display: 'flex', 
          alignItems: 'center',
          gap: '0.5rem',
          marginTop: '1rem'
        }}>
          <Filter size={16} color="#64748b" />
          <div style={{ 
            display: 'flex', 
            gap: '0.5rem',
            flex: 1
          }}>
            {[
              { key: 'all', label: 'All Issues', count: mockIssues.length },
              { key: 'reported', label: 'Reported', count: mockIssues.filter(i => i.status === 'reported').length },
              { key: 'in-progress', label: 'In Progress', count: mockIssues.filter(i => i.status === 'in-progress').length },
              { key: 'resolved', label: 'Resolved', count: mockIssues.filter(i => i.status === 'resolved').length }
            ].map(filter => (
              <button
                key={filter.key}
                onClick={() => setSelectedStatus(filter.key)}
                style={{
                  background: selectedStatus === filter.key ? '#667eea' : '#f8fafc',
                  color: selectedStatus === filter.key ? 'white' : '#64748b',
                  border: '1px solid #e2e8f0',
                  padding: '0.4rem 0.8rem',
                  borderRadius: '20px',
                  fontSize: '0.8rem',
                  fontWeight: '500',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease'
                }}
              >
                {filter.label} ({filter.count})
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      {viewMode === 'map' ? (
        <div style={{ height: 'calc(100vh - 160px)' }}>
          <IssueMap issues={filteredIssues} onMarkerClick={handleMarkerClick} />
        </div>
      ) : (
        <div style={{ padding: '1rem 2rem' }}>
          <div className="issues-grid" style={{ gridTemplateColumns: '1fr' }}>
            {filteredIssues.map((issue) => (
              <div 
                key={issue.id} 
                className="issue-card"
                onClick={() => navigate(`/issue/${issue.id}`)}
              >
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
                      marginTop: '0.3rem'
                    }}>
                      {formatDate(issue.timestamp)} • Category: {issue.category}
                    </div>
                  </div>
                  {getStatusBadge(issue.status)}
                </div>

                <div className="issue-description">
                  {issue.description}
                </div>

                <div className="issue-actions">
                  <button 
                    className={`upvote-btn ${upvotedIssues.has(issue.id) ? 'upvoted' : ''}`}
                    onClick={(e) => handleUpvote(issue.id, e)}
                  >
                    <ThumbsUp size={14} />
                    {issue.upvotes + (upvotedIssues.has(issue.id) ? 1 : 0)}
                  </button>
                  
                  <button 
                    className="upvote-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      // Mock comment functionality
                      alert('Comment functionality coming soon!');
                    }}
                  >
                    <MessageCircle size={14} />
                    Comment
                  </button>
                </div>
              </div>
            ))}
          </div>

          {filteredIssues.length === 0 && (
            <div style={{ textAlign: 'center', padding: '3rem 1rem' }}>
              <div style={{ 
                fontSize: '3rem', 
                marginBottom: '1rem',
                opacity: 0.5
              }}>🔍</div>
              <h3 style={{ 
                color: '#64748b', 
                marginBottom: '0.5rem',
                fontWeight: '500'
              }}>
                No Issues Found
              </h3>
              <p style={{ color: '#94a3b8' }}>
                No issues match your current filter. Try changing the status filter.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default NearbyIssues;