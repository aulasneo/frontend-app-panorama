import 'core-js/stable';
import 'regenerator-runtime';

import {
  APP_INIT_ERROR, APP_READY, subscribe, initialize, getConfig,
} from '@edx/frontend-platform';
import { AppProvider, ErrorPage } from '@edx/frontend-platform/react';
import ReactDOM from 'react-dom';
import { Helmet } from 'react-helmet';

import Header from '@edx/frontend-component-header';
import FooterSlot from '@openedx/frontend-slot-footer';
import messages from './i18n';
import AppPanorama from './AppPanorama';

import './index.scss';

subscribe(APP_READY, () => {
  ReactDOM.render(
    <AppProvider>
      <Helmet>
        <link rel="shortcut icon" href={getConfig().FAVICON_URL} type="image/x-icon" />
      </Helmet>
      <Header />
      <AppPanorama />
      <FooterSlot />
    </AppProvider>,
    document.getElementById('root'),
  );
});

subscribe(APP_INIT_ERROR, (error) => {
  ReactDOM.render(<ErrorPage message={error.message} />, document.getElementById('root'));
});

initialize({
  messages,
});
