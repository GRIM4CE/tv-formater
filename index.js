import axios from 'axios'
import fs from 'fs'

import 'dotenv/config'

const seriesId = 73903
const seriesOrderType = 2
const seasonNmb = 4
const epDir = './dest'

const $axios = axios.create({
  baseURL: 'https://api4.thetvdb.com/v4/'
})

const getTokenFromFile = () => {
  try {
    return fs.readFileSync('./token.txt', 'utf8')
  }
  catch {
    return ''
  }
}

const writeToken = (token) => {
  fs.writeFile('./token.txt', token, err => {
    if (err) {
      console.error(err)
      return
    }
  })
}

const authenticate = async () => {
  return $axios.post('login', {
    apikey: process.env.API_KEY,
    pin: process.env.PIN
  }).then((res) => res.data)
}


const setToken = (token) => {
  $axios.defaults.headers.common['Authorization'] = `Bearer ${token}`
}

// login
const getAuthToken = async () => {
  try {
    let token = getTokenFromFile() || ''
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
  return await $axios.get('series/73903/extended').then(res => res.data)
}

const getSeason = async() => {
  const { data } = await getSeries(seriesId)
  const seasonId = data.seasons.find(season => {
    return (season.type.id === seriesOrderType && season.number === seasonNmb)
  }).id

  return $axios.get(`seasons/${seasonId}/extended`).then(res => res.data)
}

const getEpisodeList = async () => {
  const { data } = await getSeason()

  const episodeArray = data.episodes.map(episode => {
    const { seasonNumber: s, number: e, name } = episode
    const season = s < 10 ? `0${s}` : s
    const number = e < 10 ? `0${e}` : e
    return `s${season}e${number} - ${name}`
  })
  return episodeArray
}


const init = async () => {
  await getAuthToken()
  const episodeNames = (await getEpisodeList());
  if(!episodeNames.length) return
  const files = fs.readdirSync(epDir)
  files.forEach((file, i) => {
    fs.rename(`${epDir}/${file}`, `${epDir}/${episodeNames[i]}.mkv`, (err) => console.log(err))
  })
}

init()