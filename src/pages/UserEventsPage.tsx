import React, { useEffect, useState } from 'react';
import Navbar from '../components/Navbar';
import { getCookie } from '../utils/cookies';
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
        const token = getCookie('id_token');
        if (!token) {
          throw new Error('Please log in to view your events');
        }
        const response = await api.get('/events', {
          headers: {
            'Authorization': `Bearer ${token}`,
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
    <>
      <Navbar />
      <div className="container mt-5">
        <div className="columns is-centered">
          <div className="column is-half">
            <div className="card">
              <div className="card-content">
                <h1 className="title">My Events</h1>
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
      </div>
    </>
  );
};

export default UserEventsPage; 