import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import api from '../api';
import { useNavigate } from 'react-router-dom';
import './styles/LoginForm.css';

export default function ResetPassword() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    if (password !== confirmPassword) {
      setError(t('reset.passwordMismatch'));
      setIsLoading(false);
      return;
    }

    try {
      await api.post('/auth/change-password/', { email, code, password });
      navigate('/login');
    } catch (err) {
      setError(
        err.response?.status === 400
          ? t('reset.invalidCode')
          : t('reset.unexpectedError')
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-bg">
      <div className="login-container">
        <div className="login-left">
          <form className="login-form" onSubmit={handleSubmit}>
            <div className="form-header">
              <h2>{t('reset.title')}</h2>
              <p>{t('reset.subtitle')}</p>
            </div>

            {error && (
              <div className="error-message">
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
                </svg>
                {error}
              </div>
            )}

            <div className="field-group">
              <label>{t('reset.emailLabel')}</label>
              <div className="input-wrapper">
                <input
                  type="email"
                  placeholder={t('reset.emailPlaceholder')}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
                <svg className="input-icon" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z" />
                </svg>
              </div>
            </div>

            <div className="field-group">
              <label>{t('reset.codeLabel')}</label>
              <div className="input-wrapper">
                <input
                  type="text"
                  placeholder={t('reset.codePlaceholder')}
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  required
                />
                <svg className="input-icon" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z" />
                </svg>
              </div>
            </div>

            <div className="field-group">
              <label>{t('reset.passwordLabel')}</label>
              <div className="input-wrapper">
                <input
                  type="password"
                  placeholder={t('reset.passwordPlaceholder')}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <svg className="input-icon" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z" />
                </svg>
              </div>
            </div>

            <div className="field-group">
              <label>{t('reset.confirmPasswordLabel')}</label>
              <div className="input-wrapper">
                <input
                  type="password"
                  placeholder={t('reset.confirmPasswordPlaceholder')}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />
                <svg className="input-icon" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z" />
                </svg>
              </div>
            </div>

            <button
              type="submit"
              className={`btn-primary ${isLoading ? 'loading' : ''}`}
              disabled={isLoading}
            >
              {isLoading ? <div className="spinner" /> : t('reset.resetButton')}
            </button>

            <button
              type="button"
              className="btn-secondary"
              onClick={() => navigate('/login')}
            >
              {t('reset.backToLogin')}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}