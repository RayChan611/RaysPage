import { decryptResume, isValidAccessCode, normalizeAccessCode, ResumeFormatError, type ResumeProfile } from '../lib/resume-vault';

const form = document.querySelector<HTMLFormElement>('#resumeForm');
const code = document.querySelector<HTMLInputElement>('#resumeCode');
const submit = document.querySelector<HTMLButtonElement>('#resumeSubmit');
const reveal = document.querySelector<HTMLButtonElement>('#resumeReveal');
const gate = document.querySelector<HTMLElement>('#resumeGate');
const view = document.querySelector<HTMLElement>('#resumeView');
const content = document.querySelector<HTMLElement>('#resumeContent');
const status = document.querySelector<HTMLElement>('#resumeStatus');
const download = document.querySelector<HTMLAnchorElement>('#resumeDownload');
const lockButton = document.querySelector<HTMLButtonElement>('#resumeLock');
const unavailable = document.querySelector<HTMLElement>('#resumeUnavailable');

function element<K extends keyof HTMLElementTagNameMap>(tag: K, className: string, text?: string): HTMLElementTagNameMap[K] {
  const node = document.createElement(tag);
  node.className = className;
  if (text) node.textContent = text;
  return node;
}

function renderProfile(profile: ResumeProfile): DocumentFragment {
  const fragment = document.createDocumentFragment();
  const header = element('header', 'resume-heading');
  header.append(element('h1', '', profile.name), element('p', 'resume-role', profile.role));
  const details = element('ul', 'resume-details');
  for (const detail of profile.details) details.append(element('li', '', detail));
  header.append(details);
  fragment.append(header);
  for (const [index, section] of profile.sections.entries()) {
    const container = element('section', 'resume-section');
    const heading = element('header', 'resume-section-heading');
    const number = element('span', 'resume-section-index', String(index + 1).padStart(2, '0'));
    number.setAttribute('aria-hidden', 'true');
    const title = element('h2', '', section.title);
    title.id = `resume-section-${index}`;
    container.setAttribute('aria-labelledby', title.id);
    heading.append(number, title);
    const body = element('div', 'resume-section-body');
    container.append(heading, body);
    for (const entry of section.entries) {
      const item = element('div', 'resume-entry');
      const top = element('div', 'resume-entry-top');
      top.append(element('h3', '', entry.title));
      if (entry.period) top.append(element('span', 'resume-period', entry.period));
      item.append(top);
      const subtitle = [entry.subtitle, entry.location].filter(Boolean).join(' · ');
      if (subtitle) item.append(element('p', 'resume-entry-subtitle', subtitle));
      if (entry.points.length) {
        const list = element('ul', 'resume-points');
        for (const point of entry.points) {
          const row = element('li', '');
          if (point.label) row.append(element('strong', 'resume-point-title', point.label));
          row.append(element('p', 'resume-point-body', point.body));
          list.append(row);
        }
        item.append(list);
      }
      body.append(item);
    }
    fragment.append(container);
  }
  return fragment;
}

