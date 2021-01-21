const randomSort = require('./randomsort')

class Deck{
    constructor(random){
        
        this.deck = random?randomSort([1,1,1,1,1,2,2,3,3,4,4,5,5,6,7,8]):([6,3,1,1,1,2,2,3,3,4,4,5,5,6,7,8])
        this.cur = -1
    }
    reset(){
        this.deck = randomSort([1,1,1,1,1,2,2,3,3,4,4,5,5,6,7,8])
        this.cur = -1
    }
    get draw(){
        this.cur = this.cur + 1
        return this.deck[this.cur]
    }
    get num(){
        return 15 - this.cur
    }
    set setDeck(newDeck){
        this.deck = newDeck
    }
    get getDeck(){
        return this.deck
    }
}
module.exports = Deck
