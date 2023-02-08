import { defineStore } from 'pinia'

export interface SoftInstalled {
  version: string
  bin: string
  path: string
  num: number
  run: boolean
  running: boolean
}

export interface AppSoftInstalledItem {
  getListing: boolean
  installedInited: boolean
  installed: Array<SoftInstalled>
  list: { [key: string]: any }
}

interface State {
  nginx: AppSoftInstalledItem
  apache: AppSoftInstalledItem
  memcached: AppSoftInstalledItem
  mysql: AppSoftInstalledItem
  redis: AppSoftInstalledItem
  php: AppSoftInstalledItem
  cardHeadTitle: string
  brewRunning: boolean
  showInstallLog: boolean
  brewSrc: string
  log: Array<string>
}

const state: State = {
  cardHeadTitle: '当前版本库',
  brewRunning: false,
  showInstallLog: false,
  brewSrc: '',
  log: [],
  nginx: {
    getListing: false,
    installedInited: false,
    installed: [],
    list: {}
  },
  apache: {
    getListing: false,
    installedInited: false,
    installed: [],
    list: {}
  },
  php: {
    getListing: false,
    installedInited: false,
    installed: [],
    list: {}
  },
  memcached: {
    getListing: false,
    installedInited: false,
    installed: [],
    list: {}
  },
  mysql: {
    getListing: false,
    installedInited: false,
    installed: [],
    list: {}
  },
  redis: {
    getListing: false,
    installedInited: false,
    installed: [],
    list: {}
  }
}

export const BrewStore = defineStore('brew', {
  state: (): State => state,
  getters: {},
  actions: {}
})