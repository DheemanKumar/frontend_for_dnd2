# D&D Character Sheet Frontend

This project is the frontend for a D&D character sheet application. It allows players to view their character sheets and for a Dungeon Master (DM) to view all character sheets.

## Files

### `index.html`

This is the login page for the application. It contains a form where a player can enter their Player ID to load their character. There is also a special Player ID "DK" to enter host mode.

### `sheet.html`

This page displays the character sheet information. It can be in one of two modes:

*   **Player Mode**: Displays the character sheet for a single player.
*   **Host Mode**: Allows the DM to see a list of all players and view their character sheets.

This page also includes a dice roller.

### `style.css`

This file contains the styles for the application. It uses a "Night Sky" theme with a dark blue background and gold and white text.

### `script.js`

This file contains the JavaScript code for the application. It handles:

*   **Login**: Fetching character data from the backend based on the Player ID.
*   **Character Sheet Display**: Rendering the character sheet with all the character's stats and abilities.
*   **Host Mode**: Fetching all characters and displaying them in a list for the DM.
*   **Dice Rolling**: Simulating dice rolls with a visual animation.
*   **WebSocket Communication**: Connecting to a WebSocket server to send and receive real-time notifications, such as dice rolls.

### `result.md`

This file is not used in the application. It is likely a placeholder or a file for notes.

### `.gitattributes`

This is a Git configuration file that specifies attributes for pathnames. In this case, it is used to handle line endings automatically.

### `.vscode/settings.json`

This file contains settings for the Visual Studio Code editor. It is empty in this project.

### `test.jpeg`

This is an image of a character that is likely used for testing or as a placeholder.

### `profiles/IGNEEL.png`

This is a profile image for a character named "IGNEEL".
