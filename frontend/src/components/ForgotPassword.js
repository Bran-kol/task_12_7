import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import './styles/ForgotPassword.css';
import api from '../api';
import { useNavigate } from 'react-router-dom';
import LanguageSwitcher from './LanguageSwitcher';

export default function ForgotPassword() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [step, setStep] = useState('email'); // 'email' | 'code' | 'password'
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Validate password match
  useEffect(() => {
    if (newPassword && confirmPassword && newPassword !== confirmPassword) {
      setError('Passwords do not match');
    } else if (error === 'Passwords do not match') {
      setError('');
    }
  }, [newPassword, confirmPassword]);

  const handleSubmitEmail = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    
    try {
      await api.post('/auth/forgot-password/', { email });
      setStep('code');
    } catch {
      setError(t('forgot.errorMessage'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmitCode = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    
    if (!code) {
      setError('Please enter the code');
      setIsLoading(false);
      return;
    }

    try {
      await api.post('/auth/verify-code/', { email, code });
      setStep('password');
    } catch (err) {
      setError(err.response?.data?.error || 'Invalid code');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmitPassword = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    
    if (!newPassword || newPassword !== confirmPassword) {
      setError('Passwords do not match');
      setIsLoading(false);
      return;
    }

    try {
      await api.post('/auth/change-password/', { email, code, password: newPassword });
      setStep('success');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to reset password');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="forgot-bg">
      <LanguageSwitcher />

      <div className="forgot-container">
        <div className="glass-card">
          <h2>{t('forgot.title')}</h2>
          <p>{t('forgot.subtitle')}</p>

          {error && <div className="error-message">{error}</div>}

          {/* Email Step */}
          <form 
            className={`field-group ${step !== 'email' ? 'hidden' : ''}`} 
            onSubmit={handleSubmitEmail}
          >
            <div className="field-group">
              <label>{t('forgot.emailLabel')}</label>
              <div className="input-wrapper">
                <input
                  type="email"
                  required
                  placeholder={t('forgot.emailPlaceholder')}
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  disabled={isLoading}
                />
                <svg className="input-icon" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M20 4H4c-1.1...Z"/>
                </svg>
              </div>
            </div>

            <button
              type="submit"
              className={`btn-primary ${isLoading ? 'loading' : ''}`}
              disabled={isLoading}
            >
              {isLoading ? <div className="spinner"/> : t('forgot.sendCode')}
            </button>
          </form>

          {/* Code Step */}
          <form 
            className={`field-group ${step !== 'code' ? 'hidden' : ''}`} 
            onSubmit={handleSubmitCode}
          >
            <div className="field-group">
              <label>{t('forgot.codeLabel')}</label>
              <div className="input-wrapper">
                <input
                  type="text"
                  required
                  placeholder={t('forgot.codePlaceholder')}
                  value={code}
                  onChange={e => setCode(e.target.value)}
                  disabled={isLoading}
                />
                <svg className="input-icon" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                </svg>
              </div>
            </div>

            <button
              type="button"
              className="link-btn"
              onClick={handleSubmitEmail}
              disabled={isLoading}
            >
              {t('forgot.resendCode')}
            </button>

            <button
              type="submit"
              className={`btn-primary ${isLoading ? 'loading' : ''}`}
              disabled={isLoading}
            >
              {isLoading ? <div className="spinner"/> : t('forgot.verifyCode')}
            </button>
          </form>

          {/* Password Step */}
          <form 
            className={`field-group ${step !== 'password' ? 'hidden' : ''}`} 
            onSubmit={handleSubmitPassword}
          >
            <div className="field-group">
              <label>{t('forgot.newPasswordLabel')}</label>
              <div className="input-wrapper">
                <input
                  type="password"
                  required
                  placeholder={t('forgot.newPasswordPlaceholder')}
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  disabled={isLoading}
                />
                <svg className="input-icon" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 7v10m0 0l-3-2.25m3 2.25l3-2.25m0-10.848V4.751c0-.69.477-1.296 1.152-1.354a42 42 0 011.3-.053c.5 0 1.006.207 1.354.654.348.447.5 1.003.5 1.586v4.423c0 .583-.152 1.139-.5 1.586-.348.447-.854.654-1.354.654a42 42 0 01-1.3-.053c-.675-.058-1.152-.664-1.152-1.354V7.348c0-.69.477-1.296 1.152-1.354a42 42 0 011.3-.053c.5 0 1.006.207 1.354.654.348.447.5 1.003.5 1.586"/>
                </svg>
              </div>
            </div>

            <div className="field-group">
              <label>{t('forgot.confirmPasswordLabel')}</label>
              <div className="input-wrapper">
                <input
                  type="password"
                  required
                  placeholder={t('forgot.confirmPasswordPlaceholder')}
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  disabled={isLoading}
                />
                <svg className="input-icon" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 7v10m0 0l-3-2.25m3 2.25l3-2.25m0-10.848V4.751c0-.69.477-1.296 1.152-1.354a42 42 0 011.3-.053c.5 0 1.006.207 1.354.654.348.447.5 1.003.5 1.586v4.423c0 .583-.152 1.139-.5 1.586-.348.447-.854.654-1.354.654a42 42 0 01-1.3-.053c-.675-.058-1.152-.664-1.152-1.354V7.348c0-.69.477-1.296 1.152-1.354a42 42 0 011.3-.053c.5 0 1.006.207 1.354.654.348.447.5 1.003.5 1.586"/>
                </svg>
              </div>
            </div>

            <button
              type="submit"
              className={`btn-primary ${isLoading ? 'loading' : ''}`}
              disabled={isLoading}
            >
              {isLoading ? <div className="spinner"/> : t('forgot.resetPassword')}
            </button>
          </form>

          {/* Success Slide */}
          {step === 'success' && (
            <div className="success-message">
              {t('forgot.successMessage')}
              <button className="link-btn" onClick={() => navigate('/login')}>
                {t('forgot.backToLogin')}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}