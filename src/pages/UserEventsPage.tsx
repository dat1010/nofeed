import React, { useEffect, useState } from 'react';
import AdminLayout from '../components/AdminLayout';
import api from '../services/api';

interface Event {
  id: string;
  name: string;
  description: string;
  schedule: string;
  // Add other fields as needed
}

const UserEventsPage: React.FC = () => {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchEvents = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await api.get('/events', {
          headers: {
            'accept': 'application/json',
          },
        });
        setEvents(response.data || []);
      } catch (err: any) {
        setError(err.response?.data?.error || err.message || 'Failed to fetch events');
      } finally {
        setLoading(false);
      }
    };
    fetchEvents();
  }, []);

  return (
    <AdminLayout title="My Events">
      <div className="columns">
        <div className="column is-full">
          <div className="card">
            <div className="card-content">
              {loading && <div>Loading events...</div>}
              {error && <div className="notification is-danger">{error}</div>}
              {!loading && !error && (
                <>
                  {events.length === 0 ? (
                    <div className="notification is-info">No events found.</div>
                  ) : (
                    <ul>
                      {events.map(event => (
                        <li key={event.id} className="mb-4">
                          <div className="card">
                            <div className="card-content">
                              <strong>{event.name}</strong>
                              <p>{event.description}</p>
                              <span className="tag is-light">Schedule: {event.schedule}</span>
                            </div>
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default UserEventsPage; 
