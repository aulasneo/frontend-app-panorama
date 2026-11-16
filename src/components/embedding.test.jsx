import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { MemoryRouter, useLocation } from 'react-router-dom';
import { AppContext } from '@edx/frontend-platform/react';
import { getAuthenticatedHttpClient } from '@edx/frontend-platform/auth';
import { createEmbeddingContext } from 'amazon-quicksight-embedding-sdk';
import { DashboardTypeContext, DashboardTypeProvider } from './DashboardContext';
import Embed from './Embed';
import QuickSightFrame from './QuickSightFrame';
import QuickSightConsoleFrame from './QuickSightConsoleFrame';
import Tabs from './Tabs/Tabs';
import Home from './Home/Home';

const LocationProbe = () => {
  const location = useLocation();
  return <span data-testid="location">{location.pathname}</span>;
};

// Jest hoists this factory before React imports are initialized.
// eslint-disable-next-line global-require
jest.mock('@edx/frontend-platform/react', () => ({ AppContext: require('react').createContext({}) }));
jest.mock('@edx/frontend-platform/auth', () => ({ getAuthenticatedHttpClient: jest.fn() }));
jest.mock('amazon-quicksight-embedding-sdk', () => ({ createEmbeddingContext: jest.fn() }));

const deferred = () => {
  let resolve;
  const promise = new Promise((res) => { resolve = res; });
  return { promise, resolve };
};

