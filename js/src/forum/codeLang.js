const observers = new WeakMap();

function showLanguage(code) {
  const pre = code.parentElement;
  const language = code.result && code.result.language;

  if (!pre || pre.tagName !== 'PRE' || !language || pre.className.indexOf('language-') !== -1) {
    return;
  }

  if (/^[a-z0-9_-]+$/i.test(language)) {
    pre.classList.add('language-' + language);
  }
}

export function codeLang(root) {
  if (!root) {
    return;
  }

  root.querySelectorAll('pre > code').forEach(showLanguage);

  const Observer = window.MutationObserver || window.WebKitMutationObserver || window.MozMutationObserver;

  if (!Observer || observers.has(root)) {
    return;
  }

  const observer = new Observer(function (mutations) {
    mutations.forEach(function (mutation) {
      const target = mutation.target;

      if (target.matches && target.matches('pre > code')) {
        showLanguage(target);
      }
    });
  });

  observer.observe(root, {
    attributes: true,
    attributeFilter: ['class'],
    subtree: true,
  });

  observers.set(root, observer);
}

export function destroyCodeLang(root) {
  const observer = root && observers.get(root);

  if (observer) {
    observer.disconnect();
    observers.delete(root);
  }
}
