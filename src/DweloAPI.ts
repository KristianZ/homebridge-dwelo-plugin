
import axios, { AxiosRequestConfig, AxiosResponse } from 'axios';


interface ListResponse {
  resultsCount: number;
  totalCount: number;
}

export interface Device {
  addressId: number;
  dateRegistered: string;
  deviceType: 'lock' | 'switch' | 'dimmer';
  device_metadata: Record<string, string>;
  gatewayId: string;
  givenName: string;
  isActive: boolean;
  isOnline: boolean;
  leasee: number;
  localId: string;
  metadata_id: string;
  uid: number;
}

interface ListDevicesResponse extends ListResponse {
  results: Device[];
}

export interface CommunityDoor {
  name: string;
  panelId: string;
  secondsOpen: number;
  uid: number;
}

interface ListCommunityDoorsResponse extends ListResponse {
  results: CommunityDoor[];
}

export interface Sensor {
  deviceId: number;
  gatewayId: number;
  sensorType: string;
  timeIssued: string;
  uid: number;
  value: string;
}

interface ListSensorsResponse extends ListResponse {
  results: Sensor[];
}

export class DweloAPI {
  constructor(private readonly token: string, private readonly gatewayID: string, private readonly communityId: string) { }

  public async devices(): Promise<Device[]> {
    const response = await this.request<ListDevicesResponse>('/v3/device', {
      params: {
        gatewayId: this.gatewayID,
        limit: 5000,
        offset: 0,
      },
    });
    return response.data.results;
  }

  public async communityDoors(): Promise<CommunityDoor[]> {
    if (!this.communityId) {
      return [];
    }

    const response = await this.request<ListCommunityDoorsResponse>(`/v3/perimeter/door/community/${this.communityId}`);
    return response.data.results;
  }

  public async sensors(deviceId: number): Promise<Sensor[]> {
    const response = await this.request<ListSensorsResponse>(`/v3/sensor/gateway/${this.gatewayID}/`, {
      params: {
        deviceId,
      },
    });
    return response.data.results;
  }

  public async setBrightness(brightness: number, id: number) {
    return this.request(`/v3/device/${id}/command/`, {
      method: 'POST',
      data: { 'command': brightness },
    });
  }

  public async toggleSwitch(on: boolean, id: number) {
    return this.request(`/v3/device/${id}/command/`, {
      method: 'POST',
      data: { 'command': on ? 'on' : 'off' },
    });
  }

  public async toggleLock(locked: boolean, id: number) {
    await this.request(`/v3/device/${id}/command/`, {
      method: 'POST',
      data: { 'command': locked ? 'lock' : 'unlock' },
    });

    const target = locked ? 'locked' : 'unlocked';
    await poll({
      requestFn: () => this.sensors(id),
      stopCondition: s => s.find(s => s.sensorType === 'lock')?.value === target,
      interval: 5000,
      timeout: 60 * 1000,
    });
  }

  public async openDoor(uid: number, panelId: string) {
    return this.request(`/v3/perimeter/door/${uid}/open`, {
      method: 'POST',
      data: {
        panelId,
      },
    });
  }

  private async request<T>(
    path: string,
    { headers, method, data, params }: AxiosRequestConfig<T> = {},
  ): Promise<AxiosResponse<T>> {
    const response = await axios({
      url: 'https://api.dwelo.com' + path,
      method: method ?? 'GET',
      params,
      data,
      headers: {
        ...headers,
        Authorization: `Token ${this.token} `,
        Host: 'api.dwelo.com',
        Origin: 'https://app.dwelo.com',
        Referer: 'https://app.dwelo.com',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
      },
    });
    return response;
  }
}

function poll<T>({ requestFn, stopCondition, interval, timeout }: {
  requestFn: () => Promise<T>;
  stopCondition: (response: T) => boolean;
  interval: number;
  timeout: number;
}): Promise<T> {
  let stop = false;

  const executePoll = async (resolve: (r: T) => unknown, reject: (e: Error) => void) => {
    const result = await requestFn();

    let stopConditionalResult: boolean;
    try {
      stopConditionalResult = stopCondition(result);
    } catch (e) {
      reject(e as Error);
      return;
    }

    if (stopConditionalResult) {
      resolve(result);
    } else if (stop) {
      reject(new Error('timeout'));
    } else {
      setTimeout(executePoll, interval, resolve, reject);
    }
  };

  const pollResult = new Promise<T>(executePoll);
  const maxTimeout = new Promise<T>((_, reject) => {
    setTimeout(() => {
      reject(new Error('Exceeded max timeout'));
      stop = true;
    }, timeout);
  });

  return Promise.race([pollResult, maxTimeout]);
}