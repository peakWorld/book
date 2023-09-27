
export default {
  x: 1,
  y: 2,
  sayX() {
    console.log('common...', this.x)
  },
  sayY() {
    console.log('common...', this.y)
  }
}