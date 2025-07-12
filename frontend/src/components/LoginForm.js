import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import './styles/LoginForm.css';
import api from '../api';
import { useNavigate } from 'react-router-dom';
import LanguageSwitcher from './LanguageSwitcher';
// 👇 Add context import
import { useUser } from '../contexts/UserContext';

export default function LoginForm({ setToken }) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  // 👇 useUser hook (if exists)
  const { login } = useUser();

  // Use email instead of username
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  /* ── carousel text from i18n ──────────────────────────────── */
  const slides = t('login.carousel', { returnObjects: true });
  const [idx, setIdx] = useState(0);
  useEffect(() => {
    const iv = setInterval(() => setIdx(i => (i + 1) % slides.length), 5000);
    return () => clearInterval(iv);
  }, [slides.length]);

  // Auto-fill email if remembered
  useEffect(() => {
    const remembered = localStorage.getItem('rememberUser');
    if (remembered) setEmail(remembered);
  }, []);

  /* ── form submit ──────────────────────────────────────────── */
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      // 👇 Use context login if it exists, else fallback to API call
      if (login) {
        await login(email, password, rememberMe);
        if (rememberMe) localStorage.setItem('rememberUser', email);
        navigate('/dashboard');
      } else {
        // Default API logic (unchanged)
        const { data } = await api.post('/auth/login/', { email, password, remember: rememberMe });
        if (data.access) {
          localStorage.setItem('accessToken', data.access);
          api.defaults.headers.common['Authorization'] = `Bearer ${data.access}`;
          if (setToken) setToken(data.access);
        }
        if (rememberMe) localStorage.setItem('rememberUser', email);
        navigate('/dashboard');
      }
    } catch (err) {
      setError(
        err?.detail ||
        err?.response?.status === 400 ||
        err?.response?.status === 401
          ? t('login.invalidCredentials')
          : t('login.unexpectedError')
      );
    } finally {
      setIsLoading(false);
    }
  };

  /* ── optional social login buttons (place-holders) ────────── */
  const handleSocialLogin = (provider) => {
    console.log(`Login with ${provider}`);
  };

  return (
    <div className="login-bg">
      <LanguageSwitcher />

      <div className="login-container">
        {/* Left side — Login Form */}
        <div className="login-left">
          <form className="login-form" onSubmit={handleSubmit}>
            <div className="form-header">
              <h2>{t('login.welcomeBack')}</h2>
              <p>{t('login.signInMessage')}</p>
            </div>

            {error && (
              <div className="error-message">
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
                </svg>
                {error}
              </div>
            )}

            {/* email */}
            <div className="field-group">
              <label>{t('login.email')}</label>
              <div className="input-wrapper">
                <input
                  type="email"
                  placeholder={t('login.emailPlaceholder')}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
                <svg className="input-icon" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z" />
                </svg>
              </div>
            </div>

            {/* password */}
            <div className="field-group">
              <label>{t('login.password')}</label>
              <div className="input-wrapper">
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder={t('login.passwordPlaceholder')}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                />
                <svg className="input-icon" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z"/>
                </svg>
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? t('login.hide') : t('login.show')}
                >
                  {showPassword ? (
                    <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
                      <path d="M12 7c2.76 0 5 2.24 5 5 0 .65-.13 1.26-.36 1.83l2.92 2.92c1.51-1.26 2.7-2.89 3.43-4.75-1.73-4.39-6-7.5-11-7.5-1.4 0-2.74.25-3.98.7l2.16 2.16C10.74 7.13 11.35 7 12 7zM2 4.27l2.28 2.28.46.46C3.08 8.3 1.78 10.02 1 12c1.73 4.39 6 7.5 11 7.5 1.55 0 3.03-.3 4.38-.84l.42.42L19.73 22 21 20.73 3.27 3 2 4.27zM7.53 9.8l1.55 1.55c-.05.21-.08.43-.08.65 0 1.66 1.34 3 3 3 .22 0 .44-.03.65-.08l1.55 1.55c-.67.33-1.41.53-2.2.53-2.76 0-5-2.24-5-5 0-.79.2-1.53.53-2.2zm4.31-.78l3.15 3.15.02-.16c0-1.66-1.34-3-3-3l-.17.01z"/>
                    </svg>
                  ) : (
                    <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
                      <path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"/>
                    </svg>
                  )}
                </button>
              </div>
            </div>
            <div className="form-options">
              <label className="remember-me">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={e => setRememberMe(e.target.checked)}
                />
                <span className="checkmark"></span>
                {t('login.rememberMe')}
              </label>
              <button
                type="button"
                className="forgot-link"
                onClick={() => navigate('/forgot-password')}
              >
                {t('login.forgotPassword')}
              </button>
            </div>
            <button
              type="submit"
              className={`btn-primary ${isLoading ? 'loading' : ''}`}
              disabled={isLoading}
            >
              {isLoading ? (
                <div className="spinner"></div>
              ) : (
                t('login.signIn')
              )}
            </button>
            <div className="divider">
              <span>{t('login.orContinueWith')}</span>
            </div>
            <div className="social-login">
              <button
                type="button"
                className="social-btn google"
                onClick={() => handleSocialLogin('google')}
              >
                {/* ... svg ... */}
                Google
              </button>
              <button
                type="button"
                className="social-btn microsoft"
                onClick={() => handleSocialLogin('microsoft')}
              >
                {/* ... svg ... */}
                Microsoft
              </button>
            </div>
          </form>
        </div>
        {/* Right side - Carousel */}
        <div className="login-right">
          <div className="carousel-container">
            <div className="carousel-content">
              <div className="slide-content">
                <h3>{slides[idx]?.title}</h3>
                <p>{slides[idx]?.description}</p>
                <div className="slide-icon">
                  <svg viewBox="0 0 24 24" fill="currentColor">
                    <path d={slides[idx]?.icon} />
                  </svg>
                </div>
              </div>
            </div>
            <div className="carousel-dots">
              {slides.map((_, i) => (
                <button
                  key={i}
                  className={`dot ${i === idx ? 'active' : ''}`}
                  onClick={() => setIdx(i)}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
      {/* Footer */}
      <footer className="login-footer">
        <div className="footer-content">
          <span className="footer-text">{t('login.footerCopyright')}</span>
          <nav className="footer-nav">
            <a href="/privacy">{t('login.footerPrivacy')}</a>
            <a href="/terms">{t('login.footerTerms')}</a>
            <a href="/support">{t('login.footerSupport')}</a>
          </nav>
        </div>
      </footer>
    </div>
  );
}
