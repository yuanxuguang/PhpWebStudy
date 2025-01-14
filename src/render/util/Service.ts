import IPC from '@/util/IPC'
import type { SoftInstalled } from '@/store/brew'
import { AllAppSofts, AppStore } from '@/store/app'
import { TaskStore } from '@/store/task'
import { DnsStore } from '@/store/dns'
import { I18nT } from '@shared/lang'

const exec = (
  typeFlag: AllAppSofts,
  version: SoftInstalled,
  fn: string
): Promise<string | boolean> => {
  return new Promise((resolve) => {
    if (version.running) {
      resolve(true)
      return
    }
    if (!version?.version) {
      resolve(I18nT('util.versionNoFound'))
      return
    }
    version.running = true
    const args = JSON.parse(JSON.stringify(version))
    const appStore = AppStore()
    const taskStore = TaskStore()
    const task = taskStore[typeFlag]
    task.log.splice(0)
    IPC.send(`app-fork:${typeFlag}`, fn, args).then((key: string, res: any) => {
      if (res.code === 0) {
        IPC.off(key)
        version.run = fn !== 'stopService'
        version.running = false
        if (typeFlag === 'php' && fn === 'startService') {
          const hosts = appStore.hosts
          if (hosts && hosts?.[0] && !hosts?.[0]?.phpVersion) {
            appStore.initHost().then()
          }
        }
        resolve(true)
      } else if (res.code === 1) {
        IPC.off(key)
        task.log.push(res.msg)
        version.running = false
        resolve(task.log.join('\n'))
      } else if (res.code === 200) {
        task.log.push(res.msg)
      }
    })
  })
}

export const stopService = (typeFlag: AllAppSofts, version: SoftInstalled) => {
  return exec(typeFlag, version, 'stopService')
}

export const startService = (typeFlag: AllAppSofts, version: SoftInstalled) => {
  return exec(typeFlag, version, 'startService')
}

export const reloadService = (typeFlag: AllAppSofts, version: SoftInstalled) => {
  return exec(typeFlag, version, 'reloadService')
}

export const dnsStart = (): Promise<boolean | string> => {
  return new Promise((resolve) => {
    const store = DnsStore()
    if (store.running) {
      resolve(true)
      return
    }
    store.fetching = true
    IPC.send('DNS:start').then((key: string, res: boolean | string) => {
      IPC.off(key)
      store.fetching = false
      store.running = res === true
      resolve(res)
    })
  })
}

export const dnsStop = (): Promise<boolean> => {
  return new Promise((resolve) => {
    const store = DnsStore()
    if (!store.running) {
      resolve(true)
      return
    }
    store.fetching = true
    IPC.send('DNS:stop').then((key: string, res: boolean) => {
      IPC.off(key)
      store.fetching = false
      store.running = false
      resolve(res)
    })
  })
}
