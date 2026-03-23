import React, { useContext } from 'react';
import CircularProgress from '@mui/material/CircularProgress';
import { DashboardTypeContext } from '../DashboardContext';
import Tabs from '../Tabs/Tabs';
import Embed from '../Embed';
import QuickSightConsoleFrame from '../QuickSightConsoleFrame';
import QuickSightFrame from '../QuickSightFrame';
import './stylesPanels.css';

const Panels = () => {
  const {
    dashboardType, currentView, loader, error, response,
  } = useContext(DashboardTypeContext);

  return (
    <div className="dashboard" id="dashboard">
      {!error && <Embed />}
      <Tabs />
      {currentView === 'DASHBOARDS' && (
        <div className="framesContainer" id="framesContainer">
          {response && response.map((item) => (
            <QuickSightFrame
              key={item.name}
              dashboard={item}
              isActive={dashboardType === item.displayName}
            />
          ))}
        </div>
      )}
      {currentView === 'STUDIO' && (
        <div className="framesContainer" id="framesContainer">
          <QuickSightConsoleFrame />
        </div>
      )}
      {!error && loader && (
        <div className="circularProgress circularProgressOverlay">
          <CircularProgress />
        </div>
      )}
      {error && (
        <div className="modal-container">
          <div className="warning-modal">
            <p className="modal-title">ERROR</p>
            {error}
          </div>
        </div>
      )}
    </div>
  );
};

export default Panels;
