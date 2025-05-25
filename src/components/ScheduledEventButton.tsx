import React from 'react';
import api from "../services/api";

const ScheduledEventButton: React.FC = () => {
  const handleCreateScheduledEvent = async () => {
    try {
      // Get the token from localStorage first, then fall back to Authorization header
      const token = localStorage.getItem("token") ||
        (api.defaults.headers.common["Authorization"] as string)?.split(" ")[1];
      
      console.log('Token:', token);

      if (!token) {
        alert('Please log in to create scheduled events');
        return;
      }

      // Set the Authorization header
      api.defaults.headers.common["Authorization"] = `Bearer ${token}`;

      // Use the api instance
      const response = await api.post('/events', {
        description: "A scheduled event that runs daily",
        name: "my-scheduled-event",
        payload: {
          "{\"key\"": "\"value\"}"
        },
        schedule: "0 12 * * ? *"
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