import React from 'react';
import api from "../services/api";
import { getCookie } from "../utils/cookies";

const ScheduledEventButton: React.FC = () => {
  const handleCreateScheduledEvent = async () => {
    try {
      // Get the token from cookies
      const token = getCookie("id_token");
      console.log('Token from cookie:', token);

      if (!token) {
        alert('Please log in to create scheduled events');
        return;
      }

      // Use the api instance with the token
      const response = await api.post('/events', {
        description: "A scheduled event that runs daily",
        name: "my-scheduled-event",
        payload: {
          "{\"key\"": "\"value\"}"
        },
        schedule: "0 12 * * ? *"
      }, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      console.log('Scheduled event created:', response.data);
      alert('Scheduled event created successfully!');
    } catch (error: any) {
      console.error('Error creating scheduled event:', error);
      alert(error.response?.data?.error || error.message || 'Failed to create scheduled event');
    }
  };

  return (
    <button 
      className="button is-primary"
      onClick={handleCreateScheduledEvent}
    >
      Create Daily Scheduled Event
    </button>
  );
};

export default ScheduledEventButton; 