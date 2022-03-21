
namespace miniMap {

    export class MiniMap {
        constructor(public map: Sprite, private cursor: Sprite) { }

        public paintCursorOnMiniMap(x: number, y: number, dirX: number, dirY: number) {
            this.cursor.setPosition(x + 1 + this.map.left, y + 1 + this.map.top)
            this.cursor.image.fill(0)
            this.cursor.image.drawLine(2, 2, 2 + dirX * 3, 2 + dirY * 3, 5)
            this.cursor.image.setPixel(2, 2, 2)
        }
    }

    export function createMiniMap(map: Image, color: number = 3, left: number = 0, top: number = 0): MiniMap {

        let sprMiniMap = sprites.create(map.clone())

        if (color>0&&color<16)
            for (let i = 1; i < 16; i++) {
                sprMiniMap.image.replace(i, color)
            }
        sprMiniMap.z = 998
        sprMiniMap.left = left
        sprMiniMap.top = top

        let cursor = sprites.create(image.create(5, 5))
        cursor.z = 999

        return new MiniMap(sprMiniMap, cursor)
    }
}