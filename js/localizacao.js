'use strict';

// Localização obtida com autorização do navegador e partilhada apenas nesta sessão.
window.KadiwaLocation = (() => {
    const cacheKey = 'kadiwa.location.v1';
    const maxAge = 5 * 60 * 1000;
    let pending = null;
    const validCoordinates = point => Array.isArray(point) && point.length === 2
        && point.every(Number.isFinite) && Math.abs(point[0]) <= 90 && Math.abs(point[1]) <= 180;
    function clear() {
        try { sessionStorage.removeItem(cacheKey); } catch { /* Sem armazenamento. */ }
    }
    function cached() {
        try {
            const value = JSON.parse(sessionStorage.getItem(cacheKey));
            if (validCoordinates(value?.coordinates) && Number.isFinite(value.timestamp)
                && Date.now() - value.timestamp >= 0 && Date.now() - value.timestamp <= maxAge) return value;
            sessionStorage.removeItem(cacheKey);
        } catch { /* A pesquisa continua se o armazenamento estiver indisponível. */ }
        return null;
    }
    function errorMessage(error) {
        return {
            1: 'A localização foi recusada. Pode permiti-la nas definições do navegador ou pesquisar por zona.',
            2: 'Não foi possível obter a sua localização. Tente novamente ou pesquise por zona.',
            3: 'A localização demorou demasiado. Tente novamente ou pesquise por zona.',
            insecure: 'A localização precisa de uma ligação HTTPS ou de localhost. Pode pesquisar por zona.',
            unsupported: 'Este navegador não disponibiliza localização. Pode pesquisar por zona.'
        }[error?.code] || 'Não foi possível obter a localização. Pode pesquisar por zona.';
    }
    function request() {
        if (pending) return pending;
        if (window.isSecureContext === false) return Promise.reject({ code: 'insecure' });
        if (!navigator.geolocation) return Promise.reject({ code: 'unsupported' });
        pending = new Promise((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(position => {
                const coordinates = [position.coords.latitude, position.coords.longitude];
                if (!validCoordinates(coordinates)) { reject({ code: 2 }); return; }
                const value = { coordinates, accuracy: Number.isFinite(position.coords.accuracy) ? position.coords.accuracy : null, timestamp: Date.now() };
                try { sessionStorage.setItem(cacheKey, JSON.stringify(value)); } catch { /* Sem persistência. */ }
                resolve(value);
            }, error => {
                if (error.code === 1) clear();
                reject(error);
            }, { enableHighAccuracy: true, timeout: 12000, maximumAge: 60000 });
        }).finally(() => { pending = null; });
        return pending;
    }
    return { cached, request, errorMessage, validCoordinates, clear };
})();
