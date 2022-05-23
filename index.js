L.SimpleMapBuilder = L.Evented.extend({

    id: "map",
    map: null, // the actual L.Map object

    mapInfo: { // holds general info about the map
        maps: [], // array of the separate maps
        layers: {
            overlays: [] // global overlays
        }
    },


    initialize: function(id, config) {
        if (id) this.id = id;
        this.parseConfig(config);
    },

    parseConfig: function(config) {

        if (!config.maps || config.maps.length === 0) this.createMapInfo(config);
        else (config.maps.forEach(map => this.createMapInfo(map)));
        
        if (config.markers && config.markers.length > 0) this.createGlobalMarkers(config.markers);

        this.createMap();
    },

    createMapInfo: function(map) {
        // all maps need to have a name
        if (!map.name) throw {
            type: `Map name cannot be null.`,
            map: map
        };

        // get the tilepath or use the default path
        let tilePath = map.tilePath ? map.tilePath : "directory/{z}-{y}-{x}.png";

        let tileSize = map.tileSize ? map.tileSize : 256;
        let minZoom = map.minZoom ? map.minZoom : 0;
        let maxZoom = map.maxZoom ? map.maxZoom : 2;

        // get the map bounds and the center
        let bounds = [[0, 0], [-tileSize, tileSize]];
        let center = [-tileSize / 2, tileSize / 2];

        let minX = map.minX ? map.minX : 0;
        let maxX = map.maxX ? map.maxX : 0;
        let minY = map.minY ? map.minY : 0;
        let maxY = map.maxY ? map.maxY : 0;

        let tilesX = maxX - minX + 1; // amount of tiles horizontally at zoom level 0
        let tilesY = maxY - minY + 1; // ditto, but vertically

        bounds = [[tileSize * -minY, tileSize * minX], [tileSize * -(maxY + 1), tileSize * (maxX + 1)]];
        center = [tileSize * -tilesY / 2, tileSize * tilesX / 2];

        // create the tile layer for this map
        let tileLayer = L.tileLayer(tilePath, {
            tileSize: tileSize,
            minZoom: minZoom,
            maxZoom: maxZoom,
            noWrap: true,
            bounds: bounds,
            errorTileUrl: map.errorTileUrl ? map.errorTileUrl : ""
        });

        // here comes the dirty work
        // create an object containing each marker layer ordered by the zoom levels they show up on
        let overlayLayers;
        if (map.markers && map.markers.length > 0) {
           overlayLayers = this.createOverlayLayers(map.markers);
        }

        this.mapInfo.maps.push({
            name: map.name,
            layers: {
                tiles: tileLayer,
                overlays: overlayLayers
            },
            properties: {
                bounds: bounds,
                center: center,
                minZoom: minZoom,
                maxZoom: maxZoom
            },
            active: false
        });
    },

    createOverlayLayers: function(markers) {
        // an object holding each layer by zoom level
        let overlays = [];

        markers.forEach(m => {
            if (m.minZoom === null || m.maxZoom === null) throw {
                type: "Marker must have both a minZoom and a maxZoom specified",
                marker: m
            };

            // add marker specifically (might add more types in the future)
            if (!m.type || m.type === 'marker') {
                let markerLayer;

                if (m.point === null || m.point.length !== 2) throw {
                    type: "Marker has invalid points",
                    marker: m
                };

                markerLayer = L.marker([-m.point[1], m.point[0]]);

                // add popup if text is specified
                if (m.popupText && typeof m.popupText === 'string') markerLayer.bindPopup(m.popupText);
                
                let marker = {
                    layer: markerLayer,
                    minZoom: m.minZoom,
                    maxZoom: m.maxZoom
                };

                overlays.push(marker);
            }
        });

        return overlays;
    },

    createGlobalMarkers: function(markers) {
        let overlays = this.createOverlayLayers(markers);
        this.mapInfo.layers.overlays = overlays;
    },

    createMap: function() {
        let baseMaps = {};

        this.mapInfo.maps.forEach(m => {
            // create a LayerGroup with the tiles layer and add that to the baseMaps
            baseMaps[m.name] = L.layerGroup([m.layers.tiles]);
        });

        // set the first map as active
        this.mapInfo.maps[0].active = true;

        // create the map, add the corresponding baseMap to the map
        this.map = L.map(this.id, {
            crs: L.CRS.Simple,
            layers: baseMaps[this.mapInfo.maps.find(map => map.active === true).name]
        }).setView(this.mapInfo.maps[0].properties.center, this.mapInfo.maps[0].properties.minZoom);

        this.map.setMaxBounds(this.mapInfo.maps[0].properties.bounds);

        // add the appropriate markers
        this.updateOverlays(this.mapInfo.maps[0].layers.overlays);

        // create the controls
        if (Object.keys(baseMaps).length > 1) {
            L.control.layers(baseMaps).addTo(this.map);
        }

        // update the active map when the baseMap is changed
        this.map.on('baselayerchange', (e) => this.updateBaseLayer(e));
        // update the overlays whenever the map is zoomed
        this.map.on('zoomend', () => this.updateOverlays(this.mapInfo.maps.find(map => map.active === true).layers.overlays));
    },

    updateOverlays: function(overlays) {
        overlays.forEach(m => this.removeAdd(m));

        if (this.mapInfo.layers.overlays.length > 0) 
            this.mapInfo.layers.overlays.forEach(m => this.removeAdd(m));
    },

    removeAdd: function(m) {
        let zoom = this.map.getZoom();
        if (zoom >= m.minZoom && zoom <= m.maxZoom) {
            this.map.addLayer(m.layer);
        } else {
            this.map.removeLayer(m.layer);
        }
    },

    updateBaseLayer: function(e) {
        // get the old map
        prev = this.mapInfo.maps.find(map => map.active === true);
        
        // remove all the markers from the previous map
        prev.layers.overlays.forEach(m => this.map.removeLayer(m.layer));
        prev.active = false;

        // switch to new map
        curr = this.mapInfo.maps.find(map => map.name === e.name);

        curr.active = true;

        // update map bounds
        this.map.setMaxBounds(curr.properties.bounds);

        // add all the markers on the current map
        this.updateOverlays(curr.layers.overlays);
    }
});