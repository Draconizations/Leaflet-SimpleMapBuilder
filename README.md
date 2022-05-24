# Leaflet.SimpleMapBuilder
A silly little plugin that takes a config and builds a tiled CRS.simple map for you. Good if you want to spin up a quick map you made yourself.

It currently supports the following:
- multiple basemaps, and switching between them
- changing the tilesize for each individual map
- changing the amount of zoom allowed for each individual map
- markers that hide and show depending on the zoom level
- global and map-specific markers
- changing the amount and locations of the intial tiles at zoom level 0

## Table of Contents
  * [TODO](#todo)
  * [Usage](#usage)
  * [Config](#config)
    + [mapConfig](#mapconfig)
    + [markerConfig](#markerconfig)
    + [Multiple Maps](#multiple-maps)
  * [Examples](#examples)

## TODO
this repo is still a WIP, there's a couple of stuff I'd like to add before considering this ready to be used
- being able to listen to events
- clean up the code. a ton
- write actual good documentation
- add support for more than just markers (circles, polygons)
- publish to some kind of CDN
- MAYBE a npm package

## Usage
For now, you can include the plugin by copying the source code (in `index.js`), adding it to your files, and referencing it in your html head. Make sure to put it *after* the vanilla leaflet reference.

So basically, like this:
```html
<!DOCTYPE html>
<head>
    <meta charset="UTF-8">
    <title>Example</title>
    <!-- leaflet css and js here... -->
    <script src="src/L.SimpleMapBuilder.js"></script>
    <style>
        #map {
            height: 700px;
        }
    </style>
</head>
<body>
    <div id="map"></div>
    <script src="map.js"></script>
</body>
```

A very basic `map.js` setup would look like this:
```js
let exampleConfig = {
    name: "ExampleMap",
    tilePath: "directory/{z}-{y}-{x}.png"
}

new L.SimpleMapBuilder("map", exampleConfig);
```
Note that the `tilePath` property follows leaflet's [TileLayer URL template](https://leafletjs.com/reference.html#tilelayer), and that the `"map"` parameter is the id of your map container.

That's all you need, except for the actual images.

## Config
Here's a very barebones explanation of the full config that I'll elaborate on when I'm not about to fall asleep.

all values that aren't marked as required have defaults specified here.

### mapConfig
The config for a single map.
| Option       | Type         | Default                     | Description                                                             |
|--------------|--------------|-----------------------------|-------------------------------------------------------------------------|
| name         | string       | `null`                        | REQUIRED. The name of the map                                           |
| tilePath     | string ([Tile Layer URL](https://leafletjs.com/reference.html#tilelayer))      | `"directory/{z}-{y}-{x}.png"` | the path to the tile assets, you probably want to overwrite this        |
| errorTileUrl | string       | `""`                          | the URL to the tile used if another tile fails to load                  |
| tileSize     | number       | `256`                         | the size of the tiles in pixels                                         |
| minZoom      | number       | `0`                           | the minimum zoom level, the furthest your map zooms out (inclusive)     |
| maxZoom      | number       | `2`                           | the maximum zoom level, the amount of times you can zoom in (inclusive) |
| minX         | number       | `0`                           | the X coordinate of the first tile (top left), at zoom level 0*         |
| minY         | number       | `0`                           | the Y coordinate of the first tile (top left), at zoom level 0*         |
| maxX         | number       | `0`                           | the X coordinate of the last tile (bottom right), at zoom level 0*      |
| maxY         | number       | `0`                           | the Y coordinate of the last tile (bottom right), at zoom level 0*      |
| markers      | markerConfig[] | `null`                        | optional, the markers for this map                                      |


\* the amount of tiles increases exponentially when the zoom increases, a single square tile at zoom level 0 will become 4 tiles at zoom level 1, and 16 tiles at zoom level 2, etc.

### markerConfig
The config for a single marker
| Option    | Type     | Default | Description                                                                                   |
|-----------|----------|---------|-----------------------------------------------------------------------------------------------|
| point     | number[] | `null`  | REQUIRED, the coordinates at which the marker displays. Formatted as [x, y]*                   |
| minZoom   | number   | `null`  | REQUIRED (for now), the minimum zoom at which a marker displays                               |
| maxZoom   | number   | `null`  | REQUIRED (for now), the maximum zoom at which a marker displays                               |
| popupText | string   | `null`  | the text displayed in a popup tied to the marker. The popup will not show up if this is empty |

\* the coordinates directly correspond to the pixels of a tile at zoom level 0. If your tiles are 256x large, `[128, 128]` will be in the center of your first tile.

### Multiple Maps
How to add multiple maps in one go.
| Option  | Type           | Default | Description                                                                                           |
|---------|----------------|---------|-------------------------------------------------------------------------------------------------------|
| maps    | mapConfig[]    | `null`  | REQUIRED if using multiple maps, if this is present, all mapConfig properties in the base object will be ignored |
| markers | markerConfig[] | `null`  | optional, global markers that show up regardless of what map is visible.                              |

## Examples
... are still a work in progress. Stay tuned!