if (form && code && submit && reveal && gate && view && content && status && download && lockButton) {
  if (unavailable) unavailable.hidden = true;
  let documentUrl: string | undefined;
  let controller: AbortController | undefined;
  let expiry: ReturnType<typeof setTimeout> | undefined;
  let generation = 0;
  let busy = false;

  const setBusy = (value: boolean) => {
    busy = value;
    submit.disabled = value;
    code.disabled = value;
    reveal.disabled = value;
    form.setAttribute('aria-busy', String(value));
    submit.textContent = value ? '正在打开…' : '查看简历 ↗';
  };

  const hideCode = () => {
    code.type = 'password';
    reveal.textContent = '显示';
    reveal.setAttribute('aria-label', '显示访问码');
    reveal.setAttribute('aria-pressed', 'false');
  };

  const lock = (focus = true, message = '') => {
    generation += 1;
    controller?.abort();
    controller = undefined;
    clearTimeout(expiry);
    expiry = undefined;
    content.replaceChildren();
    download.removeAttribute('href');
    download.removeAttribute('download');
    if (documentUrl) URL.revokeObjectURL(documentUrl);
    documentUrl = undefined;
    view.hidden = true;
    gate.hidden = false;
    code.value = '';
    hideCode();
    code.removeAttribute('aria-invalid');
    status.textContent = message;
    setBusy(false);
    if (focus) {
      code.focus({ preventScroll: true });
      gate.scrollIntoView({ block: 'start', behavior: 'instant' });
    }
  };

  reveal.addEventListener('click', () => {
    const show = code.type === 'password';
    code.type = show ? 'text' : 'password';
    reveal.textContent = show ? '隐藏' : '显示';
    reveal.setAttribute('aria-label', show ? '隐藏访问码' : '显示访问码');
    reveal.setAttribute('aria-pressed', String(show));
  });
  code.addEventListener('input', () => {
    code.removeAttribute('aria-invalid');
    status.textContent = '';
  });
  lockButton.addEventListener('click', () => lock());
  // 浏览器后退缓存也不能保存已解锁的正文和 PDF 地址。
  window.addEventListener('pagehide', () => lock(false));

  if (!window.isSecureContext || !window.crypto?.subtle) {
    submit.disabled = true;
    status.textContent = '请使用较新的浏览器，并通过 HTTPS 链接打开此页。';
  }

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (busy || !window.crypto?.subtle) return;
    const normalized = normalizeAccessCode(code.value);
    if (!isValidAccessCode(normalized)) {
      code.setAttribute('aria-invalid', 'true');
      status.textContent = '请检查访问码是否完整。';
      code.focus();
      return;
    }
    const attempt = ++generation;
    controller = new AbortController();
    const signal = controller.signal;
    const timeout = window.setTimeout(() => controller?.abort(), 15_000);
    let phase = 'fetch';
    let pendingUrl: string | undefined;
    let failed = false;
    setBusy(true);
    status.textContent = '';
    try {
      const response = await fetch('/private/resume.enc', {
        cache: 'no-store', credentials: 'omit', referrerPolicy: 'no-referrer', signal,
      });
      if (!response.ok) throw new Error('读取失败');
      const bytes = await response.arrayBuffer();
      clearTimeout(timeout);
      phase = 'decrypt';
      const payload = await decryptResume(bytes, normalized);
      if (attempt !== generation) return;
      const pdf = Uint8Array.from(atob(payload.document.data), (character) => character.charCodeAt(0));
      if (new TextDecoder().decode(pdf.subarray(0, 5)) !== '%PDF-') throw new ResumeFormatError();
      pendingUrl = URL.createObjectURL(new Blob([pdf], { type: 'application/pdf' }));
      pdf.fill(0);
      const rendered = renderProfile(payload.profile);
      content.replaceChildren(rendered);
      download.href = pendingUrl;
      download.download = payload.document.name;
      documentUrl = pendingUrl;
      pendingUrl = undefined;
      code.value = '';
      hideCode();
      gate.hidden = true;
      view.hidden = false;
      window.scrollTo({ top: 0, behavior: 'instant' });
      content.focus({ preventScroll: true });
      expiry = setTimeout(() => lock(true, '本次查看已结束，请重新输入访问码。'), 15 * 60_000);
    } catch (error) {
      if (attempt !== generation) return;
      failed = true;
      if (phase === 'fetch') status.textContent = '暂时无法读取简历，请检查网络后重试。';
      else if (error instanceof ResumeFormatError) status.textContent = error.message;
      else {
        code.setAttribute('aria-invalid', 'true');
        status.textContent = '访问码不正确，或资料已更新。请确认后重试。';
      }
    } finally {
      clearTimeout(timeout);
      if (pendingUrl) URL.revokeObjectURL(pendingUrl);
      if (attempt === generation) {
        controller = undefined;
        setBusy(false);
        if (failed) code.focus({ preventScroll: true });
      }
    }
  });
  if (window.isSecureContext && window.crypto?.subtle) setBusy(false);
}
