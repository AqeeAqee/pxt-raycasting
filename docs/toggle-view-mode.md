# toggle View Mode

 * Toggle current view mode, between tilemapView & raycastingView 

```sig
Render.toggleViewMode()
```

## ~hint
 * The raycastingView: rendered by raycasting, 3D (or aka 2.5D) 
 * The tilemapView: traditional flat tilemap, 2D
 * By default this render working in raycastingView, and can be switch to tilemapView any time, or switch back to raycastingView any time.
 * Could place inside the [on Event of Button](/reference/controller/button/on-event) block, for switch view mode back and forth.
## ~

## Parameters
* none

## Returns

* none

## Example

```blocks
controller.A.onEvent(ControllerButtonEvent.Pressed, function () {
    Render.toggleViewMode()
})
```

```package
pxt-raycasting=github:aqeeaqee/pxt-raycasting
```