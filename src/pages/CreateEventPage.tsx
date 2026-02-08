import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminLayout from '../components/AdminLayout';
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
      const fields = cronExpression.split(' ');
      if (fields.length < 5) return ['Invalid schedule'];
      // Support both 5 and 6 field crons (ignore year if present)
      const [minute, hour, day, month, dayOfWeek] = fields;
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

      // Helper to check if a field matches a value
      const matchesField = (field: string, value: number, cronType: 'minute' | 'hour' | 'day' | 'month' | 'dow') => {
        if (field === '*' || field === '?') return true;
        if (cronType === 'dow' && isNaN(Number(field))) {
          // Handle day of week as string (e.g., FRI)
          const days = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
          return days[value] === field.toUpperCase();
        }
        return Number(field) === value;
      };

      // Function to get next occurrence from a given date
      const getNextOccurrence = (startDate: Date): Date | null => {
        let currentDate = new Date(startDate);
        let attempts = 0;
        const maxAttempts = 10000; // Increase attempts for robustness

        while (attempts < maxAttempts) {
          const utcMinute = currentDate.getUTCMinutes();
          const utcHour = currentDate.getUTCHours();
          const utcDay = currentDate.getUTCDate();
          const utcMonth = currentDate.getUTCMonth() + 1;
          const utcDayOfWeek = currentDate.getUTCDay();

          let matches =
            matchesField(minute, utcMinute, 'minute') &&
            matchesField(hour, utcHour, 'hour') &&
            matchesField(day, utcDay, 'day') &&
            matchesField(month, utcMonth, 'month') &&
            matchesField(dayOfWeek, utcDayOfWeek, 'dow');

          if (matches) {
            return currentDate;
          }

          // Increment by 1 minute for next check
          currentDate.setUTCMinutes(currentDate.getUTCMinutes() + 1);
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
    <AdminLayout title="Create Scheduled Event">
      <div className="columns is-centered">
        <div className="column is-half">
          <div className="card">
            <div className="card-content">
                {error && <div className="notification is-danger">{error}</div>}
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
                        required
                      />
                    </div>
                  </div>

                  <div className="field">
                    <label className="label">Description</label>
                    <div className="control">
                      <textarea
                        className="textarea"
                        name="description"
                        value={formData.description}
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                  </div>

                  <div className="field">
                    <label className="label">Schedule Type</label>
                    <div className="control">
                      <div className="select is-fullwidth">
                        <select
                          name="presetSchedule"
                          value={formData.presetSchedule}
                          onChange={handleInputChange}
                        >
                          {Object.entries(PRESET_SCHEDULES).map(([key, { label }]) => (
                            <option key={key} value={key}>
                              {label}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>

                  {formData.scheduleType === 'preset' && (
                    <div className="field">
                      <label className="label">Time (Local)</label>
                      <div className="control">
                        <input
                          className="input"
                          type="time"
                          name="scheduleTime"
                          value={formData.scheduleTime}
                          onChange={handleInputChange}
                          required
                        />
                      </div>
                    </div>
                  )}

                  {formData.scheduleType === 'custom' && (
                    <div className="field">
                      <label className="label">Custom Schedule (Cron Expression)</label>
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
                      <p className="help">Enter a valid cron expression</p>
                    </div>
                  )}

                  <div className="field">
                    <label className="label">Payload (JSON)</label>
                    <div className="control">
                      <textarea
                        className="textarea"
                        name="payload"
                        value={formData.payload}
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                  </div>

                  {nextOccurrences.length > 0 && (
                    <div className="field">
                      <label className="label">Next Occurrences</label>
                      <div className="card">
                        <div className="card-content">
                          <ul>
                            {nextOccurrences.map((occurrence, index) => (
                              <li key={index}>{occurrence}</li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="field">
                    <div className="control">
                      <button
                        className={`button is-primary ${isSubmitting ? 'is-loading' : ''}`}
                        type="submit"
                        disabled={isSubmitting}
                      >
                        Create Event
                      </button>
                    </div>
                  </div>
                </form>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default CreateEventPage;
