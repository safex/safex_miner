const createWindowsInstaller = require('electron-winstaller').createWindowsInstaller
const path = require('path')

getInstallerConfig()
     .then(createWindowsInstaller)
     .catch((error) => {
     console.error(error.message || error)
     process.exit(1)
 })

function getInstallerConfig () {
    console.log('creating windows installer')
    const rootPath = path.join('./')
    const outPath = path.join(rootPath, 'installers')

    return Promise.resolve({
       appDirectory: path.join(rootPath, 'release-builds', 'Safex1ClickMinigApp-win32-ia32'),
       authors: 'Safex Developers',
       noMsi: true,
       outputDirectory: outPath,
       exe: 'Safex1ClickMinigApp.exe',
       setupExe: 'Safex1ClickMinigAppWindowsInstaller.exe',
       setupIcon: 'public/images/icons/icon.ico',
       skipUpdateIcon: true
   })
}
