import { Workflow, ValidationType, ValidationMessage, ValidationResult, DoctorValidator } from '../doctor'
import { xcode, XcodeRequiredVersionMajor, XcodeRequiredVersionMinor, iMobileDevice } from './mac'
import {
  cocoaPods,
  CocoaPodsStatus,
  noCocoaPodsConsequence,
  cocoaPodsInstallInstructions,
  cocoaPodsUpgradeInstructions,
} from './cocoapods'
import { commandExistsSync } from '../base/process'
import { spawnSync } from 'child_process'
import { versionParse, compareVersion } from '../base/version'

export class IOSWorkflow implements Workflow {
  get appliesToHostPlatform(): boolean {
    return process.platform === 'darwin'
  }
}

export const iosWorkflow = new IOSWorkflow()

export class IOSValidator implements DoctorValidator {
  public messages: ValidationMessage[] = []
  public xcodeStatus = ValidationType.missing
  public brewStatus = ValidationType.missing
  public xcodeVersionInfo: string

  get hasHomebrew(): boolean {
    return commandExistsSync('brew')
  }

  get hasIDeviceInstaller(): boolean {
    try {
      return spawnSync('ideviceinstaller', ['-h']).status === 0
    } catch (e) {
      return false
    }
  }

  get hasIosDeploy(): boolean {
    try {
      return spawnSync('ios-deploy', ['--version']).status === 0
    } catch (e) {
      return false
    }
  }

  get iosDeployVersionText(): string {
    try {
      return spawnSync('ios-deploy', ['--version'])
        .stdout.toString()
        .replace('\n', '')
    } catch (e) {
      return ''
    }
  }

  get iosDeployMinimumVersion() {
    return '1.9.2'
  }

  get iosDeployIsInstalledAndMeetsVersionCheck(): boolean {
    if (!this.hasIosDeploy) {
      return false
    }

    const version = versionParse(this.iosDeployVersionText)
    return compareVersion(version, versionParse(this.iosDeployMinimumVersion))
  }

