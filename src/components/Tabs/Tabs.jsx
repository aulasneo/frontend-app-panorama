import React, { useContext, useState } from 'react';
import { DashboardTypeContext } from '../DashboardContext';
import logo from '../../images/panorama-by-aulasneo-small.png';
import './stylesTabs.css';

const Tabs = () => {
  const {
    changeDashboardType,
    changeCurrentView,
    dashboardType,
    currentView,
    response: dashboardResponse,
    userRole,
  } = useContext(DashboardTypeContext);
  const itemsMenu = dashboardResponse || [];
  const [showTabs, setShowTabs] = useState(false);

  const handleMenuClick = (value) => {
    changeDashboardType(value);
  };

  const handleStudioBlur = () => {
    setShowTabs(false);
  };

  const showDashboards = () => {
    setShowTabs((current) => !current);
    changeCurrentView('DASHBOARDS');
  };

  const showStudio = () => {
    setShowTabs(false);
    changeCurrentView('STUDIO');
  };

  return (
    <div className="content-tabs">
      <div className="sidebar">
        {
          (userRole === 'AUTHOR') && (
            <button
              type="button"
              className={`buttonMenu ${currentView === 'STUDIO' ? 'disabled' : ''}`}
              onClick={showStudio}
            >
              Studio
            </button>
          )
        }
        <button
          type="button"
          className="buttonMenu"
          onClick={showDashboards}
          onBlur={handleStudioBlur}
          name="dashboards-button"
        >
          Dashboards
        </button>
      </div>
      <img alt="logo-panorama" src={logo} className="logo-panorama" />
      {(currentView === 'DASHBOARDS') && (
        <div className={`tab-container ${showTabs ? 'open' : 'close'}`}>
          {itemsMenu.map(({ name, displayName }) => (
            <div id={`tab-${name}`} className="tab" key={name}>
              <a
                className={`${displayName === dashboardType ? 'selected' : ''}`}
                aria-current="page"
                href={`#${displayName}`}
                onClick={() => handleMenuClick(displayName)}
              >
                {displayName}
              </a>
            </div>
          ))}
        </div>
      )}

    </div>
  );
};

export default Tabs;
