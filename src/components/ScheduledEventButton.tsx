import React from 'react';
import api from "../services/api";

const ScheduledEventButton: React.FC = () => {
  const handleCreateScheduledEvent = async () => {
    try {
      // Get the token from the Authorization header
      const token = (api.defaults.headers.common["Authorization"] as string)?.split(" ")[1];
      if (!token) {
        alert('Please log in to create scheduled events');
        return;
      }

      const response = await fetch('https://api.nofeed.zone/api/events', {
        method: 'POST',
        headers: {
          'accept': 'application/json',
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          description: "A scheduled event that runs daily",
          name: "my-scheduled-event",
          payload: {
            "{\"key\"": "\"value\"}"
          },
          schedule: "0 12 * * ? *"
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create scheduled event');
      }

      const data = await response.json();
      console.log('Scheduled event created:', data);
      alert('Scheduled event created successfully!');
    } catch (error) {
      console.error('Error creating scheduled event:', error);
      alert(error instanceof Error ? error.message : 'Failed to create scheduled event');
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