import { API } from 'homebridge';

import { HomebridgeDweloPluginPlatform } from './HomebridgeDweloPluginPlatform';
import { PLATFORM_NAME } from './settings';

export default (api: API) => {
  api.registerPlatform(PLATFORM_NAME, HomebridgeDweloPluginPlatform);
};