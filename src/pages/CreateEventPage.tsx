import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { getCookie } from '../utils/cookies';
import api from '../services/api';

interface EventFormData {
  name: string;
  description: string;
  schedule: string;
  payload: string;
}

const CreateEventPage: React.FC = () => {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState<EventFormData>({
    name: '',
    description: '',
    schedule: '0 12 * * ? *', // Default to daily at noon
    payload: '{"key": "value"}'
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const token = getCookie("id_token");
      if (!token) {
        throw new Error('Please log in to create events');
      }

      // Parse the payload string to ensure it's valid JSON
      let parsedPayload;
      try {
        parsedPayload = JSON.parse(formData.payload);
      } catch (e) {
        throw new Error('Invalid JSON in payload');
      }

      const response = await api.post('/events', {
        name: formData.name,
        description: formData.description,
        schedule: formData.schedule,
        payload: parsedPayload
      }, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      console.log('Event created:', response.data);
      alert('Event created successfully!');
      navigate('/home'); // Redirect back to home after successful creation
    } catch (error: any) {
      console.error('Error creating event:', error);
      setError(error.response?.data?.error || error.message || 'Failed to create event');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <Navbar />
      <div className="container mt-5">
        <div className="columns is-centered">
          <div className="column is-half">
            <div className="box">
              <h1 className="title">Create Scheduled Event</h1>
              
              {error && (
                <div className="notification is-danger">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit}>
                <div className="field">
                  <label className="label">Event Name</label>
                  <div className="control">
                    <input
                      className="input"
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      placeholder="my-scheduled-event"
                      required
                    />
                  </div>
                  <p className="help">A unique identifier for your event</p>
                </div>

                <div className="field">
                  <label className="label">Description</label>
                  <div className="control">
                    <input
                      className="input"
                      type="text"
                      name="description"
                      value={formData.description}
                      onChange={handleInputChange}
                      placeholder="A scheduled event that runs daily"
                      required
                    />
                  </div>
                </div>

                <div className="field">
                  <label className="label">Schedule (Cron Expression)</label>
                  <div className="control">
                    <input
                      className="input"
                      type="text"
                      name="schedule"
                      value={formData.schedule}
                      onChange={handleInputChange}
                      placeholder="0 12 * * ? *"
                      required
                    />
                  </div>
                  <p className="help">Format: minute hour day month day-of-week year</p>
                </div>

                <div className="field">
                  <label className="label">Payload (JSON)</label>
                  <div className="control">
                    <textarea
                      className="textarea"
                      name="payload"
                      value={formData.payload}
                      onChange={handleInputChange}
                      placeholder='{"key": "value"}'
                      required
                    />
                  </div>
                  <p className="help">JSON data to be passed to the event handler</p>
                </div>

                <div className="field is-grouped">
                  <div className="control">
                    <button
                      className={`button is-primary ${isSubmitting ? 'is-loading' : ''}`}
                      type="submit"
                      disabled={isSubmitting}
                    >
                      Create Event
                    </button>
                  </div>
                  <div className="control">
                    <button
                      className="button is-light"
                      type="button"
                      onClick={() => navigate('/home')}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default CreateEventPage; 