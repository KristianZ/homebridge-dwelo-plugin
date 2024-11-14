import {
  AccessoryPlugin,
  API,
  Logging,
  Service,
} from 'homebridge';

import { DweloAPI } from './DweloAPI';

export class DweloDimmerAccessory implements AccessoryPlugin {
  name: string;

  private readonly log: Logging;
  private readonly service: Service;
  private brightness: number;

  constructor(log: Logging, api: API, dweloAPI: DweloAPI, name: string, dimmerId: number) {
    this.log = log;
    this.name = name;
    this.brightness = 0;

    this.service = new api.hap.Service.Switch(this.name);
    this.service.getCharacteristic(api.hap.Characteristic.On)
      .onGet(async () => {
        const sensors = await dweloAPI.sensors(dimmerId);
        const isOn = sensors[0]?.value === 'on';
        log.debug(`Current state of the dimmer was returned: ${isOn ? 'ON' : 'OFF'}`);
        return isOn;
      })
      .onSet(async value => {
        await dweloAPI.toggleSwitch(value as boolean, dimmerId);
        this.brightness = (value) ? 99 : 0;
        log.debug(`Dimmer state was set to: ${value ? 'ON' : 'OFF'}`);
      });
    this.service.getCharacteristic(api.hap.Characteristic.Brightness)
      .onGet(async () => {
        const sensors = await dweloAPI.sensors(dimmerId);
        const isOn = sensors[0]?.value === 'on';

        if(this.brightness === 0 && isOn) {
          this.brightness = 99;
          log.debug('Dimmer state out of sync! Reset from 0 to 99.');
        } else if(this.brightness === 99 && !(isOn)) {
          this.brightness = 0;
          log.debug('Dimmer state out of sync! Reset from 99 to 0.');
        }
        return this.brightness;
      })
      .onSet(async value => {
        await dweloAPI.setBrightness(value as number, dimmerId);
        this.brightness = value as number;
        log.debug(`Dimmer state was set to: ${value}`);
      });

    log.info(`Dwelo Dimmer '${name} ' created!`);
  }

  identify(): void {
    this.log('Identify!');
  }

  getServices(): Service[] {
    return [this.service];
  }
}