import { Navigate } from 'react-router-dom';

// Old email/password sign-in is not available in team-auth mode.
const SignInForm: React.FC = () => {
  return <Navigate to="/login" replace />;
};

SignInForm.displayName = 'SignIn';

export { SignInForm };
