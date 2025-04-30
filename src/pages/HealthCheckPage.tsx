// src/pages/HealthCheckPage.tsx

import React, { useEffect, useState } from "react";
import api from "../services/api";

const HealthCheckPage: React.FC = () => {
  const [status, setStatus] = useState<'loading' | 'healthy' | 'error'>('loading');
  const [message, setMessage] = useState<string>("");
  const [errorDetails, setErrorDetails] = useState<string>("");
  const [version, setVersion] = useState<string | null>(null);

  useEffect(() => {
    const checkHealth = async () => {
      try {
        const response = await api.get('/healthcheck');
        setStatus('healthy');
        setVersion(response.data.version || null);
        setMessage("API is healthy");
        setErrorDetails("");
      } catch (error: any) {
        setStatus('error');
        setMessage("Unable to connect to API");
        if (error.response) {
          setErrorDetails(`Status: ${error.response.status}, Data: ${JSON.stringify(error.response.data)}`);
        } else if (error.request) {
          setErrorDetails("No response received from server");
        } else {
          setErrorDetails(error.message || "Unknown error");
        }
      }
    };

    checkHealth();
  }, []);

  return (
    <div className="section">
      <div className="container">
        <h1 className="title">API Health Check</h1>
        {version && (
          <p>
            <strong>Version:</strong> {version}
          </p>
        )}
        <div className={`notification ${
          status === 'healthy' ? 'is-success' : 
          status === 'error' ? 'is-danger' : 'is-info'
        }`}>
          <p className="subtitle">
            {status === 'loading' ? 'Checking system health...' : message}
          </p>
          {status === 'healthy' && <p>Connected to: https://api.nofeed.zone/api/healthcheck</p>}
          {status === 'error' && <p className="is-family-monospace is-size-7">{errorDetails}</p>}
        </div>
        {status === 'error' && (
          <div className="content">
            <p>Troubleshooting tips:</p>
            <ul>
              <li>Check if the API server is running</li>
              <li>Verify the API endpoint URL is correct (https://api.nofeed.zone/api/healthcheck)</li>
              <li>Check for CORS issues in browser console</li>
              <li>Try accessing the API directly in a new browser tab</li>
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};

export default HealthCheckPage;

