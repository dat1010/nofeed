import React from 'react';
import { useNavigate } from 'react-router-dom';

const ScheduledEventButton: React.FC = () => {
  const navigate = useNavigate();

  return (
    <button 
      className="button is-primary"
      onClick={() => navigate('/create-event')}
    >
      Create Scheduled Event
    </button>
  );
};

export default ScheduledEventButton; 