describe('Panorama authenticated embedding', () => {
  let host;
  let root;
  let context;
  let app;
  let get;
  let embedDashboard;
  let embedConsole;

  const render = async (child) => {
    await act(async () => {
      root.render(
        <AppContext.Provider value={app}>
          <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
            <DashboardTypeContext.Provider value={context}>
              {child}
            </DashboardTypeContext.Provider>
          </MemoryRouter>
        </AppContext.Provider>,
      );
    });
  };

  beforeEach(() => {
    jest.clearAllMocks();
    host = document.createElement('div');
    document.body.append(host);
    root = createRoot(host);
    context = {
      changeDashboardType: jest.fn(),
      changeCurrentView: jest.fn(),
      handleDataReceived: jest.fn(),
      changeError: jest.fn(),
      changeLoader: jest.fn(),
      changeUserRole: jest.fn(),
      changeHomeMode: jest.fn(),
      userRole: 'READER',
      currentView: 'DASHBOARDS',
    };
    app = { config: { LMS_BASE_URL: 'https://lms.example' }, authenticatedUser: { userId: 1 } };
    const responses = {
      'https://lms.example/panorama/api/get-user-role': 'READER',
      'https://lms.example/panorama/api/get-embed-url': [{ name: 'one', display_name: 'One', url: 'https://qs.example/one' }],
      'https://lms.example/panorama/api/get-studio-url': [{ url: 'https://qs.example/console' }],
      'https://lms.example/panorama/api/get-panorama-mode': 'FREE',
    };
    get = jest.fn().mockImplementation((url) => {
      if (!(url in responses)) {
        return Promise.reject(new Error(`Unexpected request URL: ${url}`));
      }
      return Promise.resolve({ data: { body: responses[url] } });
    });
    getAuthenticatedHttpClient.mockReturnValue({ get });
    embedDashboard = jest.fn().mockResolvedValue({});
    embedConsole = jest.fn().mockResolvedValue({});
    createEmbeddingContext.mockResolvedValue({ embedDashboard, embedConsole });
  });

  afterEach(async () => {
    await act(async () => root.unmount());
    host.remove();
  });

  test('loads roles and camel-cased dashboards together', async () => {
    await render(<Embed />);
    expect(get.mock.calls).toEqual([
      ['https://lms.example/panorama/api/get-user-role'],
      ['https://lms.example/panorama/api/get-embed-url'],
    ]);
    expect(context.changeUserRole).toHaveBeenLastCalledWith('READER');
    expect(context.changeDashboardType).toHaveBeenCalledWith('One');
    expect(context.changeLoader).toHaveBeenLastCalledWith(false);
  });

  test('reports home-mode failures with an explicit session message', async () => {
    get.mockRejectedValue(Object.assign(new Error('Request failed'), { response: { status: 401 } }));
    await render(<Home />);
    const message = context.changeError.mock.calls.at(-1)[0];
    expect(message).toContain('Your session has expired');
    context = { ...context, error: message };
    await render(<Home />);
    expect(host.querySelector('[role="alert"]').textContent).toBe(message);
  });

  test('opens panels only for a message from the active home iframe', async () => {
    context = { ...context, homeMode: 'SAAS' };
    await render(<><Home /><LocationProbe /></>);
    const iframe = host.querySelector('iframe');
    expect(iframe.src).toBe('https://panorama-home-pages.s3.amazonaws.com/panorama-saas-home.html?navigation=message');

    const sendMessage = async (origin, source, type = 'panorama:navigate-panels') => {
      await act(async () => {
        window.dispatchEvent(new MessageEvent('message', {
          origin,
          source,
          data: { type },
        }));
      });
    };
    await sendMessage('https://untrusted.example', iframe.contentWindow);
    await sendMessage('https://panorama-home-pages.s3.amazonaws.com', window);
    await sendMessage('https://panorama-home-pages.s3.amazonaws.com', iframe.contentWindow, 'unrelated');
    expect(host.querySelector('[data-testid="location"]').textContent).toBe('/');

    await sendMessage('https://panorama-home-pages.s3.amazonaws.com', iframe.contentWindow);
    expect(host.querySelector('[data-testid="location"]').textContent).toBe('/panels');
  });

  test.each(['revisit', 'LMS change', 'logout', 'login'])(
    'clears the previous home iframe while reloading after %s',
    async (transition) => {
      if (transition === 'login') {
        app = { ...app, authenticatedUser: null };
      }
      const home = (key) => <DashboardTypeProvider><Home key={key} /></DashboardTypeProvider>;
      await render(home('initial'));
      expect(get).toHaveBeenCalledWith('https://lms.example/panorama/api/get-panorama-mode');
      expect(host.querySelector('iframe').src).toContain('panorama-free-home.html');

      const pending = deferred();
      get.mockClear().mockReturnValue(pending.promise);
      if (transition === 'LMS change') {
        app = { ...app, config: { LMS_BASE_URL: 'https://other-lms.example' } };
      } else if (transition === 'logout') {
        app = { ...app, authenticatedUser: null };
      } else if (transition === 'login') {
        app = { ...app, authenticatedUser: { userId: 2 } };
      }
      await render(home(transition === 'revisit' ? 'revisited' : 'initial'));
      expect(get.mock.calls).toEqual([[`${app.config.LMS_BASE_URL}/panorama/api/get-panorama-mode`]]);
      expect(host.querySelector('iframe')).toBeNull();
      await act(async () => pending.resolve({ data: { body: 'SAAS' } }));
      expect(host.querySelector('iframe').src).toContain('panorama-saas-home.html');
    },
  );

  test('ignores a previous session home response after the user changes', async () => {
    const previous = deferred();
    const current = deferred();
    get.mockReturnValueOnce(previous.promise).mockReturnValueOnce(current.promise);
    const home = <DashboardTypeProvider><Home /></DashboardTypeProvider>;
    await render(home);
    app = { ...app, authenticatedUser: { userId: 2 } };
    await render(home);
    await act(async () => current.resolve({ data: { body: 'SAAS' } }));
    await act(async () => previous.resolve({ data: { body: 'FREE' } }));
    expect(host.querySelector('iframe').src).toContain('panorama-saas-home.html');
  });

  test('accepts an empty grant list without retaining the previous dashboard', async () => {
    get.mockImplementation((url) => Promise.resolve({ data: { body: url.endsWith('get-user-role') ? 'READER' : [] } }));
    await render(<Embed />);
    expect(context.handleDataReceived).toHaveBeenLastCalledWith([]);
    expect(context.changeDashboardType).toHaveBeenLastCalledWith('');
    expect(context.changeLoader).toHaveBeenLastCalledWith(false);
  });

  test('handles dashboard request failure independently of a successful role request', async () => {
    get.mockImplementation((url) => (url.endsWith('get-user-role')
      ? Promise.resolve({ data: { body: 'AUTHOR' } }) : Promise.reject(new Error('Network failed'))));
    await render(<Embed />);
    expect(context.changeUserRole).toHaveBeenLastCalledWith('');
    expect(context.changeError).toHaveBeenLastCalledWith(expect.stringContaining('could not load'));
  });

  test.each([
    [401, 'Your session has expired'],
    [403, 'You do not have access'],
    [500, 'Panorama could not load'],
  ])('handles role request failure %s and clears the loader', async (status, message) => {
    get.mockImplementation((url) => (url.endsWith('get-user-role')
      ? Promise.reject(Object.assign(new Error('Request failed'), { response: { status } })) : Promise.resolve({ data: { body: [] } })));
    await render(<Embed />);
    expect(context.changeError).toHaveBeenLastCalledWith(expect.stringContaining(message));
    expect(context.changeLoader).toHaveBeenLastCalledWith(false);
    expect(context.changeUserRole).toHaveBeenLastCalledWith('');
  });

  test('ignores requests completed after unmount', async () => {
    const pending = deferred();
    get.mockReturnValue(pending.promise);
    await render(<Embed />);
    await render(null);
    jest.clearAllMocks();
    await act(async () => pending.resolve({ data: { body: [] } }));
    expect(context.changeError).not.toHaveBeenCalled();
    expect(context.changeLoader).not.toHaveBeenCalled();
  });

  test('reloads after the authenticated user changes', async () => {
    await render(<Embed />);
    get.mockClear();
    app = { ...app, authenticatedUser: { userId: 2 } };
    await render(<Embed />);
    expect(get).toHaveBeenCalledTimes(2);
  });

  test.each(['', 'Reader', 'INVALID'])('rejects an invalid role %s', async (role) => {
    get.mockImplementation((url) => Promise.resolve({ data: { body: url.endsWith('get-user-role') ? role : [] } }));
    await render(<Embed />);
    expect(context.changeError).toHaveBeenLastCalledWith(expect.stringContaining('could not load'));
  });

  test('does not embed after switching away during SDK initialization', async () => {
    const pending = deferred();
    createEmbeddingContext.mockReturnValue(pending.promise);
    const dashboard = { name: 'one', url: 'https://qs.example/one' };
    await render(<QuickSightFrame dashboard={dashboard} isActive />);
    await render(<QuickSightFrame dashboard={dashboard} isActive={false} />);
    await act(async () => pending.resolve({ embedDashboard }));
    expect(embedDashboard).not.toHaveBeenCalled();
  });

  test('fetches a fresh URL on delayed first activation and every tab revisit', async () => {
    const dashboard = { name: 'one', url: 'https://qs.example/expired' };
    await render(<QuickSightFrame dashboard={dashboard} isActive={false} />);
    expect(get).not.toHaveBeenCalled();
    get.mockResolvedValueOnce({
      data: {
        body: [
          { name: 'other', url: 'https://qs.example/wrong-dashboard' },
          { name: 'one', url: 'https://qs.example/fresh' },
        ],
      },
    });
    await render(<QuickSightFrame dashboard={dashboard} isActive />);
    expect(embedDashboard.mock.calls[0][0].url).toBe('https://qs.example/fresh');
    await render(<QuickSightFrame dashboard={dashboard} isActive={false} />);
    get.mockResolvedValueOnce({ data: { body: [{ name: 'one', url: 'https://qs.example/fresh-again' }] } });
    await render(<QuickSightFrame dashboard={dashboard} isActive />);
    expect(embedDashboard.mock.calls[1][0].url).toBe('https://qs.example/fresh-again');
    expect(get.mock.calls).toEqual([
      ['https://lms.example/panorama/api/get-embed-url'],
      ['https://lms.example/panorama/api/get-embed-url'],
    ]);
  });

  test.each(['switch', 'unmount', 'user', 'LMS'])(
    'ignores a stale dashboard URL response after %s',
    async (transition) => {
      const pending = deferred();
      get.mockReturnValueOnce(pending.promise);
      const dashboard = { name: 'one', url: 'https://qs.example/expired' };
      await render(<QuickSightFrame dashboard={dashboard} isActive />);
      if (transition === 'user') {
        app = { ...app, authenticatedUser: { userId: 2 } };
      } else if (transition === 'LMS') {
        app = { ...app, config: { LMS_BASE_URL: 'https://new-lms.example' } };
      }
      get.mockResolvedValue({ data: { body: [{ name: 'one', url: 'https://qs.example/current' }] } });
      await render(transition === 'unmount' ? null
        : <QuickSightFrame dashboard={dashboard} isActive={transition !== 'switch'} />);
      await act(async () => pending.resolve({ data: { body: [{ name: 'one', url: 'https://qs.example/stale' }] } }));
      if (transition === 'user' || transition === 'LMS') {
        expect(get).toHaveBeenLastCalledWith(`${app.config.LMS_BASE_URL}/panorama/api/get-embed-url`);
        expect(embedDashboard).toHaveBeenCalledTimes(1);
        expect(embedDashboard.mock.calls[0][0].url).toBe('https://qs.example/current');
      } else {
        expect(embedDashboard).not.toHaveBeenCalled();
      }
    },
  );

  test.each([401, 403, 500])('does not reuse a saved URL when renewal fails with %s', async (status) => {
    get.mockRejectedValue(Object.assign(new Error('Request failed'), { response: { status } }));
    await render(<QuickSightFrame dashboard={{ name: 'one', url: 'https://qs.example/saved' }} isActive />);
    expect(embedDashboard).not.toHaveBeenCalled();
    expect(context.changeError.mock.calls.at(-1)[0]).toMatch(/session has expired|do not have access|could not load/);
  });

  test('does not embed a dashboard removed from the refreshed grants', async () => {
    get.mockResolvedValue({ data: { body: [] } });
    await render(<QuickSightFrame dashboard={{ name: 'one', url: 'https://qs.example/saved' }} isActive />);
    expect(embedDashboard).not.toHaveBeenCalled();
    expect(context.changeError).toHaveBeenLastCalledWith(expect.stringContaining('no longer available'));
  });

  test('isolates late SDK writes from a replacement dashboard and remounts safely', async () => {
    get.mockResolvedValue({
      data: {
        body: [
          { name: 'one', url: 'https://qs.example/old' },
          { name: 'two', url: 'https://qs.example/new' },
        ],
      },
    });
    const pending = deferred();
    embedDashboard.mockImplementationOnce(({ container }) => pending.promise.then(() => {
      container.append(document.createElement('iframe'));
    }));
    await render(<QuickSightFrame dashboard={{ name: 'one', url: 'https://qs.example/old' }} isActive />);
    const oldContainer = embedDashboard.mock.calls[0][0].container;
    await render(<QuickSightFrame dashboard={{ name: 'two' }} isActive />);
    await act(async () => pending.resolve());
    expect(oldContainer.isConnected).toBe(false);
    expect(host.querySelector('iframe')).toBeNull();
    expect(embedDashboard).toHaveBeenCalledTimes(2);
    await render(null);
    await render(<QuickSightFrame dashboard={{ name: 'two' }} isActive />);
    expect(embedDashboard).toHaveBeenCalledTimes(3);
  });

  test('passes student parameters as data and reports SDK content errors', async () => {
    context.userRole = 'STUDENT';
    get.mockResolvedValue({ data: { body: [{ name: 'one', url: 'https://qs.example/#p.userId=7&p.lms=school' }] } });
    await render(<QuickSightFrame dashboard={{ name: 'one', url: 'https://qs.example/#p.userId=old' }} isActive />);
    const options = embedDashboard.mock.calls[0][1];
    expect(options.parameters).toEqual([{ Name: 'userId', Values: ['7'] }, { Name: 'lms', Values: ['school'] }]);
    options.onMessage({ eventName: 'ERROR_OCCURRED', message: { errorCode: 'SESSION_EXPIRED' } });
    expect(context.changeError).toHaveBeenLastCalledWith('QuickSight error: SESSION_EXPIRED');
  });

  test.each(['READER', 'STUDENT'])('hides Studio and refuses console embedding for %s', async (role) => {
    context.userRole = role;
    context.currentView = 'STUDIO';
    await render(<><Tabs /><QuickSightConsoleFrame /></>);
    expect(host.textContent).not.toContain('Studio');
    expect(get).not.toHaveBeenCalled();
  });

  test('keeps dashboard tab identities when repeated labels are reordered', async () => {
    const first = { name: 'first', displayName: 'Shared label' };
    const second = { name: 'second', displayName: 'Shared label' };
    context = { ...context, response: [first, second] };
    await render(<Tabs />);
    const firstTab = host.querySelector('#tab-first');
    const secondTab = host.querySelector('#tab-second');
    expect(firstTab.textContent).toBe('Shared label');
    expect(secondTab.textContent).toBe('Shared label');
    context = { ...context, response: [second, first] };
    await render(<Tabs />);
    expect(host.querySelectorAll('.tab')[0]).toBe(secondTab);
    expect(host.querySelectorAll('.tab')[1]).toBe(firstTab);
  });

  test('shows Studio for authors and cancels a late console URL response', async () => {
    context.userRole = 'AUTHOR';
    context.currentView = 'STUDIO';
    const pending = deferred();
    get.mockReturnValue(pending.promise);
    await render(<><Tabs /><QuickSightConsoleFrame /></>);
    expect(host.textContent).toContain('Studio');
    await render(null);
    await act(async () => pending.resolve({ data: { body: [{ url: 'https://qs.example/console' }] } }));
    expect(createEmbeddingContext).not.toHaveBeenCalled();
  });

  test('embeds the author console and detaches it when leaving Studio', async () => {
    context.userRole = 'AUTHOR';
    context.currentView = 'STUDIO';
    await render(<QuickSightConsoleFrame />);
    expect(get.mock.calls).toEqual([['https://lms.example/panorama/api/get-studio-url']]);
    expect(embedConsole).toHaveBeenCalledTimes(1);
    const { container } = embedConsole.mock.calls[0][0];
    expect(container.isConnected).toBe(true);
    expect(context.changeLoader).toHaveBeenLastCalledWith(false);
    context = { ...context, currentView: 'DASHBOARDS' };
    await render(<QuickSightConsoleFrame />);
    expect(container.isConnected).toBe(false);
  });

  test.each(['URL request', 'SDK initialization', 'console embedding'])(
    'clears the loader when leaving Studio during %s',
    async (stage) => {
      context.userRole = 'AUTHOR';
      context.currentView = 'STUDIO';
      const pending = deferred();
      if (stage === 'URL request') {
        get.mockReturnValue(pending.promise);
      } else if (stage === 'SDK initialization') {
        createEmbeddingContext.mockReturnValue(pending.promise);
      } else {
        embedConsole.mockReturnValue(pending.promise);
      }
      await render(<QuickSightConsoleFrame />);
      expect(context.changeLoader).toHaveBeenLastCalledWith(true);
      context = { ...context, currentView: 'DASHBOARDS' };
      await render(<QuickSightConsoleFrame />);
      expect(context.changeLoader).toHaveBeenLastCalledWith(false);
      context.changeLoader.mockClear();
      await act(async () => pending.resolve(stage === 'URL request'
        ? { data: { body: [{ url: 'https://qs.example/console' }] } }
        : { embedDashboard, embedConsole }));
      expect(context.changeLoader).not.toHaveBeenCalled();
      expect(context.changeError).toHaveBeenLastCalledWith(null);
      if (stage !== 'console embedding') {
        expect(embedConsole).not.toHaveBeenCalled();
      }
    },
  );

  test('reports SDK initialization failures without leaving the console loader active', async () => {
    context.userRole = 'AUTHOR';
    context.currentView = 'STUDIO';
    createEmbeddingContext.mockRejectedValue(new Error('SDK unavailable'));
    await render(<QuickSightConsoleFrame />);
    expect(context.changeError).toHaveBeenLastCalledWith('QuickSight embedding failed');
    expect(context.changeLoader).toHaveBeenLastCalledWith(false);
  });
});
