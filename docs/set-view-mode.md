# set View Mode

 * set current view mode to tilemapView or raycastingView 

```sig
Render.setViewMode()
```

## ~hint
 * The raycastingView: rendered by raycasting, 3D (or aka 2.5D) 
 * The tilemapView: traditional flat tilemap, 2D
 * By default this render working in raycastingView, and can be switch to tilemapView any time, or switch back to raycastingView any time.
 * Could place inside the [on Event of Button](/reference/controller/button/on-event) block, with Pressed/Released, for switch view mode back and forth.
## ~

## Parameters
* **viewMode** raycastingView or tilemapView

## Returns

* none

## Example

```blocks
controller.menu.onEvent(ControllerButtonEvent.Pressed, function () {
    Render.setViewMode(ViewMode.tilemapView)
})
controller.menu.onEvent(ControllerButtonEvent.Released, function () {
    Render.setViewMode(ViewMode.raycastingView)
})
```

```package
pxt-raycasting=github:aqeeaqee/pxt-raycasting
```