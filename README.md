# Clipboard Manager

## Description

A simple and efficient clipboard manager built on Electron and React.

## Features

- Keeps track of all items copied to your clipboard
- Uses file system to store data hence fast
- Works seamlessly on Windows, macOS, and Linux
- User-friendly interface
- Hotkeys are supported
- Search functionality

## Limitations

- Currently only text type data is supported
- Performance testing is yet to be done

## Installation

To install the clipboard manager, follow these steps:

1. Clone the repository: `git clone https://github.com/Atishay96/Clipboard-Manager`
2. Navigate to the project directory: `cd Clipboard-Manager`
3. Install the necessary dependencies: `npm install` or `yarn install`

## Usage

To use the clipboard manager, follow these steps:

1. Start the application: `yarn electron:run`
2. Copy any text. It will be automatically saved in the clipboard manager.
3. To access your clipboard history, open the clipboard manager and scroll through the list of copied items.
4. Delete button is provided to delete sensitive data.

## Build

- To generate Mac build, run `yarn package-mac`
- To generate Linux build, run `yarn package-linux`
- To generate Windows build, run `yarn package-win`

Builds will be generated inside `Clipboard-Manager/release-builds` directory

## Hotkeys

- **Command(or Control) + C**: To copy
- **Command(or Control) + Shift + V**: Toggle cliboard manager
- **Command(or Control) + 1 to Control + 9**: Quickly paste items from the clipboard history using numbered shortcuts.

## Contributing

Contributions are welcome! Please raise a PR explaining the need and change.

## License

This project is licensed under the MIT License - see the [LICENSE](https://github.com/Atishay96/Clipboard-Manager/blob/main/LICENSE) file for details.


## Screenshot

![Clipboard Manager Screenshot](https://github.com/Atishay96/Clipboard-Manager/blob/main/assets/screenshot.png)
