import app from 'flarum/forum/app';
import { extend } from 'flarum/common/extend';
import extractText from 'flarum/common/utils/extractText';
import CommentPost from 'flarum/forum/components/CommentPost';
import ClipboardJS from 'clipboard';

import { getTheme } from './getTheme';
import { codeLang, destroyCodeLang } from './codeLang';

const themeNames = ['default', 'github', 'lingcoder', 'csdn', 'cnblog', 'jianshu', 'segmentfault'];

app.initializers.add('ffans/clipboardjs', () => {
  let settings;
  let clipboard;

  function getSettings() {
    if (!settings) {
      const configuredTheme = app.forum.attribute('themeName');
      const themeName = themeNames.indexOf(configuredTheme) === -1 ? 'default' : configuredTheme;

      settings = {
        copyEnabled: app.forum.attribute('isCopyEnable'),
        codeLanguageEnabled: app.forum.attribute('isShowCodeLang'),
        themeName,
        theme: getTheme(themeName),
      };
    }

    return settings;
  }

  function trans(key, parameters) {
    return extractText(app.translator.trans('ffans-clipboardjs.forum.' + key, parameters));
  }

  function addCopyButtons(root) {
    const { theme, themeName } = getSettings();

    root.querySelectorAll('pre').forEach(function (pre) {
      const code = pre.querySelector('code');

      if (!code || pre.querySelector('[data-ffans-clipboard]')) {
        return;
      }

      const button = document.createElement('button');
      button.type = 'button';
      button.classList.add('clipboard', themeName);
      button.setAttribute('data-ffans-clipboard', '');
      button.setAttribute('aria-label', trans('action_copy'));
      button.setAttribute('title', trans('action_copy'));
      button.setAttribute('aria-live', 'polite');
      button.innerHTML = theme[0];
      pre.insertBefore(button, pre.firstChild);

      pre.classList.add('copy-ready');

      if (themeName === 'lingcoder' || themeName === 'csdn') {
        pre.classList.add('sticky');
      }
    });
  }

  function resetButton(button) {
    const { theme } = getSettings();

    button.classList.remove('succeed', 'failed');
    button.innerHTML = theme[0];
    button.setAttribute('aria-label', trans('action_copy'));
    button.setAttribute('title', trans('action_copy'));
    button.ffansClipboardReset = null;
  }

  function showButtonResult(button, state, html, labelKey) {
    if (button.ffansClipboardReset) {
      clearTimeout(button.ffansClipboardReset);
    }

    button.classList.remove('succeed', 'failed');
    button.classList.add(state);

    if (html) {
      button.innerHTML = html;
    }

    button.setAttribute('aria-label', trans(labelKey));
    button.setAttribute('title', trans(labelKey));
    button.ffansClipboardReset = setTimeout(function () {
      resetButton(button);
    }, 1000);
  }

  function fallbackMessage(action) {
    if (/iPhone|iPad/i.test(navigator.userAgent)) {
      return trans('no_support');
    }

    const actionKey = action === 'cut' ? 'X' : 'C';
    const shortcut = /Mac/i.test(navigator.userAgent) ? '⌘-' + actionKey : 'Ctrl-' + actionKey;

    return trans('msg', {
      actionKey: shortcut,
      action: trans(action === 'cut' ? 'action_cut' : 'action_copy'),
    });
  }

  function ensureClipboard() {
    if (clipboard) {
      return;
    }

    clipboard = new ClipboardJS('[data-ffans-clipboard]', {
      target: function (trigger) {
        return trigger.parentElement.querySelector('code');
      },
    });

    clipboard.on('success', function (event) {
      showButtonResult(event.trigger, 'succeed', getSettings().theme[1], 'ok_btn');
      event.clearSelection();
    });

    clipboard.on('error', function (event) {
      showButtonResult(event.trigger, 'failed', getSettings().theme[2], 'error_btn');
      window.alert(fallbackMessage(event.action));
    });
  }

  extend(CommentPost.prototype, ['oncreate', 'onupdate'], function () {
    const { copyEnabled, codeLanguageEnabled } = getSettings();

    if (copyEnabled) {
      ensureClipboard();
      addCopyButtons(this.element);
    }

    if (codeLanguageEnabled) {
      codeLang(this.element);
    }
  });

  extend(CommentPost.prototype, 'onremove', function () {
    if (getSettings().codeLanguageEnabled) {
      destroyCodeLang(this.element);
    }
  });
});
