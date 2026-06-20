export class InAppBrowser {
  constructor() {
    this.isElectron = typeof window.electronAPI !== 'undefined';
    this.isIOS = !this.isElectron && typeof Capacitor !== 'undefined';
    this.authResolve = null;
  }

  open(url, existingPopup) {
    return new Promise((resolve) => {
      this.authResolve = resolve;
      if (this.isIOS) {
        this.openIOS(url);
      } else {
        this.openTab(url, existingPopup);
      }
    });
  }

  async startExternalFlow(supabase) {
    window.electronAPI.minimizeWindow();

    const result = await window.electronAPI.startAuthServer();
    if (!result || !result.callbackUrl) {
      window.electronAPI.restoreWindow();
      return { success: false, error: 'Could not start auth server' };
    }

    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'discord',
      options: {
        redirectTo: result.callbackUrl,
        skipBrowserRedirect: true,
      },
    });
    if (error || !data?.url) {
      window.electronAPI.closeAuthUrl();
      window.electronAPI.restoreWindow();
      return { success: false, error: error?.message || 'Failed to get Discord auth URL' };
    }

    window.electronAPI.openExternalUrl(data.url);

    const hash = await window.electronAPI.waitForAuthHash();
    window.electronAPI.restoreWindow();
    return { success: true, hash };
  }

  openTab(url, existingPopup) {
    const popup = existingPopup || window.open(url, '_blank');
    if (!popup) { this.resolve(''); return; }
    if (existingPopup && url) popup.location.href = url;
    const handler = (event) => {
      if (event.data?.type === 'supabase-auth' && event.origin === window.location.origin) {
        window.removeEventListener('message', handler);
        this.resolve(event.data.hash || '');
        if (!popup.closed) popup.close();
      }
    };
    window.addEventListener('message', handler);
    const poll = setInterval(() => {
      if (popup.closed) {
        clearInterval(poll);
        window.removeEventListener('message', handler);
        this.resolve('');
      }
    }, 1000);
  }

  openIOS(url) {
    const Browser = Capacitor.Plugins.Browser;
    if (!Browser) { this.resolve(''); return; }
    Browser.open({ url });
    Browser.addListener('browserPageLoaded', (event) => {
      if (event.url.includes('/auth/callback.html')) {
        const hash = event.url.split('#')[1] || '';
        this.resolve('#' + hash);
        Browser.close();
      }
    });
  }

  resolve(data) {
    if (this.authResolve) {
      this.authResolve(data);
      this.authResolve = null;
    }
  }

  close() {
    if (this.isElectron && window.electronAPI.closeAuthUrl) {
      window.electronAPI.closeAuthUrl();
    }
  }
}