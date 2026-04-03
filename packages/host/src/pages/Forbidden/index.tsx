/**
 * Forbidden (403) Page — shown when a user is authenticated but lacks the
 * role required to access the requested resource.
 *
 * Distinction:
 *   401 Unauthorized → not authenticated → redirect to /login
 *   403 Forbidden    → authenticated but wrong role → show this page
 *
 * The user stays in the AppShell (sidebar + header are visible) so they
 * can navigate to a page they CAN access. No dead-end.
 */
import React    from 'react';
import { Link } from 'react-router-dom';
import { useAppSelector } from '@/store/hooks';
import { selectUser }     from '@/store/slices';

const Forbidden: React.FC = () => {
  const user = useAppSelector(selectUser);

  return (
    <div className="page forbidden-page">
      <div className="forbidden-card">
        <div className="forbidden-card__code" aria-hidden="true">403</div>

        <h1 className="forbidden-card__title">Access Denied</h1>

        <p className="forbidden-card__message">
          {user !== null ? (
            <>
              Your role (<strong style={{ color: 'var(--color-warning)' }}>{user.role}</strong>)
              doesn't have permission to view this page.
            </>
          ) : (
            'You don\'t have permission to view this page.'
          )}
        </p>

        <p className="forbidden-card__hint">
          Contact your administrator if you believe this is a mistake.
        </p>

        <Link to="/dashboard" className="btn btn--primary forbidden-card__cta">
          Back to Dashboard
        </Link>
      </div>
    </div>
  );
};

export default Forbidden;
