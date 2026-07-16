'use client';

import { useState, useEffect } from 'react';
import { DashboardData } from '@/types/dashboard';
import { dashboardService } from '@/services/dashboard-service';
import { useAuth } from './use-auth';

export const useDashboard = () => {
  const { user } = useAuth();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      if (!user) return;

      try {
        setLoading(true);
        const result = await dashboardService.getDashboardData();
        setData(result);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to fetch dashboard data'));
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [user]);

  const refresh = async () => {
    if (!user) return;
    try {
      setLoading(true);
      const result = await dashboardService.getDashboardData();
      setData(result);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to refresh dashboard data'));
    } finally {
      setLoading(false);
    }
  };

  return {
    data,
    loading,
    error,
    refresh,
  };
};
