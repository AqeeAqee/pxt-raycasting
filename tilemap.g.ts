// Auto-generated code. Do not edit.
namespace myTiles {
    //% fixedInstance jres blockIdentity=images._tile
    export const transparency16 = image.ofBuffer(hex``);

    helpers._registerFactory("tilemap", function(name: string) {
        switch(helpers.stringTrim(name)) {
            case "level1":
            case "level1":return tiles.createTilemap(hex`1000100001010101010101010101010101010101010000000000000000000000000000010100000000000000000000000000000101000000000000000000000000000001010000000303030000020202000000010100000003000000000000020000000101000000030000000000000200000001010000000000000000000000000000010100000000000000000000000000000101000000020000000000000100000001010000000200000000000001000000010100000002020200000101010000000101000000000000000000000000000001010000000000000000000000000000010100000000000000000000000000000101010101010101010101010101010101`, img`
2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 
2 . . . . . . . . . . . . . . 2 
2 . . . . . . . . . . . . . . 2 
2 . . . . . . . . . . . . . . 2 
2 . . . 2 2 2 . . 2 2 2 . . . 2 
2 . . . 2 . . . . . . 2 . . . 2 
2 . . . 2 . . . . . . 2 . . . 2 
2 . . . . . . . . . . . . . . 2 
2 . . . . . . . . . . . . . . 2 
2 . . . 2 . . . . . . 2 . . . 2 
2 . . . 2 . . . . . . 2 . . . 2 
2 . . . 2 2 2 . . 2 2 2 . . . 2 
2 . . . . . . . . . . . . . . 2 
2 . . . . . . . . . . . . . . 2 
2 . . . . . . . . . . . . . . 2 
2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 
`, [myTiles.transparency16,sprites.builtin.forestTiles0,sprites.dungeon.greenOuterNorth0,sprites.builtin.brick], TileScale.Sixteen);
        }
        return null;
    })

    helpers._registerFactory("tile", function(name: string) {
        switch(helpers.stringTrim(name)) {
            case "transparency16":return transparency16;
        }
        return null;
    })

}
// Auto-generated code. Do not edit.
