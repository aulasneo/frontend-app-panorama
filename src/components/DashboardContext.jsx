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
  beginLoading: () => () => { },
  changeHomeMode: () => { },
  handleDataReceived: () => { },
  itemsMenu: [],
  homeMode: '',
});

export const DashboardTypeProvider = ({ children }) => {
  const [dashboardType, setDashboardType] = useState('');
  const [currentView, setCurrentView] = useState('DASHBOARDS');
  const [loader, setLoader] = useState(true);
  const [pendingLoads, setPendingLoads] = useState(0);
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

  // Each asynchronous frame load releases only its own share of the loader.
  // Cleanup and finally may both run, so the release must be idempotent.
  const beginLoading = useCallback(() => {
    setPendingLoads((count) => count + 1);
    let finished = false;
    return () => {
      if (!finished) {
        finished = true;
        setPendingLoads((count) => count - 1);
      }
    };
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
      beginLoading,
      loader: loader || pendingLoads > 0,
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
      beginLoading,
      changeUserRole,
      currentView,
      dashboardType,
      error,
      handleDataReceived,
      homeMode,
      loader,
      pendingLoads,
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
