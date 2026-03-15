import { t } from 'i18next';
import { Navigate } from 'react-router-dom';

// Reset password is not available in team-auth mode.
const ResetPasswordForm = () => {
  return <Navigate to="/login" replace />;
};

ResetPasswordForm.displayName = 'ResetPassword';

export { ResetPasswordForm };
