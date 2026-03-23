import { useEffect, useContext } from 'react';
import { AppContext } from '@edx/frontend-platform/react';
import { getAuthenticatedHttpClient } from '@edx/frontend-platform/auth';
import { camelCaseObject } from '@edx/frontend-platform';
import { DashboardTypeContext } from './DashboardContext';

const Embed = () => {
  const {
    changeDashboardType,
    changeCurrentView,
    handleDataReceived,
    changeError,
    changeLoader,
    changeUserRole,
  } = useContext(DashboardTypeContext);

  const { config } = useContext(AppContext);

  // ==========================================================
  // GET USER ROLE
  // ==========================================================
  useEffect(() => {
    const getUserRole = async () => {
      const { data } = await getAuthenticatedHttpClient().get(
        `${config.LMS_BASE_URL}/panorama/api/get-user-role`,
      );
      changeUserRole(data.body);
    };

    getUserRole();
  }, [changeUserRole, config.LMS_BASE_URL]);

  // ==========================================================
  // FETCH DASHBOARD OR STUDIO URLS
  // ==========================================================
  useEffect(() => {
    changeLoader(true);

    const fetchData = async () => {
      try {
        const url = `${config.LMS_BASE_URL}/panorama/api/get-embed-url`;

        const { data } = await getAuthenticatedHttpClient().get(url);
        const enrollmentData = camelCaseObject(data);
        const urlResponse = enrollmentData.body;

        handleDataReceived(urlResponse);
        changeCurrentView('DASHBOARDS');
        if (urlResponse.length > 0) {
          changeDashboardType(urlResponse[0].displayName);
        }
        changeLoader(false);
      } catch (error) {
        const httpErrorStatus = error.message;
        changeError(httpErrorStatus);
        changeLoader(false);
      }
    };

    fetchData();
  }, [
    changeCurrentView,
    changeDashboardType,
    changeError,
    changeLoader,
    config.LMS_BASE_URL,
    handleDataReceived,
  ]);

  return null;
};

export default Embed;
