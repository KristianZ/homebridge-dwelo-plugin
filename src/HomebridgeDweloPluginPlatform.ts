import { API, StaticPlatformPlugin, PlatformConfig, AccessoryPlugin, Logging } from 'homebridge';

import { CommunityDoor, Device, DweloAPI } from './DweloAPI';
import { DweloLockAccessory } from './DweloLockAccessory';
import { DweloSwitchAccessory } from './DweloSwitchAccessory';
import { DweloDimmerAccessory } from './DweloDimmerAccessory';
import { DweloCommunityDoorAccessory } from './DweloCommunityDoorAccessory';

export class HomebridgeDweloPluginPlatform implements StaticPlatformPlugin {
  private readonly dweloAPI: DweloAPI;

  constructor(
    public readonly log: Logging,
    public readonly config: PlatformConfig,
    public readonly api: API,
  ) {
    this.dweloAPI = new DweloAPI(config.token, config.gatewayId, config.communityId);
    this.log.debug(`Finished initializing platform: ${this.config.name}`);
  }

  accessories(callback: (foundAccessories: AccessoryPlugin[]) => void): void {
    Promise.all([
      this.dweloAPI.devices(),
      this.dweloAPI.communityDoors(),
    ]).then(([devices, doors]) => {
      const accessories = devices
        .map((d) => this.createAccessory(d))
        .filter((a): a is AccessoryPlugin => !!a);

      const communityDoors = doors
        .filter(d => this.config.doors.includes(d.uid))
        .map((d) => this.createCommunityDoor(d));

      callback([...accessories, ...communityDoors]);
    });
  }

  private createAccessory(device: Device): AccessoryPlugin | null {
    switch (device.deviceType) {
      case 'switch':
        return new DweloSwitchAccessory(this.log, this.api, this.dweloAPI, device.givenName, device.uid);
      case 'lock':
        return new DweloLockAccessory(this.log, this.api, this.dweloAPI, device.givenName, device.uid);
      case 'dimmer':
        return new DweloDimmerAccessory(this.log, this.api, this.dweloAPI, device.givenName, device.uid);
      default:
        this.log.warn(
          `Device ${device.uid} (${device.givenName}) is not supported because ${device.deviceType} devices are not supported.`);
        return null;
    }
  }

  private createCommunityDoor(door: CommunityDoor): AccessoryPlugin {
    return new DweloCommunityDoorAccessory(this.log, this.api, this.dweloAPI, door);
  }
}
