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
  const [updateTrigger, setUpdateTrigger] = useState<number>(0);
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
        const maxAttempts = 1000;

        while (attempts < maxAttempts) {
          const utcHour = currentDate.getUTCHours();
          const utcMinute = currentDate.getUTCMinutes();
          const utcDay = currentDate.getUTCDate();
          const utcMonth = currentDate.getUTCMonth() + 1;
          const utcDayOfWeek = currentDate.getUTCDay();

          // Check if current date matches the schedule
          let matches = true;

          // Check hour and minute
          if (hour !== '*' && parseInt(hour) !== utcHour) matches = false;
          if (minute !== '*' && parseInt(minute) !== utcMinute) matches = false;

          // Check day of month
          if (day !== '*' && day !== '?') {
            const dayNum = parseInt(day);
            if (dayNum !== utcDay) matches = false;
          }

          // Check month
          if (month !== '*' && parseInt(month) !== utcMonth) matches = false;

          // Check day of week
          if (dayOfWeek !== '*' && dayOfWeek !== '?') {
            let cronDay: number;
            if (dayOfWeek === 'FRI') {
              cronDay = 5;
            } else {
              cronDay = parseInt(dayOfWeek);
            }
            if (cronDay !== utcDayOfWeek) matches = false;
          }

          if (matches) {
            return currentDate;
          }

          // Increment date based on schedule type
          if (dayOfWeek !== '*' || day !== '*') {
            // For weekly/monthly schedules, increment by days
            currentDate.setDate(currentDate.getDate() + 1);
          } else {
            // For daily schedules, increment by minutes
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
          // Start looking from 1 minute after the last occurrence
          nextDate = getNextOccurrence(new Date(nextDate.getTime() + 60000));
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
    console.log('Input changed:', name, value);
    
    // First, update the form data
    setFormData(prev => {
      const newData = { ...prev, [name]: value };
      
      // Handle schedule type changes
      if (name === 'presetSchedule') {
        console.log('Changing preset schedule to:', value);
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
        console.log('New schedule after preset change:', newData.schedule);
      }
      
      // Handle time changes
      if (name === 'scheduleTime' && newData.scheduleType === 'preset') {
        console.log('Changing time to:', value);
        const utcTime = convertToUTC(value);
        if (utcTime) {
          const template = PRESET_SCHEDULES[newData.presetSchedule as keyof typeof PRESET_SCHEDULES].value;
          newData.schedule = template
            .replace('{hour}', utcTime.hours.toString())
            .replace('{minute}', utcTime.minutes.toString());
          console.log('New schedule after time change:', newData.schedule);
        }
      }
      
      return newData;
    });
  };

  // Separate effect to handle next occurrences
  useEffect(() => {
    console.log('Effect triggered with schedule:', formData.schedule);
    const calculateNextOccurrences = () => {
      try {
        const schedule = formData.schedule;
        if (!schedule) {
          console.log('No schedule set');
          setNextOccurrences(['No schedule set']);
          return;
        }

        console.log('Calculating next occurrences for schedule:', schedule);
        const occurrences = getNextOccurrences(schedule);
        console.log('Calculated occurrences:', occurrences);
        // Force a new array reference to ensure React detects the change
        setNextOccurrences([...occurrences]);
      } catch (error) {
        console.error('Error calculating next occurrences:', error);
        setNextOccurrences(['Error calculating schedule']);
      }
    };

    calculateNextOccurrences();
  }, [formData.schedule, formData.presetSchedule, formData.scheduleTime]);

  // Add a debug effect to track form data changes
  useEffect(() => {
    console.log('Form data updated:', {
      schedule: formData.schedule,
      presetSchedule: formData.presetSchedule,
      scheduleTime: formData.scheduleTime,
      scheduleType: formData.scheduleType
    });
  }, [formData]);

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
                    {nextOccurrences.length > 0 ? (
                      <ul>
                        {nextOccurrences.map((date, index) => (
                          <li key={`${date}-${index}`}>{date}</li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>

                <div className="field is-grouped">
                  <div className="control">
                    <button
                      type="submit"
                      className="button is-link"
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? 'Creating...' : 'Create Event'}
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