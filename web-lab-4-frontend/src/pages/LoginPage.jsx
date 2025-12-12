import { useMemo, useState } from 'preact/hooks';
import { Header } from '../components/header';
import { api } from '../api/client';
import '../styles/layout.css';
import '../styles/header.css';
import '../styles/auth.css';

async function sha256Hex(text) {
  const enc = new TextEncoder().encode(text);
  const hashBuf = await crypto.subtle.digest('SHA-256', enc);
  const hashArr = Array.from(new Uint8Array(hashBuf));
  return hashArr.map((b) => b.toString(16).padStart(2, '0')).join('');
}

export function LoginPage() {
  const [mode, setMode] = useState('login'); // login | register
  const [login, setLogin] = useState('');
  const [password, setPassword] = useState('');
  const [password2, setPassword2] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const isRegister = mode === 'register';

  const canSubmit = useMemo(() => {
    if (!login || !password) return false;
    if (isRegister && password !== password2) return false;
    return true;
  }, [login, password, password2, isRegister]);

  function switchMode(nextMode) {
    setError(null);
    setMode(nextMode);
    setPassword('');
    setPassword2('');
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!canSubmit) return;

    setIsSubmitting(true);
    setError(null);

    try {
      const passwordHash = await sha256Hex(password);

      if (isRegister) {
        await api.auth.register(login, passwordHash);
        switchMode('login');
      } else {
        const data = await api.auth.login(login, passwordHash);
        localStorage.setItem('authToken', data.token);
        window.location.href = '/app';
      }
    } catch (err) {
      setError(err.message || 'Ошибка');
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
            <h2 class="card__title">
              {isRegister ? 'Регистрация' : 'Вход'}
            </h2>

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
              <label class="label">Логин</label>
              <input
                class="input"
                type="text"
                value={login}
                onInput={(e) => setLogin(e.target.value)}
                required
              />
            </div>

            <div class="field">
              <label class="label">Пароль</label>
              <input
                class="input"
                type="password"
                value={password}
                onInput={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            {isRegister && (
              <div class="field">
                <label class="label">Повтор пароля</label>
                <input
                  class="input"
                  type="password"
                  value={password2}
                  onInput={(e) => setPassword2(e.target.value)}
                  required
                />
                {password2 && password !== password2 && (
                  <div class="hint hint--danger">
                    Пароли не совпадают
                  </div>
                )}
              </div>
            )}

            {error && <div class="alert alert--danger">{error}</div>}

            <button class="btn" type="submit" disabled={!canSubmit || isSubmitting}>
              {isSubmitting
                ? 'Отправка...'
                : isRegister
                ? 'Зарегистрироваться'
                : 'Войти'}
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
