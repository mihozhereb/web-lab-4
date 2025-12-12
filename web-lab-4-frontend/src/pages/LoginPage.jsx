// src/pages/LoginPage.jsx
import { useMemo, useState } from 'preact/hooks';
import { Header } from '../components/header';
import ReCAPTCHA from 'react-google-recaptcha';
import { api } from '../api/client';
import '../styles/layout.css';
import '../styles/header.css';
import '../styles/auth.css';

const RECAPTCHA_SITE_KEY = '6LeMcSksAAAAABVwX4MliHQjvgTD35kmQ9MoUF7v'; // псевдо-ключ, заменишь на свой

async function sha256Hex(text) {
  const enc = new TextEncoder().encode(text);
  const hashBuf = await crypto.subtle.digest('SHA-256', enc);
  const hashArr = Array.from(new Uint8Array(hashBuf));
  return hashArr.map((b) => b.toString(16).padStart(2, '0')).join('');
}

export function LoginPage() {
  const [mode, setMode] = useState('login'); // 'login' | 'register'
  const [login, setLogin] = useState('');
  const [password, setPassword] = useState('');
  const [password2, setPassword2] = useState('');
  const [captchaToken, setCaptchaToken] = useState(null);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const isRegister = mode === 'register';

  const canSubmit = useMemo(() => {
    if (!login || !password) return false;
    if (isRegister) {
      if (!password2 || password2 !== password) return false;
      if (!captchaToken) return false;
    }
    return true;
  }, [login, password, password2, captchaToken, isRegister]);

  function switchMode(nextMode) {
    setError(null);
    setMode(nextMode);
    setPassword('');
    setPassword2('');
    setCaptchaToken(null);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);

    if (!canSubmit) return;

    setIsSubmitting(true);
    try {
      const passwordHash = await sha256Hex(password);

      if (!isRegister) {
        const data = await api.auth.login(login, passwordHash);
        localStorage.setItem('authToken', data.token);
        window.location.href = '/app';
      } else {
        await api.auth.register(login, passwordHash, captchaToken);
        switchMode('login');
      }
    } catch (err) {
      setError(err.message || 'Неизвестная ошибка');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div class="page">
      <Header />

      <main class="container">
        <section class="card">
          <div class="card__head">
            <h2 class="card__title">{isRegister ? 'Регистрация' : 'Вход'}</h2>

            <div class="segmented">
              <button
                type="button"
                class={`segmented__btn ${!isRegister ? 'is-active' : ''}`}
                onClick={() => switchMode('login')}
              >
                Вход
              </button>
              <button
                type="button"
                class={`segmented__btn ${isRegister ? 'is-active' : ''}`}
                onClick={() => switchMode('register')}
              >
                Регистрация
              </button>
            </div>
          </div>

          <form class="form" onSubmit={handleSubmit}>
            <div class="field">
              <label class="label" for="login">
                Логин
              </label>
              <input
                id="login"
                class="input"
                type="text"
                value={login}
                onInput={(e) => setLogin(e.target.value)}
                placeholder="например, student123"
                autocomplete="username"
                required
              />
            </div>

            <div class="field">
              <label class="label" for="password">
                Пароль
              </label>
              <input
                id="password"
                class="input"
                type="password"
                value={password}
                onInput={(e) => setPassword(e.target.value)}
                placeholder="Введите пароль"
                autocomplete={isRegister ? 'new-password' : 'current-password'}
                required
              />
            </div>

            {isRegister && (
              <div class="field">
                <label class="label" for="password2">
                  Повтор пароля
                </label>
                <input
                  id="password2"
                  class="input"
                  type="password"
                  value={password2}
                  onInput={(e) => setPassword2(e.target.value)}
                  placeholder="Повторите пароль"
                  autocomplete="new-password"
                  required
                />
                {password2 && password2 !== password && (
                  <div class="hint hint--danger">Пароли не совпадают</div>
                )}
              </div>
            )}

            {isRegister && (
              <div class="field">
                <label class="label">Капча</label>
                <div class="captcha">
                  <ReCAPTCHA
                    sitekey={RECAPTCHA_SITE_KEY}
                    onChange={(token) => setCaptchaToken(token)}
                    onExpired={() => setCaptchaToken(null)}
                  />
                </div>
                <div class="hint">Капча обязательна для регистрации.</div>
              </div>
            )}

            {error && <div class="alert alert--danger">{error}</div>}

            <button class="btn" type="submit" disabled={!canSubmit || isSubmitting}>
              {isSubmitting ? 'Отправка…' : isRegister ? 'Зарегистрироваться' : 'Войти'}
            </button>

            <div class="footnote">
              {isRegister ? (
                <>
                  Уже есть аккаунт?{' '}
                  <button type="button" class="link" onClick={() => switchMode('login')}>
                    Войти
                  </button>
                </>
              ) : (
                <>
                  Нет аккаунта?{' '}
                  <button type="button" class="link" onClick={() => switchMode('register')}>
                    Зарегистрироваться
                  </button>
                </>
              )}
            </div>
          </form>
        </section>
      </main>
    </div>
  );
}
