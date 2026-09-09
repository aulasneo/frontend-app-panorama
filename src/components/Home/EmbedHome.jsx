import { useContext, useEffect } from 'react';
import { AppContext } from '@edx/frontend-platform/react';
import { getAuthenticatedHttpClient } from '@edx/frontend-platform/auth';
import { camelCaseObject } from '@edx/frontend-platform';
import { DashboardTypeContext } from '../DashboardContext';
import getApiErrorMessage from '../errors';

const EmbedHome = () => {
  const {
    changeHomeMode, changeError,
  } = useContext(DashboardTypeContext);
  const { config } = useContext(AppContext);

  useEffect(() => {
    let cancelled = false;
    changeError(null);
    const fetchData = async () => {
      try {
        const url = `${config.LMS_BASE_URL}/panorama/api/get-panorama-mode`;
        const { data } = await getAuthenticatedHttpClient().get(url);
        const enrollmentData = camelCaseObject(data);
        const home = enrollmentData.body;
        if (!cancelled) { changeHomeMode(home); }
      } catch (error) {
        if (!cancelled) { changeError(getApiErrorMessage(error)); }
      }
    };
    fetchData();
    return () => { cancelled = true; };
  }, [changeError, changeHomeMode, config.LMS_BASE_URL]);

  return null;
};

export default EmbedHome;
