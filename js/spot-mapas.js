'use strict';

// Cartografia real do OpenStreetMap. Apenas itens com coordenadas recebem marcadores.
window.KadiwaMaps = (() => {
    const cityCenter = [-25.9653, 32.5892];
    function create(host, { items = [], onSelect, status } = {}) {
        if (!window.L) {
            host.innerHTML = '<p class="map-unavailable">Mapa indisponível. Use o botão de direções para abrir a localização.</p>';
            return { setItems() {}, resize() {}, destroy() {} };
        }
        const map = L.map(host, { scrollWheelZoom: false, attributionControl: true }).setView(cityCenter, 11);
        const tiles = L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
            maxZoom: 19,
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a>'
        }).addTo(map);
        const markers = L.layerGroup().addTo(map);
        let failures = 0;
        tiles.on('tileerror', () => {
            failures++;
            if (status && failures >= 3) status.textContent = 'Não foi possível carregar o mapa. Verifique a ligação ou abra as direções.';
        });
        tiles.on('tileload', () => {
            failures = 0;
            if (status) status.textContent = '';
        });
        function setItems(next) {
            markers.clearLayers();
            const located = next.filter(item => Array.isArray(item.coordinates) && item.coordinates.length === 2 && item.coordinates.every(Number.isFinite));
            located.forEach((item, index) => {
                const label = `${item.name}${item.locationType === 'demo' ? ' — ponto demonstrativo' : ''}`;
                const marker = L.marker(item.coordinates, {
                    icon: L.divIcon({ className: 'spot-map-pin', html: `<span>${index + 1}</span>`, iconSize: [30, 30], iconAnchor: [15, 15] }),
                    title: label, alt: label, keyboard: true
                }).addTo(markers);
                const tooltip = document.createElement('span');
                tooltip.textContent = label;
                marker.bindTooltip(tooltip);
                if (onSelect) marker.on('click', () => onSelect(item));
            });
            if (located.length === 1) map.setView(located[0].coordinates, 16);
            else if (located.length > 1) map.fitBounds(located.map(item => item.coordinates), { padding: [32, 32], maxZoom: 15 });
            else map.setView(cityCenter, 11);
        }
        setItems(items);
        return { setItems, resize: () => map.invalidateSize({ pan: false }), destroy: () => map.remove() };
    }
    return { create };
})();
