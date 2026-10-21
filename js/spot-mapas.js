'use strict';

// Cartografia real do OpenStreetMap. Apenas itens com coordenadas recebem marcadores.
window.KadiwaMaps = (() => {
    const cityCenter = [-25.9653, 32.5892];
    function create(host, { items = [], onSelect, status } = {}) {
        if (!window.L) {
            host.innerHTML = '<p class="map-unavailable">Mapa indisponível. Use o botão de direções para abrir a localização.</p>';
            return { setItems() {}, setUserPosition() {}, resize() {}, destroy() {} };
        }
        const map = L.map(host, { scrollWheelZoom: false, attributionControl: true }).setView(cityCenter, 11);
        const tiles = L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
            maxZoom: 19,
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a>'
        }).addTo(map);
        const markers = L.layerGroup().addTo(map);
        const userMarkers = L.layerGroup().addTo(map);
        let userPosition = null;
        let currentItems = [];
        const validPoint = point => Array.isArray(point) && point.length === 2 && point.every(Number.isFinite)
            && Math.abs(point[0]) <= 90 && Math.abs(point[1]) <= 180;
        function fitLocations() {
            const points = currentItems.filter(item => validPoint(item.coordinates)).map(item => item.coordinates);
            if (userPosition) points.push(userPosition.coordinates);
            if (points.length === 1) map.setView(points[0], 16);
            else if (points.length > 1) map.fitBounds(points, { padding: [32, 32], maxZoom: 15 });
            else map.setView(cityCenter, 11);
        }
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
            currentItems = next;
            markers.clearLayers();
            const located = next.filter(item => validPoint(item.coordinates));
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
            fitLocations();
        }
        function setUserPosition(position) {
            if (position === userPosition) return;
            userMarkers.clearLayers();
            userPosition = validPoint(position?.coordinates) ? position : null;
            if (userPosition) {
                const label = document.createElement('span');
                label.textContent = 'A sua localização';
                L.circleMarker(userPosition.coordinates, { radius: 8, color: '#fff', weight: 3, fillColor: '#181a1b', fillOpacity: 1 })
                    .addTo(userMarkers).bindTooltip(label, { permanent: true, direction: 'top' });
            }
            fitLocations();
        }
        setItems(items);
        return { setItems, setUserPosition, resize: () => map.invalidateSize({ pan: false }), destroy: () => map.remove() };
    }
    return { create };
})();
