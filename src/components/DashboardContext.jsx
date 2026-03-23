import React, {
  useState, createContext, useMemo, useCallback,
} from 'react';
import PropTypes from 'prop-types';

export const DashboardTypeContext = createContext({
  dashboardType: '',
  changeDashboardType: () => { },
  changeUserRole: () => { },
  changeError: () => { },
  changeLoader: () => { },
  changeHomeMode: () => { },
  handleDataReceived: () => { },
  itemsMenu: [],
  homeMode: 'DEMO',
});

export const DashboardTypeProvider = ({ children }) => {
  const [dashboardType, setDashboardType] = useState('');
  const [loader, setLoader] = useState(true);
  const [error, setError] = useState(null);
  const [response, setResponse] = useState('');
  const [dashboardFunction, setDashboardFunction] = useState('READER');
  const [homeMode, setHomeMode] = useState('DEMO');
  const [userRole, setUserRole] = useState('');

  const changeUserRole = useCallback((value) => {
    setUserRole(value);
  }, []);

  const changeDashboardFunction = useCallback((value) => {
    setDashboardFunction(value);
  }, []);

  const changeDashboardType = useCallback((value) => {
    setDashboardType(value);
  }, []);

  const changeHomeMode = useCallback((value) => {
    setHomeMode(value);
  }, []);

  const handleDataReceived = useCallback((data) => {
    setResponse(data);
  }, []);

  const changeError = useCallback((newError) => {
    setError(newError);
  }, []);

  const changeLoader = useCallback((newLoader) => {
    setLoader(newLoader);
  }, []);

  const contextValue = useMemo(
    () => ({
      dashboardType,
      changeDashboardType,
      handleDataReceived,
      changeHomeMode,
      changeError,
      changeLoader,
      loader,
      error,
      response,
      changeDashboardFunction,
      dashboardFunction,
      homeMode,
      userRole,
      changeUserRole,
    }),
    [
      changeDashboardFunction,
      changeDashboardType,
      changeError,
      changeHomeMode,
      changeLoader,
      changeUserRole,
      dashboardFunction,
      dashboardType,
      error,
      handleDataReceived,
      homeMode,
      loader,
      response,
      userRole,
    ],
  );

  return (
    <DashboardTypeContext.Provider value={contextValue}>
      {children}
    </DashboardTypeContext.Provider>
  );
};

DashboardTypeProvider.propTypes = {
  children: PropTypes.node.isRequired,
};
