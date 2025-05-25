import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { getCookie } from '../utils/cookies';
import api from '../services/api';

interface EventFormData {
  name: string;
  description: string;
  schedule: string;
  payload: string;
  scheduleType: 'preset' | 'custom';
  presetSchedule: string;
  scheduleTime: string;
}

const PRESET_SCHEDULES = {
  'daily': { label: 'Daily', value: '0 {hour} * * ? *' },
  'weekly-friday': { label: 'Weekly on Friday', value: '0 {hour} ? * FRI *' },
  'monthly-first': { label: 'Monthly on 1st', value: '0 {hour} 1 * ? *' },
  'custom': { label: 'Custom Schedule', value: '' }
};

const CreateEventPage: React.FC = () => {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [nextOccurrences, setNextOccurrences] = useState<string[]>([]);
  const [formData, setFormData] = useState<EventFormData>({
    name: '',
    description: '',
    schedule: '0 12 * * ? *',
    payload: '{"key": "value"}',
    scheduleType: 'preset',
    presetSchedule: 'daily',
    scheduleTime: '12:00'
  });

  // Convert local time to UTC
  const convertToUTC = (localTime: string): number => {
    const [hours, minutes] = localTime.split(':').map(Number);
    const date = new Date();
    date.setHours(hours, minutes, 0, 0);
    return date.getUTCHours();
  };

  // Parse cron expression and get next occurrences
  const getNextOccurrences = (cronExpression: string): string[] => {
    const [minute, hour, day, month, dayOfWeek] = cronExpression.split(' ');
    const occurrences: string[] = [];
    const now = new Date();
    
    // Function to check if a date matches the cron pattern
    const matchesCronPattern = (date: Date): boolean => {
      const utcHour = date.getUTCHours();
      const utcMinute = date.getUTCMinutes();
      const utcDay = date.getUTCDate();
      const utcMonth = date.getUTCMonth() + 1; // JavaScript months are 0-based
      const utcDayOfWeek = date.getUTCDay();

      // Check hour and minute
      if (hour !== '*' && parseInt(hour) !== utcHour) return false;
      if (minute !== '*' && parseInt(minute) !== utcMinute) return false;

      // Check day of month
      if (day !== '*' && day !== '?' && parseInt(day) !== utcDay) return false;

      // Check month
      if (month !== '*' && parseInt(month) !== utcMonth) return false;

      // Check day of week
      if (dayOfWeek !== '*' && dayOfWeek !== '?') {
        const cronDay = dayOfWeek === 'FRI' ? 5 : parseInt(dayOfWeek);
        if (cronDay !== utcDayOfWeek) return false;
      }

      return true;
    };

    // Find next 3 occurrences
    let currentDate = new Date(now);
    while (occurrences.length < 3) {
      if (matchesCronPattern(currentDate)) {
        const localTime = new Date(currentDate).toLocaleString();
        occurrences.push(localTime);
      }
      // Move to next minute
      currentDate.setMinutes(currentDate.getMinutes() + 1);
    }

    return occurrences;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => {
      const newData = {
        ...prev,
        [name]: value
      };
      
      // If changing preset schedule or time, update the actual schedule
      if (name === 'presetSchedule' || name === 'scheduleTime') {
        if (newData.scheduleType === 'preset') {
          const utcHour = convertToUTC(newData.scheduleTime);
          const scheduleTemplate = PRESET_SCHEDULES[newData.presetSchedule as keyof typeof PRESET_SCHEDULES].value;
          newData.schedule = scheduleTemplate.replace('{hour}', utcHour.toString());
        }
        if (name === 'presetSchedule') {
          newData.scheduleType = value === 'custom' ? 'custom' : 'preset';
        }
      }
      
      return newData;
    });

    // Update next occurrences immediately after form data changes
    if (name === 'scheduleTime' || name === 'presetSchedule') {
      const updatedSchedule = name === 'scheduleTime' 
        ? PRESET_SCHEDULES[formData.presetSchedule as keyof typeof PRESET_SCHEDULES].value.replace('{hour}', convertToUTC(value).toString())
        : formData.schedule;
      setNextOccurrences(getNextOccurrences(updatedSchedule));
    }
  };

  useEffect(() => {
    setNextOccurrences(getNextOccurrences(formData.schedule));
  }, [formData.schedule]);

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
      navigate('/home');
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
                  <label className="label">Schedule</label>
                  <div className="control">
                    <div className="select is-fullwidth mb-2">
                      <select
                        name="presetSchedule"
                        value={formData.presetSchedule}
                        onChange={handleInputChange}
                      >
                        {Object.entries(PRESET_SCHEDULES).map(([key, { label }]) => (
                          <option key={key} value={key}>{label}</option>
                        ))}
                      </select>
                    </div>
                    
                    {formData.scheduleType === 'preset' && (
                      <div className="field">
                        <div className="control">
                          <input
                            className="input"
                            type="text"
                            name="scheduleTime"
                            value={formData.scheduleTime}
                            onChange={handleInputChange}
                            placeholder="HH:MM"
                            pattern="^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$"
                            required
                          />
                        </div>
                        <p className="help">Enter time in 24-hour format (e.g., 14:30 for 2:30 PM)</p>
                      </div>
                    )}
                    
                    {formData.scheduleType === 'custom' && (
                      <input
                        className="input"
                        type="text"
                        name="schedule"
                        value={formData.schedule}
                        onChange={handleInputChange}
                        placeholder="0 12 * * ? *"
                        required
                      />
                    )}
                  </div>
                  <p className="help">
                    {formData.scheduleType === 'custom' 
                      ? 'Format: minute hour day month day-of-week year (in UTC)'
                      : 'Select a preset schedule and time, or choose custom for more options'}
                  </p>
                </div>

                <div className="field">
                  <label className="label">Next Occurrences (Local Time)</label>
                  <div className="box">
                    <ul>
                      {nextOccurrences.map((date, index) => (
                        <li key={index}>{date}</li>
                      ))}
                    </ul>
                  </div>
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