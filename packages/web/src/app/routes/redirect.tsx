import React, { useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

import { LoadingScreen } from '@/components/custom/loading-screen';

// Third-party auth redirect is not available in team-auth mode.
// This page now only handles the OAuth2 connection popup callback (window.opener).
const RedirectPage: React.FC = React.memo(() => {
  const location = useLocation();
  const navigate = useNavigate();
  const hasCheckedParams = useRef(false);

  useEffect(() => {
    if (hasCheckedParams.current) {
      return;
    }
    hasCheckedParams.current = true;
    const params = new URLSearchParams(location.search);
    const code = params.get('code');

    if (window.opener && code) {
      window.opener.postMessage(
        {
          code: code,
        },
        '*',
      );
    }
    if (!window.opener && !code) {
      navigate('/');
    }
  }, [location.search, navigate]);

  return <LoadingScreen />;
});

RedirectPage.displayName = 'RedirectPage';

export { RedirectPage };
