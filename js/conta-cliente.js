'use strict';

(() => {
    const ACCOUNT_KEY = 'kadiwa.customer.account.v1';
    const REVIEWS_KEY = 'kadiwa.customer.reviews.v1';
    const PENDING_REVIEW_KEY = 'kadiwa.customer.pending-review.v1';

    const storage = {
        read(key, fallback) {
            try {
                const value = window.localStorage.getItem(key);
                return value ? JSON.parse(value) : fallback;
            } catch {
                return fallback;
            }
        },
        write(key, value) {
            try {
                window.localStorage.setItem(key, JSON.stringify(value));
                return true;
            } catch {
                return false;
            }
        },
        remove(key) {
            try { window.localStorage.removeItem(key); } catch { /* armazenamento indisponível */ }
        }
    };

    const getAccount = () => storage.read(ACCOUNT_KEY, null);
    const getReviews = () => {
        const reviews = storage.read(REVIEWS_KEY, []);
        return Array.isArray(reviews) ? reviews : [];
    };
    const normaliseWhatsApp = value => String(value || '').replace(/[^\d]/g, '');
    const safeName = value => String(value || '').trim().replace(/\s+/g, ' ').slice(0, 80);
    const reviewKey = spotId => `review-${spotId}`;

    function createDialog() {
        const dialog = document.createElement('dialog');
        dialog.className = 'account-dialog';
        dialog.id = 'account-dialog';
        dialog.setAttribute('aria-labelledby', 'account-dialog-title');
        dialog.innerHTML = `
            <div class="account-dialog-heading">
                <div><p class="account-kicker">Conta do cliente</p><h2 id="account-dialog-title">Entre no Kadiwa Spot</h2></div>
                <button class="account-close" type="button" data-account-close aria-label="Fechar conta">×</button>
            </div>
            <div class="account-dialog-body">
                <div class="account-intro">
                    <p>Registar-se é opcional. A sua conta permite guardar uma avaliação ou testemunho e escolher que atualizações quer receber.</p>
                    <p class="account-local-note">Nesta fase, os dados ficam apenas neste navegador. As notificações serão ligadas quando o serviço de mensagens estiver disponível.</p>
                </div>
                <form id="account-form" class="account-form" novalidate>
                    <div class="account-field"><label for="account-name">Nome</label><input id="account-name" name="name" autocomplete="name" required maxlength="80"></div>
                    <div class="account-field"><label for="account-email">Email</label><input id="account-email" name="email" type="email" autocomplete="email" required></div>
                    <div class="account-field"><label for="account-whatsapp">WhatsApp</label><input id="account-whatsapp" name="whatsapp" type="tel" inputmode="tel" autocomplete="tel" placeholder="84 000 0000" required aria-describedby="account-whatsapp-help"><small id="account-whatsapp-help">Introduza 9 a 15 dígitos. Pode incluir o indicativo +258.</small></div>
                    <fieldset class="account-preferences"><legend>Atualizações que quer receber</legend><label><input type="checkbox" name="updates-email"> Novos spots e destaques por email</label><label><input type="checkbox" name="updates-whatsapp"> Atualizações por WhatsApp</label><small>Estas opções não enviam mensagens nesta versão de demonstração.</small></fieldset>
                    <p class="account-form-error" id="account-form-error" role="alert" hidden></p>
                    <div class="account-actions"><button type="submit" class="btn btn-teal">Guardar conta</button><button type="button" class="account-text-button" data-account-close>Continuar sem conta</button></div>
                </form>
                <section id="account-summary" class="account-summary" hidden aria-live="polite"></section>
            </div>`;
        document.body.append(dialog);
        return dialog;
    }

    function createReviewDialog() {
        const dialog = document.createElement('dialog');
        dialog.className = 'account-dialog account-review-dialog';
        dialog.id = 'review-dialog';
        dialog.setAttribute('aria-labelledby', 'review-dialog-title');
        dialog.innerHTML = `
            <div class="account-dialog-heading"><div><p class="account-kicker">A sua experiência</p><h2 id="review-dialog-title">Avaliar spot</h2></div><button class="account-close" type="button" data-review-close aria-label="Fechar avaliação">×</button></div>
            <form id="review-form" class="account-dialog-body account-form" novalidate>
                <p id="review-spot-name" class="review-spot-name"></p>
                <input type="hidden" id="review-spot-id" name="spotId">
                <fieldset class="review-rating"><legend>Como avalia este local?</legend><div class="review-rating-options"><label><input type="radio" name="rating" value="1" required><span>1</span></label><label><input type="radio" name="rating" value="2"><span>2</span></label><label><input type="radio" name="rating" value="3"><span>3</span></label><label><input type="radio" name="rating" value="4"><span>4</span></label><label><input type="radio" name="rating" value="5"><span>5</span></label></div></fieldset>
                <div class="account-field"><label for="review-message">O seu testemunho</label><textarea id="review-message" name="message" rows="5" maxlength="600" minlength="10" required placeholder="Conte o que gostou ou o que pode melhorar."></textarea><small>O texto fica guardado apenas neste navegador nesta versão.</small></div>
                <p class="account-form-error" id="review-form-error" role="alert" hidden></p>
                <div class="account-actions"><button type="submit" class="btn btn-teal">Guardar avaliação</button><button type="button" class="account-text-button" data-review-close>Cancelar</button></div>
            </form>`;
        document.body.append(dialog);
        return dialog;
    }

    function setModalState() {
        document.body.classList.toggle('has-modal', Array.from(document.querySelectorAll('dialog')).some(dialog => dialog.open));
    }

    function fillForm(dialog, account) {
        dialog.querySelector('#account-name').value = account?.name || '';
        dialog.querySelector('#account-email').value = account?.email || '';
        dialog.querySelector('#account-whatsapp').value = account?.whatsapp || '';
        dialog.querySelector('[name="updates-email"]').checked = Boolean(account?.notifications?.email);
        dialog.querySelector('[name="updates-whatsapp"]').checked = Boolean(account?.notifications?.whatsapp);
    }

    function renderSummary(dialog, account) {
        const form = dialog.querySelector('#account-form');
        const summary = dialog.querySelector('#account-summary');
        if (!account) {
            form.hidden = false;
            summary.hidden = true;
            return;
        }
        const updates = [];
        if (account.notifications?.email) updates.push('email');
        if (account.notifications?.whatsapp) updates.push('WhatsApp');
        form.hidden = true;
        summary.hidden = false;
        summary.replaceChildren();
        const title = document.createElement('h3');
        title.tabIndex = -1;
        title.textContent = `Olá, ${account.name}`;
        const copy = document.createElement('p');
        copy.textContent = updates.length ? `Preferências guardadas para: ${updates.join(' e ')}.` : 'Ainda não escolheu receber atualizações.';
        const note = document.createElement('p');
        note.className = 'account-local-note';
        note.textContent = 'Os dados desta demonstração ficam guardados neste navegador.';
        const edit = document.createElement('button');
        edit.type = 'button';
        edit.className = 'btn btn-teal';
        edit.textContent = 'Editar conta';
        edit.addEventListener('click', () => {
            fillForm(dialog, account);
            summary.hidden = true;
            form.hidden = false;
            dialog.querySelector('#account-name').focus();
        });
        const clear = document.createElement('button');
        clear.type = 'button';
        clear.className = 'account-text-button account-delete';
        clear.textContent = 'Apagar dados deste navegador';
        clear.addEventListener('click', () => {
            storage.remove(ACCOUNT_KEY);
            storage.remove(REVIEWS_KEY);
            updateAccountButtons();
            renderSummary(dialog, null);
            fillForm(dialog, null);
        });
        summary.append(title, copy, note, edit, clear);
    }

    function updateAccountButtons() {
        const account = getAccount();
        document.querySelectorAll('[data-account-open]').forEach(button => {
            button.textContent = account ? 'Minha conta' : 'Entrar / Registar';
            button.setAttribute('aria-label', account ? 'Abrir a minha conta' : 'Entrar ou registar conta');
        });
    }

    function openAccount(dialog) {
        const account = getAccount();
        fillForm(dialog, account);
        renderSummary(dialog, account);
        if (!dialog.open) dialog.showModal();
        setModalState();
        const target = account ? dialog.querySelector('.account-summary h3') : dialog.querySelector('#account-name');
        target?.focus();
    }

    function openReview(dialog, spot) {
        const account = getAccount();
        if (!account) return false;
        const reviews = getReviews();
        const previous = reviews.find(review => review.spotId === spot.id);
        dialog.querySelector('#review-dialog-title').textContent = `Avaliar ${spot.name}`;
        dialog.querySelector('#review-spot-name').textContent = 'A sua avaliação será guardada neste navegador.';
        dialog.querySelector('#review-spot-id').value = spot.id;
        dialog.querySelector('#review-message').value = previous?.message || '';
        dialog.querySelectorAll('[name="rating"]').forEach(input => { input.checked = Number(input.value) === previous?.rating; });
        dialog.querySelector('#review-form-error').hidden = true;
        if (!dialog.open) dialog.showModal();
        setModalState();
        (previous ? dialog.querySelector('#review-message') : dialog.querySelector('[name="rating"]'))?.focus();
        return true;
    }

    function startReview(accountDialog, reviewDialog, spot) {
        const outerDialog = document.querySelector('#detail-dialog[open]');
        if (outerDialog) outerDialog.close();
        if (openReview(reviewDialog, spot)) return;
        storage.write(PENDING_REVIEW_KEY, spot);
        openAccount(accountDialog);
    }

    function setup() {
        const accountDialog = createDialog();
        const reviewDialog = createReviewDialog();

        updateAccountButtons();
        document.addEventListener('click', event => {
            const accountButton = event.target.closest('[data-account-open]');
            if (accountButton) {
                event.preventDefault();
                openAccount(accountDialog);
                return;
            }
            const reviewButton = event.target.closest('[data-review-spot]');
            if (reviewButton) {
                event.preventDefault();
                startReview(accountDialog, reviewDialog, { id: reviewButton.dataset.reviewSpot, name: reviewButton.dataset.reviewSpotName || 'este spot' });
            }
        });

        accountDialog.addEventListener('click', event => {
            if (event.target === accountDialog || event.target.closest('[data-account-close]')) accountDialog.close();
        });
        reviewDialog.addEventListener('click', event => {
            if (event.target === reviewDialog || event.target.closest('[data-review-close]')) reviewDialog.close();
        });
        [accountDialog, reviewDialog].forEach(dialog => dialog.addEventListener('close', setModalState));

        accountDialog.querySelector('#account-form').addEventListener('submit', event => {
            event.preventDefault();
            const form = event.currentTarget;
            const error = accountDialog.querySelector('#account-form-error');
            const values = new FormData(form);
            const name = safeName(values.get('name'));
            const email = String(values.get('email') || '').trim();
            const whatsapp = normaliseWhatsApp(values.get('whatsapp'));
            let message = '';
            if (name.length < 2) message = 'Indique o seu nome para criar a conta.';
            else if (!form.querySelector('#account-email').validity.valid) message = 'Introduza um email válido.';
            else if (whatsapp.length < 9 || whatsapp.length > 15) message = 'Introduza um número de WhatsApp com 9 a 15 dígitos.';
            if (message) {
                error.textContent = message;
                error.hidden = false;
                return;
            }
            const old = getAccount();
            const account = {
                name,
                email,
                whatsapp: `+${whatsapp}`,
                notifications: { email: values.get('updates-email') === 'on', whatsapp: values.get('updates-whatsapp') === 'on' },
                createdAt: old?.createdAt || new Date().toISOString(),
                updatedAt: new Date().toISOString()
            };
            if (!storage.write(ACCOUNT_KEY, account)) {
                error.textContent = 'Não foi possível guardar os dados neste navegador. Verifique as permissões de armazenamento.';
                error.hidden = false;
                return;
            }
            error.hidden = true;
            updateAccountButtons();
            renderSummary(accountDialog, account);
            const pending = storage.read(PENDING_REVIEW_KEY, null);
            if (pending?.id) {
                storage.remove(PENDING_REVIEW_KEY);
                accountDialog.close();
                openReview(reviewDialog, pending);
            }
        });

        reviewDialog.querySelector('#review-form').addEventListener('submit', event => {
            event.preventDefault();
            const form = event.currentTarget;
            const error = reviewDialog.querySelector('#review-form-error');
            const values = new FormData(form);
            const rating = Number(values.get('rating'));
            const message = String(values.get('message') || '').trim();
            if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
                error.textContent = 'Escolha uma avaliação de 1 a 5.';
                error.hidden = false;
                return;
            }
            if (message.length < 10) {
                error.textContent = 'Escreva pelo menos 10 caracteres no seu testemunho.';
                error.hidden = false;
                return;
            }
            const spotId = String(values.get('spotId') || '');
            const reviews = getReviews().filter(review => review.spotId !== spotId);
            reviews.push({ id: reviewKey(spotId), spotId, rating, message: message.slice(0, 600), updatedAt: new Date().toISOString() });
            if (!storage.write(REVIEWS_KEY, reviews)) {
                error.textContent = 'Não foi possível guardar a sua avaliação neste navegador.';
                error.hidden = false;
                return;
            }
            error.hidden = true;
            reviewDialog.close();
            document.dispatchEvent(new CustomEvent('kadiwa:review-saved', { detail: { spotId, rating } }));
        });

        window.KadiwaCustomerAccount = { getAccount, getReviews, normaliseWhatsApp };
    }

    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', setup, { once: true });
    else setup();
})();
