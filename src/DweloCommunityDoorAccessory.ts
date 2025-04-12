import {
  AccessoryPlugin,
  API,
  CharacteristicValue,
  Logging,
  Service,
} from 'homebridge';

import { CommunityDoor, DweloAPI } from './DweloAPI';

export class DweloCommunityDoorAccessory implements AccessoryPlugin {
  private readonly lockService: Service;
  private targetState: CharacteristicValue = this.api.hap.Characteristic.LockTargetState.SECURED;

  constructor(
    private readonly log: Logging,
    private readonly api: API,
    private readonly dweloAPI: DweloAPI,
    private readonly door: CommunityDoor) {

    this.lockService = new api.hap.Service.LockMechanism(door.name);

    this.lockService.getCharacteristic(api.hap.Characteristic.LockCurrentState)
      .onGet(() => {
        return this.targetState;
      });

    this.lockService.getCharacteristic(api.hap.Characteristic.LockTargetState)
      .onGet(() => {
        return this.targetState;
      })
      .onSet(async (_) => {
        this.targetState = this.api.hap.Characteristic.LockCurrentState.UNSECURED;
        this.lockService.updateCharacteristic(
          this.api.hap.Characteristic.LockCurrentState,
          this.api.hap.Characteristic.LockCurrentState.UNSECURED,
        );

        this.log.debug('Opening door %s (%s)', this.door.uid, this.door.name);
        try {
          await this.dweloAPI.openDoor(this.door.uid, this.door.panelId);
        } catch (e) {
          this.log.error('Error opening door %s (%s): %s', this.door.uid, this.door.name, e);
        }

        setTimeout(() => {
          this.log.debug('Closing door %s (%s)', this.door.uid, this.door.name);
          this.targetState = this.api.hap.Characteristic.LockTargetState.SECURED;
          this.lockService.updateCharacteristic(
            this.api.hap.Characteristic.LockCurrentState,
            this.api.hap.Characteristic.LockCurrentState.SECURED,
          );
          this.lockService.updateCharacteristic(
            this.api.hap.Characteristic.LockTargetState,
            this.api.hap.Characteristic.LockTargetState.SECURED,
          );
        }, this.door.secondsOpen * 1000);
      });

    this.log.info(`Dwelo Community Door Lock '${this.door.name}' created!`);
  }

  identify(): void {
    this.log('Identify!');
  }

  getServices(): Service[] {
    return [this.lockService];
  }
}
