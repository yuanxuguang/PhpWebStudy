import { createReadStream, readFileSync } from 'fs'
import { Base } from './Base'
import { getAllFileAsync, execPromise } from '../Fn'
import { ForkPromise } from '@shared/ForkPromise'
import { copy, existsSync, writeFile, mkdirp, appendFile } from 'fs-extra'
import { TaskQueue, TaskItem, TaskQueueProgress } from '@shared/TaskQueue'
import { join } from 'path'
import { cut, load } from 'nodejieba'

class BomCleanTask implements TaskItem {
  path = ''
  constructor(path: string) {
    this.path = path
  }
  run(): Promise<boolean> {
    return new Promise((resolve, reject) => {
      const path = this.path
      try {
        let handled = false
        const stream = createReadStream(path, {
          start: 0,
          end: 3
        })
        stream.on('data', (chunk) => {
          handled = true
          stream.close()
          let buff: any = chunk
          if (
            buff &&
            buff.length >= 3 &&
            buff[0].toString(16).toLowerCase() === 'ef' &&
            buff[1].toString(16).toLowerCase() === 'bb' &&
            buff[2].toString(16).toLowerCase() === 'bf'
          ) {
            buff = readFileSync(path)
            buff = buff.slice(3)
            writeFile(path, buff, 'binary', (err) => {
              buff = null
              if (err) {
                reject(err)
              } else {
                resolve(true)
              }
            })
          } else {
            resolve(false)
          }
        })
        stream.on('error', (err) => {
          handled = true
          stream.close()
          reject(err)
        })
        stream.on('close', () => {
          if (!handled) {
            handled = true
            resolve(false)
          }
        })
      } catch (err) {
        reject(err)
      }
    })
  }
}

class Manager extends Base {
  jiebaLoad = false
  jiebaLoadFail = false
  constructor() {
    super()
  }

  getAllFile(fp: string, fullpath = true) {
    return new ForkPromise((resolve, reject) => {
      getAllFileAsync(fp, fullpath).then(resolve).catch(reject)
    })
  }

  cleanBom(files: Array<string>) {
    return new ForkPromise((resolve, reject, on) => {
      const taskQueue = new TaskQueue()
      taskQueue
        .progress((progress: TaskQueueProgress) => {
          on(progress)
        })
        .end(() => {
          resolve(true)
        })
        .initQueue(
          files.map((p) => {
            return new BomCleanTask(p)
          })
        )
        .run()
    })
  }

  wordSplit(txt: string) {
    return new ForkPromise(async (resolve) => {
      if (!txt.trim() || this.jiebaLoadFail) {
        return resolve([])
      }
      const dict: { [k: string]: string } = {}
      const fenciLoad = async () => {
        const jiebaDir = join(global.Server.BaseDir!, 'cache/nodejieba')
        await mkdirp(jiebaDir)
        let file = join(jiebaDir, 'jieba.dict.utf8')
        if (!existsSync(file)) {
          await copy(join(global.Server.Static!, 'nodejieba/jieba.dict.utf8'), file)
        }
        dict.dict = file
        file = join(jiebaDir, 'hmm_model.utf8')
        if (!existsSync(file)) {
          await copy(join(global.Server.Static!, 'nodejieba/hmm_model.utf8'), file)
        }
        dict.hmmDict = file
        file = join(jiebaDir, 'user.dict.utf8')
        if (!existsSync(file)) {
          await copy(join(global.Server.Static!, 'nodejieba/user.dict.utf8'), file)
        }
        dict.userDict = file
        file = join(jiebaDir, 'idf.utf8')
        if (!existsSync(file)) {
          await copy(join(global.Server.Static!, 'nodejieba/idf.utf8'), file)
        }
        dict.idfDict = file
        file = join(jiebaDir, 'stop_words.utf8')
        if (!existsSync(file)) {
          await copy(join(global.Server.Static!, 'nodejieba/stop_words.utf8'), file)
        }
        dict.stopWordDict = file
        if (!this.jiebaLoad) {
          this.jiebaLoad = true
          await execPromise(`echo '${global.Server.Password}' | sudo -S chmod -R 755 ${jiebaDir}`)
          try {
            load(dict)
          } catch (err: any) {
            this.jiebaLoadFail = true
            appendFile(
              join(global.Server.BaseDir!, 'fork.error.txt'),
              `\n${err?.toString()}`
            ).then()
          }
        }
      }
      await fenciLoad()
      if (this.jiebaLoadFail) {
        resolve([])
        return
      }
      console.log('wordSplit !!!')
      try {
        const arr = cut(txt.trim(), true)
        resolve(arr)
      } catch (err: any) {
        appendFile(join(global.Server.BaseDir!, 'fork.error.txt'), `\n${err?.toString()}`).then()
        resolve([])
      }
    })
  }
}

export default new Manager()
