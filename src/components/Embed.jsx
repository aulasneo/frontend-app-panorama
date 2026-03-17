import { useState, useEffect, useContext } from 'react';
import { createEmbeddingContext } from 'amazon-quicksight-embedding-sdk';
import { AppContext } from '@edx/frontend-platform/react';
import { getAuthenticatedHttpClient } from '@edx/frontend-platform/auth';
import { camelCaseObject } from '@edx/frontend-platform';
import { DashboardTypeContext } from './DashboardContext';

const Embed = () => {
  const {
    changeDashboardType,
    handleDataReceived,
    changeError,
    changeLoader,
    dashboardFunction,
    userRole,
    changeUserRole,
  } = useContext(DashboardTypeContext);

  const { config, authenticatedUser } = useContext(AppContext);
  const [response, setResponse] = useState(null);

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
        let url;

        // ---------------------------------------
        // SELECCIÓN DEL ENDPOINT SEGÚN EL TIPO
        // ---------------------------------------
        if (dashboardFunction === 'AUTHOR') {
          // Consola de edición
          url = `${config.LMS_BASE_URL}/panorama/api/get-studio-url`;
        } else {
          // Reader o Author en modo dashboards
          url = `${config.LMS_BASE_URL}/panorama/api/get-embed-url?dashboard_function=${dashboardFunction}`;
        }

        const { data } = await getAuthenticatedHttpClient().get(url);
        const enrollmentData = camelCaseObject(data);
        const urlResponse = enrollmentData.body;

        setResponse(urlResponse);
        handleDataReceived(urlResponse);

        for (let i = 0; i < urlResponse.length; i++) {
          const container = document.createElement('div');
          container.id = `${urlResponse[i].name}Container`;
        }

        changeDashboardType(urlResponse[0].displayName);
        changeLoader(false);
      } catch (error) {
        const httpErrorStatus = error.message;
        changeError(httpErrorStatus);
        changeLoader(false);
      }
    };

    fetchData();
  }, [
    changeDashboardType,
    changeError,
    changeLoader,
    config.LMS_BASE_URL,
    dashboardFunction,
    handleDataReceived,
    userRole,
  ]);

  // ==========================================================
  // EMBED DASHBOARDS OR CONSOLE
  // ==========================================================
  useEffect(() => {
    const embedDashboards = async () => {
      changeLoader(true);

      if (!response) {
        changeLoader(false);
        return;
      }

      const embeddingContext = await createEmbeddingContext();
      const { embedDashboard, embedConsole, embedQSearchBar } = embeddingContext;

      await Promise.all(response.map(async (dashboard) => {
        const containerId = `${dashboard.name}Container`;
        const container = document.getElementById(containerId);

        if (!container) {
          return;
        }

        if (container.firstChild) {
          container.removeChild(container.firstChild);
        }

        const options = {
          url: dashboard.url,
          container,
          width: '100%',
        };

        // ---------------------------------------
        // EMBEDDING SEGÚN TIPO
        // ---------------------------------------
        if (dashboardFunction === 'AUTHOR') {
          // Studio (consola)
          embedConsole(options);
        } else if (dashboardFunction === 'READER') {
          // Reader con parámetros si es STUDENT
          if (userRole === 'STUDENT') {
            const contentOptions = {
              parameters: [
                { Name: 'userId', Values: [authenticatedUser.userId] },
                { Name: 'lms', Values: [config.LMS_BASE_URL.split('//')[1]] },
                { Name: 'userFullName', Values: [authenticatedUser.name] },
                { Name: 'userEmail', Values: [authenticatedUser.email] },
              ],
            };

            const embeddedDashboard = await embedDashboard(options, contentOptions);

            embeddedDashboard.setParameters([
              { Name: 'userId', Values: authenticatedUser.userId },
              { Name: 'lms', Values: config.LMS_BASE_URL.split('//')[1] },
              { Name: 'userFullName', Values: authenticatedUser.name },
              { Name: 'userEmail', Values: authenticatedUser.email },
            ]);
          } else {
            embedDashboard(options);
          }
        } else if (dashboardFunction === 'AI_AUTHOR') {
          embedQSearchBar(options);
        }
      }));

      changeLoader(false);
    };

    embedDashboards();
  }, [
    authenticatedUser.email,
    authenticatedUser.name,
    authenticatedUser.userId,
    changeLoader,
    config.LMS_BASE_URL,
    dashboardFunction,
    response,
    userRole,
  ]);

  return null;
};

export default Embed;
