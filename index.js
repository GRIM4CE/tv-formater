import axios from 'axios'
import fs from 'fs'
import 'dotenv/config'

const $axios = axios.create({
  baseURL: 'https://api4.thetvdb.com/v4/'
})


const authenticate = async () => {
  return $axios.post('login', {
    apikey: process.env.API_KEY,
    pin: process.env.PIN
  }).then((res) => res.data)
}

const getTokenFromFile = () => {
  return fs.readFileSync('./token.txt', 'utf8')
}

const writeToken = (token) => {
  fs.writeFile('./token.txt', token, err => {
    if (err) {
      console.error(err)
      return
    }
  })
}

const setToken = (token) => {
  $axios.defaults.headers.common['Authorization'] = `Bearer ${token}`
}

// login
const getAuthToken = async () => {
  try {
    let token = getTokenFromFile()
    if(!token) {
      const res = await authenticate()
      token = res.data.token
      writeToken(token)
    }
    setToken(token)
  } catch(e) {
    console.log(e)
  }
}

const getSeries = async (id) => {
  getAuthToken()
  return await $axios.get('series/73903/extended').then(res => res.data)
}

const getSeason = async({ seriesId, orderType, seasonNmb }) => {
  const { data } = await getSeries(seriesId)
  const seasonId = data.seasons.find(season => {
    return (season.type.id === orderType && season.number === seasonNmb)
  }).id

  return $axios.get(`seasons/${seasonId}/extended`).then(res => res.data)
}

const getEpisodeList = async () => {
  const { data } = await getSeason({ seriesId: 73903, orderType: 2, seasonNmb: 4 })

  const episodeArray = data.episodes.map(episode => {
    const { seasonNumber: s, number: e, name } = episode
    const season = s < 10 ? `0${s}` : s
    const number = e < 10 ? `0${e}` : e
    return `s${season}e${number} - ${name}`
  })
  console.log(episodeArray) 
}

getEpisodeList()