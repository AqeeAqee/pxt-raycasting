# jump With Height And Duration

 * Make sprite jump, with specific height and duration

```sig
Render.jumpWithHeightAndDuration()
```


## Parameters
* **sprite**
* **height** jump height in pixel
* **duration** hover time span, unit: ms

## Returns

* none

## Example

```blocks
controller.B.onEvent(ControllerButtonEvent.Pressed, function () {
    Render.jumpWithHeightAndDuration(Render.getRenderSpriteInstance(), 8, 500)
})
```

```package
pxt-raycasting=github:aqeeaqee/pxt-raycasting
```