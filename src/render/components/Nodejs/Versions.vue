<template>
  <div class="nodejs-versions">
    <div class="current-version">
      <span class="left-title">{{ $t('base.currentVersion') }}</span>
      <span class="version">{{ current }}</span>
    </div>
    <div class="block">
      <span class="left-title">{{ $t('base.selectVersion') }}</span>
      <el-select
        v-model="select"
        filterable
        :loading="task.getVersioning"
        :loading-text="$t('base.gettingVersion')"
        :disabled="task.getVersioning || task.isRunning"
        class="ml-30"
      >
        <template v-for="item in localVersions" :key="item">
          <el-option :label="item" :value="item">
            <span style="float: left" v-text="item"></span>
            <span style="float: right">{{ $t('base.installed') }}</span>
          </el-option>
        </template>
        <template v-for="item in task.versions" :key="item">
          <template v-if="!localVersions.includes(item)"></template>
          <el-option :label="item" :value="item"></el-option>
        </template>
      </el-select>
      <el-button
        class="ml-20"
        :disabled="task.isRunning"
        :loading="task.isRunning || task.getVersioning"
        @click="versionChange"
      >
        {{ task.btnTxt }}
      </el-button>
    </div>
  </div>
</template>

<script lang="ts">
  import { defineComponent } from 'vue'
  import IPC from '@/util/IPC'
  import { TaskStore } from '@/store/task'
  import { I18nT } from '@shared/lang'
  import { MessageError, MessageSuccess } from '@/util/Element'

  export default defineComponent({
    name: 'MoNodejsVersions',
    components: {},
    props: {},
    data() {
      return {
        current: I18nT('base.gettingVersion'),
        select: '',
        localVersions: []
      }
    },
    computed: {
      task() {
        return TaskStore().node
      }
    },
    watch: {
      currentType(nv, ov) {
        console.log(`currentType: nv: ${nv}, ov: ${ov}`)
      },
      logs() {
        this.$nextTick(() => {
          let container = this.$el.querySelector('#logs')
          if (container) {
            container.scrollTop = container.scrollHeight
          }
        })
      }
    },
    created: function () {
      this.checkNvm()
        .then(() => {
          if (this.task.versions.length === 0) {
            this.getAllVersion()
          }
          this.getLocalVersion()
        })
        .catch(() => {
          if (this.task.isRunning) {
            return
          }
          this.$baseConfirm(I18nT('base.nvmNoInstallTips'), undefined, {
            customClass: 'confirm-del',
            type: 'warning'
          }).then(() => {
            this.installNvm()
          })
        })
    },
    methods: {
      checkNvm() {
        return new Promise((resolve, reject) => {
          if (this.task.NVM_DIR) {
            resolve(true)
            return
          }
          IPC.send('app-fork:node', 'nvmDir').then((key: string, res: any) => {
            IPC.off(key)
            if (res?.data) {
              this.task.NVM_DIR = res.data
              resolve(true)
            } else {
              reject(new Error(I18nT('base.nvmDirNoFound')))
            }
          })
        })
      },
      installNvm() {
        this.task.isRunning = true
        this.task.btnTxt = I18nT('base.installingNVM')
        IPC.send('app-fork:node', 'installNvm').then((key: string, res: any) => {
          IPC.off(key)
          this.task.isRunning = false
          if (res?.code === 0) {
            this.checkNvm().then(() => {
              this.getAllVersion()
            })
          } else {
            MessageError(I18nT('base.fail'))
          }
        })
      },
      getAllVersion() {
        if (this.task.getVersioning || this.task.versions.length > 0) {
          return
        }
        this.task.btnTxt = I18nT('base.gettingVersion')
        this.task.getVersioning = true
        IPC.send('app-fork:node', 'allVersion', this.task.NVM_DIR).then((key: string, res: any) => {
          IPC.off(key)
          if (res?.data) {
            this.task.versions = res.data
            this.task.getVersioning = false
            this.task.btnTxt = I18nT('base.switch')
          } else {
            this.task.btnTxt = I18nT('base.switch')
            this.task.getVersioning = false
            MessageError(I18nT('base.fail'))
          }
        })
      },
      getLocalVersion() {
        IPC.send('app-fork:node', 'localVersion', this.task.NVM_DIR).then(
          (key: string, res: any) => {
            IPC.off(key)
            if (res?.data?.versions) {
              const localVersions: Array<any> = this.localVersions
              localVersions.splice(0)
              localVersions.push(...res.data.versions)
              this.current = res.data.current
            }
          }
        )
      },
      versionChange() {
        this.task.isRunning = true
        this.task.btnTxt = I18nT('base.switching')
        IPC.send('app-fork:node', 'versionChange', this.task.NVM_DIR, this.select).then(
          (key: string, res: any) => {
            IPC.off(key)
            if (res?.code === 0) {
              this.task.btnTxt = I18nT('base.switch')
              this.task.isRunning = false
              this.current = this.select
              MessageSuccess(I18nT('base.success'))
            } else {
              this.task.btnTxt = I18nT('base.switch')
              this.task.isRunning = false
              MessageError(I18nT('base.fail'))
            }
          }
        )
      }
    }
  })
</script>
