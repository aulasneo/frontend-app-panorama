import React, { useContext, useState, useEffect } from 'react';
import { DashboardTypeContext } from '../DashboardContext';
import logo from '../../images/panorama-by-aulasneo-small.png';
import './stylesTabs.css';

const Tabs = () => {
  const {
    changeDashboardType,
    dashboardType,
    response: dashboardResponse,
    dashboardFunction,
    changeDashboardFunction,
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

  const changeShowTabs = (e) => {
    if (e.target.name === 'dashboards-button') {
      setShowTabs(!showTabs);
    }
    changeDashboardFunction(e.target.value);
  };

  return (
    <div className="content-tabs">
      <div className="sidebar">
        {
          (userRole === 'AUTHOR' || userRole === 'AI_AUTHOR') && (
            <button
              type="button"
              className={`buttonMenu ${(dashboardFunction === 'AUTHOR' || dashboardFunction === 'AI_AUTHOR') && 'disabled'}`}
              onClick={changeShowTabs}
              value={userRole === 'AUTHOR' ? 'AUTHOR' : 'AI_AUTHOR'}
            >
              Studio
            </button>
          )
        }
        <button
          type="button"
          className="buttonMenu"
          onClick={changeShowTabs}
          onBlur={handleStudioBlur}
          name="dashboards-button"
          value="READER"
        >
          Dashboards
        </button>
      </div>
      <img alt="logo-panorama" src={logo} className="logo-panorama" />
      {(dashboardFunction === 'READER') && (
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
