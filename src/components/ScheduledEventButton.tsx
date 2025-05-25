import React from 'react';

const ScheduledEventButton: React.FC = () => {
  const handleCreateScheduledEvent = async () => {
    try {
      const response = await fetch('https://api.nofeed.zone/api/events', {
        method: 'POST',
        headers: {
          'accept': 'application/json',
          'Content-Type': 'application/json',
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
        throw new Error('Failed to create scheduled event');
      }

      const data = await response.json();
      console.log('Scheduled event created:', data);
      alert('Scheduled event created successfully!');
    } catch (error) {
      console.error('Error creating scheduled event:', error);
      alert('Failed to create scheduled event');
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