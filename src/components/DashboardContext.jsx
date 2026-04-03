import React, {
  useState, createContext, useMemo, useCallback,
} from 'react';
import PropTypes from 'prop-types';

export const DashboardTypeContext = createContext({
  dashboardType: '',
  changeDashboardType: () => { },
  changeCurrentView: () => { },
  changeUserRole: () => { },
  changeError: () => { },
  changeLoader: () => { },
  changeHomeMode: () => { },
  handleDataReceived: () => { },
  itemsMenu: [],
  homeMode: '',
});

export const DashboardTypeProvider = ({ children }) => {
  const [dashboardType, setDashboardType] = useState('');
  const [currentView, setCurrentView] = useState('DASHBOARDS');
  const [loader, setLoader] = useState(true);
  const [error, setError] = useState(null);
  const [response, setResponse] = useState('');
  const [homeMode, setHomeMode] = useState('');
  const [userRole, setUserRole] = useState('');

  const changeUserRole = useCallback((value) => {
    setUserRole(value);
  }, []);

  const changeCurrentView = useCallback((value) => {
    setCurrentView(value);
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
      currentView,
      changeCurrentView,
      handleDataReceived,
      changeHomeMode,
      changeError,
      changeLoader,
      loader,
      error,
      response,
      homeMode,
      userRole,
      changeUserRole,
    }),
    [
      changeCurrentView,
      changeDashboardType,
      changeError,
      changeHomeMode,
      changeLoader,
      changeUserRole,
      currentView,
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
