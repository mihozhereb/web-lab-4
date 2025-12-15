import { useEffect, useMemo, useRef, useState } from 'preact/hooks';
import { route } from 'preact-router';
import { Header } from '../components/header';
import { api } from '../api/client';
import '../styles/layout.css';
import '../styles/header.css';
import '../styles/main.css';

function isAuthenticated() {
  return Boolean(localStorage.getItem('authToken'));
}

function parseNumberStrict(str) {
  const s = String(str).trim().replace(',', '.');
  if (s === '' || s === '-' || s === '+') return { ok: false, value: null };
  const n = Number(s);
  if (!Number.isFinite(n)) return { ok: false, value: null };
  return { ok: true, value: n };
}

export function MainPage() {
  // R: по умолчанию 1
  const [r, setR] = useState(1);

  // поля ввода
  const [xText, setXText] = useState('');
  const [yText, setYText] = useState('');

  const [xErr, setXErr] = useState(null);
  const [yErr, setYErr] = useState(null);

  const [results, setResults] = useState([]); // {x,y,r,hit,ts}
  const [loading, setLoading] = useState(false);
  const [serverError, setServerError] = useState(null);

  const svgRef = useRef(null);

  useEffect(() => {
    if (!isAuthenticated()) route('/', true);
  }, []);

  // загрузка истории
  useEffect(() => {
    let cancelled = false;
    (async () => {
      setServerError(null);
      try {
        const data = await api.results.list();
        const items = Array.isArray(data) ? data : (data?.items || []);
        if (!cancelled) setResults(items);
      } catch (e) {
        if (!cancelled) setServerError('Не удалось загрузить историю (бэкенд недоступен).');
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const validated = useMemo(() => {
    const px = parseNumberStrict(xText);
    const py = parseNumberStrict(yText);

    const xOk = px.ok && px.value >= -3 && px.value <= 3;
    const yOk = py.ok && py.value >= -3 && py.value <= 5;

    return { xOk, yOk, x: xOk ? px.value : null, y: yOk ? py.value : null };
  }, [xText, yText]);

  function validateAndSetErrors() {
    const px = parseNumberStrict(xText);
    const py = parseNumberStrict(yText);

    if (!px.ok) setXErr('X должен быть числом');
    else if (px.value < -3 || px.value > 3) setXErr('X должен быть в диапазоне [-3..3]');
    else setXErr(null);

    if (!py.ok) setYErr('Y должен быть числом');
    else if (py.value < -3 || py.value > 5) setYErr('Y должен быть в диапазоне [-3..5]');
    else setYErr(null);

    return px.ok && py.ok && (px.value >= -3 && px.value <= 3) && (py.value >= -3 && py.value <= 5);
  }

  async function submitPoint(x, y, rr) {
    setLoading(true);
    setServerError(null);
    try {
      const data = await api.results.check(x, y, rr);
      const point = data?.point || data;

      // Требуем, чтобы hit пришёл с сервера
      if (typeof point?.hit !== 'boolean') {
        throw new Error('Сервер не вернул поле hit');
      }

      const normalized = {
        x: Number(point.x),
        y: Number(point.y),
        r: Number(point.r),
        hit: Boolean(point.hit),
        ts: point.ts ?? new Date().toISOString(),
      };

      setResults((prev) => [normalized, ...prev]);
    } catch (e) {
      setServerError(e.message || 'Ошибка проверки на сервере');
    } finally {
      setLoading(false);
    }
  }

  async function onSubmitForm(e) {
    e.preventDefault();
    if (!validateAndSetErrors()) return;
    await submitPoint(validated.x, validated.y, r);
  }

  // --- SVG ---
  const W = 360;
  const H = 360;
  const cx = W / 2;
  const cy = H / 2;
  const pxPerUnit = 110 / 3; // масштаб зависит от выбранного R

  function toSvgX(x) { return cx + x * pxPerUnit; }
  function toSvgY(y) { return cy - y * pxPerUnit; }

  function onSvgClick(e) {
    const svg = svgRef.current;
    if (!svg) return;

    const rect = svg.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;

    const x = (mx - cx) / pxPerUnit;
    const y = (cy - my) / pxPerUnit;

    const xr = Math.round(x * 100) / 100;
    const yr = Math.round(y * 100) / 100;

    setXText(String(xr));
    setYText(String(yr));
    setXErr(null);
    setYErr(null);

    submitPoint(xr, yr, r);
  }

  function onChangeR(newR) {
    setR(newR);
  }

  function onLogout(e) {
    e.preventDefault();
    api.auth.logoutLocal();
    route('/', true);
  }

  async function onClearHistory() {
    setLoading(true);
    setServerError(null);
    try {
      await api.results.clear(); // псевдо REST
      setResults([]);
    } catch (e) {
      setServerError(e.message || 'Не удалось очистить историю на сервере');
    } finally {
      setLoading(false);
    }
  }

  // Цвет точки по текущему выбранному R:
  // если точка проверена при другом R -> серый
  // иначе зелёный/красный по hit (пришёл с сервера)
  function pointColor(p) {
    if (Number(p.r) !== Number(r)) return 'var(--pt-gray)';
    return p.hit ? 'var(--pt-ok)' : 'var(--pt-bad)';
  }

  // --- область (как в варианте) ---
  // Прямоугольник: [-R,0] x [0,R]
  const rectX = toSvgX(-r);
  const rectY = toSvgY(r);
  const rectW = r * pxPerUnit;
  const rectH = r * pxPerUnit;

  // Четверть круга (x>=0, y>=0): сектор от (0,R) до (R,0)
  const arcStart = { x: toSvgX(0), y: toSvgY(r) };
  const arcEnd = { x: toSvgX(r), y: toSvgY(0) };
  const arcR = r * pxPerUnit;
  const quarterCirclePath = `
    M ${toSvgX(0)} ${toSvgY(0)}
    L ${arcStart.x} ${arcStart.y}
    A ${arcR} ${arcR} 0 0 1 ${arcEnd.x} ${arcEnd.y}
    Z
  `;

  // Треугольник: (0,0), (R/2,0), (0,-R/2)
  const triPath = `
    M ${toSvgX(0)} ${toSvgY(0)}
    L ${toSvgX(r / 2)} ${toSvgY(0)}
    L ${toSvgX(0)} ${toSvgY(-r / 2)}
    Z
  `;

  const tick = r;

  return (
    <div class="page">
      <Header />

      <main class="container container--wide">
        <div class="main-grid">
          <section class="card card--graph">
            <div class="graph-head">
              <h2 class="card__title">График области</h2>
            </div>

            <div class="graph-box">
              <svg
                ref={svgRef}
                width={360}
                height={360}
                viewBox="0 0 360 360"
                class="svg"
                onClick={onSvgClick}
              >
                <rect x="0" y="0" width="360" height="360" class="svg-bg" />

                <g class="area">
                  <rect x={rectX} y={rectY} width={rectW} height={rectH} />
                  <path d={quarterCirclePath} />
                  <path d={triPath} />
                </g>

                <line x1="0" y1={cy} x2="360" y2={cy} class="axis" />
                <line x1={cx} y1="0" x2={cx} y2="360" class="axis" />
                <text x="348" y={cy - 8} class="axis-label">x</text>
                <text x={cx + 8} y="12" class="axis-label">y</text>

                {[-tick, -tick / 2, tick / 2, tick].map((val) => (
                  <g key={`xt_${val}`}>
                    <line x1={toSvgX(val)} y1={cy - 4} x2={toSvgX(val)} y2={cy + 4} class="tick" />
                    <text x={toSvgX(val)} y={cy + 18} class="tick-label" text-anchor="middle">
                      {val === tick ? 'R' : val === -tick ? '-R' : val === tick / 2 ? 'R/2' : '-R/2'}
                    </text>
                  </g>
                ))}

                {[-tick, -tick / 2, tick / 2, tick].map((val) => (
                  <g key={`yt_${val}`}>
                    <line x1={cx - 4} y1={toSvgY(val)} x2={cx + 4} y2={toSvgY(val)} class="tick" />
                    <text x={cx + 18} y={toSvgY(val) + 4} class="tick-label">
                      {val === tick ? 'R' : val === -tick ? '-R' : val === tick / 2 ? 'R/2' : '-R/2'}
                    </text>
                  </g>
                ))}

                <g class="points">
                  {results.map((p, idx) => (
                    <circle
                      key={`p_${p.ts}_${idx}`}
                      cx={toSvgX(Number(p.x))}
                      cy={toSvgY(Number(p.y))}
                      r="4"
                      fill={pointColor(p)}
                      stroke="var(--pt-stroke)"
                      stroke-width="1"
                    />
                  ))}
                </g>
              </svg>
            </div>
          </section>

          <section class="card card--panel">
            <div class="panel-head">
              <h2 class="card__title">Проверка точки</h2>
            </div>

            <form class="form" onSubmit={onSubmitForm}>
              <div class="field">
                <label class="label">X (−3 … 3)</label>
                <input
                  class={`input ${xErr ? 'input--error' : ''}`}
                  type="text"
                  value={xText}
                  onInput={(e) => setXText(e.target.value)}
                  onBlur={() => validateAndSetErrors()}
                  placeholder="например, -1.25"
                />
                {xErr && <div class="hint hint--danger">{xErr}</div>}
              </div>

              <div class="field">
                <label class="label">Y (−3 … 5)</label>
                <input
                  class={`input ${yErr ? 'input--error' : ''}`}
                  type="text"
                  value={yText}
                  onInput={(e) => setYText(e.target.value)}
                  onBlur={() => validateAndSetErrors()}
                  placeholder="например, 2"
                />
                {yErr && <div class="hint hint--danger">{yErr}</div>}
              </div>

              <div class="field">
                <label class="label">R</label>
                <div class="radio-row">
                  {[1, 2, 3].map((v) => (
                    <label class={`radio ${r === v ? 'radio--on' : ''}`} key={v}>
                      <input type="radio" name="r" checked={r === v} onChange={() => onChangeR(v)} />
                      <span>{v}</span>
                    </label>
                  ))}
                </div>
              </div>

              {serverError && <div class="alert alert--warn">{serverError}</div>}

              <button class="btn" type="submit" disabled={loading}>
                {loading ? 'Проверка…' : 'Проверить'}
              </button>

              <div class="logout">
                <a class="link" href="/" onClick={onLogout}>
                  Выйти и вернуться на стартовую страницу
                </a>
              </div>
            </form>
          </section>

          <section class="card card--panel">
            <h3 class="table-title">История проверок</h3>

            <div class="table-wrap">
              <table class="table">
                <thead>
                  <tr>
                    <th>X</th>
                    <th>Y</th>
                    <th>R</th>
                    <th>Результат</th>
                    <th>Время</th>
                  </tr>
                </thead>
                <tbody>
                  {results.length === 0 ? (
                    <tr>
                      <td colspan="5" class="table__empty">Нет результатов</td>
                    </tr>
                  ) : (
                    results.slice(0, 50).map((p, idx) => (
                      <tr key={p.ts + '_' + idx}>
                        <td>{Number(p.x).toFixed(2)}</td>
                        <td>{Number(p.y).toFixed(2)}</td>
                        <td>{p.r}</td>
                        <td class={p.hit ? 'ok' : 'bad'}>{p.hit ? 'Попал' : 'Не попал'}</td>
                        <td class="muted">{String(p.ts).replace('T', ' ').slice(0, 19)}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <button class="btn btn--ghost" type="button" onClick={onClearHistory} disabled={loading}>
                Очистить историю
            </button>
          </section>

          <section class="card card--panel">
            <h3 class="table-title">Metrics</h3>
            <div class="empty-box"> </div>
          </section>
        </div>
      </main>
    </div>
  );
}
