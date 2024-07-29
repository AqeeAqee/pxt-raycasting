# refresh Tilemap

* Refresh the 3D tilemap

```sig
Render.refreshTilemap()
```

Only necessary when the 3D tilemap doesn't update automatically. Some built-in tilemap blocks that edit the 2D tilemap don't update the 3D rendered tilemap.

## Example

```blocks
controller.A.onEvent(ControllerButtonEvent.Pressed, function () {
    tiles.setTileAt(tiles.getTileLocation(8, 8), sprites.builtin.forestTiles0)
    Render.refreshTilemap()
})
Render.setViewMode(ViewMode.raycastingView)
tiles.setCurrentTilemap(tilemap`level1`)
```

```jres
{
    "transparency16": {
        "data": "hwQQABAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA==",
        "mimeType": "image/x-mkcd-f4",
        "tilemapTile": true
    },
    "level1": {
        "id": "level1",
        "mimeType": "application/mkcd-tilemap",
        "data": "MTAxMDAwMTAwMDAxMDEwMTAxMDEwMTAxMDEwMTAxMDEwMTAxMDEwMTAxMDEwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDEwMTAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMTAxMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAxMDEwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDEwMTAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMTAxMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAxMDEwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDEwMTAwMDAwMDAwMDAwMDAwMDIwMDAwMDAwMDAwMDAwMTAxMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAxMDEwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDEwMTAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMTAxMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAxMDEwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDEwMTAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMTAxMDEwMTAxMDEwMTAxMDEwMTAxMDEwMTAxMDEwMTAxMjIyMjIyMjIyMjIyMjIyMjAyMDAwMDAwMDAwMDAwMjAwMjAwMDAwMDAwMDAwMDIwMDIwMDAwMDAwMDAwMDAyMDAyMDAwMDAwMDAwMDAwMjAwMjAwMDAwMDAwMDAwMDIwMDIwMDAwMDAwMDAwMDAyMDAyMDAwMDAwMDAwMDAwMjAwMjAwMDAwMDAyMDAwMDIwMDIwMDAwMDAwMDAwMDAyMDAyMDAwMDAwMDAwMDAwMjAwMjAwMDAwMDAwMDAwMDIwMDIwMDAwMDAwMDAwMDAyMDAyMDAwMDAwMDAwMDAwMjAwMjAwMDAwMDAwMDAwMDIwMjIyMjIyMjIyMjIyMjIyMg==",
        "tileset": [
            "myTiles.transparency16",
            "sprites.builtin.forestTiles0",
            "sprites.castle.tilePath5"
        ],
        "displayName": "level1"
    },
    "*": {
        "mimeType": "image/x-mkcd-f4",
        "dataEncoding": "base64",
        "namespace": "myTiles"
    }
}
```

```package
pxt-raycasting=github:aqeeaqee/pxt-raycasting
```
