/// <reference path="../node_modules/phaser/typescript/phaser.d.ts"/>
/// <reference path="../typings/tsd.d.ts"/>

module MyGame {

    class InitState extends Phaser.State {
        create() {
            this.add.text(0, 0, 'click to run', { fill:'white' })

            this.input.onTap.addOnce(e => this.game.state.start('running'))
        }
    }

    class RunningState extends Phaser.State {
        actor: Actor

        create() {
            this.stage.backgroundColor = '#333333'

            this.actor = new Actor(this.game, 'res/' + location.search.replace(/\W/g, '') + '.json')
            this.actor.onLoad.add(info => $(document).trigger('actor.load', info))

            this.actor.position.set(this.game.width / 2, this.game.height / 2)
        }

        resize() {
            this.actor.position.set(this.game.width / 2, this.game.height / 2)
        }
    }

    export class Game extends Phaser.Game {
        constructor() {
            super('100', '100')

            // let's get it running at the start
            //this.state.add('init', new InitState, true)
            this.state.add('running', new RunningState, true)

            $(window).resize(e => this.fitWindow())
        }

        // Note: Utils.debounced is not working :(
        fitWindow() {
            var width = $(window).width(),
                height = $(window).height()
            this.width = width
            this.height = height
            this.renderer.resize(width, height)
            this.state.getCurrentState().resize()
        }
    }

}
