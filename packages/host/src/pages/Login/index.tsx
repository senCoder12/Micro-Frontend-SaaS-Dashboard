/**
 * Login Page — mock authentication entry point.
 *
 * FLOW:
 *   1. User submits email + password
 *   2. loginAsync POSTs to /auth/login (intercepted by mock adapter)
 *   3. On success: dispatch setUser() → navigate to intended page
 *   4. On failure: show inline error from authSlice.error
 *
 * REDIRECT AFTER LOGIN:
 *   React Router's <Navigate> passes the blocked route in location.state.from.
 *   e.g., user visits /analytics → redirected to /login → logs in → /analytics.
 *   If no intended route, defaults to /dashboard.
 *
 * DEMO CREDENTIALS:
 *   Three users with different roles are shown on-screen.
 *   Click any to fill the form — removes friction for demos.
 */
import React, { useState }                  from 'react';
import { useNavigate, useLocation, Navigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector }    from '@/store/hooks';
import { loginAsync, selectAuthStatus, selectAuthError } from '@/store/slices';
import { setUser, selectIsAuthenticated }                from '@/store/slices';
import type { UserRole }                                 from '@/types';

// ── Demo credential cards ──────────────────────────────────────────────────

interface DemoUser {
  email:       string;
  password:    string;
  role:        UserRole;
  description: string;
}

const DEMO_USERS: DemoUser[] = [
  {
    email:       'admin@acme.com',
    password:    'password',
    role:        'admin',
    description: 'Full access — all pages',
  },
  {
    email:       'manager@acme.com',
    password:    'password',
    role:        'manager',
    description: 'Dashboard + Analytics',
  },
  {
    email:       'viewer@acme.com',
    password:    'password',
    role:        'viewer',
    description: 'Dashboard only',
  },
];

const ROLE_COLOR: Record<UserRole, string> = {
  admin:   'var(--color-primary)',
  manager: 'var(--color-success)',
  viewer:  'var(--color-warning)',
};

// ── Page ───────────────────────────────────────────────────────────────────

const Login: React.FC = () => {
  const dispatch  = useAppDispatch();
  const navigate  = useNavigate();
  const location  = useLocation();
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');

  const status       = useAppSelector(selectAuthStatus);
  const error        = useAppSelector(selectAuthError);
  const isAuthenticated = useAppSelector(selectIsAuthenticated);

  // Already logged in — redirect immediately (handles direct nav to /login)
  if (isAuthenticated) {
    const from = (location.state as { from?: { pathname: string } } | null)?.from?.pathname ?? '/dashboard';
    return <Navigate to={from} replace />;
  }

  const isLoading = status === 'loading';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading) return;

    const result = await dispatch(loginAsync({ email, password }));

    if (loginAsync.fulfilled.match(result)) {
      // Wire user profile into userSlice (loginAsync only handles the token)
      dispatch(setUser(result.payload.user));
      // Navigate to where the user was trying to go, or default to dashboard
      const from = (location.state as { from?: { pathname: string } } | null)
        ?.from?.pathname ?? '/dashboard';
      navigate(from, { replace: true });
    }
    // On rejection: error is in Redux state, rendered below the form
  };

  const fillDemo = (demo: DemoUser) => {
    setEmail(demo.email);
    setPassword(demo.password);
  };

  return (
    <div className="login-page" role="main">
      <div className="login-card">
        {/* Logo */}
        <div className="login-logo" aria-hidden="true">
          <span className="login-logo__icon">◈</span>
          <span className="login-logo__text">SaaS Dashboard</span>
        </div>

        <h1 className="login-title">Sign in to your account</h1>

        {/* Credentials form */}
        <form className="login-form" onSubmit={handleSubmit} noValidate>
          <div className="login-form__field">
            <label className="login-form__label" htmlFor="email">
              Email address
            </label>
            <input
              id="email"
              className="login-form__input"
              type="email"
              autoComplete="email"
              required
              placeholder="you@acme.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              disabled={isLoading}
              aria-describedby={error ? 'login-error' : undefined}
            />
          </div>

          <div className="login-form__field">
            <label className="login-form__label" htmlFor="password">
              Password
            </label>
            <input
              id="password"
              className="login-form__input"
              type="password"
              autoComplete="current-password"
              required
              placeholder="••••••••"
              value={password}
              onChange={e => setPassword(e.target.value)}
              disabled={isLoading}
            />
          </div>

          {/* Error message */}
          {error !== null && (
            <p id="login-error" className="login-form__error" role="alert">
              <span aria-hidden="true">⚠</span> {error}
            </p>
          )}

          <button
            className="btn btn--primary login-form__submit"
            type="submit"
            disabled={isLoading || !email || !password}
            aria-busy={isLoading}
          >
            {isLoading ? 'Signing in…' : 'Sign in'}
          </button>
        </form>

        {/* Demo credentials */}
        <div className="login-demo">
          <p className="login-demo__label">Demo accounts — click to fill:</p>
          <div className="login-demo__cards">
            {DEMO_USERS.map(demo => (
              <button
                key={demo.email}
                type="button"
                className="login-demo__card"
                onClick={() => fillDemo(demo)}
                disabled={isLoading}
              >
                <span
                  className="login-demo__role"
                  style={{ color: ROLE_COLOR[demo.role] }}
                >
                  {demo.role}
                </span>
                <span className="login-demo__desc">{demo.description}</span>
                <span className="login-demo__email">{demo.email}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
