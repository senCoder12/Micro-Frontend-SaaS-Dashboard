/**
 * NotFound — Rendered for any path not matched by the router.
 * Lives outside the AppShell route so it renders full-screen
 * without the sidebar/header.
 */
import React from 'react';
import { useNavigate } from 'react-router-dom';

const NotFound: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="not-found">
      <div className="not-found__code" aria-hidden="true">404</div>
      <h1 className="not-found__title">Page not found</h1>
      <p className="not-found__message">
        The page you're looking for doesn't exist or has been moved.
      </p>
      <button
        className="btn btn--primary"
        type="button"
        onClick={() => navigate('/dashboard')}
      >
        Back to Dashboard
      </button>
    </div>
  );
};

export default NotFound;
