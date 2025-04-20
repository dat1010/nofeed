// src/pages/HealthCheckPage.tsx

import React, { useEffect, useState } from "react";
import api from "../services/api";

interface HealthResponse {
  status: string;
  // Add more properties here if your healthcheck returns additional data
}

const HealthCheckPage: React.FC = () => {
  const [healthData, setHealthData] = useState<HealthResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");

  useEffect(() => {
    const fetchHealthCheck = async () => {
      try {
        const response = await api.get<HealthResponse>("/healthcheck");
        setHealthData(response.data);
      } catch (err: any) {
        setError(err.message || "Error fetching health check");
      } finally {
        setLoading(false);
      }
    };

    fetchHealthCheck();
  }, []);

  if (loading) {
    return <div>Loading health status...</div>;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  return (
    <div>
      <h1>API Health Check</h1>
      <pre>{JSON.stringify(healthData, null, 2)}</pre>
    </div>
  );
};

export default HealthCheckPage;