  public validate() {
    if (xcode.isInstalled) {
      this.xcodeStatus = ValidationType.installed

      this.messages.push(new ValidationMessage(`Xcode at ${xcode.xcodeSelectPath}`))
      this.xcodeVersionInfo = xcode.versionText;
      if (this.xcodeVersionInfo && this.xcodeVersionInfo.includes(',')) {
        this.xcodeVersionInfo = this.xcodeVersionInfo.substring(0, this.xcodeVersionInfo.indexOf(','));
        this.messages.push(new ValidationMessage(this.xcodeVersionInfo))
      }

      /**
       * installed and check xcode version
       */
      if (!xcode.isInstalledAndMeetsVersionCheck) {
        this.xcodeStatus = ValidationType.partial
        this.messages.push(
          new ValidationMessage(
            `Weex requires a minimum Xcode version of ${XcodeRequiredVersionMajor}.${XcodeRequiredVersionMinor}.0.\n
          Download the latest version or update via the Mac App Store.`,
            true /* isError */,
          ),
        )
      }

      /**
       * get admin
       */
      if (!xcode.eulaSigned) {
        this.xcodeStatus = ValidationType.partial
        this.messages.push(
          new ValidationMessage(
            "Xcode end user license agreement not signed; open Xcode or run the command 'sudo xcodebuild -license'.",
            true /* isError */,
          ),
        )
      }

      if (!xcode.isSimctlInstalled) {
        this.xcodeStatus = ValidationType.partial
        this.messages.push(
          new ValidationMessage(
            `Xcode requires additional components to be installed in order to run.\n'
          Launch Xcode and install additional required components when prompted.`,
            true /* isError */,
          ),
        )
      }
    } else {
      this.xcodeStatus = ValidationType.missing
      if (!xcode.xcodeSelectPath) {
        this.messages.push(
          new ValidationMessage(
            `Xcode not installed; this is necessary for iOS development.\n
          Download at https://developer.apple.com/xcode/download/.`,
            true /* isError */,
          ),
        )
      } else {
        this.messages.push(
          new ValidationMessage(
            `Xcode installation is incomplete; a full installation is necessary for iOS development.\n
          Download at: https://developer.apple.com/xcode/download/\n
          Or install Xcode via the App Store.\n
          Once installed, run:\n
            sudo xcode-select --switch /Applications/Xcode.app/Contents/Developer`,
            true /* isError */,
          ),
        )
      }
    }

    // brew installed
    if (this.hasHomebrew) {
      this.brewStatus = ValidationType.installed

      // if (!iMobileDevice.isInstalled) {
      //   this.brewStatus = ValidationType.partial
      //   this.messages.push(
      //     new ValidationMessage(
      //       `libimobiledevice and ideviceinstaller are not installed. To install, run:\n
      //     brew install --HEAD libimobiledevice\n
      //     brew install ideviceinstaller`,
      //       true /* isError */,
      //     ),
      //   )
      // } else if (!iMobileDevice.isWorking) {
      //   this.brewStatus = ValidationType.partial
      //   this.messages.push(
      //     new ValidationMessage(
      //       `Verify that all connected devices have been paired with this computer in Xcode.\n
      //     If all devices have been paired, libimobiledevice and ideviceinstaller may require updating.\n
      //     To update, run:\n
      //     brew uninstall --ignore-dependencies libimobiledevice\n
      //     brew install --HEAD libimobiledevice\n
      //     brew install ideviceinstaller`,
      //       true /* isError */,
      //     ),
      //   )
      // } else if (!this.hasIDeviceInstaller) {
      //   this.brewStatus = ValidationType.partial
      //   this.messages.push(
      //     new ValidationMessage(
      //       `ideviceinstaller is not installed; this is used to discover connected iOS devices.\n
      //     To install, run:\n
      //     brew install --HEAD libimobiledevice\n
      //     brew install ideviceinstaller`,
      //       true /* isError */,
      //     ),
      //   )
      // }

      // if (this.hasIosDeploy) {
      //   this.messages.push(new ValidationMessage(`ios-deploy ${this.iosDeployVersionText}`))
      // }

      // if (!this.iosDeployIsInstalledAndMeetsVersionCheck) {
      //   this.brewStatus = ValidationType.partial
      //   if (this.hasIosDeploy) {
      //     this.messages.push(
      //       new ValidationMessage(
      //         `ios-deploy out of date (${this.iosDeployMinimumVersion} is required). To upgrade:\n
      //       brew upgrade ios-deploy`,
      //         true /* isError */,
      //       ),
      //     );
      //   } else {
      //     this.messages.push(
      //       new ValidationMessage(
      //         `ios-deploy not installed. To install:\n
      //       brew install ios-deploy`,
      //         true /* isError */,
      //       ),
      //     )
      //   }
        
      // }

      const cocoaPodsStatus = cocoaPods.evaluateCocoaPodsInstallation;

      if (cocoaPodsStatus === CocoaPodsStatus.recommended) {
        if (cocoaPods.isCocoaPodsInitialized) {
          this.messages.push(new ValidationMessage(`CocoaPods version ${cocoaPods.cocoaPodsVersionText}`))
        } else {
          this.brewStatus = ValidationType.partial
          this.messages.push(
            new ValidationMessage(
              `CocoaPods installed but not initialized.\n
            ${noCocoaPodsConsequence}\n
            To initialize CocoaPods, run:\n
              pod setup\n
            once to finalize CocoaPods\' installation.`,
              true /* isError */,
            ),
          )
        }
      } else {
        this.brewStatus = ValidationType.partial
        if (cocoaPodsStatus === CocoaPodsStatus.notInstalled) {
          this.messages.push(
            new ValidationMessage(
              `CocoaPods not installed.\n
            ${noCocoaPodsConsequence}\n
            To install:\n
            ${cocoaPodsInstallInstructions}`,
              true /* isError */,
            ),
          )
        } else {
          this.messages.push(
            new ValidationMessage(
              `CocoaPods out of date (${cocoaPods.cocoaPodsRecommendedVersion} is recommended).\n
            ${noCocoaPodsConsequence}\n
            To upgrade:\n
            ${cocoaPodsUpgradeInstructions}`,
              true /* isError */,
            ),
          )
        }
      }
    } else {
      this.brewStatus = ValidationType.missing
      this.messages.push(
        new ValidationMessage(
          `Brew not installed; use this to install tools for iOS device development.\n
        Download brew at https://brew.sh/.`,
          true /* isError */,
        ),
      )
    }
    return new ValidationResult(
      [this.xcodeStatus, this.brewStatus].reduce(this.mergeValidationTypes),
      this.messages,
      this.xcodeVersionInfo
    );
  }

  private mergeValidationTypes(t1: ValidationType, t2: ValidationType):ValidationType {
    return t1 === t2 ? t1 : ValidationType.partial;
  }
}

export const iosValidator = new IOSValidator()
