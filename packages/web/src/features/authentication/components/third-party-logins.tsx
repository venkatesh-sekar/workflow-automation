import React from 'react';

// Third-party login is not available in team-auth mode.
const ThirdPartyLogin = React.memo(({ isSignUp: _ }: { isSignUp: boolean }) => {
  return null;
});

ThirdPartyLogin.displayName = 'ThirdPartyLogin';
export { ThirdPartyLogin };
