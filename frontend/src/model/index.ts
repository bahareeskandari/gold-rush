export interface UserData {
  gold: number // amount of gold
  name: string // name of entity
  coordinates: { x: number; y: number } // position on game board
  emoji: string // player representation emoji
  position: string // position in hackathon user leaderboard
}
