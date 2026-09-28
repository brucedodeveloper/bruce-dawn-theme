(() => {
  const GIFT_WRAP_FLAG = '_gift_wrap';

  const GiftWrap = {
    variantId() {
      const id = window.giftWrapConfig?.variantId;
      return id ? Number(id) : null;
    },

    isWrapped(properties) {
      if (!properties) return false;
      const value = properties[GIFT_WRAP_FLAG];
      return value === true || value === 'true';
    },

    desiredQuantity(items) {
      const wrapId = this.variantId();
      let total = 0;
      for (const item of items || []) {
        if (wrapId && item.variant_id === wrapId) continue;
        if (!this.isWrapped(item.properties)) continue;
        total += item.quantity;
      }
      return total;
    },

    sectionBody(sections) {
      if (!sections?.length) return {};
      return {
        sections,
        sections_url: window.location.pathname,
      };
    },

    async fetchCart() {
      const response = await fetch(`${routes.cart_url}.js`, {
        headers: { Accept: 'application/json' },
        cache: 'no-store',
      });
      return response.json();
    },

    errorMessage(data) {
      if (!data) return window.cartStrings?.error || 'Cart error';
      if (typeof data.errors === 'string') return data.errors;
      if (typeof data.description === 'string') return data.description;
      if (typeof data.message === 'string' && data.status) return data.message;
      return window.cartStrings?.error || 'Cart error';
    },

    async change({ id, quantity, properties, sections }) {
      const body = {
        id,
        quantity,
        ...this.sectionBody(sections),
      };
      if (properties) body.properties = properties;

      const response = await fetch(routes.cart_change_url, {
        ...fetchConfig(),
        body: JSON.stringify(body),
      });
      const data = await response.json();
      if (!response.ok || data.status || data.errors) {
        throw new Error(this.errorMessage(data));
      }
      return data;
    },

    async add(variantId, quantity, sections) {
      const response = await fetch(routes.cart_add_url, {
        ...fetchConfig(),
        body: JSON.stringify({
          items: [{ id: variantId, quantity }],
          ...this.sectionBody(sections),
        }),
      });
      const data = await response.json();
      if (!response.ok || data.status) {
        throw new Error(this.errorMessage(data));
      }
      return data;
    },

    async sync(cart, sections = []) {
      const wrapId = this.variantId();
      if (!wrapId) return null;

      const items = cart.items || [];
      const desired = this.desiredQuantity(items);
      const wrapLine = items.find((item) => item.variant_id === wrapId);
      const current = wrapLine ? wrapLine.quantity : 0;
      if (current === desired) return null;

      if (!wrapLine) {
        const added = await this.add(wrapId, desired, sections);
        if (added.item_count != null) return added;
        const fresh = await this.fetchCart();
        return added.sections ? { ...fresh, sections: added.sections } : fresh;
      }

      return this.change({
        id: wrapLine.key,
        quantity: desired,
        sections,
      });
    },

    async syncFromServer(sections) {
      if (!this.variantId()) return null;
      const cart = await this.fetchCart();
      return this.sync(cart, sections);
    },

    clip(value, field) {
      const text = (value || '').trim();
      const limit = Number(window.giftWrapConfig?.limits?.[field]);
      if (!Number.isFinite(limit) || limit < 1) return text;
      return text.slice(0, limit);
    },

    buildProperties(existing, { enabled, to, from, message }) {
      const next = { ...(existing || {}) };
      if (!enabled) {
        next[GIFT_WRAP_FLAG] = '';
        next.To = '';
        next.From = '';
        next['Gift message'] = '';
        return next;
      }

      next[GIFT_WRAP_FLAG] = 'true';
      next.To = to || '';
      next.From = from || '';
      next['Gift message'] = message || '';
      return next;
    },
  };

  window.GiftWrap = GiftWrap;

  function giftWrapCartController() {
    const template = document.getElementById('MainContent')?.dataset.template;
    if (template === 'cart') {
      return (
        document.querySelector('cart-items') ||
        document.querySelector('cart-drawer-items')
      );
    }
    return (
      document.querySelector('cart-drawer-items') ||
      document.querySelector('cart-items')
    );
  }

  function giftWrapRoot(target) {
    return target?.closest('[data-gift-wrap]');
  }

  function giftWrapProperties(root) {
    try {
      const parsed = JSON.parse(
        root.querySelector('[data-gift-wrap-properties]')?.textContent || '{}',
      );
      if (Array.isArray(parsed)) return Object.fromEntries(parsed);
      return parsed || {};
    } catch (error) {
      return {};
    }
  }

  function giftWrapSetEditor(root, open) {
    const saved = root.dataset.saved === 'true';
    const editor = root.querySelector('[data-gift-wrap-editor]');
    editor?.classList.toggle('twcss-hidden', !open);
    editor?.classList.toggle('twcss-flex', open);
    root
      .querySelector('[data-gift-wrap-cancel]')
      ?.classList.toggle('twcss-hidden', !open);
    root
      .querySelector('[data-gift-wrap-summary]')
      ?.classList.toggle('twcss-hidden', open || !saved);
    root
      .querySelector('[data-gift-wrap-edit]')
      ?.classList.toggle('twcss-hidden', open || !saved);
  }

  function giftWrapFillEditor(root) {
    const properties = giftWrapProperties(root);
    const to = root.querySelector('[data-gift-wrap-to]');
    const from = root.querySelector('[data-gift-wrap-from]');
    const message = root.querySelector('[data-gift-wrap-message]');
    if (to) to.value = GiftWrap.clip(properties.To, 'to');
    if (from) from.value = GiftWrap.clip(properties.From, 'from');
    if (message)
      message.value = GiftWrap.clip(properties['Gift message'], 'message');
  }

  function giftWrapShowError(root, message) {
    const error = root.querySelector('[data-gift-wrap-error]');
    if (!error) return;
    error.textContent = message || '';
    error.classList.toggle('twcss-hidden', !message);
  }

  function giftWrapSetBusy(root, busy) {
    root.querySelectorAll('button, input, textarea').forEach((control) => {
      control.disabled = busy;
    });
  }

  async function giftWrapPersist(root, enabled) {
    const cartItems = giftWrapCartController();
    if (!cartItems) return;

    const sections = cartItems
      .getSectionsToRender()
      .map((section) => section.section);
    const properties = GiftWrap.buildProperties(giftWrapProperties(root), {
      enabled,
      to: GiftWrap.clip(root.querySelector('[data-gift-wrap-to]')?.value, 'to'),
      from: GiftWrap.clip(
        root.querySelector('[data-gift-wrap-from]')?.value,
        'from',
      ),
      message: GiftWrap.clip(
        root.querySelector('[data-gift-wrap-message]')?.value,
        'message',
      ),
    });

    giftWrapShowError(root, '');
    giftWrapSetBusy(root, true);

    try {
      const changed = await GiftWrap.change({
        id: root.dataset.lineKey,
        quantity: Number(root.dataset.quantity),
        properties,
        sections,
      });
      const synced = await GiftWrap.sync(changed, sections);
      cartItems.applyGiftWrapCartState(synced || changed);
    } catch (error) {
      giftWrapSetBusy(root, false);
      const toggle = root.querySelector('[data-gift-wrap-toggle]');
      if (toggle) toggle.checked = root.dataset.saved === 'true';
      giftWrapShowError(root, error.message);
    }
  }

  document.addEventListener('change', (event) => {
    const productToggle = event.target.closest(
      '[data-gift-wrap-product-toggle]',
    );
    if (productToggle) {
      const fields = productToggle
        .closest('[data-gift-wrap-product]')
        ?.querySelector('[data-gift-wrap-product-fields]');
      if (!fields) return;
      const isChecked = productToggle.checked;
      fields.classList.toggle('twcss-hidden', !isChecked);
      fields.classList.toggle('twcss-flex', isChecked);
      fields.querySelectorAll('input, textarea').forEach((field) => {
        field.disabled = !isChecked;
      });
      return;
    }

    const toggle = event.target.closest('[data-gift-wrap-toggle]');
    if (!toggle) return;
    const root = giftWrapRoot(toggle);
    if (!root) return;

    if (toggle.checked) {
      giftWrapFillEditor(root);
      giftWrapSetEditor(root, true);
      return;
    }

    if (root.dataset.saved === 'true') {
      giftWrapPersist(root, false);
      return;
    }

    giftWrapSetEditor(root, false);
  });

  document.addEventListener('click', (event) => {
    const edit = event.target.closest('[data-gift-wrap-edit]');
    const cancel = event.target.closest('[data-gift-wrap-cancel]');
    const update = event.target.closest('[data-gift-wrap-update]');
    const control = edit || cancel || update;
    if (!control) return;

    const root = giftWrapRoot(control);
    if (!root) return;

    if (edit) {
      giftWrapFillEditor(root);
      giftWrapSetEditor(root, true);
      return;
    }

    if (cancel) {
      const toggle = root.querySelector('[data-gift-wrap-toggle]');
      if (toggle) toggle.checked = root.dataset.saved === 'true';
      giftWrapSetEditor(root, false);
      giftWrapShowError(root, '');
      return;
    }

    giftWrapPersist(root, true);
  });

  document.addEventListener('keydown', (event) => {
    if (event.key !== 'Enter') return;
    if (!event.target.closest('[data-gift-wrap-editor]')) return;
    event.preventDefault();
  });
})();
