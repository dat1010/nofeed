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
  'daily': { label: 'Daily', value: '{minute} {hour} * * ? *' },
  'weekly-friday': { label: 'Weekly on Friday', value: '{minute} {hour} ? * FRI *' },
  'monthly-first': { label: 'Monthly on 1st', value: '{minute} {hour} 1 * ? *' },
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
  const convertToUTC = (localTime: string): { hours: number; minutes: number } | null => {
    if (!localTime || !localTime.includes(':')) return null;
    
    const [hours, minutes] = localTime.split(':').map(Number);
    if (isNaN(hours) || isNaN(minutes)) return null;
    
    const date = new Date();
    date.setHours(hours, minutes, 0, 0);
    return {
      hours: date.getUTCHours(),
      minutes: date.getUTCMinutes()
    };
  };

  // Parse cron expression and get next occurrences
  const getNextOccurrences = (cronExpression: string): string[] => {
    if (!cronExpression) return ['Invalid schedule'];
    
    try {
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
        if (day !== '*' && day !== '?') {
          const dayNum = parseInt(day);
          if (dayNum !== utcDay) return false;
        }

        // Check month
        if (month !== '*' && parseInt(month) !== utcMonth) return false;

        // Check day of week
        if (dayOfWeek !== '*' && dayOfWeek !== '?') {
          let cronDay: number;
          if (dayOfWeek === 'FRI') {
            cronDay = 5;
          } else {
            cronDay = parseInt(dayOfWeek);
          }
          if (cronDay !== utcDayOfWeek) return false;
        }

        return true;
      };

      // Function to format date with timezone
      const formatDate = (date: Date): string => {
        return date.toLocaleString(undefined, {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
          timeZoneName: 'short'
        });
      };

      // Function to get next occurrence from a given date
      const getNextOccurrence = (startDate: Date): Date | null => {
        let currentDate = new Date(startDate);
        let attempts = 0;
        const maxAttempts = 10000; // Increased to handle longer intervals

        while (attempts < maxAttempts) {
          if (matchesCronPattern(currentDate)) {
            return currentDate;
          }
          
          // For weekly and monthly schedules, increment by days instead of minutes
          if (dayOfWeek !== '*' || day !== '*') {
            currentDate.setDate(currentDate.getDate() + 1);
          } else {
            currentDate.setMinutes(currentDate.getMinutes() + 1);
          }
          attempts++;
        }
        return null;
      };

      // Get first occurrence
      let nextDate = getNextOccurrence(now);
      if (!nextDate) return ['No upcoming occurrences found'];

      // Get next 3 occurrences
      for (let i = 0; i < 3; i++) {
        if (nextDate) {
          occurrences.push(formatDate(nextDate));
          // For weekly and monthly schedules, start looking from next day
          const nextStartDate = new Date(nextDate);
          if (dayOfWeek !== '*' || day !== '*') {
            nextStartDate.setDate(nextStartDate.getDate() + 1);
          } else {
            nextStartDate.setMinutes(nextStartDate.getMinutes() + 1);
          }
          nextDate = getNextOccurrence(nextStartDate);
        }
      }

      return occurrences.length > 0 ? occurrences : ['No upcoming occurrences found'];
    } catch (error) {
      console.error('Error calculating next occurrences:', error);
      return ['Error calculating schedule'];
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    // First, update the form data
    setFormData(prev => {
      const newData = { ...prev, [name]: value };
      
      // Handle schedule type changes
      if (name === 'presetSchedule') {
        newData.scheduleType = value === 'custom' ? 'custom' : 'preset';
        
        // For custom schedule, set a default
        if (value === 'custom') {
          newData.schedule = '0 0 * * ? *';
        } else {
          // For preset schedules, update with current time
          const utcTime = convertToUTC(newData.scheduleTime);
          if (utcTime) {
            const template = PRESET_SCHEDULES[value as keyof typeof PRESET_SCHEDULES].value;
            newData.schedule = template
              .replace('{hour}', utcTime.hours.toString())
              .replace('{minute}', utcTime.minutes.toString());
          }
        }
      }
      
      // Handle time changes
      if (name === 'scheduleTime' && newData.scheduleType === 'preset') {
        const utcTime = convertToUTC(value);
        if (utcTime) {
          const template = PRESET_SCHEDULES[newData.presetSchedule as keyof typeof PRESET_SCHEDULES].value;
          newData.schedule = template
            .replace('{hour}', utcTime.hours.toString())
            .replace('{minute}', utcTime.minutes.toString());
        }
      }
      
      return newData;
    });
  };

  // Separate effect to handle next occurrences
  useEffect(() => {
    const calculateNextOccurrences = () => {
      try {
        const schedule = formData.schedule;
        if (!schedule) {
          setNextOccurrences(['No schedule set']);
          return;
        }

        const occurrences = getNextOccurrences(schedule);
        setNextOccurrences(occurrences);
      } catch (error) {
        console.error('Error calculating next occurrences:', error);
        setNextOccurrences(['Error calculating schedule']);
      }
    };

    calculateNextOccurrences();
  }, [formData.schedule, formData.presetSchedule, formData.scheduleTime]);

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
