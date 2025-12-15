import { useEffect, useMemo, useRef, useState } from 'preact/hooks';
import { api } from '../api/client';
import '../styles/metrics.css';

const MAX_POINTS = 60;

function clamp(n, a, b) { return Math.max(a, Math.min(b, n)); }

function formatBytes(bytes) {
  if (!Number.isFinite(bytes)) return '—';
  const mb = bytes / 1024 / 1024;
  return `${mb.toFixed(1)} MB`;
}

function formatSeconds(sec) {
  if (!Number.isFinite(sec)) return '—';
  if (sec < 60) return `${Math.floor(sec)}s`;
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}m ${s}s`;
}

function sparkPath(values, w = 220, h = 56, pad = 6) {
  const v = values.filter((x) => Number.isFinite(x));
  if (v.length < 2) return '';

  const min = Math.min(...v);
  const max = Math.max(...v);
  const span = max - min || 1;

  const stepX = (w - pad * 2) / (v.length - 1);

  const pts = v.map((val, i) => {
    const x = pad + i * stepX;
    const t = (val - min) / span;
    const y = pad + (1 - t) * (h - pad * 2);
    return [x, y];
  });

  let d = `M ${pts[0][0].toFixed(2)} ${pts[0][1].toFixed(2)}`;
  for (let i = 1; i < pts.length; i++) {
    const [x, y] = pts[i];
    const [px, py] = pts[i - 1];
    const cx = ((px + x) / 2).toFixed(2);
    d += ` Q ${px.toFixed(2)} ${py.toFixed(2)} ${cx} ${((py + y) / 2).toFixed(2)}`;
    if (i === pts.length - 1) d += ` T ${x.toFixed(2)} ${y.toFixed(2)}`;
  }
  return d;
}

function sparkArea(values, w = 220, h = 56, pad = 6) {
  const d = sparkPath(values, w, h, pad);
  if (!d) return '';

  const v = values.filter((x) => Number.isFinite(x));
  const stepX = (w - pad * 2) / (v.length - 1);
  const lastX = pad + (v.length - 1) * stepX;
  const baseY = h - pad;
  return `${d} L ${lastX.toFixed(2)} ${baseY} L ${pad.toFixed(2)} ${baseY} Z`;
}

function MetricCard({ title, value, sub, values }) {
  const W = 220;
  const H = 56;

  const line = useMemo(() => sparkPath(values, W, H), [values]);
  const area = useMemo(() => sparkArea(values, W, H), [values]);

  return (
    <div class="metric-card">
      <div class="metric-card__top">
        <div class="metric-card__title">{title}</div>
        <div class="metric-card__value">{value}</div>
        {sub && <div class="metric-card__sub">{sub}</div>}
      </div>

      <div class="metric-card__chart">
        <svg viewBox={`0 0 ${W} ${H}`} class="spark">
          <path d={area} class="spark__area" />
          <path d={line} class="spark__line" />
        </svg>
      </div>
    </div>
  );
}

export function MetricsPanel() {
  const [err, setErr] = useState(null);
  const [now, setNow] = useState(null);

  const [hist, setHist] = useState({
    uptime: [],
    mem: [],
    http: [],
  });

  const timerRef = useRef(null);
  const inFlightRef = useRef(false);

  async function tick() {
    if (inFlightRef.current) return;
    inFlightRef.current = true;

    try {
      const data = await api.metrics.summary();

      const uptime = Number(data?.uptime);
      const mem = Number(data?.jvmUsedMemory);
      const http = Number(data?.httpRequests);

      setNow({ uptime, mem, http });
      setErr(null);

      setHist((prev) => {
        const push = (arr, v) => {
          const next = arr.concat([v]);
          if (next.length > MAX_POINTS) next.shift();
          return next;
        };

        return {
          uptime: push(prev.uptime, uptime),
          mem: push(prev.mem, mem),
          http: push(prev.http, http),
        };
      });
    } catch (e) {
      setErr(e.message || 'Не удалось получить метрики');
    } finally {
      inFlightRef.current = false;
    }
  }

  useEffect(() => {
    tick();
    timerRef.current = setInterval(tick, 1000);
    return () => clearInterval(timerRef.current);
  }, []);

  const uptimeText = now ? formatSeconds(now.uptime) : '—';
  const memText = now ? formatBytes(now.mem) : '—';
  const httpText = now && Number.isFinite(now.http) ? String(Math.floor(now.http)) : '—';

  function trend(values) {
    const v = values.filter(Number.isFinite);
    if (v.length < 2) return null;
    const a = v[v.length - 2];
    const b = v[v.length - 1];
    const diff = b - a;
    if (Math.abs(diff) < 1e-9) return '≈';
    return diff > 0 ? '↑' : '↓';
  }

  return (
    <div class="metrics-wrap">
      {err && <div class="alert alert--warn">{err}</div>}

      <div class="metrics-grid">
        <MetricCard
          title="Uptime"
          value={`${uptimeText} ${trend(hist.uptime) || ''}`}
          sub="время работы сервера"
          values={hist.uptime}
        />

        <MetricCard
          title="JVM Memory"
          value={`${memText} ${trend(hist.mem) || ''}`}
          sub="используемая память"
          values={hist.mem}
        />

        <MetricCard
          title="HTTP"
          value={`${httpText} ${trend(hist.http) || ''}`}
          sub="количество запросов"
          values={hist.http}
        />
      </div>
    </div>
  );
}

