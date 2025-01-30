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
    this.brightness = 20;

    this.service = new api.hap.Service.Lightbulb(this.name);
    this.service.getCharacteristic(api.hap.Characteristic.On)
      .onGet(async () => {
        const sensors = await dweloAPI.sensors(dimmerId);
        const isOn = sensors[0]?.value === 'on';
        log.debug(`Current state of the dimmer was returned: ${isOn ? 'ON' : 'OFF'}`);
        return isOn;
      })
      .onSet(async value => {
        const isOn = value as boolean;
        if(isOn) {
          await dweloAPI.setBrightness(this.brightness, dimmerId);
        } else {
          await dweloAPI.toggleSwitch(false, dimmerId);
        }
        log.debug(`Dimmer state was set to: ${isOn ? this.brightness : 'OFF'}`);
      });
    this.service.getCharacteristic(api.hap.Characteristic.Brightness)
      .setProps({
        minValue: 0,
        maxValue: 99,
        minStep: 1,
      })
      .onGet(async () => {
        return this.brightness;
      })
      .onSet(async value => {
        const newBrightness = value as number;
        if(newBrightness === this.brightness) {
          return;
        }
        this.brightness = newBrightness;
        await dweloAPI.setBrightness(this.brightness, dimmerId);
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