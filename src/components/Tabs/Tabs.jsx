import React, { useContext, useState, useEffect } from 'react';
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
  const [itemsMenu, setItemsMenu] = useState([]);
  const [showTabs, setShowTabs] = useState(false);

  useEffect(() => {
    if (dashboardResponse && dashboardResponse.length > 0) {
      setItemsMenu(dashboardResponse.map((item) => item.displayName));
    }
  }, [dashboardResponse]);

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
          {itemsMenu.map((item) => (
            <div id={`tab-${item}`} className="tab" key={item}>
              <a
                className={`${item === dashboardType ? 'selected' : ''}`}
                aria-current="page"
                href={`#${item}`}
                onClick={() => handleMenuClick(item)}
              >
                {item}
              </a>
            </div>
          ))}
        </div>
      )}

    </div>
  );
};

export default Tabs;
