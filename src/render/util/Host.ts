import IPC from '@/util/IPC'
import { startService } from '@/util/Service'
import type { AppHost } from '@/store/app'
import { AppStore } from '@/store/app'
import { BrewStore } from '@/store/brew'
import { I18nT } from '@shared/lang'
import { MessageError, MessageSuccess } from '@/util/Element'
const { shell } = require('@electron/remote')
const handleHostEnd = (arr: Array<AppHost>) => {
  const appStore = AppStore()
  const brewStore = BrewStore()

  const apacheRunning = brewStore.apache.installed.find((a) => a.run)
  const apacheTaskRunning = brewStore.apache.installed.some((a) => a.running)
  if (apacheRunning && !apacheTaskRunning) {
    startService('apache', apacheRunning).then()
  }

  const nginxRunning = brewStore.nginx.installed.find((a) => a.run)
  const nginxTaskRunning = brewStore.nginx.installed.some((a) => a.running)
  if (nginxRunning && !nginxTaskRunning) {
    startService('nginx', nginxRunning).then()
  }
  const hosts = appStore.hosts
  hosts.splice(0)
  hosts.push(...arr)

  const writeHosts = appStore.config.setup.hosts.write
  IPC.send('app-fork:host', 'writeHosts', writeHosts).then((key: string) => {
    IPC.off(key)
  })

  MessageSuccess(I18nT('base.success'))
}

export const handleHost = (host: AppHost, flag: string, old?: AppHost, park?: boolean) => {
  return new Promise((resolve) => {
    host = JSON.parse(JSON.stringify(host))
    old = JSON.parse(JSON.stringify(old ?? {}))
    IPC.send('app-fork:host', 'handleHost', host, flag, old, park).then((key: string, res: any) => {
      IPC.off(key)
      if (res?.code === 0) {
        if (res?.data?.host) {
          handleHostEnd(res.data.host)
          resolve(true)
        } else if (res?.data?.hostBackFile) {
          MessageError(I18nT('base.hostParseErr'))
          shell.showItemInFolder(res?.data?.hostBackFile)
          resolve(I18nT('base.hostParseErr'))
        }
      } else if (res?.code === 1) {
        MessageError(res.msg)
        resolve(res.msg)
      }
    })
  })
}
