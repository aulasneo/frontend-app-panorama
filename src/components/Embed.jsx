import { useEffect, useContext } from 'react';
import { AppContext } from '@edx/frontend-platform/react';
import { getAuthenticatedHttpClient } from '@edx/frontend-platform/auth';
import { camelCaseObject } from '@edx/frontend-platform';
import { DashboardTypeContext } from './DashboardContext';
import getApiErrorMessage from './errors';

const Embed = () => {
  const {
    changeDashboardType, changeCurrentView, handleDataReceived,
    changeError, changeLoader, changeUserRole,
  } = useContext(DashboardTypeContext);
  const { config, authenticatedUser } = useContext(AppContext);

  useEffect(() => {
    let cancelled = false;
    changeLoader(true);
    changeError(null);
    changeUserRole('');
    handleDataReceived([]);

    const fetchData = async () => {
      try {
        const client = getAuthenticatedHttpClient();
        // Both requests must succeed before mounting content with the new role.
        const [roleResponse, dashboardResponse] = await Promise.all([
          client.get(`${config.LMS_BASE_URL}/panorama/api/get-user-role`),
          client.get(`${config.LMS_BASE_URL}/panorama/api/get-embed-url`),
        ]);
        if (cancelled) { return; }
        const role = roleResponse.data.body;
        const dashboards = camelCaseObject(dashboardResponse.data).body;
        if (!['AUTHOR', 'READER', 'STUDENT'].includes(role) || !Array.isArray(dashboards)) {
          throw new Error('Invalid Panorama response');
        }
        changeUserRole(role);
        handleDataReceived(dashboards);
        changeCurrentView('DASHBOARDS');
        changeDashboardType(dashboards[0]?.displayName || '');
      } catch (error) {
        if (!cancelled) { changeError(getApiErrorMessage(error)); }
      } finally {
        if (!cancelled) { changeLoader(false); }
      }
    };
    fetchData();
    return () => { cancelled = true; };
  }, [
    changeCurrentView, changeDashboardType, changeError, changeLoader,
    changeUserRole, config.LMS_BASE_URL, handleDataReceived, authenticatedUser,
  ]);

  return null;
};

export default Embed;
