
Forked from https://github.com/eduardoramirez/homebridge-dwelo

<p align="center">

<img src="https://github.com/homebridge/branding/raw/master/logos/homebridge-wordmark-logo-vertical.png" width="150">

</p>


# Homebridge Dwelo Plugin

Makes Dwelo devices available to Homebridge, which can be used to control them from other tools such as HomeKit. Specifically, the following Dwelo devices are surfaced by this plugin:
- Community Doors
- Dimmers _(usually ceiling lights)_
- Switches _(usually outlets or lights)_
- Locks

## Install

### Prerequisites
- [x] Node.js 12 or later
- [x] A modern code editor such as [VS Code](https://code.visualstudio.com/)
- [x] Homebridge installed

### Setup Locally
1. Clone this repository.
2. Within the repository folder, run `npm install` to install the dependencies.

### Upload to a Raspberry Pi
1. Navigate to the parent folder of the repository.
2. Run the following command to upload the repository to the Raspberry Pi. Replace `<username>` and `<ip>` with your username and IP address for your Raspberry Pi. By default, the username is `pi`. If you are prommpted for a password, by default it is `raspberry`.
    ```shell
    rsync -avzq \
    --exclude='.git/' \
    --exclude='node_modules/' \
    --exclude='dist/' \
    --exclude='.vscode/' \
    --exclude='.github/' \
    ./homebridge-dwelo-plugin <username>@<ip>:/home/pi
    ```

### Install on Homebridge
1. Navigate to Homebridge via the terminal or browser (`http://<ip>:8581/login or http://homebridge.local:8581)
2. Navigate to the repository. If you uploaded to the Raspberry Pi using the previous steps, you can navigate to the repository by running `cd ~/homebridge-dwelo-plugin`.
3. **⚠️ _First time setup only_ ⚠️** Run `npm install` to install the dependencies.
4. Run `npm build` to compile the TypeScript code.
5. **⚠️ _First time setup only_ ⚠️** Run `npm link` to surface the repository as a package to npm.
6. **⚠️ _First time setup only_ ⚠️** Run `npm link <name field in package.json>` to surface the repository as a package to Homebridge.
7. Run `sudo hb-service restart` to restart Homebridge.

## Contributing

Feel free to submit feature requests, bug reports, and pull requests. Adhere to [Clean Code](https://gist.github.com/wojteklu/73c6914cc446146b8b533c0988cf8d29) practices.

### Versioning

Given a version number `MAJOR`.`MINOR`.`PATCH`, such as `1.4.3`, increment the:

1. **MAJOR** version when you make breaking changes to your plugin,
2. **MINOR** version when you add functionality in a backwards compatible manner, and
3. **PATCH** version when you make backwards compatible bug fixes.

You can use the `npm version` command to help you with this:

```bash
# major update / breaking changes
npm version major

# minor update / new features
npm version update

# patch / bugfixes
npm version patch
```

## Forking (based on Homebridge Plugin Template)
### Update Plugin Name

Open the [`package.json`](./package.json) and change the following attributes:

* `name` - this should be prefixed with `homebridge-` or `@username/homebridge-` and contain no spaces or special characters apart from a dashes
* `displayName` - this is the "nice" name displayed in the Homebridge UI
* `repository.url` - Link to your GitHub repo
* `bugs.url` - Link to your GitHub repo issues page

When you are ready to publish the plugin you should set `private` to false, or remove the attribute entirely.

Open the [`src/settings.ts`](./src/settings.ts) file and change the default values:

* `PLATFORM_NAME` - Set this to be the name of your platform. This is the name of the platform that users will use to register the plugin in the Homebridge `config.json`.
* `PLUGIN_NAME` - Set this to be the same name you set in the [`package.json`](./package.json) file. 

Open the [`config.schema.json`](./config.schema.json) file and change the following attribute:

* `pluginAlias` - set this to match the `PLATFORM_NAME` you defined in the previous step.

### Watch For Changes and Build Automatically

If you want to have your code compile automatically as you make changes, and restart Homebridge automatically between changes, you first need to add your plugin as a platform in `~/.homebridge/config.json`:
```
{
...
    "platforms": [
        {
            "name": "Config",
            "port": 8581,
            "platform": "config"
        },
        {
            "name": "<PLUGIN_NAME>",
            //... any other options, as listed in config.schema.json ...
            "platform": "<PLATFORM_NAME>"
        }
    ]
}
```

and then you can run:

```
npm run watch
```

This will launch an instance of Homebridge in debug mode which will restart every time you make a change to the source code. It will load the config stored in the default location under `~/.homebridge`. You may need to stop other running instances of Homebridge while using this command to prevent conflicts. You can adjust the Homebridge startup command in the [`nodemon.json`](./nodemon.json) file.
