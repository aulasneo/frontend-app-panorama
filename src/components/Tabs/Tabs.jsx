import React, { useContext, useState, useEffect } from 'react';
import { getAuthenticatedHttpClient } from '@edx/frontend-platform/auth';
import { AppContext } from '@edx/frontend-platform/react';
import { DashboardTypeContext } from '../DashboardContext';
import './stylesTabs.css';

const Tabs = () => {
  const {
    changeDashboardType, dashboardType, response, dashboardFunction, changeDashboardFunction,
  } = useContext(DashboardTypeContext);
  const [itemsMenu, setItemsMenu] = useState([]);
  const [showTabs, setShowTabs] = useState(false);
  const [userRole, setUserRole] = useState('');
  const { config } = useContext(AppContext);
  const getUserRole = async () => {
    const response = await getAuthenticatedHttpClient().get(`${config.LMS_BASE_URL}/panorama/api/get-user-role`);
    setUserRole(response.data.body);
  };

  useEffect(() => {
    getUserRole();
  }, []);

  const handleMenuClick = (value) => {
    changeDashboardType(value);
  };

  const handleStudioBlur = () => {
    setShowTabs(false);
  };

  const ChangeShowTabs = (e) => {
    if (e.target.name === 'dashboards-button') {
      setShowTabs(!showTabs);
    }
    changeDashboardFunction(e.target.value);
  };

  useEffect(() => {
    if (response && response.length > 0 && itemsMenu.length === 0) {
      const updatedItemsMenu = [];
      for (let i = 0; i < response.length; i++) {
        updatedItemsMenu.push(response[i].displayName);
      }
      setItemsMenu(updatedItemsMenu);
    }
  }, [response, itemsMenu]);

  return (
    <div className="content-tabs">
      <div className="sidebar">
        {
          (userRole === 'AUTHOR' || userRole === 'AI_AUTHOR') &&
          <button
            type="button"
            className={`buttonMenu ${(dashboardFunction === 'AUTHOR' || dashboardFunction === 'AI_AUTHOR') && 'disabled'}`}
            onClick={ChangeShowTabs} value={userRole === 'AUTHOR' ? 'AUTHOR' : 'AI_AUTHOR'}>Studio
          </button>
        }
        <button
          type="button"
          className="buttonMenu"
          onClick={ChangeShowTabs}
          onBlur={handleStudioBlur}
          name="dashboards-button"
          value="READER">Dashboards
        </button>
      </div>

      {(dashboardFunction === 'READER') && (
        <div className={`tab-container ${showTabs ? 'open' : 'close'}`}>
          {itemsMenu.map((item, index) => (
            <div id={`tab${index}`} className="tab" key={item.id || `item_${index}`}>
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
