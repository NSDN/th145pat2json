/// <reference path="../node_modules/phaser/typescript/phaser.d.ts"/>
/// <reference path="../typings/tsd.d.ts"/>

module MyGame {

    // the update function runs at 60fps, while the animation is at 15fps
    const FRAME_RATE = 60 / 15

    // TODO: add more states and characters
    const ACTOR_STATES = {
        "res/futo.atlas": {
            "stand": ["anim-0"],
            "walk": ["walkFront-1", "walkFrontLoop-2"],
            "walk=>stand": ["walkFront-3", "anim-0"],
            "walkBack": ["walkBack-4", "walkBackLoop-5"],
            "walkBack=>stand": ["walkBack-6", "anim-0"],
            "jump": ["slide-9", "slideUpperLoop-10", "slide-11", null],
            "jumpFall": ["slideUnderLoop-12", "slide-13", "slide-9", null],
            "crunch": ["slide-14", "slide-15", "slideUnderLoop-16", "slide-17", null],
            "crunchBack": ["slideUpperLoop-18", "anim-19", "anim-20", null]
        },
    }

    export class Actor extends Phaser.Group {
        states: Actor.States
        sprites: Actor.Sprites
        cursors: Phaser.CursorKeys

        isReady = false
        onLoad = new Phaser.Signal

        stateProcs: Actor.StateProc[] = [
            new Actor.StateProc({
                stand: 1,
                walk: 1,
                walkBack: 1,
            }, (state, data) => {
                if (this.cursors.up.isDown)
                    this.states.set('jump')
                else if (this.cursors.down.isDown)
                    this.states.set('crunch')
                else if (this.cursors.left.isDown && !this.cursors.right.isDown)
                    this.states.set('walkBack')
                else if (this.cursors.right.isDown && !this.cursors.left.isDown)
                    this.states.set('walk')
                else
                    this.states.set('stand')
                return true
            }),

            new Actor.StateProc({
                jump:       { age: 9 * FRAME_RATE, offset: 0, height:  200, next: 'jumpFall' },
                jumpFall:   { age: 7 * FRAME_RATE, offset: 1, height:  200, next: 'stand' },
                crunch:     { age: 9 * FRAME_RATE, offset: 0, height: -180, next: 'crunchBack' },
                crunchBack: { age: 7 * FRAME_RATE, offset: 1, height: -180, next: 'stand' },
            }, (state, data) => {
                var x = this.states.currentAge / data.age + data.offset,
                    h = 2 * x - x * x
                this.position.y = this.game.height / 2 - h * data.height
                if (this.states.currentAge > data.age)
                    this.states.set(data.next)
                return true
            }),

            new Actor.StateProc(null, (state, data) => {
                this.states.set('stand')
                return true
            })
        ]

        constructor(game: Phaser.Game, spriteInfoUrl: string) {
            super(game)

            this.cursors = game.input.keyboard.createCursorKeys()

            $.getJSON(spriteInfoUrl)
                .then(info => this.load(info))
                .fail(info => this.load({ }))
        }

        load(info) {
            this.sprites = new Actor.Sprites(this, info.atlasUrl, info.anims, info.boxes)
            this.sprites.onLoad.add(data => this.isReady = true)

            this.states = new Actor.States(this, ACTOR_STATES[info.atlasUrl] || { })
            this.states.onChange.add(data => this.sprites.playAnimations(data || []))

            this.onLoad.dispatch(info)
        }

        update() {
            this.game.input.update()

            if (this.isReady) {
                this.sprites.update()
                this.states.update()
            }
        }
    }

    export module Actor {

        export class StateProc {
            constructor(
                public filter: { [state: string]: any },
                public update: (state: string, data: any) => boolean
            ) { }
        }

        export class States {
            private name: string
            private age: number

            onChange = new Phaser.Signal

            constructor(public actor: Actor, private data: any) {
            }

            set(name: string) {
                if (name === this.name)
                    return

                this.onChange.dispatch(this.data[this.name + '=>' + name] || this.data[name])
                this.age = 0
                this.name = name

                return this.data[name]
            }

            get(name: string) {
                return this.data[name]
            }

            get currentName() {
                return this.name
            }

            get currentAge() {
                return this.age
            }

            update() {
                this.age ++

                this.actor.stateProcs.some(stateProc => {
                    var data = stateProc.filter && stateProc.filter[this.name]
                    if (!stateProc.filter || data)
                        return stateProc.update(this.name, data)
                })
            }
        }

        export class Sprites {
            private animQueue: string[] = [ ]
            private sprite: Phaser.Sprite
            private graphics: Phaser.Graphics
            private animations: any[]

            isLoaded = false
            onLoad = new Phaser.Signal

            constructor(public actor: Actor, private atlasUrl: string, private anims: any[], private hitboxes: any[][]) {
                this.actor.game.load.atlasJSONHash(atlasUrl, atlasUrl + '.png', atlasUrl + '.json')
                this.actor.game.load.onLoadComplete.addOnce(e => this.updateSprites())

                // Note: must use setTimeout or the event might be trigger before return
                setTimeout(e => this.actor.game.load.start(), 0)
            }

            private updateSprites() {
                this.actor.removeAll()

                this.sprite = this.actor.create(0, 0, this.atlasUrl)
                this.sprite.anchor.set(0.5, 0.5)

                if (this.anims) this.anims.forEach(anim => {
                    var frameNames = Phaser.Animation.generateFrameNames(anim.name, 0, anim.length, '', 4)
                    this.sprite.animations.add(anim.name, frameNames)
                })
                this.sprite.events.onAnimationComplete.add(e => this.continueAnimation())

                this.graphics = this.actor.game.add.graphics(0, 0)

                this.isLoaded = true
                this.onLoad.dispatch()
            }

            getAnimations() {
                return this.animations
            }

            playAnimations(names: string[]) {
                this.animQueue = names
                if (names[0])
                    this.startAnimation(names[0], names.length === 1)
            }

            private continueAnimation() {
                this.playAnimations(this.animQueue.length > 1 ?
                    this.animQueue.slice(1) : this.animQueue)
            }

            private startAnimation(name: string, loop: boolean = false) {
                if (this.sprite) {
                    var currentAnim = this.sprite.animations.currentAnim
                    if (currentAnim && currentAnim.isPlaying) {
                        var frame = this.sprite.animations.frame
                        this.sprite.animations.play(name, 15, loop)
                        this.sprite.animations.frame = frame
                    }
                    else {
                        this.sprite.animations.play(name, 15, loop)
                    }
                }
            }

            private static hitboxColors = [
                0x0f0fff, 0x0fff0f, 0xff0f0f
            ]

            update() {
                if (!this.graphics || !this.hitboxes || !this.graphics.visible)
                    return

                this.graphics.position.copyFrom(this.actor.position)
                this.graphics.clear()

                var index = this.sprite.animations.currentFrame.index,
                    boxes = this.hitboxes[index]
                if (boxes) boxes.forEach((boxes, type) => {
                    this.graphics.lineStyle(2, Sprites.hitboxColors[type], 0.6)
                    boxes.forEach(box => {
                        this.graphics.drawRect(box.l, box.t, box.r - box.l, box.b - box.t)
                    })
                })
            }

            get isHitboxVisible(): boolean {
                return this.graphics && this.graphics.visible
            }

            set isHitboxVisible(val: boolean) {
                if (this.graphics)
                    this.graphics.visible = val
            }
        }

    }

}
